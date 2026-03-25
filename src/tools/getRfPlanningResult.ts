import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

interface RfPlanningResult {
    planningHistroyId?: string;
    beforeIndex?: number;
    afterIndex?: number;
    status?: number;
    failType?: number;
}

const STATUS_LABELS: Record<number, string> = {
    0: 'completed (optimization just succeeded)',
    1: 'idle (no optimization result)',
    2: 'in progress (RF planning)',
    3: 'canceling',
};

function formatResult(data: RfPlanningResult): string {
    const lines: string[] = ['=== WLAN Optimization Result ==='];
    if (data.status !== undefined) {
        lines.push(`Status: ${STATUS_LABELS[data.status] ?? `unknown (${data.status})`}`);
    }
    if (data.beforeIndex !== undefined) lines.push(`Before Index: ${data.beforeIndex}/100`);
    if (data.afterIndex !== undefined) lines.push(`After Index: ${data.afterIndex}/100`);
    if (data.planningHistroyId) lines.push(`History ID: ${data.planningHistroyId}`);
    if (data.failType !== undefined) {
        lines.push(`Fail Type: ${data.failType === 0 ? 'before deployment' : 'after deployment'}`);
    }
    return lines.join('\n');
}

export function registerGetRfPlanningResultTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getRfPlanningResult',
        {
            description:
                'Get the current WLAN Optimization (RF planning) result and status. Shows whether optimization is idle, in progress, or just completed, along with before/after quality indexes.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getRfPlanningResult', async ({ siteId }) => {
            const result = await client.getRfPlanningResult(siteId);
            const text = result && typeof result === 'object' ? formatResult(result as RfPlanningResult) : JSON.stringify(result, null, 2);
            return toToolResult(text);
        })
    );
}
