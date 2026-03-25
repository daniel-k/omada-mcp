import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const applyRfPlanningHistorySchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    historyId: z.string().min(1).describe('Planning history ID (from listRfPlanningHistory)'),
    config: z
        .enum(['recommended', 'previous'])
        .describe('Which config to apply: "recommended" (algorithm-optimized) or "previous" (roll back to original)'),
});

const CONFIG_MAP: Record<string, number> = {
    recommended: 1,
    previous: 2,
};

export function registerApplyRfPlanningHistoryTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'applyRfPlanningHistory',
        {
            description:
                'Apply a WLAN Optimization history entry. Choose to apply the recommended (optimized) config or roll back to the previous (original) config.',
            inputSchema: applyRfPlanningHistorySchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('applyRfPlanningHistory', async ({ siteId, historyId, config }) => {
            return toToolResult(await client.applyRfPlanningHistory(historyId, CONFIG_MAP[config], siteId));
        })
    );
}
