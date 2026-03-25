import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const pskSettingSchema = z.object({
    securityKey: z.string().describe('WPA-Personal password (8-63 printable ASCII characters)'),
    versionPsk: z.number().int().describe('WPA version: 1=WPA-PSK, 2=WPA2-PSK, 3=WPA/WPA2-PSK, 4=WPA3-SAE'),
    encryptionPsk: z.number().int().describe('Encryption: 1=Auto, 3=AES. Must be AES when versionPsk is WPA3-SAE.'),
    gikRekeyPskEnable: z.boolean().describe('Whether group key update period is enabled'),
});

const createSsidSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    name: z.string().min(1, 'SSID name is required (1-32 UTF-8 characters)'),
    band: z
        .number()
        .int()
        .describe('Bitmask: bit0=2.4G, bit1=5G, bit2=6G. E.g. 3=2.4G+5G, 7=2.4G+5G+6G.'),
    security: z
        .number()
        .int()
        .describe('Security mode: 0=None, 2=WPA-Enterprise, 3=WPA-Personal, 4=PPSK without RADIUS, 5=PPSK with RADIUS'),
    broadcast: z.boolean().optional().describe('Whether to broadcast the SSID name (default: true). Set false for hidden networks.'),
    guestNetEnable: z.boolean().optional().describe('Whether this is a guest network'),
    vlanEnable: z.boolean().optional().describe('Whether VLAN tagging is enabled'),
    vlanId: z.number().int().optional().describe('VLAN ID (1-4094). Required when vlanEnable is true.'),
    pskSetting: pskSettingSchema.optional().describe('WPA-Personal settings. Required when security is 3.'),
    mloEnable: z.boolean().optional().describe('Whether MLO (Multi-Link Operation) is enabled'),
    pmfMode: z.number().int().optional().describe('PMF mode: 1=Mandatory, 2=Capable, 3=Disable'),
    enable11r: z.boolean().optional().describe('Whether 802.11r fast roaming is enabled'),
    siteId: z.string().min(1).optional(),
});

export function registerCreateSsidTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'createSsid',
        {
            description:
                'Create a new SSID (wireless network) in a WLAN group. After creation, use the individual update tools (updateSsidRateControl, updateSsidMultiCastConfig, etc.) to configure advanced settings.',
            inputSchema: createSsidSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('createSsid', async ({ wlanId, siteId, ...data }) =>
            toToolResult(await client.createSsid(wlanId, data, siteId))
        )
    );
}
