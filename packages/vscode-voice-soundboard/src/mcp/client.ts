import { getClient } from "./lifecycle.js";
import type {
  VoiceStatusResponse,
  VoiceSpeakResponse,
  VoiceInterruptResponse,
  DialogueResponse,
} from "./types.js";

function requireClient() {
  const client = getClient();
  if (!client) {
    throw new Error("MCP server not connected");
  }
  return client;
}

export function parseToolResult(result: { content: Array<{ type: string; text?: string }> }): unknown {
  const textContent = result.content.find((c) => c.type === "text");
  if (!textContent?.text) {
    throw new Error("Empty response from MCP server");
  }
  return JSON.parse(textContent.text);
}

export async function getStatus(): Promise<VoiceStatusResponse> {
  const client = requireClient();
  const result = await client.callTool({ name: "voice_status", arguments: {} });
  return parseToolResult(result as never) as VoiceStatusResponse;
}

export async function speak(
  text: string,
  voice?: string,
  speed?: number,
): Promise<VoiceSpeakResponse> {
  const client = requireClient();
  const args: Record<string, unknown> = { text, artifactMode: "path" };
  if (voice) args.voice = voice;
  if (speed !== undefined) args.speed = speed;

  const result = await client.callTool({ name: "voice_speak", arguments: args });
  return parseToolResult(result as never) as VoiceSpeakResponse;
}

export async function dialogue(
  script: string,
  cast?: Record<string, string>,
  speed?: number,
): Promise<DialogueResponse> {
  const client = requireClient();
  const args: Record<string, unknown> = { script, artifactMode: "path" };
  if (cast) args.cast = cast;
  if (speed !== undefined) args.speed = speed;

  const result = await client.callTool({ name: "voice_dialogue", arguments: args });
  return parseToolResult(result as never) as DialogueResponse;
}

export async function interrupt(): Promise<VoiceInterruptResponse> {
  const client = requireClient();
  const result = await client.callTool({
    name: "voice_interrupt",
    arguments: { reason: "manual" },
  });
  return parseToolResult(result as never) as VoiceInterruptResponse;
}
