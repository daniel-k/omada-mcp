import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient.js';
import { customRequestSchema, toToolResult, wrapToolHandler } from '../server/common.js';

export function registerCallApiTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'omada.callApi',
        {
            description:
                'Call an arbitrary API path on the Omada controller. The provided URL should be a path, for example /openapi/v1/{omadacId}/sites',
            inputSchema: customRequestSchema.shape
        },
        wrapToolHandler('omada.callApi', async ({ method, url, params, data, siteId }) => {
            const resolvedUrl = siteId ? url.replace('{siteId}', siteId) : url;

            const payload = await client.callApi({
                method,
                url: resolvedUrl,
                params,
                data
            });

            return toToolResult(payload);
        })
    );
}
