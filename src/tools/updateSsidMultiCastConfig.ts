import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateSsidMultiCastConfigSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    multiCastEnable: coercedBoolean().describe('Whether multicast-to-unicast conversion is enabled'),
    channelUtil: z.coerce
        .number()
        .int()
        .describe('Channel utilization threshold (0-100). When reached, multicast is no longer converted to unicast. Default: 100.'),
    arpCastEnable: coercedBoolean().describe('Whether ARP-to-unicast conversion is enabled'),
    ipv6CastEnable: coercedBoolean().describe('Whether IPv6 multicast (MLD) to unicast conversion is enabled'),
    filterEnable: coercedBoolean().describe('Whether multicast filtering is enabled'),
    filterMode: z.coerce
        .number()
        .int()
        .optional()
        .describe('Filtering protocol bitmask: bit0=IGMP, bit1=MDNS, bit2=Others. E.g. 7=all enabled, 1=IGMP only.'),
    macGroupId: z.string().optional().describe('MAC Group Profile ID for multicast filtering'),
    siteId: z.string().min(1).optional(),
});

export function registerUpdateSsidMultiCastConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateSsidMultiCastConfig',
        {
            description:
                'Update SSID multicast/broadcast management config (multicast-to-unicast, ARP proxy, IPv6 MLD, multicast filtering). Use getSsidDetail to see current multiCast values.',
            inputSchema: updateSsidMultiCastConfigSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateSsidMultiCastConfig', async ({ wlanId, ssidId, siteId, ...data }) =>
            toToolResult(await client.updateSsidMultiCastConfig(wlanId, ssidId, data, siteId))
        )
    );
}
