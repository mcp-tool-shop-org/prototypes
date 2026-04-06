import type { SiteConfig } from "@mcptoolshop/site-theme"

export const config: SiteConfig = {
  title: "Context Window Manager",
  description:
    "MCP server for lossless LLM context restoration via KV cache persistence.",
  logoBadge: "CW",
  brandName: "Context Window Manager",
  repoUrl: "https://github.com/mcp-tool-shop-org/context-window-manager",
  footerText:
    'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: "Python · MCP · vLLM + LMCache",
    headline: "Lossless context.",
    headlineAccent: "Zero information loss.",
    description:
      "Context Window Manager is an MCP server that solves the context exhaustion problem. Freeze your KV cache tensors to persistent storage and thaw them later with exact restoration — no summarization, no RAG, no missing details.",
    primaryCta: { href: "#get-started", label: "Get started" },
    secondaryCta: { href: "handbook/", label: "Read the Handbook" },
    previews: [
      {
        label: "Install",
        code: "pip install cwm-mcp\n\n# Optional extras\npip install cwm-mcp[redis]       # distributed storage\npip install cwm-mcp[lmcache]     # LMCache integration\npip install cwm-mcp[encryption]  # encrypted-at-rest\npip install cwm-mcp[all]         # everything"
      },
      {
        label: "Claude Code config",
        code: '// .claude/settings.json\n{\n  "mcpServers": {\n    "context-window-manager": {\n      "command": "python",\n      "args": ["-m", "context_window_manager"],\n      "env": {\n        "CWM_VLLM_URL": "http://localhost:8000"\n      }\n    }\n  }\n}'
      },
      {
        label: "Core tools",
        code: "# Freeze your current session\n> window_freeze session_abc123 my-project\n\n# Restore it exactly as it was\n> window_thaw my-project\n\n# Branch for exploration\n> window_clone my-project my-project-v2\n\n# Check status\n> window_status my-project"
      }
    ]
  },

  sections: [
    {
      kind: "features",
      id: "features",
      title: "Not just another memory tool",
      subtitle: "Actual KV tensors. Actual restoration. No approximation.",
      features: [
        {
          title: "True lossless restoration",
          desc: "Preserves actual KV cache tensors — not summaries, not embeddings. Thaw a frozen window and the model resumes from the exact same cognitive state."
        },
        {
          title: "Tiered storage",
          desc: "CPU memory → Disk → Redis. CWM promotes and demotes automatically across tiers. Fast restore when warm, reliable restore when cold, shared restore with Redis."
        },
        {
          title: "Session isolation",
          desc: "Every session gets a unique cache_salt. No cross-session data leakage, no timing attacks, clean separation between concurrent contexts."
        }
      ]
    },
    {
      kind: "data-table",
      id: "how-it-works",
      title: "MCP tools",
      subtitle: "Six operations over your context windows, exposed as MCP tools.",
      columns: ["Tool", "Description"],
      rows: [
        ["window_freeze", "Snapshot session context to persistent storage"],
        ["window_thaw", "Restore context from a saved window"],
        ["window_list", "List all available context windows"],
        ["window_status", "Get detailed session and window info"],
        ["window_clone", "Branch a context for parallel exploration"],
        ["window_delete", "Remove a saved window and free storage"]
      ]
    },
    {
      kind: "code-cards",
      id: "get-started",
      title: "Get started",
      cards: [
        {
          title: "Install & run",
          code: "pip install cwm-mcp\n\n# Start the MCP server\npython -m context_window_manager\n\n# Or with explicit vLLM URL\nCWM_VLLM_URL=http://localhost:8000 \\\n  python -m context_window_manager"
        },
        {
          title: "vLLM server setup",
          code: '# Enable prefix caching + LMCache connector\nvllm serve "meta-llama/Llama-3.1-8B-Instruct" \\\n  --enable-prefix-caching \\\n  --kv-transfer-config \'{\n    "kv_connector":"LMCacheConnectorV1",\n    "kv_role":"kv_both"\n  }\''
        },
        {
          title: "LMCache environment",
          code: "# Configure LMCache tiers\nexport LMCACHE_USE_EXPERIMENTAL=True\nexport LMCACHE_LOCAL_CPU=True\nexport LMCACHE_MAX_LOCAL_CPU_SIZE=8.0\n\n# Optional: Redis for distributed storage\nexport LMCACHE_REDIS_URL=redis://localhost:6379"
        },
        {
          title: "Development setup",
          code: "git clone https://github.com/mcp-tool-shop-org/context-window-manager\ncd context-window-manager\npython -m venv .venv\nsource .venv/bin/activate  # Linux/macOS\n# .venv\\Scripts\\activate   # Windows\npip install -e '.[dev]'\npytest tests/unit/"
        }
      ]
    },
    {
      kind: "features",
      id: "production",
      title: "Built for production",
      subtitle: "7 phases shipped. 366 tests passing. Beta-stable.",
      features: [
        {
          title: "366 tests",
          desc: "Full async coverage with pytest-asyncio, property-based tests via Hypothesis, performance benchmarks, and integration tests. Run the unit suite in seconds."
        },
        {
          title: "7 completed phases",
          desc: "Core infrastructure → MCP server shell → Freeze → Thaw → Advanced features (clone, auto-freeze) → Production hardening → Integration and polish."
        },
        {
          title: "vLLM + LMCache stack",
          desc: "Built on proven inference infrastructure. Integrates with vLLM prefix caching and LMCache's tiered persistence — no custom tensor plumbing required."
        }
      ]
    }
  ]
}
