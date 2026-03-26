import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const ssidDetailSchema = z.object({
    wlanId: z.string().min(1, 'wlanId is required. Use getWlanGroupList to get available WLAN group IDs.'),
    ssidId: z.string().min(1, 'ssidId is required. Use getSsidList to get available SSID IDs.'),
    includeSecrets: coercedBoolean().optional().describe('Include sensitive fields like pskSetting.securityKey. Defaults to false (secrets are redacted).'),
    siteId: z.string().min(1).optional(),
});

const PMF_LABELS: Record<number, string> = { 1: 'Mandatory', 2: 'Capable', 3: 'Disable' };
const SECURITY_LABELS: Record<number, string> = {
    0: 'None',
    2: 'WPA-Enterprise',
    3: 'WPA-Personal',
    4: 'PPSK without RADIUS',
    5: 'PPSK with RADIUS',
};
const WPA_VERSION_LABELS: Record<number, string> = {
    1: 'WPA-PSK',
    2: 'WPA2-PSK',
    3: 'WPA/WPA2-PSK',
    4: 'WPA3-SAE',
};
const ENCRYPTION_LABELS: Record<number, string> = { 1: 'Auto', 3: 'AES' };

function bandLabel(band: number): string {
    const parts: string[] = [];
    if (band & 1) parts.push('2.4G');
    if (band & 2) parts.push('5G');
    if (band & 4) parts.push('6G');
    return parts.join('+') || String(band);
}

function annotateDetail(detail: unknown): unknown {
    if (detail === null || typeof detail !== 'object') {
        return detail;
    }

    const result = { ...(detail as Record<string, unknown>) };

    if (typeof result.pmfMode === 'number') {
        result.pmfMode_display = PMF_LABELS[result.pmfMode] ?? result.pmfMode;
    }
    if (typeof result.security === 'number') {
        result.security_display = SECURITY_LABELS[result.security] ?? result.security;
    }
    if (typeof result.band === 'number') {
        result.band_display = bandLabel(result.band);
    }

    if (result.pskSetting && typeof result.pskSetting === 'object') {
        const psk = { ...(result.pskSetting as Record<string, unknown>) };
        if (typeof psk.versionPsk === 'number') {
            psk.versionPsk_display = WPA_VERSION_LABELS[psk.versionPsk] ?? psk.versionPsk;
        }
        if (typeof psk.encryptionPsk === 'number') {
            psk.encryptionPsk_display = ENCRYPTION_LABELS[psk.encryptionPsk] ?? psk.encryptionPsk;
        }
        result.pskSetting = psk;
    }

    return result;
}

function redactSecrets(detail: unknown): unknown {
    if (detail === null || typeof detail !== 'object') {
        return detail;
    }

    const result = detail as Record<string, unknown>;

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
            const annotated = annotateDetail(detail);
            return toToolResult(includeSecrets ? annotated : redactSecrets(annotated));
        })
    );
}
