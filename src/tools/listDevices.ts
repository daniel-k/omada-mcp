import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListDevicesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'omada.listDevices',
        {
            description: 'List provisioned network devices for a specific site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('omada.listDevices', async ({ siteId }) => toToolResult(await client.listDevices(siteId)))
    );
}
