import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const emptySchema = z.object({});

export function registerListSitesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listSites',
        {
            description: 'List all sites configured on the Omada controller.',
            inputSchema: emptySchema.shape,
        },
        wrapToolHandler('listSites', async () => toToolResult(await client.listSites()))
    );
}
