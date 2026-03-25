import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetWlanExperienceIndexTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getWlanExperienceIndex',
        {
            description:
                'Get the WLAN experience index showing results from the last optimization scan, including before/after quality scores, AP counts, and duration.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getWlanExperienceIndex', async ({ siteId }) => toToolResult(await client.getWlanExperienceIndex(siteId)))
    );
}
