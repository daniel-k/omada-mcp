import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const powerRangeSchema = z.object({
    minPower2g: z.number().int().min(9).max(30).optional().describe('Min TX power for 2.4 GHz (9-30 dBm)'),
    maxPower2g: z.number().int().min(9).max(30).optional().describe('Max TX power for 2.4 GHz (9-30 dBm)'),
    minPower5g: z.number().int().min(9).max(30).optional().describe('Min TX power for 5 GHz (9-30 dBm)'),
    maxPower5g: z.number().int().min(9).max(30).optional().describe('Max TX power for 5 GHz (9-30 dBm)'),
    minPower6g: z.number().int().min(9).max(30).optional().describe('Min TX power for 6 GHz (9-30 dBm)'),
    maxPower6g: z.number().int().min(9).max(30).optional().describe('Max TX power for 6 GHz (9-30 dBm)'),
}).optional().describe('Custom power range (required when powerMode is 1/custom)');

const widthRangeSchema = z.object({
    minWidth5g: z.number().int().optional().describe('Min channel width for 5 GHz (20, 40, 80, 160, 240)'),
    maxWidth5g: z.number().int().optional().describe('Max channel width for 5 GHz (20, 40, 80, 160, 240)'),
    minWidth6g: z.number().int().optional().describe('Min channel width for 6 GHz (20, 40, 80, 160, 320)'),
    maxWidth6g: z.number().int().optional().describe('Max channel width for 6 GHz (20, 40, 80, 160, 320)'),
}).optional().describe('Channel width range (required when widthSelectEn is true)');

const powerThresholdSchema = z.object({
    mode: z.number().int().min(0).max(1).optional().describe('0: auto, 1: custom'),
    threshold2g: z.number().int().min(-75).max(-60).optional().describe('2.4 GHz power threshold (-75 to -60 dBm)'),
    threshold5g: z.number().int().min(-75).max(-60).optional().describe('5 GHz power threshold (-75 to -60 dBm)'),
    threshold6g: z.number().int().min(-75).max(-60).optional().describe('6 GHz power threshold (-75 to -60 dBm)'),
}).optional().describe('Power threshold settings');

const advancedSettingSchema = z.object({
    exclude5gChEn: z.boolean().optional().describe('Enable excluded 5 GHz channels'),
    exclude5gCh: z.array(z.object({
        channel: z.number().int().describe('Channel number'),
        freq: z.number().int().describe('Frequency'),
    })).optional().describe('List of excluded 5 GHz channels'),
    powerMode: z.number().int().min(0).max(1).optional().describe('Power mode: 0 = auto, 1 = custom'),
    powerRange: powerRangeSchema,
    widthSelectEn: z.boolean().optional().describe('Enable channel width selection'),
    widthRange: widthRangeSchema,
    powerThreshold: powerThresholdSchema,
}).optional().describe('Advanced settings (only used in custom mode)');

const updateRfPlanningConfigSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    mode: z.number().int().min(0).max(1).describe('0: auto configuration, 1: custom configuration'),
    customSetting: z.object({
        channelDeployEnable: z.boolean().describe('Enable channel deployment'),
        channelWidthDeployEnable: z.boolean().describe('Enable channel width deployment'),
        bandDeployEnable: z.boolean().describe('Enable band deployment'),
        powerAdjustEnable: z.boolean().describe('Enable power adjustment'),
        advancedSetting: advancedSettingSchema,
    }).optional().describe('Custom settings (required when mode is 1)'),
});

export function registerUpdateRfPlanningConfigTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateRfPlanningConfig',
        {
            description:
                'Update WLAN Optimization (RF planning) configuration. Set mode to 0 for auto or 1 for custom with specific channel/power/band deployment options. Use getRfPlanningConfig first to see current values.',
            inputSchema: updateRfPlanningConfigSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateRfPlanningConfig', async ({ siteId, ...data }) => {
            return toToolResult(await client.updateRfPlanningConfig(data, siteId));
        })
    );
}
