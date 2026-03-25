import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerCancelRfOptimizationTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'cancelRfOptimization',
        {
            description: 'Cancel an in-progress WLAN Optimization (RF planning) run.',
            inputSchema: siteInputSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('cancelRfOptimization', async ({ siteId }) => toToolResult(await client.cancelRfOptimization(siteId)))
    );
}
