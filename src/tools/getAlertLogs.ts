import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';
import { coercedBoolean } from './coerce.js';

const getAlertLogsSchema = z.object({
    scope: z.enum(['site', 'global']).default('site').describe("Query scope: 'site' for a single site, 'global' for the controller view."),
    siteId: z.string().min(1).optional().describe("Site ID; required (or default) when scope='site'."),
    ...createPaginationSchema(50),
    timeStart: z.coerce.number().int().describe('Start timestamp in milliseconds (UNIX ms).'),
    timeEnd: z.coerce.number().int().describe('End timestamp in milliseconds (UNIX ms).'),
    module: z
        .enum(['System', 'Device', 'Client'])
        .optional()
        .describe('Filter by module. Site alerts allow System/Device/Client; global alerts allow System/Device.'),
    resolved: coercedBoolean().optional().describe('Filter by resolved status.'),
});

export function registerGetAlertLogsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAlertLogs',
        {
            description:
                'Get the alert log list for a site or globally. Alert logs are higher-severity events that require attention; they can be resolved or deleted.',
            inputSchema: getAlertLogsSchema.shape,
        },
        wrapToolHandler('getAlertLogs', async ({ scope, siteId, page, pageSize, timeStart, timeEnd, module, resolved }) => {
            const options = { page, pageSize, timeStart, timeEnd, module, resolved };
            const result = scope === 'global' ? await client.getAlertLogsForGlobal(options) : await client.getAlertLogsForSite(options, siteId);
            return toToolResult(result);
        })
    );
}
