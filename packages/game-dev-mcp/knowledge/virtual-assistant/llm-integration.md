---
title: "Integrating LLMs with Unreal Engine 5"
category: virtual-assistant
tags: [llm, api, openai, claude, http, streaming, context]
difficulty: advanced
summary: "Connecting UE5 to LLM APIs for conversation, reasoning, and game AI."
ueVersion: "5.4+"
---

## Overview

LLMs (GPT, Claude, local models) can drive game characters, NPCs, and virtual assistants. UE5 connects to them via HTTP API calls.

## API Architecture

```
UE5 Actor
  → HTTP POST to LLM API (OpenAI/Anthropic/local)
  ← Stream JSON response
  → Parse text/tool calls
  → Drive game actions
```

## Making HTTP Requests from UE5

### C++ (FHttpModule)
```cpp
auto Request = FHttpModule::Get().CreateRequest();
Request->SetURL("https://api.anthropic.com/v1/messages");
Request->SetVerb("POST");
Request->SetHeader("Content-Type", "application/json");
Request->SetHeader("x-api-key", ApiKey);
Request->SetContentAsString(JsonBody);
Request->OnProcessRequestComplete().BindUObject(this, &UMyComponent::OnResponseReceived);
Request->ProcessRequest();
```

### Blueprint
Use the "HTTP Request" node or a plugin like VaRest for simplified JSON handling.

## Streaming Responses

For real-time text display (typewriter effect):
- Use Server-Sent Events (SSE) or chunked transfer
- In C++: implement `OnHeaderReceived` and read chunks incrementally
- In Blueprint: poll a timer or use an async task

## Context Management

Maintain conversation history as a message array:
```json
[
  {"role": "system", "content": "You are a game NPC named Aria..."},
  {"role": "user", "content": "What's in this room?"},
  {"role": "assistant", "content": "I see a chest and a locked door..."}
]
```

Trim old messages to stay within token limits. Keep the system prompt and last N exchanges.

## Security Considerations

- **Never expose API keys in shipped builds** — use a relay server
- Store keys in config files excluded from source control
- Rate-limit requests to prevent abuse
- Validate and sanitize LLM output before executing game actions

## Local Models

For offline/privacy-sensitive use:
- **Ollama** — easy local model serving (Llama, Mistral)
- **LM Studio** — GUI for local models
- **vLLM** — high-throughput serving

Connect the same way — just point the URL to localhost instead of a cloud API.

## Tool Use / Function Calling

Modern LLMs support tool/function calling. Map game actions to tools:
- `look_around()` → describe nearby objects
- `pick_up(item)` → inventory management
- `move_to(location)` → pathfinding
- `attack(target)` → combat

Parse tool call JSON from the LLM response and execute the corresponding game logic.
