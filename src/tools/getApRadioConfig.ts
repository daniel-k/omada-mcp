import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const getApRadioConfigSchema = z.object({
    siteId: z.string().min(1).optional(),
    apMac: z.string().min(1, 'apMac is required (e.g. AA-BB-CC-DD-EE-FF)'),
});

interface RadioSetting {
    radioEnable?: boolean;
    channel?: string;
    channelWidth?: string;
    txPower?: number;
    txPowerLevel?: number;
    channelLimitEnable?: boolean;
    freq?: number;
    wirelessMode?: number;
    channelRange?: number[];
    nonPscEnable?: boolean;
}

interface ChannelDetail {
    channel?: number;
    freq?: number;
    availableChannelWidthList?: number[];
    index?: number;
}

interface AvailableChannelEntry {
    radioId?: number;
    apChannelDetailList?: ChannelDetail[];
}

const TX_POWER_LEVEL_LABELS: Record<number, string> = {
    0: 'low',
    1: 'medium',
    2: 'high',
    3: 'custom',
    4: 'auto',
};

// Source of truth: OpenAPI spec ApRadioSettingopenApiVO.channelWidth
// "RADIO_20 = 2; RADIO_40 = 3; RADIO_40_20 = 4(2G Auto); RADIO_80 = 5;
//  RADIO_80_40_20 = 6(5G Auto); RADIO_160 = 7; RADIO_160_80_40_20 = 8;
//  RADIO_240 = 9; RADIO_320 = 10"
const CHANNEL_WIDTH_LABELS: Record<string, string> = {
    '0': 'auto',
    '2': '20 MHz',
    '3': '40 MHz',
    '4': 'Auto (up to 40 MHz)',
    '5': '80 MHz',
    '6': 'Auto (up to 80 MHz)',
    '7': '160 MHz',
    '8': 'Auto (up to 160 MHz)',
    '9': '240 MHz',
    '10': '320 MHz',
};

const BAND_LABELS: Record<string, string> = {
    radioSetting2g: '2.4 GHz',
    radioSetting5g: '5 GHz',
    radioSetting5g1: '5 GHz-1',
    radioSetting5g2: '5 GHz-2',
    radioSetting6g: '6 GHz',
};

// Band key -> radioId used by the /available-channel endpoint.
// 0: 2.4GHz; 1: 5GHz(-1); 2: 5GHz-2; 3: 6GHz.
const BAND_RADIO_ID: Record<string, number> = {
    radioSetting2g: 0,
    radioSetting5g: 1,
    radioSetting5g1: 1,
    radioSetting5g2: 2,
    radioSetting6g: 3,
};

type IndexLookup = Map<number, ChannelDetail>;

function buildIndexLookup(available: unknown): Map<number, IndexLookup> {
    const byRadio = new Map<number, IndexLookup>();
    const entries = Array.isArray(available) ? (available as AvailableChannelEntry[]) : [];
    for (const entry of entries) {
        if (typeof entry?.radioId !== 'number') continue;
        const lookup: IndexLookup = new Map();
        for (const detail of entry.apChannelDetailList ?? []) {
            if (typeof detail.index === 'number') {
                lookup.set(detail.index, detail);
            }
        }
        byRadio.set(entry.radioId, lookup);
    }
    return byRadio;
}

function formatChannel(setting: RadioSetting, lookup?: IndexLookup): string {
    const raw = setting.channel;
    if (raw === undefined) return '?';
    if (raw === '0' || raw === 'auto') return 'auto';

    const idx = Number.parseInt(raw, 10);
    const detail = Number.isFinite(idx) ? lookup?.get(idx) : undefined;

    if (detail?.channel !== undefined) {
        const freq = detail.freq ?? setting.freq;
        return freq !== undefined ? `ch ${detail.channel} (${freq} MHz)` : `ch ${detail.channel}`;
    }

    // Fallback: if we couldn't resolve the index, show the raw index plus any freq we have
    // from the config itself so the output is still useful.
    if (setting.freq !== undefined) {
        return `index ${raw} (${setting.freq} MHz)`;
    }
    return `index ${raw}`;
}

function formatRadioSetting(key: string, setting: RadioSetting, lookup?: IndexLookup): string {
    const label = BAND_LABELS[key] ?? key;
    const lines: string[] = [`=== ${label} Radio ===`];

    lines.push(`Enabled: ${setting.radioEnable ? 'yes' : 'no'}`);

    lines.push(`Channel: ${formatChannel(setting, lookup)}`);

    const width = CHANNEL_WIDTH_LABELS[setting.channelWidth ?? ''] ?? setting.channelWidth ?? '?';
    lines.push(`Width: ${width}`);

    const powerLevel = TX_POWER_LEVEL_LABELS[setting.txPowerLevel ?? -1] ?? `unknown(${setting.txPowerLevel})`;
    const powerStr = setting.txPowerLevel === 3 ? `custom ${setting.txPower} dBm` : powerLevel;
    lines.push(`TX Power: ${powerStr}`);

    if (setting.channelLimitEnable !== undefined) {
        lines.push(`Channel Limit: ${setting.channelLimitEnable ? 'enabled' : 'disabled'}`);
    }

    if (setting.channelRange?.length) {
        lines.push(`Available Channels: ${setting.channelRange.join(', ')}`);
    }

    return lines.join('\n');
}

function formatRadioConfig(data: Record<string, unknown>, indexLookups: Map<number, IndexLookup>): string {
    const bandKeys = ['radioSetting2g', 'radioSetting5g', 'radioSetting5g1', 'radioSetting5g2', 'radioSetting6g'];
    const sections: string[] = [];

    for (const key of bandKeys) {
        const setting = data[key] as RadioSetting | undefined;
        if (setting) {
            const lookup = indexLookups.get(BAND_RADIO_ID[key] ?? -1);
            sections.push(formatRadioSetting(key, setting, lookup));
        }
    }

    return sections.length > 0 ? sections.join('\n\n') : JSON.stringify(data, null, 2);
}

export function registerGetApRadioConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getApRadioConfig',
        {
            description:
                'Get AP radio configuration including channel, channel width, TX power, and wireless mode for each radio band (2.4G, 5G, 5G2, 6G).',
            inputSchema: getApRadioConfigSchema.shape,
        },
        wrapToolHandler('getApRadioConfig', async ({ apMac, siteId }) => {
            // Fetch radio config and the available-channel map in parallel.
            // The radio-config endpoint's `channel` field is an opaque index
            // that only makes sense paired with the available-channel list.
            const [configResult, availableResult] = await Promise.all([
                client.getApRadioConfig(apMac, siteId),
                client.getApAvailableChannels(apMac, siteId).catch(() => undefined),
            ]);

            const indexLookups = buildIndexLookup(availableResult);
            const text =
                configResult && typeof configResult === 'object'
                    ? formatRadioConfig(configResult as Record<string, unknown>, indexLookups)
                    : JSON.stringify(configResult, null, 2);
            return toToolResult(text);
        })
    );
}
