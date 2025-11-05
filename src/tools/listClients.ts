import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerListClientsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'omada.listClients',
        {
            description: 'List network clients connected to a site.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('omada.listClients', async ({ siteId }) => toToolResult(await client.listClients(siteId)))
    );
}
