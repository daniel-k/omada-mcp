import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';
import { createPaginationSchema } from '../utils/pagination-schema.js';
import { coercedObject } from './coerce.js';

const timeRangeSchema = z.object({
    timeStart: z.coerce.number().int(),
    timeEnd: z.coerce.number().int(),
});

const getAuditLogsSchema = z.object({
    scope: z.enum(['site', 'global']).default('site').describe("Query scope: 'site' for a single site, 'global' for the controller view."),
    siteId: z.string().min(1).optional().describe("Site ID; required (or default) when scope='site'."),
    ...createPaginationSchema(50),
    sortTime: z.enum(['asc', 'desc']).optional().describe('Sort order by time.'),
    result: z.coerce.number().int().min(0).max(1).optional().describe('Filter by result: 0=successful, 1=failed.'),
    level: z.enum(['Error', 'Warning', 'Information']).optional().describe('Filter by log level.'),
    auditTypes: z.string().optional().describe('Comma-separated audit-log types (e.g. "Log,Cloud Access,User Interface").'),
    times: coercedObject(z.array(timeRangeSchema))
        .optional()
        .describe('Optional list of time ranges, each with timeStart/timeEnd in ms. Defaults to last 7 days when omitted.'),
    searchKey: z.string().optional().describe('Fuzzy search against log content.'),
});

export function registerGetAuditLogsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAuditLogs',
        {
            description:
                'Get the audit log list for a site or globally. Audit logs record administrator/operator actions (logins, configuration changes, API calls).',
            inputSchema: getAuditLogsSchema.shape,
        },
        wrapToolHandler('getAuditLogs', async (args) => {
            const options = {
                page: args.page,
                pageSize: args.pageSize,
                sortTime: args.sortTime,
                result: args.result,
                level: args.level,
                auditTypes: args.auditTypes,
                times: args.times,
                searchKey: args.searchKey,
            };
            const result =
                args.scope === 'global' ? await client.getAuditLogsForGlobal(options) : await client.getAuditLogsForSite(options, args.siteId);
            return toToolResult(result);
        })
    );
}
