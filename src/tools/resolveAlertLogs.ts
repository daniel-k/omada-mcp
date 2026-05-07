import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const resolveAlertLogsSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID. If omitted, the configured default site is used.'),
    selectType: z
        .enum(['include', 'exclude', 'all'])
        .describe(
            "'include' resolves the listed log IDs, 'exclude' resolves all but the listed ones, 'all' resolves every alert in the time window."
        ),
    logs: z.array(z.string()).optional().describe('Alert log IDs (from getAlertLogs). Required for include/exclude.'),
    startTime: z.coerce.number().int().describe('Start timestamp (ms).'),
    endTime: z.coerce.number().int().describe('End timestamp (ms).'),
    filterModule: z.enum(['System', 'Device']).optional().describe("Module filter; required when selectType='all'."),
});

export function registerResolveAlertLogsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'resolveAlertLogs',
        {
            description: 'Mark site alert log entries as resolved.',
            inputSchema: resolveAlertLogsSchema.shape,
        },
        wrapToolHandler('resolveAlertLogs', async ({ siteId, selectType, logs, startTime, endTime, filterModule }) => {
            const result = await client.resolveAlertForSite({ selectType, logs, startTime, endTime, filterModule }, siteId);
            return toToolResult(result);
        })
    );
}
