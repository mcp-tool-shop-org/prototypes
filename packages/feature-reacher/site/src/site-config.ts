import type { SiteConfig } from "@mcptoolshop/site-theme"

export const config: SiteConfig = {
  title: "Feature-Reacher",
  description:
    "Adoption Risk Auditing — surface underutilized features before they become technical debt.",
  logoBadge: "FR",
  brandName: "Feature-Reacher",
  repoUrl: "https://github.com/mcp-tool-shop-org/feature-reacher",
  footerText:
    'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: "TypeScript · Next.js · Local-first",
    headline: "Surface adoption risk.",
    headlineAccent: "Before it's debt.",
    description:
      "Feature-Reacher ingests your product docs and release notes, then produces a ranked Adoption Risk Audit — explainable diagnoses for every feature users may never discover, with cited evidence and copyable actions.",
    primaryCta: { href: "#get-started", label: "Get started" },
    secondaryCta: { href: "handbook/", label: "Read the Handbook" },
    previews: [
      {
        label: "Quick start",
        code: 'npm install\nnpm run dev\n\n# Open http://localhost:3000\n# Paste your release notes or docs\n# Click "Run Audit"\n# Get a ranked adoption risk report'
      },
      {
        label: "Audit pipeline",
        code: '// Text in → ranked diagnosis out\nimport { extractFeatures } from "@/analysis/extractor"\nimport { scoreFeatures }   from "@/analysis/scoring"\nimport { diagnose }         from "@/analysis/diagnose"\nimport { rankFeatures }     from "@/analysis/ranking"\n\nconst features = extractFeatures(artifactText)\nconst scored   = scoreFeatures(features)\nconst audited  = diagnose(scored)\nconst report   = rankFeatures(audited) // evidence-backed'
      },
      {
        label: "Compare & export",
        code: "// Phase 2: audit history + comparison\n// /history  — browse saved audits\n// /compare  — side-by-side diff\n//   • New risks  (appeared since last audit)\n//   • Resolved   (no longer flagged)\n//   • Diagnosis changes per feature\n\n// Export formats\n// Plain text  — paste into Slack or docs\n// Printable HTML — formatted for stakeholders"
      }
    ]
  },

  sections: [
    {
      kind: "features",
      id: "features",
      title: "Explainable intelligence",
      subtitle: "Every conclusion cites its source. No ML, no guesswork.",
      features: [
        {
          title: "Evidence-backed diagnoses",
          desc: "Six diagnosis types, each triggered by explicit signals in your artifacts. Every flagged feature links back to the exact passage that raised the risk."
        },
        {
          title: "Deterministic scoring",
          desc: "Recency decay, visibility signals, and documentation density — all heuristic, all reproducible. Same input always produces the same ranked audit."
        },
        {
          title: "Local-first",
          desc: "Runs entirely in the browser. Audits saved to IndexedDB. No server, no authentication, no telemetry. Your product data never leaves your machine."
        }
      ]
    },
    {
      kind: "data-table",
      id: "pipeline",
      title: "Audit pipeline",
      subtitle:
        "Six deterministic steps from raw artifact to ranked adoption risk report.",
      columns: ["Step", "Input", "Output"],
      rows: [
        [
          "Artifact Upload",
          "Paste text or upload .txt / .md",
          "Normalized artifact corpus"
        ],
        [
          "Feature Extraction",
          "Normalized text",
          "Feature list with evidence citations"
        ],
        [
          "Heuristic Scoring",
          "Extracted features",
          "Risk scores 0–1 per feature"
        ],
        [
          "Diagnosis",
          "Scored features",
          "6 diagnosis types with triggering signals"
        ],
        ["Risk Ranking", "Diagnoses", "Features ordered by adoption risk"],
        [
          "Export",
          "Ranked audit",
          "Plain text · printable HTML · executive summary"
        ]
      ]
    },
    {
      kind: "code-cards",
      id: "get-started",
      title: "Get started",
      cards: [
        {
          title: "Install & run",
          code: "git clone https://github.com/mcp-tool-shop-org/feature-reacher\ncd feature-reacher\nnpm install\nnpm run dev\n\n# Open http://localhost:3000"
        },
        {
          title: "Run an audit",
          code: '# Three ways to bring in artifacts\n# 1. Paste text directly into the editor\n# 2. Upload a .txt or .md file\n# 3. Build a named Artifact Set\n#    for repeatable audit workflows\n\n# Click "Run Audit" → ranked results\n# Expand any feature for evidence + actions'
        },
        {
          title: "Compare audits",
          code: "# Phase 2: save and compare\n# All audits auto-saved to IndexedDB\n# (toggle off for manual save)\n\n# /history  — browse past audits\n# /compare  — pick two → side-by-side diff\n# /trends   — sparkline risk trajectory"
        },
        {
          title: "Run the tests",
          code: "npm test\n\n# Jest + ts-jest guardrail suite\n# Risk scores bounded 0–1\n# Audit IDs formatted correctly\n# Edge cases handled gracefully\n\nnpm run typecheck  # TypeScript strict mode\nnpm run lint       # ESLint"
        }
      ]
    },
    {
      kind: "features",
      id: "design",
      title: "Designed for trust",
      subtitle: "Transparent by principle. Auditable by construction.",
      features: [
        {
          title: "No magic",
          desc: "Every diagnosis is explainable with cited evidence and clear reasoning. If you can't trace a conclusion back to an artifact passage, it doesn't ship."
        },
        {
          title: "Reproducible",
          desc: "Heuristics only — no probabilistic models, no LLM calls, no runtime variance. Audit the same docs twice and get the same ranked report both times."
        },
        {
          title: "Transparent",
          desc: "Expand any flagged feature to see exactly which artifact passage triggered the diagnosis, the signals that fired, and the recommended action."
        }
      ]
    }
  ]
}
