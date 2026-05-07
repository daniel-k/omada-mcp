import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const resetLogNotificationSettingsSchema = z.object({
    scope: z.enum(['site', 'global']).default('site').describe("'site' or 'global'."),
    siteId: z.string().min(1).optional().describe("Site ID; used (or default) when scope='site'."),
});

export function registerResetLogNotificationSettingsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'resetLogNotificationSettings',
        {
            description: 'Reset log notification settings to controller defaults at site or global scope.',
            inputSchema: resetLogNotificationSettingsSchema.shape,
        },
        wrapToolHandler('resetLogNotificationSettings', async ({ scope, siteId }) => {
            const result = scope === 'global' ? await client.resetLogNotificationForGlobal() : await client.resetLogNotificationForSite(siteId);
            return toToolResult(result);
        })
    );
}
