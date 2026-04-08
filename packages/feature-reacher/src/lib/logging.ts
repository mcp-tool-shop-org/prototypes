/**
 * Logging utilities for observability.
 * Non-intrusive logging that doesn't transmit data externally.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

const LOG_STORAGE_KEY = "feature-reacher-logs";
const MAX_LOG_ENTRIES = 100;

/**
 * Get stored logs from session storage.
 */
function getStoredLogs(): LogEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = sessionStorage.getItem(LOG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Store logs to session storage.
 */
function storeLogs(logs: LogEntry[]): void {
  if (typeof window === "undefined") return;

  try {
    // Keep only the most recent entries
    const trimmed = logs.slice(-MAX_LOG_ENTRIES);
    sessionStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage might be full or unavailable
  }
}

/**
 * Log a message with context.
 */
function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  };

  // Console output (for dev)
  const consoleMethod = level === "error" ? console.error :
                       level === "warn" ? console.warn :
                       level === "debug" ? console.debug :
                       console.log;

  if (process.env.NODE_ENV === "development") {
    consoleMethod(`[${level.toUpperCase()}] ${message}`, context || "");
  }

  // Session storage (for diagnostics)
  const logs = getStoredLogs();
  logs.push(entry);
  storeLogs(logs);
}

/**
 * Logger object with level-specific methods.
 */
export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    log("debug", message, context),

  info: (message: string, context?: Record<string, unknown>) =>
    log("info", message, context),

  warn: (message: string, context?: Record<string, unknown>) =>
    log("warn", message, context),

  error: (message: string, context?: Record<string, unknown>) =>
    log("error", message, context),

  /**
   * Log an error object with stack trace.
   */
  exception: (error: Error, context?: Record<string, unknown>) => {
    log("error", error.message, {
      ...context,
      name: error.name,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"),
    });
  },

  /**
   * Get all logs for diagnostic export.
   */
  getLogs: (): LogEntry[] => getStoredLogs(),

  /**
   * Clear all stored logs.
   */
  clearLogs: (): void => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(LOG_STORAGE_KEY);
    }
  },

  /**
   * Export logs as a diagnostic string.
   */
  exportDiagnostics: (): string => {
    const logs = getStoredLogs();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        version: "Phase 3",
        logs,
      },
      null,
      2
    );
  },
};

/**
 * Track timing for performance monitoring.
 */
export function trackTiming(name: string): () => void {
  const start = performance.now();

  return () => {
    const duration = performance.now() - start;
    logger.debug(`Timing: ${name}`, { durationMs: Math.round(duration) });
  };
}

/**
 * Wrap an async function with error logging.
 */
export async function withLogging<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const endTiming = trackTiming(name);
  try {
    const result = await fn();
    endTiming();
    return result;
  } catch (error) {
    logger.exception(error as Error, { operation: name });
    throw error;
  }
}
