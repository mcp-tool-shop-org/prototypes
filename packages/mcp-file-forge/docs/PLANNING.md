# MCP File Forge - Planning & Research Document

> **Project**: MCP File Forge
> **Type**: MCP Server for File/Project Management
> **Target**: Windows-first, Claude Code optimized
> **Created**: 2026-02-02

---

## Executive Summary

MCP File Forge is a Model Context Protocol (MCP) server that provides secure, sandboxed file operations and project scaffolding capabilities. Built with TypeScript for maximum compatibility with the MCP ecosystem, it emphasizes:

- **Security-first**: Sandboxed operations with configurable access controls
- **Windows-native**: Optimized for Windows paths, permissions, and conventions
- **Developer experience**: Intuitive tool names, clear error messages, helpful defaults
- **Performance**: Async operations, streaming for large files, minimal overhead

---

## Research Summary

### MCP Protocol Insights (2025-2026)

Based on research from the official MCP specification and community best practices:

#### Key Protocol Concepts
1. **Tools**: Functions that can be called by LLMs (with user approval)
2. **Resources**: File-like data that can be read by clients
3. **Prompts**: Pre-written templates for specific tasks

#### Transport Layer
- **STDIO**: Primary transport for local servers (our choice)
- **HTTP/SSE**: For remote/networked servers
- **Critical**: Never write to stdout for STDIO servers (breaks JSON-RPC)

#### SDK Status
- TypeScript SDK: v1.x stable, v2 expected Q1 2026
- Package: `@modelcontextprotocol/sdk`
- Validation: `zod@3` for schema validation

#### Security Requirements
- Explicit user consent before tool invocation
- Tool descriptions are untrusted unless from trusted server
- OAuth Resource Server pattern for authentication (new in 2025)
- Resource Indicators (RFC 8707) for token scoping

### Existing File Management Solutions

| Server | Strengths | Gaps |
|--------|-----------|------|
| Official Filesystem | Secure, configurable | Basic operations only |
| Desktop Commander | Full terminal, process mgmt | Security concerns |
| fast-filesystem-mcp | Large file streaming | Linux-focused |

### Our Differentiation
1. **Windows-first**: Native path handling, permission model
2. **Project scaffolding**: Template-based project creation
3. **Smart defaults**: Sensible access controls out-of-box
4. **Claude Code optimized**: Tools designed for AI workflows

---

## Architecture

