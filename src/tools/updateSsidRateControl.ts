import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateSsidRateControlSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    rate2gCtrlEnable: coercedBoolean().describe('Whether 2.4GHz data rate control is enabled'),
    lowerDensity2g: z.coerce
        .number()
        .optional()
        .describe('2.4GHz minimum data rate (Mbps). Values: 1, 2, 5.5, 6, 9, 11, 12, 18, 24, 36, 48, 54. CCK rates (1, 2, 5.5, 11) unavailable when cckRatesDisable is true.'),
    higherDensity2g: z.coerce.number().int().optional().describe('2.4GHz maximum data rate (Mbps). Value: 54.'),
    cckRatesDisable: coercedBoolean().optional().describe('Whether CCK rates (1, 2, 5.5, 11 Mbps) are disabled on 2.4GHz'),
    clientRatesRequire2g: coercedBoolean().optional().describe('Whether clients must support the configured 2.4GHz minimum rate'),
    sendBeacons2g: coercedBoolean().optional().describe('Whether to send beacons at 1 Mbps on 2.4GHz'),
    rate5gCtrlEnable: coercedBoolean().describe('Whether 5GHz data rate control is enabled'),
    lowerDensity5g: z.coerce.number().int().optional().describe('5GHz minimum data rate (Mbps). Values: 6, 9, 12, 18, 24, 36, 48, 54.'),
    higherDensity5g: z.coerce.number().int().optional().describe('5GHz maximum data rate (Mbps). Value: 54.'),
    clientRatesRequire5g: coercedBoolean().optional().describe('Whether clients must support the configured 5GHz minimum rate'),
    sendBeacons5g: coercedBoolean().optional().describe('Whether to send beacons at 6 Mbps on 5GHz'),
    rate6gCtrlEnable: coercedBoolean().optional().describe('Whether 6GHz data rate control is enabled (deprecated since controller V5.14.30)'),
    siteId: z.string().min(1).optional(),
});

export function registerUpdateSsidRateControlTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateSsidRateControl',
        {
            description:
                'Update SSID 802.11 data rate control config (minimum/maximum rates per band, CCK rates, beacon rates). Use getSsidDetail to see current rateControl values.',
            inputSchema: updateSsidRateControlSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateSsidRateControl', async ({ wlanId, ssidId, siteId, ...data }) =>
            toToolResult(await client.updateSsidRateControl(wlanId, ssidId, data, siteId))
        )
    );
}
