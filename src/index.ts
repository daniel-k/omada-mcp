import { loadConfigFromEnv } from './config.js';
import { OmadaClient } from './omadaClient.js';
import { startHttpServer } from './server/http.js';
import { startStdioServer } from './server/stdio.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  const config = loadConfigFromEnv();
  logger.info('Loaded Omada configuration', {
    baseUrl: config.baseUrl,
    omadacId: config.omadacId,
    siteId: config.siteId ?? null,
    strictSsl: config.strictSsl,
    requestTimeout: config.requestTimeout ?? null,
    proxyConfigured: Boolean(config.proxyUrl)
  });

  const client = new OmadaClient(config);

  const useHttp = process.env.MCP_SERVER_USE_HTTP === 'true';

  if (useHttp) {
    await startHttpServer(client);
  } else {
    await startStdioServer(client);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error('Failed to start Omada MCP server', { error: message });
  process.exitCode = 1;
});
