import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';
import { buildRebootScheduleBody, rebootScheduleShape } from './createRebootSchedule.js';

const updateRebootScheduleSchema = z.object({
    id: z.string().min(1).describe('Reboot schedule ID (from listRebootSchedules)'),
    ...rebootScheduleShape,
});

export function registerUpdateRebootScheduleTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateRebootSchedule',
        {
            description:
                'Modify an existing reboot schedule. All fields are required (the API replaces the schedule wholesale). Use listRebootSchedules to get the id.',
            inputSchema: updateRebootScheduleSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateRebootSchedule', async (input) => {
            const parsed = input as z.infer<typeof updateRebootScheduleSchema>;
            const { id, ...rest } = parsed;
            return toToolResult(await client.updateRebootSchedule(id, buildRebootScheduleBody(rest), parsed.siteId));
        })
    );
}
