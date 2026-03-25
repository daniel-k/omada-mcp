import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateSsidHotspotV2Schema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    hotspotV2Enable: z.boolean().describe('Whether Hotspot 2.0 (Passpoint) is enabled'),
    networkType: z
        .number()
        .int()
        .optional()
        .describe(
            '802.11u network type: 0=Private, 1=Private with guest, 2=Chargeable public, 3=Free public, 4=Personal device, 5=Emergency only, 14=Test, 15=Wildcard'
        ),
    operatorDomain: z.string().optional().describe('Hotspot operator domain name (e.g. www.example.com)'),
    dgafDisable: z.boolean().optional().describe('Whether to disable downstream group-addressed forwarding (blocks multicast/broadcast)'),
    internet: z.boolean().optional().describe('Whether internet access is available through this network'),
    availabilityIpv4: z
        .number()
        .int()
        .optional()
        .describe('IPv4 availability: 0=unavailable, 1=public, 2=port-restricted, 3=single NAT, 4=double NAT, 7=unknown'),
    availabilityIpv6: z.number().int().optional().describe('IPv6 availability: 0=unavailable, 1=available, 2=unknown'),
    operatorFriendly: z.string().optional().describe('Operator friendly name (1-64 visible ASCII characters)'),
    siteId: z.string().min(1).optional(),
});

export function registerUpdateSsidHotspotV2Tool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateSsidHotspotV2',
        {
            description:
                'Update SSID Hotspot 2.0 (Passpoint) config. Requires compatible security mode (WPA-Enterprise). Use getSsidDetail to see current settings.',
            inputSchema: updateSsidHotspotV2Schema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateSsidHotspotV2', async ({ wlanId, ssidId, siteId, ...data }) =>
            toToolResult(await client.updateSsidHotspotV2(wlanId, ssidId, data, siteId))
        )
    );
}
