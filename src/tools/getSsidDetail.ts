import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const ssidDetailSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    includeSecrets: z.boolean().optional().describe('Include sensitive fields like pskSetting.securityKey. Defaults to false (secrets are redacted).'),
    siteId: z.string().min(1).optional(),
});

function redactSecrets(detail: unknown): unknown {
    if (detail === null || typeof detail !== 'object') {
        return detail;
    }

    const result = { ...(detail as Record<string, unknown>) };

    if (result.pskSetting && typeof result.pskSetting === 'object') {
        result.pskSetting = { ...(result.pskSetting as Record<string, unknown>), securityKey: '***REDACTED***' };
    }

    return result;
}

export function registerGetSsidDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getSsidDetail',
        {
            description:
                'Get detailed information for a specific SSID (wireless network), including security settings, rate limits, scheduling, and advanced configurations. Requires wlanId (from getWlanGroupList) and ssidId (from getSsidList). The pskSetting.securityKey (Wi-Fi password) is redacted by default. You do NOT need it for updateSsidBasicConfig — omit pskSetting and the existing password is preserved automatically. Only set includeSecrets=true if the user explicitly asks to see or export the password.',
            inputSchema: ssidDetailSchema.shape,
        },
        wrapToolHandler('getSsidDetail', async ({ wlanId, ssidId, siteId, includeSecrets }) => {
            const detail = await client.getSsidDetail(wlanId, ssidId, siteId);
            return toToolResult(includeSecrets ? detail : redactSecrets(detail));
        })
    );
}
