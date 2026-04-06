# Dev Brain MCP Server - Specification

## Overview

Dev Brain is an intelligent MCP server that consumes the Context Engine to provide
actionable developer insights. It analyzes code coverage, behavior patterns, and
user flows to suggest tests, refactoring, and UX improvements.

## Architecture

```
┌──────────────────────────┐
│   Context MCP Server     │  ← Foundation: stores & searches context
│  - file context          │
│  - code context          │
│  - UI flow context       │
│  - semantic search       │
└─────────────┬────────────┘
              │ (MCP calls)
              ▼
┌──────────────────────────┐
│   Dev Brain MCP Server   │  ← Intelligence: reasoning & recommendations
│  - coverage_analyze      │
│  - behavior_missing      │
│  - tests_generate        │
│  - refactor_suggest      │
│  - ux_insights           │
└──────────────────────────┘
```

## Unix Philosophy

- **Single Responsibility**: Dev Brain only reasons and recommends; it does NOT store data
- **Composability**: Consumes Context Engine via MCP; can be consumed by other agents
- **No Side Effects**: Read-only analysis; does not modify code directly

## Tools

### 1. `coverage_analyze`
Analyze test coverage gaps by comparing observed user flows to test coverage.

**Input:**
```json
{
  "codebase_stream": "string (optional)",
  "test_patterns": ["array of test file patterns"],
  "min_support": "number (0-1, default 0.1)"
}
```

**Output:**
```json
{
  "total_flows": 100,
  "covered_flows": 65,
  "coverage_percentage": 65.0,
  "gaps": [
    {
      "pattern": ["ui.click", "api.request", "ui.render"],
      "support": 0.25,
      "priority": "high",
      "suggested_test": "test_search_flow_renders_results"
    }
  ]
}
```

### 2. `behavior_missing`
Find user behavior patterns that aren't captured in the codebase.

**Input:**
```json
{
  "stream_type": "string (ui, api, code)",
  "min_support": "number (0-1)",
  "compare_to": "string (tests, coverage, both)"
}
```

**Output:**
```json
{
  "missing_behaviors": [
    {
      "pattern": ["login", "mfa_prompt", "mfa_timeout"],
      "observed_count": 45,
      "description": "MFA timeout flow not handled in code",
      "suggested_action": "Add timeout handler in auth module"
    }
  ]
}
```

### 3. `tests_generate`
Generate test suggestions for uncovered patterns.

**Input:**
```json
{
  "gap_id": "string",
  "test_framework": "string (pytest, jest, go)",
  "style": "string (unit, integration, e2e)"
}
```

**Output:**
```json
{
  "test_name": "test_search_returns_results",
  "test_file": "tests/test_search.py",
  "test_code": "def test_search_returns_results():\n    ...",
  "covers_pattern": ["ui.click", "api.request", "ui.render"]
}
```

### 4. `refactor_suggest`
Suggest refactoring based on code usage patterns.

**Input:**
```json
{
  "file_path": "string (optional)",
  "symbol_name": "string (optional)",
  "analysis_type": "string (complexity, duplication, naming)"
}
```

**Output:**
```json
{
  "suggestions": [
    {
      "type": "extract_function",
      "location": "src/auth.py:45",
      "reason": "Code block appears in 5 different patterns",
      "confidence": 0.85
    }
  ]
}
```

### 5. `ux_insights`
Extract UX insights from user behavior patterns.

**Input:**
```json
{
  "flow_type": "string (search, checkout, onboarding)",
  "metric": "string (dropoff, time_to_complete, error_rate)"
}
```

**Output:**
```json
{
  "insights": [
    {
      "finding": "50% of users abandon at step 3 (payment)",
      "supporting_patterns": 3,
      "confidence": 0.78,
      "suggestion": "Simplify payment form or add progress indicator"
    }
  ]
}
```

## Context Engine Integration

Dev Brain calls Context Engine tools via MCP:

```python
# Example: coverage_analyze implementation
async def handle_coverage_analyze(args):
    # 1. Get patterns from Context Engine
    patterns = await context_engine.call("context_patterns", {
        "min_support": args.get("min_support", 0.1)
    })

    # 2. Get test coverage
    test_streams = await context_engine.call("context_search", {
        "query": "test coverage",
        "stream_filter": "code_file"
    })

    # 3. Find gaps
    gaps = await context_engine.call("context_gaps", {
        "known_patterns": extract_test_patterns(test_streams),
        "min_support": 0.05
    })

    # 4. Apply reasoning to prioritize and suggest
    return analyze_and_suggest(patterns, gaps)
```

## Dependencies

- `mcp>=1.0.0` - MCP server framework
- `httpx>=0.24.0` - For calling Context Engine (if HTTP transport)

## Configuration

```python
@dataclass
class DevBrainConfig:
    server_name: str = "dev-brain"
    server_version: str = "1.0.0"

    # Context Engine connection
    context_engine_url: str = "stdio://context-engine"

    # Analysis thresholds
    min_gap_support: float = 0.05
    min_confidence: float = 0.5
    max_suggestions: int = 20
```

## Testing Strategy

1. **Unit tests**: Test each tool's logic independently
2. **Mock Context Engine**: Use mock responses for Context Engine calls
3. **Integration tests**: Test real communication between servers

## Future Extensions

- `docs_generate` - Generate documentation from code patterns
- `security_audit` - Analyze patterns for security issues
- `performance_profile` - Identify performance bottlenecks from patterns
