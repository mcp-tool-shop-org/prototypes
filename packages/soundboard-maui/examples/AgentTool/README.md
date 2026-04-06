# Agent Tool Example

Use the Soundboard SDK as a callable tool in an AI agent pipeline.

## The pattern

```
Agent loop
  ├── thinks: "I should narrate this finding"
  ├── calls: SpeakTool.ExecuteAsync({ text: "...", mood: "narrator" })
  ├── SDK streams audio to engine
  └── tool returns: { success: true, chunkCount: 12 }
```

The agent decides *what* to say. The tool handles *how* it sounds.

## Run

```bash
# Start your engine (default: localhost:8765)
# Then:
dotnet run --project examples/AgentTool
```

## What it demonstrates

- **Tool-shaped interface:** `SpeakToolInput` / `SpeakToolResult` records that map to LLM function schemas
- **Stateful tool:** Client connection and preset/voice cache initialized once, reused across calls
- **Mood mapping:** Agent passes a mood hint, tool resolves it to an engine preset
- **Error isolation:** Tool catches exceptions and returns structured errors to the agent

## Adapting for your agent framework

The `SpeakTool` class is framework-agnostic. To integrate:

1. Register `SpeakToolInput` as a function schema in your tool registry
2. Call `ExecuteAsync` when the agent invokes the tool
3. Return `SpeakToolResult` as the function result

Works with any agent framework that supports tool calling — Semantic Kernel, AutoGen, LangChain, or custom.

## Why this matters

Most agent voice integrations require:
- Running a separate TTS service
- Managing audio files
- Handling format conversion

With the SDK:
- One `ProjectReference` or NuGet package
- Audio streams directly, no files needed (this example just logs chunks)
- Cancellation propagates from agent to engine
