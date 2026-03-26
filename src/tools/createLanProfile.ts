import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { coercedBoolean, coercedObject } from './coerce.js';

import type { OmadaClient } from '../omadaClient/index.js';
import { toToolResult, wrapToolHandler } from '../server/common.js';

const createLanProfileSchema = z.object({
    siteId: z.string().min(1).optional(),
    name: z.string().min(1, 'Profile name is required'),
    nativeNetworkId: z.string().min(1).describe('Native (untagged) network ID'),
    tagNetworkIds: coercedObject(z.array(z.string().min(1))).describe('Tagged network IDs'),
    poe: coercedBoolean().describe('Whether PoE is enabled'),
    spanningTreeEnable: coercedBoolean().describe('Whether Spanning Tree Protocol is enabled'),
    loopbackDetectEnable: coercedBoolean().describe('Whether loopback detection is enabled'),
    portIsolationEnable: coercedBoolean().describe('Whether port isolation is enabled'),
    lldpMedEnable: coercedBoolean().describe('Whether LLDP-MED is enabled'),
});

export function registerCreateLanProfileTool(server: McpServer, client: OmadaClient): void {
    server.registerTool(
        'createLanProfile',
        {
            description: 'Create a new LAN profile with native/tagged network assignments and port settings.',
            inputSchema: createLanProfileSchema.shape,
            annotations: {
                destructiveHint: true,
            },
        },
        wrapToolHandler('createLanProfile', async ({ siteId, ...data }) =>
            toToolResult(await client.createLanProfile(data, siteId))
        )
    );
}
