import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const deleteRebootScheduleSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    id: z.string().min(1).describe('Reboot schedule ID (from listRebootSchedules)'),
});

export function registerDeleteRebootScheduleTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'deleteRebootSchedule',
        {
            description: 'Delete a reboot schedule by its ID.',
            inputSchema: deleteRebootScheduleSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('deleteRebootSchedule', async ({ id, siteId }) => toToolResult(await client.deleteRebootSchedule(id, siteId)))
    );
}
