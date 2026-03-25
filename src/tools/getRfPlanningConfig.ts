import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetRfPlanningConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRfPlanningConfig',
        {
            description:
                'Get WLAN Optimization (RF planning) configuration for a site, including mode (auto/custom), channel/power/band deployment settings, and advanced options.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getRfPlanningConfig', async ({ siteId }) => toToolResult(await client.getRfPlanningConfig(siteId)))
    );
}
