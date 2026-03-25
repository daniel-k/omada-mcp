import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const deleteRfPlanningHistorySchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    historyId: z.string().min(1).describe('Planning history ID to delete'),
});

export function registerDeleteRfPlanningHistoryTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'deleteRfPlanningHistory',
        {
            description: 'Delete a WLAN Optimization history entry.',
            inputSchema: deleteRfPlanningHistorySchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('deleteRfPlanningHistory', async ({ siteId, historyId }) => {
            return toToolResult(await client.deleteRfPlanningHistory(historyId, siteId));
        })
    );
}
