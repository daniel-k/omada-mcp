import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const updateSwitchPortSchema = z.object({
    siteId: z.string().min(1).optional(),
    switchMac: z.string().min(1, 'switchMac is required'),
    portId: z.string().min(1, 'portId is required'),
    profileId: z.string().min(1).optional().describe('LAN profile ID to assign'),
    poe: coercedBoolean().optional().describe('Enable or disable PoE'),
    bandwidthLimitMode: z.coerce.number().int().optional().describe('Bandwidth limit mode'),
    linkSpeed: z.coerce.number().int().optional().describe('Link speed setting'),
    duplex: z.coerce.number().int().optional().describe('Duplex mode'),
    spanningTreeEnable: coercedBoolean().optional().describe('Enable Spanning Tree Protocol'),
    portIsolationEnable: coercedBoolean().optional().describe('Enable port isolation'),
    loopbackDetectEnable: coercedBoolean().optional().describe('Enable loopback detection'),
    lldpMedEnable: coercedBoolean().optional().describe('Enable LLDP-MED'),
});

export function registerUpdateSwitchPortTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'updateSwitchPort',
        {
            description: 'Update a switch port configuration (profile, PoE, speed, STP, isolation, etc.).',
            inputSchema: updateSwitchPortSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('updateSwitchPort', async ({ siteId, switchMac, portId, ...data }) =>
            toToolResult(await client.updateSwitchPort(switchMac, portId, data, siteId))
        )
    );
}
