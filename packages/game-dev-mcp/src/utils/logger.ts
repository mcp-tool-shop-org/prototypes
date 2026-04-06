export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

let currentLevel: LogLevel = 'info';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

function write(level: LogLevel, message: string, context?: string): void {
  if (!shouldLog(level)) return;
  const prefix = context ? `[game-dev-mcp:${context}]` : '[game-dev-mcp]';
  console.error(`${prefix} ${message}`);
}

export const log = {
  error: (message: string, context?: string) => write('error', message, context),
  warn: (message: string, context?: string) => write('warn', message, context),
  info: (message: string, context?: string) => write('info', message, context),
  debug: (message: string, context?: string) => write('debug', message, context),
  setLevel: (level: LogLevel) => { currentLevel = level; },
};
