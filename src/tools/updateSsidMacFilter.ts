import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateSsidMacFilterSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    macFilterEnable: coercedBoolean().describe('Whether MAC filtering is enabled'),
    policy: z.coerce.number().int().optional().describe('Filter policy: 0=Deny List, 1=Allow List'),
    macFilterId: z.string().optional().describe('MAC Group Profile ID for the filter list'),
    siteId: z.string().min(1).optional(),
});

export function registerUpdateSsidMacFilterTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateSsidMacFilter',
        {
            description:
                'Update SSID MAC filter config (enable/disable MAC filtering, set allow/deny policy). Use getSsidDetail to see current macFilter values.',
            inputSchema: updateSsidMacFilterSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateSsidMacFilter', async ({ wlanId, ssidId, siteId, ...data }) =>
            toToolResult(await client.updateSsidMacFilter(wlanId, ssidId, data, siteId))
        )
    );
}
