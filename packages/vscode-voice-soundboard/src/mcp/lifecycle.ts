import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ExtensionConfig } from "../config.js";

let client: Client | null = null;
let transport: StdioClientTransport | null = null;

export function getClient(): Client | null {
  return client;
}

export async function startServer(config: ExtensionConfig): Promise<Client> {
  if (client) {
    return client;
  }

  const args = ["@mcptoolshop/voice-soundboard-mcp", `--backend=${config.backend}`];
  if (config.format !== "wav") {
    args.push(`--format=${config.format}`);
  }

  const env: Record<string, string> = {
    ...process.env as Record<string, string>,
    VOICE_SOUNDBOARD_ARTIFACT_MODE: "path",
  };

  // Pass API key for HTTP backend
  if (config.backend === "http" && config.openaiApiKey) {
    env.OPENAI_API_KEY = config.openaiApiKey;
  }

  // Pass custom Python path if set
  if (config.pythonPath) {
    env.VOICE_SOUNDBOARD_PYTHON = config.pythonPath;
  }

  transport = new StdioClientTransport({
    command: "npx",
    args,
    env,
  });

  client = new Client({ name: "vscode-voice-soundboard", version: "0.3.0" }, {
    capabilities: {},
  });

  await client.connect(transport);
  return client;
}

export async function stopServer(): Promise<void> {
  if (client) {
    try {
      await client.close();
    } catch {
      // ignore close errors
    }
    client = null;
  }
  if (transport) {
    try {
      await transport.close();
    } catch {
      // ignore close errors
    }
    transport = null;
  }
}

export function isConnected(): boolean {
  return client !== null;
}
