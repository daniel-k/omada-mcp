import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const getApLoadBalanceSchema = z.object({
    siteId: z.string().min(1).optional().describe('Site ID (omit to use default site)'),
    apMac: z.string().min(1).describe('AP MAC address, e.g. AA-BB-CC-DD-EE-FF'),
});

interface LoadBalanceResult {
    enable?: boolean;
    maxClients2g?: number;
    maxClients5g?: number;
    maxClients5g1?: number;
    maxClients5g2?: number;
    maxClients6g?: number;
    rssiEnable2g?: boolean;
    threshold2g?: number;
    rssiEnable5g?: boolean;
    threshold5g?: number;
    rssiEnable5g1?: boolean;
    threshold5g1?: number;
    rssiEnable5g2?: boolean;
    threshold5g2?: number;
    rssiEnable6g?: boolean;
    threshold6g?: number;
}

const BANDS = [
    { suffix: '2g', label: '2.4 GHz' },
    { suffix: '5g', label: '5 GHz' },
    { suffix: '5g1', label: '5 GHz-1' },
    { suffix: '5g2', label: '5 GHz-2' },
    { suffix: '6g', label: '6 GHz' },
];

function formatLoadBalance(data: LoadBalanceResult): string {
    const lines: string[] = [];

    lines.push(`Load Balance: ${data.enable ? 'enabled' : 'disabled'}`);
    lines.push('');

    // Max clients
    const clientLines: string[] = [];
    for (const { suffix, label } of BANDS) {
        const key = `maxClients${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}` as keyof LoadBalanceResult;
        const val = data[key];
        if (val !== undefined) {
            clientLines.push(`  ${label}: ${val} max clients`);
        }
    }
    if (clientLines.length > 0) {
        lines.push('Max Clients:');
        lines.push(...clientLines);
        lines.push('');
    }

    // RSSI thresholds
    const rssiLines: string[] = [];
    for (const { suffix, label } of BANDS) {
        const enableKey = `rssiEnable${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}` as keyof LoadBalanceResult;
        const threshKey = `threshold${suffix.charAt(0).toUpperCase()}${suffix.slice(1)}` as keyof LoadBalanceResult;
        const enabled = data[enableKey];
        const threshold = data[threshKey];
        if (enabled !== undefined) {
            rssiLines.push(`  ${label}: ${enabled ? `enabled at ${threshold} dBm` : `disabled (${threshold} dBm)`}`);
        }
    }
    if (rssiLines.length > 0) {
        lines.push('RSSI Thresholds:');
        lines.push(...rssiLines);
    }

    return lines.join('\n');
}

export function registerGetApLoadBalanceTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getApLoadBalance',
        {
            description:
                'Get AP load balance and RSSI threshold configuration. Returns per-band settings for max client limits and RSSI kick thresholds.',
            inputSchema: getApLoadBalanceSchema.shape,
        },
        wrapToolHandler('getApLoadBalance', async ({ apMac, siteId }) => {
            const result = await client.getApLoadBalance(apMac, siteId);
            const text = result && typeof result === 'object' ? formatLoadBalance(result as LoadBalanceResult) : JSON.stringify(result, null, 2);
            return toToolResult(text);
        })
    );
}
