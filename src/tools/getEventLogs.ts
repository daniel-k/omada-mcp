import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';

const getEventLogsSchema = z.object({
    scope: z.enum(['site', 'global']).default('site').describe("Query scope: 'site' for a single site, 'global' for the controller view."),
    siteId: z.string().min(1).optional().describe("Site ID; required (or default) when scope='site'."),
    ...createPaginationSchema(50),
    timeStart: z.coerce.number().int().describe('Start timestamp in milliseconds (UNIX ms).'),
    timeEnd: z.coerce.number().int().describe('End timestamp in milliseconds (UNIX ms).'),
    module: z
        .enum(['System', 'Device', 'Client'])
        .optional()
        .describe('Filter by module. Site logs allow System/Device/Client; global logs allow System/Device.'),
});

export function registerGetEventLogsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getEventLogs',
        {
            description:
                'Get the event log list for a site or globally. Event logs cover everyday system, device and client activity within the configured event categories.',
            inputSchema: getEventLogsSchema.shape,
        },
        wrapToolHandler('getEventLogs', async ({ scope, siteId, page, pageSize, timeStart, timeEnd, module }) => {
            const options = { page, pageSize, timeStart, timeEnd, module };
            const result = scope === 'global' ? await client.getEventLogsForGlobal(options) : await client.getEventLogsForSite(options, siteId);
            return toToolResult(result);
        })
    );
}
