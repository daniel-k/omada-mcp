import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean, coercedObject } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const pskSettingSchema = z.object({
    securityKey: z.string().optional().describe('WPA-Personal password (8-63 printable ASCII characters)'),
    versionPsk: z.coerce.number().int().describe('WPA version: 1=WPA-PSK, 2=WPA2-PSK, 3=WPA/WPA2-PSK, 4=WPA3-SAE'),
    encryptionPsk: z.coerce.number().int().describe('Encryption: 1=Auto, 3=AES. Must be AES when versionPsk is WPA3-SAE.'),
    gikRekeyPskEnable: coercedBoolean().describe('Whether group key update period is enabled'),
});

const updateSsidBasicConfigSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    name: z.string().min(1).describe('SSID name (1-32 UTF-8 characters)'),
    band: z.coerce
        .number()
        .int()
        .describe(
            'Bitmask: bit0=2.4G, bit1=5G, bit2=6G. E.g. 3=2.4G+5G, 7=2.4G+5G+6G. Use getSsidDetail to see current value.'
        ),
    security: z.coerce
        .number()
        .int()
        .describe('Security mode: 0=None, 2=WPA-Enterprise, 3=WPA-Personal, 4=PPSK without RADIUS, 5=PPSK with RADIUS'),
    broadcast: coercedBoolean().describe('Whether to broadcast the SSID name'),
    guestNetEnable: coercedBoolean().describe('Whether this is a guest network'),
    vlanEnable: coercedBoolean().describe('Whether VLAN tagging is enabled'),
    mloEnable: coercedBoolean().describe('Whether MLO (Multi-Link Operation) is enabled'),
    pmfMode: z.coerce.number().int().describe('PMF mode: 1=Mandatory, 2=Capable, 3=Disable'),
    enable11r: coercedBoolean().describe('Whether 802.11r fast roaming is enabled'),
    vlanId: z.coerce.number().int().optional().describe('VLAN ID (1-4094). Required when vlanEnable is true.'),
    pskSetting: coercedObject(pskSettingSchema)
        .optional()
        .describe('WPA-Personal settings. If omitted for security=3, the existing pskSetting is preserved automatically.'),
    oweEnable: coercedBoolean().optional().describe('Enhanced Open (OWE). Only for security=0 with 2.4G or 5G bands.'),
    hidePwd: coercedBoolean().optional().describe('Whether to hide the SSID password'),
    siteId: z.string().min(1).optional(),
});

export function registerUpdateSsidBasicConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateSsidBasicConfig',
        {
            description:
                'Update SSID basic config (name, band, security, VLAN, guest network, PMF, 802.11r, MLO). Use getSsidDetail first to see current values — all required fields must be provided. IMPORTANT: Do NOT include pskSetting unless the user wants to change the Wi-Fi password. When pskSetting is omitted, the existing password is preserved automatically.',
            inputSchema: updateSsidBasicConfigSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateSsidBasicConfig', async ({ wlanId, ssidId, siteId, ...data }) => {
            // If pskSetting wasn't provided and security requires one, carry forward the existing PSK
            if (data.pskSetting === undefined && data.security === 3) {
                const current = (await client.getSsidDetail(wlanId, ssidId, siteId)) as Record<string, unknown>;
                if (current.pskSetting) {
                    data.pskSetting = current.pskSetting as typeof data.pskSetting;
                }
            }

            return toToolResult(await client.updateSsidBasicConfig(wlanId, ssidId, data, siteId));
        })
    );
}