### Phase 1: Deterministic Layer (This Phase)

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP File Forge                          │
├─────────────────────────────────────────────────────────────┤
│  Transport Layer (STDIO)                                    │
│  └─ StdioServerTransport                                    │
├─────────────────────────────────────────────────────────────┤
│  Tool Registry                                              │
│  ├─ File Reading (read_file, read_directory, read_multiple) │
│  ├─ File Writing (write_file, create_directory, copy, move) │
│  ├─ File Search (glob, grep, find_by_content)               │
│  ├─ File Metadata (stat, exists, get_permissions)           │
│  └─ Project Scaffolding (scaffold_project, list_templates)  │
├─────────────────────────────────────────────────────────────┤
│  Security Layer                                             │
│  ├─ Path Sandboxing (allowed_paths configuration)           │
│  ├─ Operation Allowlist (read-only mode option)             │
│  └─ Size Limits (max file size, max directory depth)        │
├─────────────────────────────────────────────────────────────┤
│  Configuration                                              │
│  ├─ Environment Variables                                   │
│  ├─ Config File (mcp-file-forge.json)                       │
│  └─ CLI Arguments                                           │
└─────────────────────────────────────────────────────────────┘
```

### Future Phases

- **Phase 2**: UI/UX polish, VS Code extension integration
- **Phase 3**: Advanced features (git integration, diff tools)
- **Phase 4**: Template marketplace, community templates

---

## Tool Specifications

### Reading Tools

#### `read_file`
Read file contents with optional encoding and line limits.

```typescript
{
  path: string;          // Absolute or relative path
  encoding?: string;     // Default: 'utf-8'
  start_line?: number;   // 1-indexed, default: 1
  end_line?: number;     // Inclusive, default: EOF
  max_size_kb?: number;  // Limit for safety, default: 10240 (10MB)
}
```

#### `read_directory`
List directory contents with metadata.

```typescript
{
  path: string;
  recursive?: boolean;      // Default: false
  max_depth?: number;       // For recursive, default: 5
  include_hidden?: boolean; // Default: false
  pattern?: string;         // Glob pattern filter
}
```

#### `read_multiple`
Batch read multiple files efficiently.

```typescript
{
  paths: string[];
  encoding?: string;
  fail_on_error?: boolean; // Default: false (partial results OK)
}
```

### Writing Tools

#### `write_file`
Write or overwrite file contents.

```typescript
{
  path: string;
  content: string;
  encoding?: string;     // Default: 'utf-8'
  create_dirs?: boolean; // Create parent dirs, default: true
  overwrite?: boolean;   // Default: true (false = fail if exists)
  backup?: boolean;      // Create .bak before overwrite, default: false
}
```

#### `create_directory`
Create directory with optional recursive creation.

```typescript
{
  path: string;
  recursive?: boolean; // Default: true
}
```

#### `copy_file`
Copy file or directory.

```typescript
{
  source: string;
  destination: string;
  overwrite?: boolean;   // Default: false
  recursive?: boolean;   // For directories, default: true
}
```

#### `move_file`
Move/rename file or directory.

```typescript
{
  source: string;
  destination: string;
  overwrite?: boolean; // Default: false
}
```

#### `delete_file`
Delete file or directory.

```typescript
{
  path: string;
  recursive?: boolean; // For directories, default: false (safety)
  force?: boolean;     // Ignore errors, default: false
}
```

### Search Tools

#### `glob_search`
Find files matching glob patterns.

```typescript
{
  pattern: string;       // Glob pattern (e.g., "**/*.ts")
  base_path?: string;    // Default: current sandbox root
  max_results?: number;  // Default: 1000
  include_dirs?: boolean; // Default: false
}
```

#### `grep_search`
Search file contents with regex.

```typescript
{
  pattern: string;         // Regex pattern
  path?: string;           // File or directory to search
  glob?: string;           // File pattern filter (e.g., "*.ts")
  case_sensitive?: boolean; // Default: true
  max_results?: number;    // Default: 100
  context_lines?: number;  // Lines before/after match, default: 0
}
```

### Metadata Tools

#### `file_stat`
Get file/directory statistics.

```typescript
{
  path: string;
}
// Returns: size, created, modified, accessed, is_file, is_dir, permissions
```

#### `file_exists`
Check if path exists.

```typescript
{
  path: string;
  type?: 'file' | 'directory' | 'any'; // Default: 'any'
}
```

### Project Scaffolding

#### `scaffold_project`
Create project from template.

```typescript
{
  template: string;        // Template name or path
  destination: string;     // Where to create project
  variables?: Record<string, string>; // Template variables
  overwrite?: boolean;     // Default: false
}
```

#### `list_templates`
List available project templates.

```typescript
{
  category?: string; // Filter by category
}
```

---

## Security Model

### Path Sandboxing

```typescript
interface SandboxConfig {
  // Allowed root paths (operations restricted to these)
  allowed_paths: string[];

  // Explicitly denied paths (even within allowed)
  denied_paths?: string[];

  // Whether to follow symlinks outside sandbox
  follow_symlinks?: boolean; // Default: false

  // Maximum file size for read/write (bytes)
  max_file_size?: number; // Default: 100MB

  // Maximum directory depth for recursive operations
  max_depth?: number; // Default: 20
}
```

### Default Configuration

```json
{
  "allowed_paths": ["."],
  "denied_paths": [
    "**/node_modules/**",
    "**/.git/**",
    "**/.*"
  ],
  "max_file_size": 104857600,
  "max_depth": 20,
  "follow_symlinks": false
}
```

### Read-Only Mode

Optional mode where all write operations are disabled:

```bash
# Environment variable
MCP_FILE_FORGE_READ_ONLY=true

