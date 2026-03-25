import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateRoamingSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    fastRoamingEnable: z.boolean().optional().describe('Enable fast roaming (802.11r)'),
    aiRoamingEnable: z.boolean().optional().describe('Enable AI roaming (only effective when fast roaming is enabled)'),
    nonStickRoamingEnable: z.boolean().optional().describe('Enable non-stick roaming'),
});

export function registerUpdateRoamingTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateRoaming',
        {
            description:
                'Update site-level roaming settings. Use getRoaming first to see current values.',
            inputSchema: updateRoamingSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateRoaming', async ({ siteId, ...params }) => {
            const roaming: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) roaming[key] = value;
            }

            if (Object.keys(roaming).length === 0) {
                return toToolResult('No settings provided to update.');
            }

            return toToolResult(await client.updateRoaming({ roaming }, siteId));
        })
    );
}
