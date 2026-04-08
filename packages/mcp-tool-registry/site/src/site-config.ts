import type { SiteConfig } from "@mcptoolshop/site-theme"

export const config: SiteConfig = {
  title: "MCP Tool Registry",
  description:
    "The single source of truth for all MCP Tool Shop tools — schema-validated metadata, opinionated bundles, and a pre-built search index.",
  logoBadge: "TR",
  brandName: "MCP Tool Registry",
  repoUrl: "https://github.com/mcp-tool-shop-org/mcp-tool-registry",
  npmUrl: "https://www.npmjs.com/package/@mcptoolshop/mcp-tool-registry",
  footerText:
    'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: "npm · JSON Schema · v1 stable",
    headline: "One registry.",
    headlineAccent: "Every tool.",
    description:
      "The metadata-only single source of truth for all MCP Tool Shop tools. Schema-validated on every commit. Opinionated bundles built by rules, not manual curation. Pre-built search index ships inside the package. Pin a version — get deterministic metadata every time.",
    primaryCta: { href: "#get-started", label: "Get started" },
    secondaryCta: { href: "handbook/", label: "Read the Handbook" },
    previews: [
      {
        label: "Install",
        code: 'npm install @mcptoolshop/mcp-tool-registry\n\n# Import the full registry\nimport registry from "@mcptoolshop/mcp-tool-registry/registry.json"\n  with { type: "json" }\n\nconsole.log(`${registry.tools.length} tools registered`)'
      },
      {
        label: "Import a bundle",
        code: '// Available bundles: core, agents, ops, evaluation\nimport coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json"\n  with { type: "json" }\n\nimport agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json"\n  with { type: "json" }'
      },
      {
        label: "Search index",
        code: '// Pre-built index — no runtime computation\nimport toolIndex from\n  "@mcptoolshop/mcp-tool-registry/dist/registry.index.json"\n  with { type: "json" }\n\n// Filter by keyword\nconst hits = toolIndex.filter(\n  t => t.keywords.includes("accessibility")\n)'
      }
    ]
  },

  sections: [
    {
      kind: "features",
      id: "features",
      title: "Built for reliability",
      subtitle: "Data-only. Schema-validated. Reproducible.",
      features: [
        {
          title: "Metadata-only",
          desc: "Zero executable code. Just JSON metadata describing every tool in the ecosystem — IDs, descriptions, install URLs, tags, capabilities, and verification status. Safe to import anywhere."
        },
        {
          title: "Schema-validated on every commit",
          desc: "Every tool entry is validated against a JSON Schema in CI. Required fields, ID format, description quality, HTTPS URLs, and policy rules are all checked before merge."
        },
        {
          title: "Least privilege by default",
          desc: "Tools default to zero capabilities. Side-effects are opt-in and must be declared explicitly in the schema. Deprecated tools are automatically excluded from all bundles."
        }
      ]
    },
    {
      kind: "data-table",
      id: "bundles",
      title: "Opinionated bundles",
      subtitle:
        "Membership is determined by declarative rules — not manual curation.",
      columns: ["Bundle", "Description", "Selection logic"],
      rows: [
        [
          "core",
          "Essential utilities every workspace needs",
          "Explicit ID list"
        ],
        [
          "agents",
          "Agent orchestration, navigation, context, tool selection",
          "Explicit IDs + agents tag"
        ],
        [
          "ops",
          "DevOps, infrastructure, deployment, monitoring",
          "Tags: automation, packaging, release, monitoring"
        ],
        [
          "evaluation",
          "Testing, benchmarking, coverage analysis",
          "Tags: testing, evaluation, benchmark, coverage"
        ]
      ]
    },
    {
      kind: "code-cards",
      id: "get-started",
      title: "Get started",
      cards: [
        {
          title: "Full registry",
          code: 'import registry from\n  "@mcptoolshop/mcp-tool-registry/registry.json"\n  with { type: "json" }\n\nconsole.log(`${registry.tools.length} tools`)\nconsole.log(registry.tools[0].id)'
        },
        {
          title: "Bundle import",
          code: '// Install a curated subset\nimport core from\n  "@mcptoolshop/mcp-tool-registry/bundles/core.json"\n  with { type: "json" }\n\n// core, agents, ops, evaluation\nconsole.log(core.tools.map(t => t.id))'
        },
        {
          title: "Derived artifacts",
          code: '// LLM-native context file\nimport llmContext from\n  "@mcptoolshop/mcp-tool-registry/dist/registry.llms.txt"\n\n// Build metadata + registry hash\nimport meta from\n  "@mcptoolshop/mcp-tool-registry/dist/derived.meta.json"\n  with { type: "json" }'
        },
        {
          title: "Submit a tool",
          code: "# 1. Read the registry guidelines\n#    docs/registry-guidelines.md\n\n# 2. Add entry to registry.json\n#    (keep tools array sorted by id)\n\n# 3. Validate\nnpm run validate\nnpm run policy\n\n# 4. Open a Pull Request"
        }
      ]
    },
    {
      kind: "features",
      id: "design",
      title: "Designed for trust",
      subtitle: "Pin a version. Get deterministic metadata. Every time.",
      features: [
        {
          title: "Reproducible",
          desc: "Pin a registry version in your workspace and get identical metadata on every install. The registry hash in `dist/derived.meta.json` lets you verify the exact state of any pinned version."
        },
        {
          title: "Fast discovery",
          desc: "A pre-built search index with keywords and facets ships inside the npm package — no server required. Filter by tag, capability, bundle membership, or verification status at zero runtime cost."
        },
        {
          title: "SemVer v1 stable",
          desc: "The v1 contract is frozen. New optional fields may appear in minor versions; no existing required fields will change within a major version. mcpt CLI v0.2.0+ supports v1 artifacts."
        }
      ]
    }
  ]
}
