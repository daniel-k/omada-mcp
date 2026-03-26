import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateMeshSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    meshEnable: coercedBoolean().optional().describe('Enable or disable mesh networking'),
    autoFailoverEnable: coercedBoolean().optional().describe('Enable auto failover'),
    defGatewayEnable: coercedBoolean().optional().describe('Connectivity detection: true = auto (recommended), false = custom IP'),
    gateway: z.string().optional().describe('Custom gateway IP for connectivity detection (used when defGatewayEnable is false)'),
    fullSector: coercedBoolean().optional().describe('Enable full-sector DFS'),
});

export function registerUpdateMeshTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateMesh',
        {
            description:
                'Update site-level mesh settings. Use getMesh first to see current values.',
            inputSchema: updateMeshSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateMesh', async ({ siteId, ...params }) => {
            const mesh: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) mesh[key] = value;
            }

            if (Object.keys(mesh).length === 0) {
                return toToolResult('No settings provided to update.');
            }

            return toToolResult(await client.updateMesh({ mesh }, siteId));
        })
    );
}
