import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const exportLogsSchema = z.object({
    type: z.enum(['event', 'audit']).default('event').describe("'event' exports the event/alert log list, 'audit' exports the audit log list."),
    siteIds: z.array(z.string().min(1)).min(1).describe('Site IDs to include in the export.'),
    format: z.coerce.number().int().min(0).max(1).default(0).describe('Export format: 0=CSV, 1=xlsx.'),
});

export function registerExportLogsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'exportLogs',
        {
            description: 'Export the global event log or audit log list as CSV or XLSX. Returns metadata pointing at the generated file.',
            inputSchema: exportLogsSchema.shape,
        },
        wrapToolHandler('exportLogs', async ({ type, siteIds, format }) => {
            const payload = { siteIds, format: format as 0 | 1 };
            const result = type === 'audit' ? await client.exportAuditLogListForGlobal(payload) : await client.exportLogListForGlobal(payload);
            return toToolResult(result);
        })
    );
}
