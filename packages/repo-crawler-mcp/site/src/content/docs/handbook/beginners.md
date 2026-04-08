---
title: For Beginners
description: New to Repo Crawler MCP? Start here for a gentle introduction.
sidebar:
  order: 99
---

## What is this tool?

Repo Crawler MCP is an MCP server that gives AI agents structured access to GitHub repository data. Instead of manually browsing GitHub or writing API scripts, an AI assistant can call tools like `crawl_repo` to get metadata, issues, security alerts, dependency info, and more — all from a single request.

It works with Claude Code and other MCP-compatible AI tools as a plugin/server.

## Who is this for?

- **Claude Code users** who want their AI assistant to understand their GitHub repos in depth
- **AI agent builders** who need structured GitHub data for their tools
- **DevOps teams** who want to audit repos, compare projects, or export data through AI workflows
- **Security teams** who need AI-assisted visibility into Dependabot alerts, code scanning, and SBOMs

## Prerequisites

- **Node.js 18 or later** — check with `node --version`
- **A GitHub personal access token** — set as `GITHUB_TOKEN` environment variable. A fine-grained token with read access to repos is recommended
- **Claude Code** (or another MCP client) — to actually use the tools through an AI assistant
- Basic familiarity with GitHub repositories

## Your first 5 minutes

### 1. Add the server to Claude Code

Create or edit `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "repo-crawler": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/repo-crawler-mcp"],
      "env": {
        "GITHUB_TOKEN": "your-github-token-here"
      }
    }
  }
}
```

### 2. Start Claude Code

Open Claude Code in your project. It discovers the server automatically.

### 3. Ask Claude to crawl a repo

Try: "Crawl the express repo on GitHub and tell me about it."

Claude calls `crawl_repo` with `owner: "expressjs"` and `repo: "express"` at Tier 1. You get back structured metadata: description, stars, forks, languages, recent commits, contributors, and more.

### 4. Go deeper with higher tiers

Ask: "Show me the open issues and PRs for that repo" — Claude uses Tier 2 to fetch issues, pull requests, and activity data.

Ask: "Are there any security alerts?" — Claude uses Tier 3 to check Dependabot alerts, security advisories, and the SBOM.

### 5. Try an org crawl

Ask: "Crawl the mcp-tool-shop-org organization" — Claude calls `crawl_org` to scan every repo in the org.

## Common mistakes

1. **Forgetting the GitHub token.** Without `GITHUB_TOKEN`, the server falls back to unauthenticated API access, which has a 60 requests/hour rate limit (vs 5,000 with a token). Always set the token.

2. **Starting at Tier 3 for every repo.** Higher tiers make more API calls. Start at Tier 1 (the default) for a quick overview. Only go to Tier 2 or 3 when you need activity data or security information. This saves API quota.

3. **Not using section selection.** If you only need issues, pass `sections: ["issues"]` instead of crawling everything at Tier 2. Section-selective fetching saves API calls and context window space.

4. **Using a classic token instead of fine-grained.** Fine-grained tokens with minimal read permissions are safer. Classic tokens with broad scopes expose more than necessary.

5. **Expecting real-time data.** The server caches responses (2–10 min TTL depending on data type) to save API quota. If you need fresh data, use the `clear_cache` tool first.

## Next steps

- [Getting Started](/repo-crawler-mcp/handbook/getting-started/) — detailed setup and configuration
- [Tools](/repo-crawler-mcp/handbook/tools/) — all 10 tools with parameters and examples
- [Data Tiers](/repo-crawler-mcp/handbook/data-tiers/) — what each tier includes

## Glossary

- **MCP** — Model Context Protocol. A standard for tools that extend AI assistants. Repo Crawler is an MCP server.
- **Tier** — A data depth level (1–3). Tier 1 is basic metadata, Tier 2 adds activity (issues/PRs), Tier 3 adds security (alerts/SBOMs).
- **SBOM** — Software Bill of Materials. A list of all dependencies in a project, useful for security auditing.
- **Dependabot alert** — A GitHub notification about a known vulnerability in one of your dependencies.
- **Rate limiting** — GitHub limits how many API requests you can make per hour. The server handles this automatically with throttling and retries.
- **Graceful degradation** — If one API call fails (e.g., no permission for Dependabot), the rest of the crawl still succeeds. Failed sections are reported but do not block results.
- **Section-selective fetching** — Only requesting specific parts of the data (e.g., just issues) instead of everything, saving API quota.
