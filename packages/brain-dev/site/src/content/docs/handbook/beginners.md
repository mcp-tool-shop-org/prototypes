---
title: For Beginners
description: New to brain-dev? Start here for a gentle introduction.
sidebar:
  order: 99
---

## What is this tool?

brain-dev is a code analysis assistant that plugs into your AI coding environment. It reads your Python source files, understands the structure through AST (Abstract Syntax Tree) parsing, and gives your AI assistant the ability to find bugs, generate tests, spot security holes, and suggest improvements -- all without you leaving the conversation.

The problem it solves: when you ask an AI assistant to review your code, it can only see what you paste into the chat. brain-dev gives the assistant specialized analysis tools so it can examine your code systematically rather than relying on general knowledge alone.

## Who is this for?

- **Python developers** who use an AI coding assistant (Claude Desktop, Claude Code, or any MCP-compatible client).
- **Teams** that want automated security scanning and test gap detection as part of their development workflow.
- **Solo developers** who want a second pair of eyes on code quality without setting up a full CI/CD pipeline.

You do not need to be an expert in static analysis or AST parsing. brain-dev handles that internally and returns results in plain language.

## Prerequisites

Before installing brain-dev, make sure you have:

- **Python 3.11 or later** -- check with `python --version` or `python3 --version`.
- **pip** -- the Python package installer. Comes with Python on most systems.
- **An MCP client** -- Claude Desktop, Claude Code, or another tool that supports the Model Context Protocol. This is how you talk to brain-dev.
- **Basic terminal skills** -- you need to be comfortable running commands like `pip install` and editing a JSON config file.

## Your first 5 minutes

**Step 1: Install brain-dev.**

```bash
pip install dev-brain
```

**Step 2: Verify the installation.**

```bash
dev-brain --version
```

You should see output like `dev-brain 1.0.2`.

**Step 3: Add brain-dev to your MCP client.**

For Claude Desktop, open your config file (`claude_desktop_config.json`) and add:

```json
{
  "mcpServers": {
    "dev-brain": {
      "command": "dev-brain"
    }
  }
}
```

Save the file and restart Claude Desktop.

**Step 4: Run your first analysis.**

In your AI assistant, type:

> "Use brain-dev to generate smart tests for my_module.py"

Replace `my_module.py` with the absolute path to any Python file in your project. brain-dev will parse the file, detect what needs mocking, and return a complete pytest file.

**Step 5: Try a security audit.**

Ask your assistant:

> "Run a security audit on src/database.py using brain-dev"

The assistant will call the `security_audit` tool and report any vulnerabilities it finds, along with CWE references and fix recommendations.

## Common mistakes

1. **Using a relative file path with `smart_tests_generate`.** The tool requires an absolute path (e.g., `/home/user/project/src/module.py`, not `src/module.py`). If you get a "File not found" error, check the path.

2. **Expecting brain-dev to run tests.** brain-dev generates test code and analyzes coverage gaps, but it does not execute tests. You still run `pytest` yourself or through your CI pipeline.

3. **Forgetting to restart the MCP client after config changes.** If you add brain-dev to your Claude Desktop config but it does not appear in the tool list, restart the application. The config is read at startup.

4. **Passing non-Python files to `smart_tests_generate`.** The AST-based generator only works with `.py` files. For JavaScript or other languages, use the `tests_generate` tool with the `jest` or `go` framework option instead (though these produce skeleton templates, not full test files).

5. **Confusing `tests_generate` and `smart_tests_generate`.** The `tests_generate` tool creates simple skeleton stubs from a coverage gap description. The `smart_tests_generate` tool reads an actual Python source file and produces a complete, compilable test file with mocks and fixtures. For most users, `smart_tests_generate` is the one you want.

## Next steps

- [Getting Started](/brain-dev/handbook/getting-started/) -- detailed installation and configuration instructions.
- [Tools Reference](/brain-dev/handbook/tools/) -- full parameter documentation for all 9 tools.
- [Security Patterns](/brain-dev/handbook/security-patterns/) -- learn what vulnerability classes brain-dev detects and how to interpret the findings.

## Glossary

- **AST (Abstract Syntax Tree)** -- a tree representation of the structure of source code. brain-dev uses Python's built-in `ast` module to parse code without executing it.
- **CWE (Common Weakness Enumeration)** -- a standardized list of software security weaknesses maintained by MITRE. Each vulnerability brain-dev detects includes a CWE identifier for cross-referencing.
- **Fixture** -- in pytest, a function that provides test data or setup/teardown logic. brain-dev generates fixtures for dependencies that need mocking.
- **MCP (Model Context Protocol)** -- a protocol that lets AI assistants call external tools. brain-dev is an MCP server, meaning it provides tools that an MCP client (like Claude Desktop) can invoke.
- **Mock** -- a simulated object used in testing to replace real dependencies (databases, APIs, file systems). brain-dev's smart test generator detects which imports need mocking and creates appropriate `MagicMock` or `AsyncMock` instances.
- **OWASP** -- the Open Web Application Security Project, a foundation that publishes guidelines for web application security. brain-dev's security patterns are aligned with OWASP categories.
- **stdio** -- standard input/output. brain-dev communicates with MCP clients over stdio using JSON-RPC messages, which means it reads from stdin and writes to stdout rather than opening a network port.
