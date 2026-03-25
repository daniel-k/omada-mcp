import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

interface ChannelLimitData {
    channelLimit?: {
        enable?: boolean;
    };
}

function formatChannelLimit(data: ChannelLimitData): string {
    const enable = data.channelLimit?.enable;
    if (enable !== undefined) {
        return `Channel Limit: ${enable ? 'enabled' : 'disabled'}`;
    }
    return JSON.stringify(data, null, 2);
}

export function registerGetChannelLimitTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getChannelLimit',
        {
            description:
                'Get site-level channel limit setting. When enabled, APs are restricted to the channels assigned in their radio configuration.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getChannelLimit', async ({ siteId }) => {
            const result = await client.getChannelLimit(siteId);
            const text = result && typeof result === 'object' ? formatChannelLimit(result as ChannelLimitData) : JSON.stringify(result, null, 2);
            return toToolResult(text);
        })
    );
}
