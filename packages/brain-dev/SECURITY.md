# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Model

Dev Brain is a **read-only analysis tool** designed for trusted development environments. It operates as an MCP (Model Context Protocol) server and has the following security characteristics:

### What Dev Brain Does

- Analyzes Python source code using safe AST parsing
- Generates test suggestions and documentation recommendations
- Detects security vulnerabilities in analyzed code
- Returns JSON responses with analysis results

### What Dev Brain Does NOT Do

- Execute arbitrary code (`eval`, `exec`, subprocess calls)
- Write, modify, or delete files
- Make network requests
- Store or persist any data
- Access databases or external services

### File Access Scope

The `smart_tests_generate` tool accepts file paths and reads Python files for analysis. This tool:

- Only reads `.py` files
- Uses safe `ast.parse()` for code analysis (no execution)
- Does not write or modify any files
- Returns only the filename (not full path) in responses

**Important**: This tool has read access to any Python file accessible to the user running the MCP server. It is designed for use in trusted development environments where the MCP client is also trusted.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by:

1. **DO NOT** open a public GitHub issue
2. Email: **64996768+mcp-tool-shop@users.noreply.github.com**
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond to security reports within 48 hours and will work with you to understand and address the issue.

## Security Best Practices for Users

1. **Run in trusted environments**: Only use Dev Brain in development environments with trusted MCP clients
2. **Review analyzed code**: The tool analyzes any Python file you point it to
3. **Keep dependencies updated**: Run `pip install --upgrade dev-brain` regularly
4. **Check permissions**: Ensure the MCP server runs with appropriate file system permissions

## Dependencies

Dev Brain has minimal dependencies to reduce attack surface:

- `mcp>=1.0.0` - Official MCP server framework

Development dependencies (not required for runtime):
- `pytest` - Testing framework
- `pytest-asyncio` - Async test support
- `pytest-cov` - Coverage reporting
