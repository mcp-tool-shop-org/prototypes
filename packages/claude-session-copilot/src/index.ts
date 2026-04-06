#!/usr/bin/env node

/** CLI entry point for claude-session-copilot. */

import { createServer } from "./server.js";
import { VERSION } from "./version.js";

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

process.on("uncaughtException", (error) => {
  console.error("[session-copilot] Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("[session-copilot] Unhandled rejection:", reason);
  process.exit(1);
});

async function main(): Promise<void> {
  const { server, transport, store } = createServer();

  console.error(
    `[session-copilot] Starting v${VERSION} (store: ${store.getPath()})`,
  );

  await server.connect(transport);

  console.error("[session-copilot] Server connected and ready");
}

main().catch((error) => {
  console.error("[session-copilot] Fatal error:", error);
  process.exit(1);
});
