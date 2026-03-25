import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { siteInputSchema, toToolResult, wrapToolHandler } from '../server/common.js';

const MODE_LABELS: Record<number, string> = {
    0: 'disabled',
    1: 'prefer 5GHz/6GHz',
    2: 'balance',
};

interface BandSteeringData {
    bandSteeringForMultiBand?: {
        mode?: number;
    };
}

function formatBandSteering(data: BandSteeringData): string {
    const mode = data.bandSteeringForMultiBand?.mode;
    if (mode !== undefined) {
        const label = MODE_LABELS[mode] ?? `unknown (${mode})`;
        return `Band Steering: ${label}`;
    }
    return JSON.stringify(data, null, 2);
}

export function registerGetBandSteeringTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'getBandSteering',
        {
            description:
                'Get site-level band steering configuration. Band steering directs dual/tri-band clients to prefer 5GHz/6GHz or balance across bands.',
            inputSchema: siteInputSchema.shape,
        },
        wrapToolHandler('getBandSteering', async ({ siteId }) => {
            const result = await client.getBandSteering(siteId);
            const text = result && typeof result === 'object' ? formatBandSteering(result as BandSteeringData) : JSON.stringify(result, null, 2);
            return toToolResult(text);
        })
    );
}
