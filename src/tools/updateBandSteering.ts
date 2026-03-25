import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const MODE_MAP: Record<string, number> = {
    disable: 0,
    'prefer-5g-6g': 1,
    balance: 2,
};

const updateBandSteeringSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    mode: z
        .enum(['disable', 'prefer-5g-6g', 'balance'])
        .describe('Band steering mode: "disable", "prefer-5g-6g" (steer clients to 5GHz/6GHz), or "balance" (distribute across bands)'),
});

export function registerUpdateBandSteeringTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateBandSteering',
        {
            description:
                'Update site-level band steering mode. Controls whether multi-band clients are steered to prefer higher bands or balanced across bands.',
            inputSchema: updateBandSteeringSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateBandSteering', async ({ siteId, mode }) => {
            const data = {
                bandSteeringForMultiBand: {
                    mode: MODE_MAP[mode],
                },
            };
            return toToolResult(await client.updateBandSteering(data, siteId));
        })
    );
}
