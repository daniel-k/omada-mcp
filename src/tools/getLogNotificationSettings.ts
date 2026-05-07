import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const getLogNotificationSettingsSchema = z.object({
    scope: z.enum(['site', 'global']).default('site').describe("'site' for a site's notification settings, 'global' for the controller view."),
    siteId: z.string().min(1).optional().describe("Site ID; used (or default) when scope='site'."),
});

export function registerGetLogNotificationSettingsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getLogNotificationSettings',
        {
            description:
                'Get log notification settings (event/alert v2). Returns each notification key with its alert/event/email/webhook flags plus webhook and email delay configuration. These settings determine which events are captured into the event/alert logs and which trigger emails or webhooks.',
            inputSchema: getLogNotificationSettingsSchema.shape,
        },
        wrapToolHandler('getLogNotificationSettings', async ({ scope, siteId }) => {
            const result = scope === 'global' ? await client.getLogNotificationForGlobal() : await client.getLogNotificationForSite(siteId);
            return toToolResult(result);
        })
    );
}
