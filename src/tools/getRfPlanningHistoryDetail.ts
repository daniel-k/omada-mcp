import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const getRfPlanningHistoryDetailSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    historyId: z.string().min(1).describe('Planning history ID (from listRfPlanningHistory)'),
});

export function registerGetRfPlanningHistoryDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRfPlanningHistoryDetail',
        {
            description:
                'Get detailed WLAN Optimization history for a specific run, including per-AP original vs recommended channel, power, and band settings.',
            inputSchema: getRfPlanningHistoryDetailSchema.shape,
        },
        wrapToolHandler('getRfPlanningHistoryDetail', async ({ siteId, historyId }) => {
            return toToolResult(await client.getRfPlanningHistoryDetail(historyId, siteId));
        })
    );
}
