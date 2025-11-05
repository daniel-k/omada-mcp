import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import type { OmadaClient } from '../omadaClient.js';
import { logger } from '../utils/logger.js';

import { createServer } from './common.js';

export async function startStdioServer(client: OmadaClient): Promise<void> {
    logger.info('Starting stdio server');
    const server = createServer(client);
    const transport = new StdioServerTransport();
    logger.info('Connecting stdio server');
    await server.connect(transport);
    logger.info('Stdio server connected');
}
