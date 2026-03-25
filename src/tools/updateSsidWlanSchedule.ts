import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateSsidWlanScheduleSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    wlanScheduleEnable: z.boolean().describe('Whether WLAN scheduling is enabled'),
    action: z.number().int().optional().describe('Schedule action: 0=radio off during schedule, 1=radio on during schedule'),
    scheduleId: z.string().optional().describe('Time Range Profile ID for the schedule'),
    siteId: z.string().min(1).optional(),
});

export function registerUpdateSsidWlanScheduleTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateSsidWlanSchedule',
        {
            description:
                'Update SSID WLAN schedule config (enable/disable scheduling, set time range profile). Use getSsidDetail to see current wlanSchedule values.',
            inputSchema: updateSsidWlanScheduleSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateSsidWlanSchedule', async ({ wlanId, ssidId, siteId, ...data }) =>
            toToolResult(await client.updateSsidWlanSchedule(wlanId, ssidId, data, siteId))
        )
    );
}
