import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient.js';
import { clientIdSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerGetClientTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'omada.getClient',
        {
            description: 'Fetch details for a specific Omada client.',
            inputSchema: clientIdSchema.shape
        },
        wrapToolHandler('omada.getClient', async ({ clientId, siteId }) =>
            toToolResult(await client.getClient(clientId, siteId))
        )
    );
}
