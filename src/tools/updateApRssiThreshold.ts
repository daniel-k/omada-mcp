import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

// API field suffixes: rssiEnable2g, threshold2g, rssiEnable5g, threshold5g, etc.
const BAND_SUFFIX_MAP: Record<string, string> = {
    '2g': '2g',
    '5g': '5g',
    '5g1': '5g1',
    '5g2': '5g2',
    '6g': '6g',
};

const updateApRssiThresholdSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    apMac: z.string().min(1).describe('AP MAC address, e.g. AA-BB-CC-DD-EE-FF'),
    band: z.enum(['2g', '5g', '5g1', '5g2', '6g']).describe('Radio band to configure'),
    rssiEnable: coercedBoolean().describe('Enable or disable RSSI threshold for this band'),
    threshold: z.coerce
        .number()
        .int()
        .min(-95)
        .max(-10)
        .optional()
        .describe('RSSI threshold in dBm (e.g. -70). Clients below this will be kicked. Required when enabling.'),
});

export function registerUpdateApRssiThresholdTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateApRssiThreshold',
        {
            description:
                'Set the RSSI (signal strength) threshold for an AP radio band. Clients with signal weaker than the threshold will be disconnected. Use getApLoadBalance first to see current settings.',
            inputSchema: updateApRssiThresholdSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateApRssiThreshold', async ({ apMac, siteId, band, rssiEnable, threshold }) => {
            const suffix = BAND_SUFFIX_MAP[band];
            // API keys: rssiEnable2g/threshold2g, rssiEnable5g/threshold5g, etc.
            const capSuffix = suffix.charAt(0).toUpperCase() + suffix.slice(1);
            const data: Record<string, unknown> = {
                [`rssiEnable${capSuffix}`]: rssiEnable,
            };
            if (threshold !== undefined) {
                data[`threshold${capSuffix}`] = threshold;
            }

            return toToolResult(await client.updateApLoadBalance(apMac, data, siteId));
        })
    );
}
