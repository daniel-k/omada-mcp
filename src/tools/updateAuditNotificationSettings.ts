import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';
import { coercedBoolean, coercedObject } from './coerce.js';

const auditEntrySchema = z.object({
    key: z.string().min(1).describe('Audit-log category key (see Open API Access Guide §5.2.1, e.g. "DASHBOARD").'),
    webhook: coercedBoolean().describe('Trigger webhook for this audit category.'),
});

const webhookConfigSchema = z.object({
    webhookEnable: coercedBoolean().describe('Enable/disable webhook delivery.'),
    webhookId: z.string().optional().describe('Webhook ID (required when webhookEnable=true).'),
});

const updateAuditNotificationSettingsSchema = z.object({
    scope: z.enum(['site', 'global']).default('site').describe("'site' or 'global'."),
    siteId: z.string().min(1).optional().describe("Site ID; used (or default) when scope='site'."),
    auditLogNotifications: coercedObject(z.array(auditEntrySchema)).describe('Audit-category list with webhook flag per category.'),
    webhookConfig: coercedObject(webhookConfigSchema).describe('Webhook configuration (Omada Pro Controller only).'),
});

export function registerUpdateAuditNotificationSettingsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateAuditNotificationSettings',
        {
            description:
                'Update audit-log notification settings. Configures which administrator/operator audit categories trigger webhooks (Omada Pro Controller only).',
            inputSchema: updateAuditNotificationSettingsSchema.shape,
        },
        wrapToolHandler('updateAuditNotificationSettings', async (args) => {
            const data: Record<string, unknown> = {
                auditLogNotifications: args.auditLogNotifications,
                webhookConfig: args.webhookConfig,
            };
            const result =
                args.scope === 'global'
                    ? await client.modifyAuditNotificationForGlobal(data)
                    : await client.modifyAuditNotificationForSite(data, args.siteId);
            return toToolResult(result);
        })
    );
}
