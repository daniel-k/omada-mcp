import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

interface RoamingData {
    roaming?: {
        fastRoamingEnable?: boolean;
        aiRoamingEnable?: boolean;
        nonStickRoamingEnable?: boolean;
    };
}

function formatRoaming(data: RoamingData): string {
    const r = data.roaming;
    if (!r) return JSON.stringify(data, null, 2);

    const lines: string[] = ['=== Roaming Settings ==='];
    if (r.fastRoamingEnable !== undefined) lines.push(`Fast Roaming (802.11r): ${r.fastRoamingEnable ? 'enabled' : 'disabled'}`);
    if (r.aiRoamingEnable !== undefined) lines.push(`AI Roaming: ${r.aiRoamingEnable ? 'enabled' : 'disabled'}`);
    if (r.nonStickRoamingEnable !== undefined) lines.push(`Non-Stick Roaming: ${r.nonStickRoamingEnable ? 'enabled' : 'disabled'}`);
    return lines.join('\n');
}

export function registerGetRoamingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRoaming',
        {
            description:
                'Get site-level roaming settings including fast roaming (802.11r), AI roaming, and non-stick roaming.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getRoaming', async ({ siteId }) => {
            const result = await client.getRoaming(siteId);
            const text = result && typeof result === 'object' ? formatRoaming(result as RoamingData) : JSON.stringify(result, null, 2);
            return toToolResult(text);
        })
    );
}
