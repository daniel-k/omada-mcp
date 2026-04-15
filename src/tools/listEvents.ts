import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const listEventsSchema = z.object({
    siteId: z.string().min(1).optional(),
    page: z.coerce.number().int().min(1).optional().default(1).describe('Page number (default: 1)'),
    pageSize: z.coerce.number().int().min(1).max(1000).optional().default(100).describe('Page size (default: 100, max: 1000)'),
    timeStart: z.coerce
        .number()
        .int()
        .optional()
        .describe('Start of time window, unix millis. Defaults to 7 days ago.'),
    timeEnd: z.coerce.number().int().optional().describe('End of time window, unix millis. Defaults to now.'),
    module: z.enum(['System', 'Device', 'Client']).optional().describe('Filter by module (optional)'),
});

export function registerListEventsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listEvents',
        {
            description:
                'List paginated site event log entries (system/device/client events). Defaults to last 7 days when timeStart/timeEnd are omitted.',
            inputSchema: listEventsSchema.shape,
        },
        wrapToolHandler('listEvents', async ({ siteId, page, pageSize, timeStart, timeEnd, module }) => {
            const end = timeEnd ?? Date.now();
            const start = timeStart ?? end - SEVEN_DAYS_MS;
            return toToolResult(await client.listEvents(siteId, page, pageSize, start, end, module));
        })
    );
}
