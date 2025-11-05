import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import type { OmadaClient } from '../omadaClient.js';

export interface ToolRegistration {
    register(server: McpServer, client: OmadaClient): void;
}
