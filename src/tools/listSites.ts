import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient.js';
import { toToolResult } from '../server/common.js';
import { logger } from '../utils/logger.js';

export function registerListSitesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'omada.listSites',
        {
            description: 'List all sites configured on the Omada controller.'
        },
        async (extra) => {
            const sessionId = extra.sessionId ?? 'unknown-session';
            logger.info('Tool invoked', { tool: 'omada.listSites', sessionId });

            try {
                const result = toToolResult(await client.listSites());
                logger.info('Tool completed', { tool: 'omada.listSites', sessionId });
                return result;
            } catch (error) {
                logger.error('Tool failed', {
                    tool: 'omada.listSites',
                    sessionId,
                    error: error instanceof Error ? error.message : String(error)
                });
                throw error;
            }
        }
    );
}
