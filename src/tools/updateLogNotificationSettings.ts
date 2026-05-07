import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';
import { coercedBoolean, coercedObject } from './coerce.js';

const notificationEntrySchema = z.object({
    key: z.string().min(1).describe('Notification category key (see Open API Access Guide §5.6.1, e.g. "LOGIN_OK").'),
    enable: coercedBoolean().describe('Capture this notification at all (controls whether the event/alert is logged).'),
    email: coercedBoolean().describe('Send an email when this notification fires.'),
    webhook: coercedBoolean().optional().describe('Trigger a webhook (Omada Pro Controller only).'),
});

const emailSettingSchema = z
    .object({
        alertEmailEnable: coercedBoolean().optional().describe('Enable/disable email for this category.'),
        delayEnable: coercedBoolean().optional().describe('Enable/disable delayed email batching.'),
        delay: z.coerce.number().int().min(0).max(99999).optional().describe('Email delay in seconds (0–99999).'),
    })
    .partial();

const webhookConfigSchema = z.object({
    webhookEnable: coercedBoolean().describe('Enable/disable webhook delivery (Pro Controller only).'),
    webhookId: z.string().optional().describe('Webhook ID (required when webhookEnable=true).'),
});

const updateLogNotificationSettingsSchema = z.object({
    scope: z.enum(['site', 'global']).default('site').describe("'site' or 'global'."),
    siteId: z.string().min(1).optional().describe("Site ID; used (or default) when scope='site'."),
    alertNotifications: coercedObject(z.array(notificationEntrySchema))
        .optional()
        .describe('Alert-category settings: which keys are captured as alerts and how they are delivered.'),
    eventNotifications: coercedObject(z.array(notificationEntrySchema))
        .optional()
        .describe('Event-category settings: which keys are captured as events and how they are delivered.'),
    alertEmailSetting: coercedObject(emailSettingSchema).optional().describe('Email batching/delay settings for alerts.'),
    eventEmailSetting: coercedObject(emailSettingSchema).optional().describe('Email batching/delay settings for events.'),
    webhookConfig: coercedObject(webhookConfigSchema).optional().describe('Webhook configuration (Omada Pro Controller only).'),
});

export function registerUpdateLogNotificationSettingsTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateLogNotificationSettings',
        {
            description:
                'Update log notification settings (event/alert v2). Use this to choose which events/alerts get captured into the logs and which trigger email or webhook notifications. Only the fields you supply are changed; omit a section to leave it untouched.',
            inputSchema: updateLogNotificationSettingsSchema.shape,
        },
        wrapToolHandler('updateLogNotificationSettings', async (args) => {
            const data: Record<string, unknown> = {};
            if (args.alertNotifications) data.alertNotifications = args.alertNotifications;
            if (args.eventNotifications) data.eventNotifications = args.eventNotifications;
            if (args.alertEmailSetting) data.alertEmailSetting = args.alertEmailSetting;
            if (args.eventEmailSetting) data.eventEmailSetting = args.eventEmailSetting;
            if (args.webhookConfig) data.webhookConfig = args.webhookConfig;

            const result =
                args.scope === 'global'
                    ? await client.modifyLogNotificationForGlobal(data)
                    : await client.modifyLogNotificationForSite(data, args.siteId);
            return toToolResult(result);
        })
    );
}
