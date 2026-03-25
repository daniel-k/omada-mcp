import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const listRfPlanningHistorySchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    page: z.number().int().min(1).default(1).optional().describe('Page number (starts at 1)'),
    pageSize: z.number().int().min(1).max(1000).default(10).optional().describe('Entries per page (1-1000)'),
});

export function registerListRfPlanningHistoryTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listRfPlanningHistory',
        {
            description:
                'List WLAN Optimization history entries showing past optimization runs with before/after quality indexes, AP counts, and durations.',
            inputSchema: listRfPlanningHistorySchema.shape,
        },
        wrapToolHandler('listRfPlanningHistory', async ({ siteId, page, pageSize }) => {
            return toToolResult(await client.listRfPlanningHistory(siteId, page ?? 1, pageSize ?? 10));
        })
    );
}
