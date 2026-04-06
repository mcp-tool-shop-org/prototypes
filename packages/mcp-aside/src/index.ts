#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Inbox, INBOX_URI } from "./inbox.js";
import { Guardrails, DEFAULT_CONFIG } from "./guardrails.js";
import { startTimerTrigger } from "./triggers.js";

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const server = new McpServer({ name: "mcp-aside", version });

const inbox = new Inbox();
const guard = new Guardrails();

// --- Notification helpers ---
async function resourceUpdated(uri: string) {
  await server.server.sendResourceUpdated({ uri });
}

async function log(level: "debug" | "info" | "warning" | "error", data: unknown) {
  await server.sendLoggingMessage({ level, logger: "aside", data });
}

// --- Tools ---
server.registerTool(
  "aside.push",
  {
    description: "Add an interjection to the inbox and notify the client.",
    inputSchema: {
      text: z.string().min(1),
      priority: z.enum(["low", "med", "high"]).default("med"),
      reason: z.string().optional(),
      tags: z.array(z.string()).optional(),
      expiresAt: z.string().optional().describe("ISO timestamp; optional (guardrails may cap)."),
      source: z.string().optional(),
      meta: z.record(z.unknown()).optional(),
    },
    annotations: { readOnlyHint: false }
  },
  async (input) => {
    const decision = guard.decidePush(input);
    if (!decision.ok) {
      return { content: [{ type: "text", text: JSON.stringify(decision, null, 2) }] };
    }

    const item = inbox.push(decision.normalized);

    await resourceUpdated(INBOX_URI);
    if (decision.notify) await log("info", { event: "interjection-added", id: item.id, priority: item.priority });

    return { content: [{ type: "text", text: JSON.stringify({ ok: true, item }, null, 2) }] };
  }
);

server.registerTool(
  "aside.configure",
  {
    description: "Update guardrails configuration (rate limits, TTL, dedupe, etc.).",
    inputSchema: {
      enabled: z.boolean().optional(),
      defaultTtlSeconds: z.number().int().positive().optional(),
      maxTtlSeconds: z.number().int().positive().optional(),
      dedupeWindowSeconds: z.number().int().positive().optional(),
      rateLimitWindowSeconds: z.number().int().positive().optional(),
      rateLimitMax: z
        .object({ low: z.number().int().nonnegative(), med: z.number().int().nonnegative(), high: z.number().int().nonnegative() })
        .optional(),
      notifyAtOrAbove: z.enum(["low", "med", "high"]).optional(),
    },
    annotations: { readOnlyHint: false }
  },
  async (patch) => {
    guard.configure(patch);
    return { content: [{ type: "text", text: JSON.stringify({ ok: true, config: guard.getConfig() }, null, 2) }] };
  }
);

server.registerTool(
  "aside.clear",
  {
    description: "Clear the inbox.",
    inputSchema: {},
    annotations: { readOnlyHint: false }
  },
  async () => {
    inbox.clear();
    await resourceUpdated(INBOX_URI);
    await log("info", { event: "inbox-cleared" });
    return { content: [{ type: "text", text: JSON.stringify({ ok: true }, null, 2) }] };
  }
);

server.registerTool(
  "aside.status",
  {
    description: "Get current inbox size + guardrails config.",
    inputSchema: {},
    annotations: { readOnlyHint: true }
  },
  async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              ok: true,
              inboxSize: inbox.list().length,
              config: guard.getConfig(),
              defaults: DEFAULT_CONFIG
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

server.registerTool(
  "aside.stats",
  {
    description: "Get usage statistics: accepted, rejected, deduped, rate-limited counts.",
    inputSchema: {},
    annotations: { readOnlyHint: true }
  },
  async () => {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { ok: true, stats: guard.getStats() },
            null,
            2
          ),
        },
      ],
    };
  }
);

// --- Resources ---
server.registerResource(
  "Interjection Inbox",
  INBOX_URI,
  {
    mimeType: "application/json",
    description: "An ordered list of interjection candidates (newest first).",
  },
  async () => ({
    contents: [
      {
        uri: INBOX_URI,
        mimeType: "application/json",
        text: JSON.stringify({ items: inbox.list() }, null, 2),
      },
    ],
  })
);

// --- Start triggers ---
let stopTimer: null | (() => void) = null;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--version") || args.includes("-v")) {
    console.log(`mcp-aside v${version}`);
    process.exit(0);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Start timer trigger (optional; comment out if you want “manual only”)
  stopTimer = startTimerTrigger(inbox, guard, { resourceUpdated, log });

  console.error("mcp-aside running on stdio");
}

process.on("SIGINT", () => {
  stopTimer?.();
  process.exit(0);
});

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
