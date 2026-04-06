import { ConfigSchema, type Config } from './types.js';
import { log } from './utils/logger.js';

const ENV_PREFIX = 'GAMEDEV_MCP_';

function parseEnvironment(): Partial<Config> {
  const config: Partial<Config> = {};

  const host = process.env[`${ENV_PREFIX}HOST`];
  if (host) config.host = host;

  const port = process.env[`${ENV_PREFIX}PORT`];
  if (port) {
    const parsed = parseInt(port, 10);
    if (!isNaN(parsed)) config.port = parsed;
  }

  const timeout = process.env[`${ENV_PREFIX}TIMEOUT`];
  if (timeout) {
    const parsed = parseInt(timeout, 10);
    if (!isNaN(parsed)) config.timeout = parsed;
  }

  const logLevel = process.env[`${ENV_PREFIX}LOG_LEVEL`];
  if (logLevel && ['error', 'warn', 'info', 'debug'].includes(logLevel)) {
    config.logLevel = logLevel as Config['logLevel'];
  }

  return config;
}

let globalConfig: Config | null = null;

export function loadConfig(): Config {
  if (globalConfig) return globalConfig;

  const envConfig = parseEnvironment();
  const result = ConfigSchema.safeParse(envConfig);

  if (!result.success) {
    log.warn('Invalid configuration, using defaults', 'config');
    globalConfig = ConfigSchema.parse({});
  } else {
    globalConfig = result.data;
  }

  log.setLevel(globalConfig.logLevel);
  log.info(`Config: ${globalConfig.host}:${globalConfig.port} (timeout ${globalConfig.timeout}ms)`, 'config');
  return globalConfig;
}

export function getConfig(): Config {
  if (!globalConfig) throw new Error('Configuration not loaded. Call loadConfig() first.');
  return globalConfig;
}
