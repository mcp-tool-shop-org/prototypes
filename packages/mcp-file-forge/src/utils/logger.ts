/**
 * MCP File Forge - Logger Utility
 *
 * Structured logging that writes to stderr (for STDIO transport compatibility).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Log levels in order of severity.
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Logger configuration.
 */
interface LoggerConfig {
  level: LogLevel;
  prefix: string;
  file?: string;
}

/**
 * Logger class for structured logging.
 */
class Logger {
  private config: LoggerConfig;
  private fileStream: fs.WriteStream | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? 'info',
      prefix: config.prefix ?? 'mcp-file-forge',
      file: config.file,
    };

    if (this.config.file) {
      this.initFileStream();
    }
  }

  /**
   * Initialize file stream for logging.
   */
  private initFileStream(): void {
    if (!this.config.file) return;

    try {
      const logDir = path.dirname(this.config.file);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      this.fileStream = fs.createWriteStream(this.config.file, { flags: 'a' });
    } catch (error) {
      console.error(`Failed to create log file: ${error}`);
    }
  }

  /**
   * Check if a log level should be output.
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.config.level];
  }

  /**
   * Format a log message.
   */
  private format(level: LogLevel, message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(5);
    const contextStr = context ? `[${context}] ` : '';
    return `[${timestamp}] [${levelUpper}] [${this.config.prefix}] ${contextStr}${message}`;
  }

  /**
   * Write a log message.
   */
  private write(level: LogLevel, message: string, context?: string): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.format(level, message, context);

    // Always write to stderr (stdout is for MCP protocol)
    console.error(formatted);

    // Optionally write to file
    if (this.fileStream) {
      this.fileStream.write(formatted + '\n');
    }
  }

  /**
   * Log an error message.
   */
  error(message: string, context?: string): void {
    this.write('error', message, context);
  }

  /**
   * Log a warning message.
   */
  warn(message: string, context?: string): void {
    this.write('warn', message, context);
  }

  /**
   * Log an info message.
   */
  info(message: string, context?: string): void {
    this.write('info', message, context);
  }

  /**
   * Log a debug message.
   */
  debug(message: string, context?: string): void {
    this.write('debug', message, context);
  }

  /**
   * Update logger configuration.
   */
  setConfig(config: Partial<LoggerConfig>): void {
    if (config.level) {
      this.config.level = config.level;
    }
    if (config.prefix) {
      this.config.prefix = config.prefix;
    }
    if (config.file && config.file !== this.config.file) {
      this.config.file = config.file;
      this.closeFileStream();
      this.initFileStream();
    }
  }

  /**
   * Close the file stream.
   */
  closeFileStream(): void {
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = null;
    }
  }

  /**
   * Get current log level.
   */
  getLevel(): LogLevel {
    return this.config.level;
  }
}

/**
 * Global logger instance.
 */
let globalLogger: Logger | null = null;

/**
 * Get or create the global logger.
 */
export function getLogger(config?: Partial<LoggerConfig>): Logger {
  if (!globalLogger) {
    globalLogger = new Logger(config);
  } else if (config) {
    globalLogger.setConfig(config);
  }
  return globalLogger;
}

/**
 * Reset the global logger (for testing).
 */
export function resetLogger(): void {
  if (globalLogger) {
    globalLogger.closeFileStream();
    globalLogger = null;
  }
}

/**
 * Convenience exports for quick logging.
 */
export const log = {
  error: (message: string, context?: string) => getLogger().error(message, context),
  warn: (message: string, context?: string) => getLogger().warn(message, context),
  info: (message: string, context?: string) => getLogger().info(message, context),
  debug: (message: string, context?: string) => getLogger().debug(message, context),
};
