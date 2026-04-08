# Security Policy

## Scope

ToolShopStudio is an MCP tool suite that invokes external command-line tools (FFmpeg, Pandoc, FreeCAD, GDAL, OpenSCAD, Blender) via child processes. It processes user-provided files locally and does not collect, store, or transmit user data to external services.

### External Tool Invocation

All external tool invocations use argument arrays (not shell interpolation) to prevent command injection. Input parameters are validated with Zod schemas before being passed to external tools.

### Sandboxing

When running in Docker, tools execute inside a container with controlled filesystem access. In native mode, tools inherit the host process permissions.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it by emailing 64996768+mcp-tool-shop@users.noreply.github.com.

Please do **not** open a public issue for security vulnerabilities.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |
