import type { SiteConfig } from "@mcptoolshop/site-theme"

export const config: SiteConfig = {
  title: "File Compass",
  description:
    "Semantic file search for AI workstations using HNSW indexing and local embeddings via Ollama.",
  logoBadge: "FC",
  brandName: "File Compass",
  repoUrl: "https://github.com/mcp-tool-shop-org/file-compass",
  footerText:
    'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: "Python · Ollama · HNSW · MCP",
    headline: "Find files by meaning.",
    headlineAccent: "Not just by name.",
    description:
      "File Compass builds a local semantic index of your codebase using Ollama embeddings and HNSW vector search. Ask for 'authentication middleware' — get the file that handles it. No API keys, no cloud, no guessing.",
    primaryCta: { href: "#get-started", label: "Get started" },
    secondaryCta: { href: "#how-it-works", label: "How it works" },
    previews: [
      {
        label: "Quick start",
        code: "pip install file-compass\n\n# Pull the embedding model\nollama pull nomic-embed-text\n\n# Index your codebase\nfile-compass index -d \"C:/Projects\"\n\n# Search semantically\nfile-compass search \"authentication middleware\""
      },
      {
        label: "MCP config",
        code: '// claude_desktop_config.json\n{\n  "mcpServers": {\n    "file-compass": {\n      "command": "python",\n      "args": ["-m", "file_compass.gateway"],\n      "cwd": "C:/path/to/file-compass"\n    }\n  }\n}'
      },
      {
        label: "Search examples",
        code: "# Find files by what they do\nfile-compass search \"database connection handling\"\nfile-compass search \"training loop\"\nfile-compass search \"API rate limiting\"\n\n# Filter by type or scope\nfile-compass search \"error handler\" --types python\nfile-compass search \"config loader\" --git-only\n\n# Instant filename/symbol search\nfile-compass scan -d \"C:/Projects\""
      }
    ]
  },

  sections: [
    {
      kind: "features",
      id: "features",
      title: "Built for AI workstations",
      subtitle: "Local-first. Fast. Understands code, not just text.",
      features: [
        {
          title: "Local embeddings",
          desc: "Runs on Ollama with nomic-embed-text. No API keys, no cloud, no rate limits. Your codebase never leaves your machine. Works fully offline after the first pull."
        },
        {
          title: "Sub-second search",
          desc: "HNSW index delivers <100ms queries on 10K+ chunks. Incremental updates via Merkle hashing — only changed files reindex. Quick search adds <10ms filename/symbol lookup."
        },
        {
          title: "Understands code",
          desc: "AST-aware chunking via tree-sitter for Python, JS, TS, Rust, and Go. Functions and classes are indexed as units. Markdown uses headings. JSON/YAML uses top-level keys."
        }
      ]
    },
    {
      kind: "data-table",
      id: "tools",
      title: "MCP tools",
      subtitle: "Seven tools available to Claude Code and any MCP-compatible client.",
      columns: ["Tool", "Description"],
      rows: [
        ["file_search", "Semantic search with ranked results and match explanations"],
        ["file_preview", "Code preview with syntax highlighting"],
        ["file_quick_search", "Fast filename and symbol search (no embeddings)"],
        ["file_quick_index_build", "Build the quick search index"],
        ["file_actions", "Context, usages, related files, history, and symbols"],
        ["file_index_status", "Check index statistics and coverage"],
        ["file_index_scan", "Build or rebuild the full semantic index"]
      ]
    },
    {
      kind: "code-cards",
      id: "get-started",
      title: "Get started",
      cards: [
        {
          title: "Install & index",
          code: "# Clone and install\ngit clone https://github.com/mcp-tool-shop-org/file-compass\ncd file-compass\npip install -e .\n\n# Pull embedding model\nollama pull nomic-embed-text\n\n# Index your code\nfile-compass index -d \"C:/Projects\""
        },
        {
          title: "Search the CLI",
          code: "# Semantic search\nfile-compass search \"database connection handling\"\nfile-compass search \"training loop\" --types python\nfile-compass search \"API endpoints\" --git-only\n\n# Check index stats\nfile-compass status"
        },
        {
          title: "Configure Claude Code",
          code: '// claude_desktop_config.json\n{\n  "mcpServers": {\n    "file-compass": {\n      "command": "python",\n      "args": ["-m", "file_compass.gateway"],\n      "cwd": "/path/to/file-compass"\n    }\n  }\n}'
        },
        {
          title: "Environment config",
          code: "# Directories to index (comma-separated)\nexport FILE_COMPASS_DIRECTORIES=\"F:/AI\"\n\n# Ollama server\nexport FILE_COMPASS_OLLAMA_URL=\"http://localhost:11434\"\n\n# Embedding model\nexport FILE_COMPASS_EMBEDDING_MODEL=\"nomic-embed-text\""
        }
      ]
    },
    {
      kind: "features",
      id: "how-it-works",
      title: "How it works",
      subtitle: "Three steps from source file to ranked semantic result.",
      features: [
        {
          title: "Scan & chunk",
          desc: "Discovers files respecting .gitignore, then splits into semantic pieces — AST-aware for code (tree-sitter), heading-based for Markdown, top-level keys for JSON/YAML, sliding window for everything else."
        },
        {
          title: "Embed & index",
          desc: "Generates 768-dim vectors via Ollama (nomic-embed-text). Vectors stored in HNSW, metadata in SQLite. ~1KB per chunk. Merkle hashing tracks changes for incremental updates."
        },
        {
          title: "Search & explain",
          desc: "Embeds your natural-language query, finds nearest neighbors in HNSW (<100ms), returns ranked results with explanations of why each file matched — not just a score."
        }
      ]
    }
  ]
}
