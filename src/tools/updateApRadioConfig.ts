import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const BAND_KEY_MAP: Record<string, string> = {
    '2g': 'radioSetting2g',
    '5g': 'radioSetting5g',
    '5g1': 'radioSetting5g1',
    '5g2': 'radioSetting5g2',
    '6g': 'radioSetting6g',
};

// Band -> radioId (0: 2.4GHz; 1: 5GHz(-1); 2: 5GHz-2; 3: 6GHz)
const BAND_RADIO_ID: Record<string, number> = {
    '2g': 0,
    '5g': 1,
    '5g1': 1,
    '5g2': 2,
    '6g': 3,
};

const TX_POWER_LEVEL_MAP: Record<string, number> = {
    low: 0,
    medium: 1,
    high: 2,
    custom: 3,
    auto: 4,
};

// Source of truth: OpenAPI spec ApRadioSettingopenApiVO.channelWidth
// 2=20; 3=40; 4=Auto(20/40, 2G auto); 5=80; 6=Auto(20/40/80, 5G auto);
// 7=160; 8=Auto(up to 160); 9=240; 10=320
const CHANNEL_WIDTH_MAP: Record<string, string> = {
    '20MHz': '2',
    '40MHz': '3',
    '20/40MHz': '4',
    '80MHz': '5',
    '20/40/80MHz': '6',
    '160MHz': '7',
    '20/40/80/160MHz': '8',
    '240MHz': '9',
    '320MHz': '10',
    auto: '0',
};

interface ChannelDetail {
    channel?: number;
    freq?: number;
    index?: number;
}

interface AvailableChannelEntry {
    radioId?: number;
    apChannelDetailList?: ChannelDetail[];
}

/**
 * Resolve a user-supplied 802.11 channel number (e.g. "36", "100") into the
 * opaque index the radio-config endpoint expects, plus the matching freq in
 * MHz. "0"/"auto" mean auto-select — the API accepts those directly.
 *
 * Returns null if the channel cannot be resolved on the given band.
 */
async function resolveChannel(
    client: OmadaClient,
    apMac: string,
    siteId: string | undefined,
    band: string,
    channel: string
): Promise<{ index: string; freq?: number } | null> {
    if (channel === '0' || channel.toLowerCase() === 'auto') {
        return { index: '0' };
    }

    const radioId = BAND_RADIO_ID[band];
    if (radioId === undefined) return null;

    const available = (await client.getApAvailableChannels(apMac, siteId).catch(() => undefined)) as
        | AvailableChannelEntry[]
        | undefined;
    if (!Array.isArray(available)) return null;

    const entry = available.find((e) => e.radioId === radioId);
    if (!entry?.apChannelDetailList) return null;

    const target = Number.parseInt(channel, 10);
    if (!Number.isFinite(target)) return null;

    const match = entry.apChannelDetailList.find((d) => d.channel === target);
    if (!match || typeof match.index !== 'number') return null;

    return { index: String(match.index), freq: match.freq };
}

const updateApRadioConfigSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    apMac: z.string().min(1).describe('AP MAC address, e.g. AA-BB-CC-DD-EE-FF'),
    band: z.enum(['2g', '5g', '5g1', '5g2', '6g']).describe('Radio band to configure'),
    radioEnable: coercedBoolean().optional().describe('Enable or disable this radio'),
    channel: z
        .string()
        .optional()
        .describe('802.11 channel number as string (e.g. "36", "100"), or "0"/"auto" for auto-select'),
    channelWidth: z
        .enum([
            'auto',
            '20MHz',
            '40MHz',
            '20/40MHz',
            '80MHz',
            '20/40/80MHz',
            '160MHz',
            '20/40/80/160MHz',
            '240MHz',
            '320MHz',
        ])
        .optional()
        .describe('Channel width'),
    txPowerLevel: z
        .enum(['low', 'medium', 'high', 'custom', 'auto'])
        .optional()
        .describe('Transmit power level'),
    txPower: z.coerce
        .number()
        .int()
        .optional()
        .describe('Custom TX power in dBm (only used when txPowerLevel is "custom")'),
    wirelessMode: z.coerce.number().int().optional().describe('Wireless mode ID (use getApRadioConfig to see current value)'),
    channelLimitEnable: coercedBoolean().optional().describe('Enable channel limit'),
    freq: z.coerce.number().int().optional().describe('Frequency in MHz (advanced; normally prefer "channel")'),
});

export function registerUpdateApRadioConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateApRadioConfig',
        {
            description:
                'Update AP radio configuration for a single band. Call once per band you want to change. Use getApRadioConfig first to see current settings.',
            inputSchema: updateApRadioConfigSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateApRadioConfig', async ({ apMac, siteId, band, txPowerLevel, channelWidth, channel, ...rest }) => {
            const radioSetting: Record<string, unknown> = {};

            // Copy over simple fields (radioEnable, channelLimitEnable, freq, txPower, wirelessMode)
            for (const [key, value] of Object.entries(rest)) {
                if (value !== undefined) {
                    radioSetting[key] = value;
                }
            }

            // Map human-readable txPowerLevel to API number
            if (txPowerLevel !== undefined) {
                radioSetting.txPowerLevel = TX_POWER_LEVEL_MAP[txPowerLevel];
            }

            // Map human-readable channelWidth to API string (per OpenAPI spec)
            if (channelWidth !== undefined) {
                radioSetting.channelWidth = CHANNEL_WIDTH_MAP[channelWidth];
            }

            // Resolve 802.11 channel number -> index + freq via /available-channel.
            // The radio-config API's `channel` field is an opaque index, not the
            // literal 802.11 channel number. Without this resolution the API will
            // silently no-op or pick an unintended channel.
            if (channel !== undefined) {
                const resolved = await resolveChannel(client, apMac, siteId, band, channel);
                if (!resolved) {
                    throw new Error(
                        `Channel ${channel} is not available on band ${band} for AP ${apMac}. Use getApRadioConfig to see supported channels.`
                    );
                }
                radioSetting.channel = resolved.index;
                if (resolved.freq !== undefined && radioSetting.freq === undefined) {
                    radioSetting.freq = resolved.freq;
                }
            }

            const bandKey = BAND_KEY_MAP[band];
            const data = { [bandKey]: radioSetting };

            return toToolResult(await client.updateApRadioConfig(apMac, data, siteId));
        })
    );
}
