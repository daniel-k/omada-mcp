import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateChannelLimitSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    enable: z.boolean().describe('Enable or disable the channel limit'),
});

export function registerUpdateChannelLimitTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateChannelLimit',
        {
            description:
                'Enable or disable the site-level channel limit. When enabled, APs are restricted to the channels assigned in their radio configuration.',
            inputSchema: updateChannelLimitSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateChannelLimit', async ({ siteId, enable }) => {
            return toToolResult(await client.updateChannelLimit({ channelLimit: { enable } }, siteId));
        })
    );
}
