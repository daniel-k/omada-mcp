import { z } from 'zod';

const booleanStringSchema = z
  .union([z.literal('true'), z.literal('false')])
  .optional()
  .transform((value) => value !== 'false');

const numericStringSchema = z
  .string()
  .optional()
  .transform((value) => (value ? Number.parseInt(value, 10) : undefined))
  .pipe(z.number().positive().optional());

const listStringSchema = z
  .string()
  .optional()
  .transform((value) => (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : undefined));

const envSchema = z.object({
  // Omada Client Configuration
  baseUrl: z.string().url({ message: 'OMADA_BASE_URL must be a valid URL' }),
  clientId: z.string().min(1, 'OMADA_CLIENT_ID is required'),
  clientSecret: z.string().min(1, 'OMADA_CLIENT_SECRET is required'),
  omadacId: z.string().min(1, 'OMADA_OMADAC_ID is required'),
  siteId: z.string().min(1).optional(),
  strictSsl: booleanStringSchema,
  requestTimeout: numericStringSchema,
  proxyUrl: z.string().url().optional(),

  // MCP Generic Server Configuration
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
  logFormat: z.enum(['plain', 'json', 'gcp-json']).optional().default('plain'),
  useHttp: booleanStringSchema,
  stateful: booleanStringSchema,

  // MCP Server HTTP/SSE Configuration
  httpPort: numericStringSchema,
  httpHost: z.string().optional(),
  httpPath: z.string().optional(),
  httpEnableHealthcheck: booleanStringSchema,
  httpHealthcheckPath: z.string().optional(),
  httpAllowCors: booleanStringSchema,
  httpAllowedHosts: listStringSchema,
  httpAllowedOrigins: listStringSchema,
  httpEnableDnsProtection: booleanStringSchema,
});

export interface EnvironmentConfig {
  // Omada Client Configuration
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  omadacId: string;
  siteId?: string;
  strictSsl: boolean;
  requestTimeout?: number;
  proxyUrl?: string;

  // MCP Generic Server Configuration
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logFormat: 'plain' | 'json' | 'gcp-json';
  useHttp: boolean;
  stateful: boolean;

  // MCP Server HTTP/SSE Configuration
  httpPort?: number;
  httpHost?: string;
  httpPath?: string;
  httpEnableHealthcheck: boolean;
  httpHealthcheckPath?: string;
  httpAllowCors: boolean;
  httpAllowedHosts?: string[];
  httpAllowedOrigins?: string[];
  httpEnableDnsProtection: boolean;
}

export function loadConfigFromEnv(env: NodeJS.ProcessEnv = process.env): EnvironmentConfig {
  const parsed = envSchema.safeParse({
    // Omada Client Configuration
    baseUrl: env.OMADA_BASE_URL,
    clientId: env.OMADA_CLIENT_ID,
    clientSecret: env.OMADA_CLIENT_SECRET,
    omadacId: env.OMADA_OMADAC_ID ?? env.OMADA_CONTROLLER_ID,
    siteId: env.OMADA_SITE_ID,
    strictSsl: env.OMADA_STRICT_SSL,
    requestTimeout: env.OMADA_TIMEOUT,
    proxyUrl: env.OMADA_PROXY_URL,

    // MCP Generic Server Configuration
    logLevel: env.MCP_SERVER_LOG_LEVEL ?? env.LOG_LEVEL,
    logFormat: env.MCP_SERVER_LOG_FORMAT,
    useHttp: env.MCP_SERVER_USE_HTTP,
    stateful: env.MCP_SERVER_STATEFUL ?? env.MCP_HTTP_STATEFUL,

    // MCP Server HTTP/SSE Configuration
    httpPort: env.MCP_HTTP_PORT ?? env.PORT,
    httpHost: env.MCP_HTTP_HOST ?? env.HOST,
    httpPath: env.MCP_HTTP_PATH,
    httpEnableHealthcheck: env.MCP_HTTP_ENABLE_HEALTHCHECK,
    httpHealthcheckPath: env.MCP_HTTP_HEALTHCHECK_PATH,
    httpAllowCors: env.MCP_HTTP_ALLOW_CORS,
    httpAllowedHosts: env.MCP_HTTP_ALLOWED_HOSTS,
    httpAllowedOrigins: env.MCP_HTTP_ALLOWED_ORIGINS,
    httpEnableDnsProtection: env.MCP_HTTP_ENABLE_DNS_PROTECTION,
  });

  if (!parsed.success) {
    const messages = parsed.error.issues.map((issue) => issue.message);
    throw new Error(`Invalid environment configuration:\n${messages.join('\n')}`);
  }

  return {
    // Omada Client Configuration
    baseUrl: parsed.data.baseUrl.replace(/\/$/, ''),
    clientId: parsed.data.clientId,
    clientSecret: parsed.data.clientSecret,
    omadacId: parsed.data.omadacId,
    siteId: parsed.data.siteId,
    strictSsl: parsed.data.strictSsl ?? true,
    requestTimeout: parsed.data.requestTimeout,
    proxyUrl: parsed.data.proxyUrl,

    // MCP Generic Server Configuration
    logLevel: parsed.data.logLevel,
    logFormat: parsed.data.logFormat,
    useHttp: parsed.data.useHttp ?? false,
    stateful: parsed.data.stateful ?? false,

    // MCP Server HTTP/SSE Configuration
    httpPort: parsed.data.httpPort,
    httpHost: parsed.data.httpHost,
    httpPath: parsed.data.httpPath,
    httpEnableHealthcheck: parsed.data.httpEnableHealthcheck ?? true,
    httpHealthcheckPath: parsed.data.httpHealthcheckPath,
    httpAllowCors: parsed.data.httpAllowCors ?? true,
    httpAllowedHosts: parsed.data.httpAllowedHosts,
    httpAllowedOrigins: parsed.data.httpAllowedOrigins,
    httpEnableDnsProtection: parsed.data.httpEnableDnsProtection ?? true,
  };
}
