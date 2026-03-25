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

const TX_POWER_LEVEL_LABELS: Record<number, string> = {
    0: 'low',
    1: 'medium',
    2: 'high',
    3: 'custom',
    4: 'auto',
};

const CHANNEL_WIDTH_LABELS: Record<string, string> = {
    '0': 'auto',
    '2': '20 MHz',
    '3': '40 MHz',
    '4': '20/40 MHz',
    '5': '80 MHz',
    '6': '160 MHz',
    '7': '80+80 MHz',
    '8': '320 MHz',
};

const BAND_LABELS: Record<string, string> = {
    radioSetting2g: '2.4 GHz',
    radioSetting5g: '5 GHz',
    radioSetting5g1: '5 GHz-1',
    radioSetting5g2: '5 GHz-2',
    radioSetting6g: '6 GHz',
};

function formatRadioSetting(key: string, setting: RadioSetting): string {
    const label = BAND_LABELS[key] ?? key;
    const lines: string[] = [`=== ${label} Radio ===`];

    lines.push(`Enabled: ${setting.radioEnable ? 'yes' : 'no'}`);

    const ch = setting.channel === '0' || setting.channel === 'auto' ? 'auto' : `ch ${setting.channel}`;
    lines.push(`Channel: ${ch}`);

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

function formatRadioConfig(data: Record<string, unknown>): string {
    const bandKeys = ['radioSetting2g', 'radioSetting5g', 'radioSetting5g1', 'radioSetting5g2', 'radioSetting6g'];
    const sections: string[] = [];

    for (const key of bandKeys) {
        const setting = data[key] as RadioSetting | undefined;
        if (setting) {
            sections.push(formatRadioSetting(key, setting));
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
            const result = await client.getApRadioConfig(apMac, siteId);
            const text = result && typeof result === 'object' ? formatRadioConfig(result as Record<string, unknown>) : JSON.stringify(result, null, 2);
            return toToolResult(text);
        })
    );
}
