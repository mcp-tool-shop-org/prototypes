/**
 * ConsensusOS Logger
 *
 * Structured logger that prefixes output with plugin context.
 * Keeps the core dependency-free (no external logging library).
 */

import type { Logger } from "../plugins/api.js";

export function createLogger(scope: string): Logger {
  const prefix = `[${scope}]`;

  return {
    debug(message, data) {
      if (data) console.debug(prefix, message, data);
      else console.debug(prefix, message);
    },
    info(message, data) {
      if (data) console.info(prefix, message, data);
      else console.info(prefix, message);
    },
    warn(message, data) {
      if (data) console.warn(prefix, message, data);
      else console.warn(prefix, message);
    },
    error(message, data) {
      if (data) console.error(prefix, message, data);
      else console.error(prefix, message);
    },
  };
}
