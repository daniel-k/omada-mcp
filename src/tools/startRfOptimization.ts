import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const startRfOptimizationSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    optimizationStrategy: z
        .enum(['global', 'adjustment'])
        .describe(
            'Strategy: "global" performs full optimization, "adjustment" makes incremental changes based on previous results (equivalent to global on first run)'
        ),
});

const STRATEGY_MAP: Record<string, number> = {
    global: 0,
    adjustment: 1,
};

export function registerStartRfOptimizationTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'startRfOptimization',
        {
            description:
                'Start a WLAN Optimization (RF planning) run. This scans all APs and optimizes channel, power, and band assignments. Use getRfPlanningResult to check progress.',
            inputSchema: startRfOptimizationSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('startRfOptimization', async ({ siteId, optimizationStrategy }) => {
            return toToolResult(
                await client.startRfOptimization({ optimizationStrategy: STRATEGY_MAP[optimizationStrategy] }, siteId)
            );
        })
    );
}
