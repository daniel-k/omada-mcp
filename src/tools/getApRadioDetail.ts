import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const getApRadioDetailSchema = z.object({
    siteId: z.string().min(1).optional(),
    apMac: z.string().min(1, 'apMac is required (e.g. AA-BB-CC-DD-EE-FF)'),
});

interface RadioTraffic {
    rxPkts?: number;
    txPkts?: number;
    rx?: number;
    tx?: number;
    rxDropPkts?: number;
    txDropPkts?: number;
    rxErrPkts?: number;
    txErrPkts?: number;
    rxRetryPkts?: number;
    txRetryPkts?: number;
}

interface RadioChannel {
    actualChannel?: string;
    maxTxRate?: number;
    txPower?: number;
    bandWidth?: string;
    rdMode?: string;
    txUtil?: number;
    rxUtil?: number;
    interUtil?: number;
    busyUtil?: number;
}

const BAND_LABELS: Record<string, string> = {
    '2g': '2.4 GHz',
    '5g': '5 GHz',
    '5g2': '5 GHz-2',
    '6g': '6 GHz',
};

function formatBytes(bytes: number): string {
    if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`;
    if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
    if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
    if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
    return `${bytes} B`;
}

function formatCount(n: number): string {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
}

function formatBand(band: string, traffic: RadioTraffic | undefined, channel: RadioChannel | undefined): string {
    const label = BAND_LABELS[band] ?? band;
    const lines: string[] = [`=== ${label} Radio ===`];

    if (channel) {
        lines.push(`Channel: ${channel.actualChannel ?? 'unknown'}`);
        lines.push(`Width: ${channel.bandWidth ?? '?'}`);
        lines.push(`Mode: ${channel.rdMode ?? '?'}`);
        lines.push(`TX Power: ${channel.txPower ?? '?'} dBm`);
        lines.push(`Max Rate: ${channel.maxTxRate ?? '?'} Mbps`);
        lines.push(`TX Utilization: ${channel.txUtil ?? 0}%`);
        lines.push(`RX Utilization: ${channel.rxUtil ?? 0}%`);
        lines.push(`Interference: ${channel.interUtil ?? 0}%`);
        if (channel.busyUtil !== undefined) lines.push(`Busy: ${channel.busyUtil}%`);
    }

    if (traffic) {
        lines.push(`RX: ${formatBytes(traffic.rx ?? 0)} (${formatCount(traffic.rxPkts ?? 0)} pkts)`);
        lines.push(`TX: ${formatBytes(traffic.tx ?? 0)} (${formatCount(traffic.txPkts ?? 0)} pkts)`);
        lines.push(`RX Dropped: ${traffic.rxDropPkts ?? 0}`);
        lines.push(`RX Errors: ${traffic.rxErrPkts ?? 0}`);
        if (traffic.rxRetryPkts) lines.push(`RX Retries: ${formatCount(traffic.rxRetryPkts)}`);
        lines.push(`TX Dropped: ${traffic.txDropPkts ?? 0}`);
        lines.push(`TX Errors: ${traffic.txErrPkts ?? 0}`);
        if (traffic.txRetryPkts) lines.push(`TX Retries: ${formatCount(traffic.txRetryPkts)}`);
    }

    return lines.join('\n');
}

function formatRadioDetail(data: Record<string, unknown>): string {
    const bands = ['2g', '5g', '5g2', '6g'];
    const sections: string[] = [];

    for (const band of bands) {
        const traffic = data[`radioTraffic${band}`] as RadioTraffic | undefined;
        const channel = data[`wp${band}`] as RadioChannel | undefined;
        if (traffic || channel) {
            sections.push(formatBand(band, traffic, channel));
        }
    }

    return sections.length > 0 ? sections.join('\n\n') : JSON.stringify(data, null, 2);
}

export function registerGetApRadioDetailTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getApRadioDetail',
        {
            description:
                'Get AP radio details including traffic statistics (rx/tx packets, bytes, errors) and channel metrics (actual channel, bandwidth, TX power, utilization) for each radio band.',
            inputSchema: getApRadioDetailSchema.shape,
        },
        wrapToolHandler('getApRadioDetail', async ({ apMac, siteId }) => {
            const result = await client.getApRadioDetail(apMac, siteId);
            const text = result && typeof result === 'object' ? formatRadioDetail(result as Record<string, unknown>) : JSON.stringify(result, null, 2);
            return toToolResult(text);
        })
    );
}
