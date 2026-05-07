import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const getAuditNotificationSettingsSchema = z.object({
    scope: z.enum(['site', 'global']).default('site').describe("'site' or 'global'."),
    siteId: z.string().min(1).optional().describe("Site ID; used (or default) when scope='site'."),
});

export function registerGetAuditNotificationSettingsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getAuditNotificationSettings',
        {
            description: 'Get audit-log notification settings. Returns each audit category and whether it triggers a webhook (Omada Pro Controller).',
            inputSchema: getAuditNotificationSettingsSchema.shape,
        },
        wrapToolHandler('getAuditNotificationSettings', async ({ scope, siteId }) => {
            const result = scope === 'global' ? await client.getAuditNotificationForGlobal() : await client.getAuditNotificationForSite(siteId);
            return toToolResult(result);
        })
    );
}
