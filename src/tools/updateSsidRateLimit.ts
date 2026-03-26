import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean, coercedObject } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const customRateLimitSchema = z.object({
    downLimitEnable: coercedBoolean().describe('Whether to limit downlink speed'),
    downLimit: z.coerce.number().int().optional().describe('Downlink speed limit value (Kbps: 1-10485760, Mbps: 1-10240)'),
    downLimitType: z.coerce.number().int().optional().describe('Downlink unit: 0=Kbps, 1=Mbps'),
    upLimitEnable: coercedBoolean().describe('Whether to limit uplink speed'),
    upLimit: z.coerce.number().int().optional().describe('Uplink speed limit value (Kbps: 1-10485760, Mbps: 1-10240)'),
    upLimitType: z.coerce.number().int().optional().describe('Uplink unit: 0=Kbps, 1=Mbps'),
});

const rateLimitSettingSchema = z.object({
    profileId: z.string().optional().describe('Rate limit profile ID (takes priority over customSetting)'),
    customSetting: coercedObject(customRateLimitSchema).optional().describe('Custom rate limit settings'),
});

const updateSsidRateLimitSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    clientRateLimit: coercedObject(rateLimitSettingSchema).optional().describe('Per-client rate limit settings'),
    ssidRateLimit: coercedObject(rateLimitSettingSchema).optional().describe('Per-SSID rate limit settings'),
    siteId: z.string().min(1).optional(),
});

export function registerUpdateSsidRateLimitTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateSsidRateLimit',
        {
            description:
                'Update SSID rate limit config (per-client and per-SSID bandwidth limits). Use getSsidDetail to see current clientRateLimit and ssidRateLimit values.',
            inputSchema: updateSsidRateLimitSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateSsidRateLimit', async ({ wlanId, ssidId, siteId, ...data }) =>
            toToolResult(await client.updateSsidRateLimit(wlanId, ssidId, data, siteId))
        )
    );
}
