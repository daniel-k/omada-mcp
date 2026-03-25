import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

interface MeshData {
    mesh?: {
        meshEnable?: boolean;
        autoFailoverEnable?: boolean;
        defGatewayEnable?: boolean;
        gateway?: string;
        fullSector?: boolean;
    };
}

function formatMesh(data: MeshData): string {
    const m = data.mesh;
    if (!m) return JSON.stringify(data, null, 2);

    const lines: string[] = ['=== Mesh Settings ==='];
    if (m.meshEnable !== undefined) lines.push(`Mesh: ${m.meshEnable ? 'enabled' : 'disabled'}`);
    if (m.autoFailoverEnable !== undefined) lines.push(`Auto Failover: ${m.autoFailoverEnable ? 'enabled' : 'disabled'}`);
    if (m.defGatewayEnable !== undefined) {
        lines.push(`Connectivity Detection: ${m.defGatewayEnable ? 'auto (recommended)' : 'custom IP'}`);
    }
    if (m.gateway) lines.push(`Custom Gateway IP: ${m.gateway}`);
    if (m.fullSector !== undefined) lines.push(`Full-Sector DFS: ${m.fullSector ? 'enabled' : 'disabled'}`);
    return lines.join('\n');
}

export function registerGetMeshTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getMesh',
        {
            description:
                'Get site-level mesh settings including mesh enable, auto failover, connectivity detection, and full-sector DFS.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getMesh', async ({ siteId }) => {
            const result = await client.getMesh(siteId);
            const text = result && typeof result === 'object' ? formatMesh(result as MeshData) : JSON.stringify(result, null, 2);
            return toToolResult(text);
        })
    );
}
