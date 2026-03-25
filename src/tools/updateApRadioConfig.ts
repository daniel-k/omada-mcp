import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const BAND_KEY_MAP: Record<string, string> = {
    '2g': 'radioSetting2g',
    '5g': 'radioSetting5g',
    '5g1': 'radioSetting5g1',
    '5g2': 'radioSetting5g2',
    '6g': 'radioSetting6g',
};

const TX_POWER_LEVEL_MAP: Record<string, number> = {
    low: 0,
    medium: 1,
    high: 2,
    custom: 3,
    auto: 4,
};

const CHANNEL_WIDTH_MAP: Record<string, string> = {
    '20MHz': '2',
    '40MHz': '3',
    '20/40MHz': '4',
    '80MHz': '5',
    '160MHz': '6',
    '80+80MHz': '7',
    '320MHz': '8',
    auto: '0',
};

const updateApRadioConfigSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    apMac: z.string().min(1).describe('AP MAC address, e.g. AA-BB-CC-DD-EE-FF'),
    band: z.enum(['2g', '5g', '5g1', '5g2', '6g']).describe('Radio band to configure'),
    radioEnable: z.boolean().optional().describe('Enable or disable this radio'),
    channel: z
        .string()
        .optional()
        .describe('Channel number as string, or "0" for auto'),
    channelWidth: z
        .enum(['auto', '20MHz', '40MHz', '20/40MHz', '80MHz', '160MHz', '80+80MHz', '320MHz'])
        .optional()
        .describe('Channel width'),
    txPowerLevel: z
        .enum(['low', 'medium', 'high', 'custom', 'auto'])
        .optional()
        .describe('Transmit power level'),
    txPower: z
        .number()
        .int()
        .optional()
        .describe('Custom TX power in dBm (only used when txPowerLevel is "custom")'),
    wirelessMode: z.number().int().optional().describe('Wireless mode ID (use getApRadioConfig to see current value)'),
    channelLimitEnable: z.boolean().optional().describe('Enable channel limit'),
    freq: z.number().int().optional().describe('Frequency setting'),
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
        wrapToolHandler('updateApRadioConfig', async ({ apMac, siteId, band, txPowerLevel, channelWidth, ...rest }) => {
            const radioSetting: Record<string, unknown> = {};

            // Copy over simple fields
            for (const [key, value] of Object.entries(rest)) {
                if (value !== undefined) {
                    radioSetting[key] = value;
                }
            }

            // Map human-readable txPowerLevel to API number
            if (txPowerLevel !== undefined) {
                radioSetting.txPowerLevel = TX_POWER_LEVEL_MAP[txPowerLevel];
            }

            // Map human-readable channelWidth to API string
            if (channelWidth !== undefined) {
                radioSetting.channelWidth = CHANNEL_WIDTH_MAP[channelWidth];
            }

            const bandKey = BAND_KEY_MAP[band];
            const data = { [bandKey]: radioSetting };

            return toToolResult(await client.updateApRadioConfig(apMac, data, siteId));
        })
    );
}
