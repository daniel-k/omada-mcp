import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const TIMING_TYPE_MAP = { daily: 1, weekly: 2, monthly: 3 } as const;

const rebootScheduleShape = {
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    name: z.string().min(1).max(128).describe('Reboot schedule name (1-128 chars, no leading/trailing spaces)'),
    status: coercedBoolean().describe('Whether the schedule is enabled'),
    deviceMacs: z.array(z.string().min(1)).min(1).describe('MAC addresses of devices to reboot (e.g. ["AA-BB-CC-DD-EE-FF"])'),
    timing: z.enum(['daily', 'weekly', 'monthly']).describe('Schedule frequency'),
    dayOfWeek: z
        .coerce.number()
        .int()
        .min(0)
        .max(6)
        .optional()
        .describe('Day of week for weekly schedules: 0=Sunday through 6=Saturday. Required when timing is "weekly".'),
    dayOfMonth: z
        .coerce.number()
        .int()
        .min(1)
        .max(31)
        .optional()
        .describe('Day of month for monthly schedules (1-31). Required when timing is "monthly".'),
    hour: z.coerce.number().int().min(0).max(23).describe('Hour of day in site-local time (0-23)'),
    minute: z.coerce.number().int().min(0).max(59).describe('Minute of hour (0-59)'),
};

const createRebootScheduleSchema = z.object(rebootScheduleShape);

interface RebootScheduleInput {
    name: string;
    status: boolean;
    deviceMacs: string[];
    timing: 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number;
    dayOfMonth?: number;
    hour: number;
    minute: number;
}

function buildBody(input: RebootScheduleInput): Record<string, unknown> {
    const timingType = TIMING_TYPE_MAP[input.timing];
    const time: Record<string, unknown> = {
        timingType,
        hour: input.hour,
        minute: input.minute,
    };
    if (input.timing === 'weekly') {
        if (input.dayOfWeek === undefined) {
            throw new Error('dayOfWeek is required when timing is "weekly"');
        }
        time.dayOfWeek = input.dayOfWeek;
    }
    if (input.timing === 'monthly') {
        if (input.dayOfMonth === undefined) {
            throw new Error('dayOfMonth is required when timing is "monthly"');
        }
        time.dayOfMonth = input.dayOfMonth;
    }
    return {
        name: input.name,
        status: input.status,
        deviceMacs: input.deviceMacs,
        time,
    };
}

export function registerCreateRebootScheduleTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'createRebootSchedule',
        {
            description:
                'Create a new reboot schedule. Schedules automatically reboot the listed devices at the specified time. Time fields are interpreted in the site-local timezone.',
            inputSchema: createRebootScheduleSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('createRebootSchedule', async (input) => {
            const parsed = input as z.infer<typeof createRebootScheduleSchema>;
            return toToolResult(await client.createRebootSchedule(buildBody(parsed), parsed.siteId));
        })
    );
}

export { rebootScheduleShape, buildBody as buildRebootScheduleBody };
