import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateBeaconControlSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    beaconInterval2g: z.number().int().min(40).max(500).optional().describe('2.4 GHz beacon interval (40-500)'),
    dtimPeriod2g: z.number().int().min(1).max(255).optional().describe('2.4 GHz DTIM period (1-255)'),
    rtsThreshold2g: z.number().int().min(1).max(2347).optional().describe('2.4 GHz RTS threshold (1-2347)'),
    beaconInterval5g: z.number().int().min(40).max(500).optional().describe('5 GHz beacon interval (40-500)'),
    dtimPeriod5g: z.number().int().min(1).max(255).optional().describe('5 GHz DTIM period (1-255)'),
    rtsThreshold5g: z.number().int().min(1).max(2347).optional().describe('5 GHz RTS threshold (1-2347)'),
    beaconInterval6g: z.number().int().min(40).max(500).optional().describe('6 GHz beacon interval (40-500)'),
    dtimPeriod6g: z.number().int().min(1).max(255).optional().describe('6 GHz DTIM period (1-255)'),
    rtsThreshold6g: z.number().int().min(1).max(2347).optional().describe('6 GHz RTS threshold (1-2347)'),
    airtimeFairness2g: z.boolean().optional().describe('Enable 2.4 GHz airtime fairness'),
    airtimeFairness5g: z.boolean().optional().describe('Enable 5 GHz airtime fairness'),
    airtimeFairness6g: z.boolean().optional().describe('Enable 6 GHz airtime fairness'),
});

export function registerUpdateBeaconControlTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateBeaconControl',
        {
            description:
                'Update site-level beacon control settings (beacon interval, DTIM period, RTS threshold) and/or airtime fairness. Use getBeaconControl first to see current values.',
            inputSchema: updateBeaconControlSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateBeaconControl', async ({ siteId, ...params }) => {
            const beaconControl: Record<string, unknown> = {};
            const airtimeFairness: Record<string, unknown> = {};

            for (const band of ['2g', '5g', '6g'] as const) {
                const interval = params[`beaconInterval${band}` as keyof typeof params];
                const dtim = params[`dtimPeriod${band}` as keyof typeof params];
                const rts = params[`rtsThreshold${band}` as keyof typeof params];
                const atf = params[`airtimeFairness${band}` as keyof typeof params];

                if (interval !== undefined) beaconControl[`beaconInterval${band}`] = interval;
                if (dtim !== undefined) beaconControl[`dtimPeriod${band}`] = dtim;
                if (rts !== undefined) beaconControl[`rtsThreshold${band}`] = rts;
                if (atf !== undefined) airtimeFairness[`enable${band}`] = atf;
            }

            const data: Record<string, unknown> = {};
            if (Object.keys(beaconControl).length > 0) data.beaconControl = beaconControl;
            if (Object.keys(airtimeFairness).length > 0) data.airtimeFairness = airtimeFairness;

            if (Object.keys(data).length === 0) {
                return toToolResult('No settings provided to update.');
            }

            return toToolResult(await client.updateBeaconControl(data, siteId));
        })
    );
}
