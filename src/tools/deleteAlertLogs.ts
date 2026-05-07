import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const deleteAlertLogsSchema = z.object({
    scope: z.enum(['site', 'global']).default('site').describe("'site' deletes from a site, 'global' deletes from the global view."),
    siteId: z.string().min(1).optional().describe("Site ID; used (or default) when scope='site'."),
    selectType: z
        .enum(['include', 'exclude', 'all'])
        .describe("'include' deletes only the listed log IDs, 'exclude' deletes all but those, 'all' deletes every alert in the time window."),
    logs: z.array(z.string()).optional().describe('Alert log IDs (from getAlertLogs). Required for include/exclude.'),
    startTime: z.coerce.number().int().describe('Start timestamp (ms).'),
    endTime: z.coerce.number().int().describe('End timestamp (ms).'),
    filterModule: z
        .enum(['System', 'Device', 'Client'])
        .optional()
        .describe("Module filter; required when selectType='all'. Site allows System/Device/Client; global allows System/Device."),
});

export function registerDeleteAlertLogsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'deleteAlertLogs',
        {
            description: 'Delete alert log entries from a site or from the global view.',
            inputSchema: deleteAlertLogsSchema.shape,
        },
        wrapToolHandler('deleteAlertLogs', async ({ scope, siteId, selectType, logs, startTime, endTime, filterModule }) => {
            const payload = { selectType, logs, startTime, endTime, filterModule };
            const result = scope === 'global' ? await client.deleteAlertLogsForGlobal(payload) : await client.deleteAlertLogsForSite(payload, siteId);
            return toToolResult(result);
        })
    );
}
