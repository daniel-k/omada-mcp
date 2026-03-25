import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const deleteSsidSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    siteId: z.string().min(1).optional(),
});

export function registerDeleteSsidTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'deleteSsid',
        {
            description:
                'Delete an SSID (wireless network) from a WLAN group. Requires wlanId (from getWlanGroupList) and ssidId (from getSsidList).',
            inputSchema: deleteSsidSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('deleteSsid', async ({ wlanId, ssidId, siteId }) =>
            toToolResult(await client.deleteSsid(wlanId, ssidId, siteId))
        )
    );
}
