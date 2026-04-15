import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const listRebootSchedulesSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
});

export function registerListRebootSchedulesTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'listRebootSchedules',
        {
            description:
                'List reboot schedules for a site. Each schedule specifies which devices to reboot and when (daily/weekly/monthly at a given hour:minute).',
            inputSchema: listRebootSchedulesSchema.shape,
        },
        wrapToolHandler('listRebootSchedules', async ({ siteId }) => toToolResult(await client.listRebootSchedules(siteId)))
    );
}