# Or CLI flag
mcp-file-forge --read-only
```

---

## Configuration

### Priority Order (highest to lowest)
1. CLI arguments
2. Environment variables
3. Config file (`mcp-file-forge.json` in CWD)
4. Built-in defaults

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_FILE_FORGE_ALLOWED_PATHS` | Comma-separated allowed paths | `.` |
| `MCP_FILE_FORGE_READ_ONLY` | Disable write operations | `false` |
| `MCP_FILE_FORGE_MAX_FILE_SIZE` | Max file size in bytes | `104857600` |
| `MCP_FILE_FORGE_LOG_LEVEL` | Logging verbosity | `info` |

### Config File Format

```json
{
  "sandbox": {
    "allowed_paths": ["F:/Projects", "F:/AI"],
    "denied_paths": ["**/secrets/**"],
    "max_file_size": 52428800
  },
  "templates": {
    "paths": ["./templates", "~/.mcp-file-forge/templates"]
  },
  "logging": {
    "level": "debug",
    "file": "./logs/mcp-file-forge.log"
  }
}
```

---

## Error Handling

### Error Categories

| Code | Category | Example |
|------|----------|---------|
| `PATH_OUTSIDE_SANDBOX` | Security | Attempted access to unauthorized path |
| `FILE_NOT_FOUND` | I/O | Requested file doesn't exist |
| `PERMISSION_DENIED` | I/O | OS-level permission error |
| `FILE_TOO_LARGE` | Limits | File exceeds max_file_size |
| `DEPTH_EXCEEDED` | Limits | Recursive depth too deep |
| `INVALID_ENCODING` | Validation | Unknown encoding specified |
| `WRITE_DISABLED` | Config | Write attempted in read-only mode |

### Error Response Format

```typescript
{
  isError: true,
  content: [{
    type: 'text',
    text: JSON.stringify({
      code: 'PATH_OUTSIDE_SANDBOX',
      message: 'Path "C:/Windows/System32" is outside allowed paths',
      details: {
        requested_path: 'C:/Windows/System32',
        allowed_paths: ['F:/Projects', 'F:/AI']
      }
    })
  }]
}
```

---

## Logging Strategy

### Log Destinations
- **stderr**: For STDIO transport compatibility
- **File**: Optional persistent logging

### Log Format
```
[2026-02-02T15:30:45.123Z] [INFO] [read_file] Reading F:/Projects/test.ts (2.5KB)
[2026-02-02T15:30:45.125Z] [DEBUG] [sandbox] Path validated: F:/Projects/test.ts
[2026-02-02T15:30:45.130Z] [INFO] [read_file] Success: 125 lines read
```

### Log Levels
- `error`: Errors only
- `warn`: Warnings and errors
- `info`: Normal operations (default)
- `debug`: Detailed debugging info

---

## Testing Strategy

### Unit Tests
- Path validation and sandboxing
- Encoding handling
- Error generation

### Integration Tests
- Full tool call lifecycle
- File system operations (using temp directories)
- Configuration loading

### Fixtures
- Sample project templates
- Various file encodings
- Edge case files (empty, binary, large)

---

## Phase 1 Commit Plan

| # | Focus | Key Files |
|---|-------|-----------|
| 1 | Project init | package.json, tsconfig.json, .gitignore |
| 2 | Server skeleton | src/index.ts, src/server.ts |
| 3 | File reading | src/tools/read.ts |
| 4 | File writing | src/tools/write.ts |
| 5 | File search | src/tools/search.ts |
| 6 | File metadata | src/tools/metadata.ts |
| 7 | Sandboxing | src/security/sandbox.ts |
| 8 | Templates | src/tools/scaffold.ts, templates/ |
| 9 | Configuration | src/config/index.ts |
| 10 | Error handling | src/utils/errors.ts, src/utils/logger.ts |

---

## UI/UX Considerations (Future Phases)

### Tool Naming
- Use verbs: `read_file` not `file_reader`
- Be specific: `glob_search` not `search`
- Consistent prefix for related tools

### Error Messages
- User-friendly primary message
- Technical details in structured data
- Actionable suggestions where possible

### Progress Feedback
- Stream results for long operations
- Progress indicators for batch operations
- Partial results on interruption

### Default Behaviors
- Sensible defaults that "just work"
- Explicit opt-in for dangerous operations
- Clear documentation of all defaults

---

## References

- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [MCP Best Practices](https://modelcontextprotocol.info/docs/best-practices/)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)
