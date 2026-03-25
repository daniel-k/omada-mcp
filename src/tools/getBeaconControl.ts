import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

interface BeaconControlData {
    beaconControl?: {
        beaconInterval2g?: number;
        dtimPeriod2g?: number;
        rtsThreshold2g?: number;
        beaconInterval5g?: number;
        dtimPeriod5g?: number;
        rtsThreshold5g?: number;
        beaconInterval6g?: number;
        dtimPeriod6g?: number;
        rtsThreshold6g?: number;
    };
    airtimeFairness?: {
        enable2g?: boolean;
        enable5g?: boolean;
        enable6g?: boolean;
    };
}

const BAND_LABELS: Record<string, string> = {
    '2g': '2.4 GHz',
    '5g': '5 GHz',
    '6g': '6 GHz',
};

function formatBeaconControl(data: BeaconControlData): string {
    const sections: string[] = [];

    const bc = data.beaconControl;
    if (bc) {
        sections.push('=== Beacon Control ===');
        for (const band of ['2g', '5g', '6g'] as const) {
            const label = BAND_LABELS[band];
            const interval = bc[`beaconInterval${band}` as keyof typeof bc];
            const dtim = bc[`dtimPeriod${band}` as keyof typeof bc];
            const rts = bc[`rtsThreshold${band}` as keyof typeof bc];
            const parts: string[] = [];
            if (interval !== undefined) parts.push(`Beacon Interval: ${interval}`);
            if (dtim !== undefined) parts.push(`DTIM Period: ${dtim}`);
            if (rts !== undefined) parts.push(`RTS Threshold: ${rts}`);
            if (parts.length) {
                sections.push(`${label}: ${parts.join(', ')}`);
            }
        }
    }

    const af = data.airtimeFairness;
    if (af) {
        sections.push('');
        sections.push('=== Airtime Fairness ===');
        for (const band of ['2g', '5g', '6g'] as const) {
            const label = BAND_LABELS[band];
            const enabled = af[`enable${band}` as keyof typeof af];
            if (enabled !== undefined) {
                sections.push(`${label}: ${enabled ? 'enabled' : 'disabled'}`);
            }
        }
    }

    return sections.length > 0 ? sections.join('\n') : JSON.stringify(data, null, 2);
}

export function registerGetBeaconControlTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getBeaconControl',
        {
            description:
                'Get site-level beacon control settings (beacon interval, DTIM period, RTS threshold per band) and airtime fairness configuration.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getBeaconControl', async ({ siteId }) => {
            const result = await client.getBeaconControl(siteId);
            const text = result && typeof result === 'object' ? formatBeaconControl(result as BeaconControlData) : JSON.stringify(result, null, 2);
            return toToolResult(text);
        })
    );
}
