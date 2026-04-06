---
title: MCP Bouncer Handbook
description: Complete guide to MCP Bouncer — automatic health-checking and quarantine for MCP servers.
sidebar:
  order: 0
---

MCP Bouncer is a SessionStart hook that health-checks every MCP server at startup, quarantines broken ones, and auto-restores them when they come back online.

## The problem

Servers configured in `.mcp.json` load at session start whether they work or not. A broken server wastes context tokens (its tools still appear), causes failed tool calls, and throws red warnings every time you open Claude.

## The solution

Bouncer runs before each session, checks every server in parallel, and only lets healthy ones through. Broken servers are quarantined with their full config preserved. When they recover, they're automatically restored — zero manual intervention.
