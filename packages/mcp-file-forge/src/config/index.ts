/**
 * MCP File Forge - Configuration Module
 *
 * Handles loading and merging configuration from multiple sources.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { ServerConfig, SandboxConfig, LogConfig, TemplateConfig } from '../types.js';
import { ServerConfigSchema } from '../types.js';

/**
 * Default configuration values.
 */
const DEFAULT_CONFIG: ServerConfig = {
  sandbox: {
    allowed_paths: ['.'],
    denied_paths: ['**/node_modules/**', '**/.git/**'],
    follow_symlinks: false,
    max_file_size: 104857600, // 100MB
    max_depth: 20,
  },
  templates: {
    paths: ['./templates'],
  },
  logging: {
    level: 'info',
  },
  read_only: false,
};

/**
 * Environment variable prefix.
 */
const ENV_PREFIX = 'MCP_FILE_FORGE_';

/**
 * Parse a comma-separated string into an array.
 */
function parseCSV(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Parse environment variables into partial config.
 */
function parseEnvironment(): Partial<ServerConfig> {
  const config: Partial<ServerConfig> = {};
  const sandbox: Partial<SandboxConfig> = {};
  const templates: Partial<TemplateConfig> = {};
  const logging: Partial<LogConfig> = {};

  // Read-only mode
  const readOnly = process.env[`${ENV_PREFIX}READ_ONLY`];
  if (readOnly !== undefined) {
    config.read_only = readOnly.toLowerCase() === 'true';
  }

  // Sandbox settings
  const allowedPaths = process.env[`${ENV_PREFIX}ALLOWED_PATHS`];
  if (allowedPaths) {
    sandbox.allowed_paths = parseCSV(allowedPaths);
  }

  const deniedPaths = process.env[`${ENV_PREFIX}DENIED_PATHS`];
  if (deniedPaths) {
    sandbox.denied_paths = parseCSV(deniedPaths);
  }

  const followSymlinks = process.env[`${ENV_PREFIX}FOLLOW_SYMLINKS`];
  if (followSymlinks !== undefined) {
    sandbox.follow_symlinks = followSymlinks.toLowerCase() === 'true';
  }

  const maxFileSize = process.env[`${ENV_PREFIX}MAX_FILE_SIZE`];
  if (maxFileSize) {
    const parsed = parseInt(maxFileSize, 10);
    if (!isNaN(parsed)) {
      sandbox.max_file_size = parsed;
    }
  }

  const maxDepth = process.env[`${ENV_PREFIX}MAX_DEPTH`];
  if (maxDepth) {
    const parsed = parseInt(maxDepth, 10);
    if (!isNaN(parsed)) {
      sandbox.max_depth = parsed;
    }
  }

  // Template settings
  const templatePaths = process.env[`${ENV_PREFIX}TEMPLATE_PATHS`];
  if (templatePaths) {
    templates.paths = parseCSV(templatePaths);
  }

  // Logging settings
  const logLevel = process.env[`${ENV_PREFIX}LOG_LEVEL`];
  if (logLevel) {
    const level = logLevel.toLowerCase();
    if (['error', 'warn', 'info', 'debug'].includes(level)) {
      logging.level = level as 'error' | 'warn' | 'info' | 'debug';
    }
  }

  const logFile = process.env[`${ENV_PREFIX}LOG_FILE`];
  if (logFile) {
    logging.file = logFile;
  }

  // Merge partial configs
  if (Object.keys(sandbox).length > 0) {
    config.sandbox = sandbox as SandboxConfig;
  }
  if (Object.keys(templates).length > 0) {
    config.templates = templates as TemplateConfig;
  }
  if (Object.keys(logging).length > 0) {
    config.logging = logging as LogConfig;
  }

  return config;
}

/**
 * Load configuration from a JSON file.
 */
async function loadConfigFile(configPath: string): Promise<Partial<ServerConfig>> {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as Partial<ServerConfig>;
  } catch {
    // Config file doesn't exist or is invalid
    return {};
  }
}

/**
 * Deep merge two configuration objects.
 */
function mergeConfig(
  base: ServerConfig,
  override: Partial<ServerConfig>
): ServerConfig {
  return {
    sandbox: {
      ...base.sandbox,
      ...override.sandbox,
    },
    templates: {
      ...base.templates,
      ...override.templates,
    },
    logging: {
      ...base.logging,
      ...override.logging,
    },
    read_only: override.read_only ?? base.read_only,
  };
}

/**
 * Find config file in current directory or parent directories.
 */
async function findConfigFile(): Promise<string | null> {
  const configNames = ['mcp-file-forge.json', '.mcp-file-forge.json'];
  let currentDir = process.cwd();

  // Search up to 5 levels
  for (let i = 0; i < 5; i++) {
    for (const name of configNames) {
      const configPath = path.join(currentDir, name);
      try {
        await fs.access(configPath);
        return configPath;
      } catch {
        // File doesn't exist, continue
      }
    }

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}

/**
 * Global configuration instance.
 */
let globalConfig: ServerConfig | null = null;

/**
 * Load and merge configuration from all sources.
 *
 * Priority (highest to lowest):
 * 1. CLI arguments (not implemented yet)
 * 2. Environment variables
 * 3. Config file
 * 4. Built-in defaults
 */
export async function loadConfig(): Promise<ServerConfig> {
  if (globalConfig) {
    return globalConfig;
  }

  // Start with defaults
  let config = { ...DEFAULT_CONFIG };

  // Load config file if found
  const configPath = await findConfigFile();
  if (configPath) {
    const fileConfig = await loadConfigFile(configPath);
    config = mergeConfig(config, fileConfig);
    console.error(`[config] Loaded config from ${configPath}`);
  }

  // Apply environment variables (higher priority)
  const envConfig = parseEnvironment();
  config = mergeConfig(config, envConfig);

  // Validate the final config
  const result = ServerConfigSchema.safeParse(config);
  if (!result.success) {
    console.error('[config] Warning: Invalid configuration, using defaults');
    console.error(result.error.issues);
    globalConfig = DEFAULT_CONFIG;
    return DEFAULT_CONFIG;
  }

  globalConfig = result.data;
  return result.data;
}

/**
 * Get the current configuration.
 */
export function getConfig(): ServerConfig {
  if (!globalConfig) {
    throw new Error('Configuration not loaded. Call loadConfig() first.');
  }
  return globalConfig;
}

/**
 * Reset configuration (useful for testing).
 */
export function resetConfig(): void {
  globalConfig = null;
}

/**
 * Get default configuration.
 */
export function getDefaultConfig(): ServerConfig {
  return { ...DEFAULT_CONFIG };
}
