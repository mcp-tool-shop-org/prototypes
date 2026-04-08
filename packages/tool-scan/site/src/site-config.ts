import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Tool-Scan',
  description: 'Security scanner for MCP (Model Context Protocol) tools.',
  logoBadge: 'TS',
  brandName: 'tool-scan',
  repoUrl: 'https://github.com/mcp-tool-shop-org/tool-scan',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Security',
    headline: 'Scan MCP tools',
    headlineAccent: 'before they scan you.',
    description: 'Grades every tool on security, MCP compliance, and quality. Catches prompt injection, tool poisoning, data exfiltration, and command injection — A+ to F, no ambiguity.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'pip install tool-scan' },
      { label: 'Scan', code: 'tool-scan my_tool.json\n# Score: 95/100  Grade: A' },
      { label: 'CI gate', code: 'tool-scan --strict --min-score 80\n  tools/*.json' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Security, compliance, and quality in one scan.',
      features: [
        { title: 'Threat detection', desc: 'Prompt injection, tool poisoning, hidden unicode, command injection, SQL injection, XSS, SSRF, and data exfiltration — all checked automatically.' },
        { title: 'MCP compliance', desc: 'Validates against the MCP 2025-11-25 spec: required fields, name format, schema types, annotations, and additionalProperties.' },
        { title: 'Letter grades', desc: 'Weighted scoring across security (40%), compliance (35%), and quality (25%). A+ to F with actionable remarks for every deduction.' },
        { title: 'Plugin system', desc: 'Extend with custom security rules, compliance checks, and quality validators. Load from directories, entry points, or register programmatically.' },
        { title: 'SARIF output', desc: 'SARIF v2.1.0 reports for GitHub Code Scanning, Azure DevOps, and VS Code. Security findings appear as inline annotations on PRs.' },
        { title: 'Concurrent scanning', desc: 'Parallel file processing with --jobs N. Compact JSON (~50% smaller) and streaming mode for large batches.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        {
          title: 'CLI',
          code: '# Scan a tool definition\ntool-scan my_tool.json\n\n# Strict mode for CI gates\ntool-scan --strict --min-score 80 \\\n  tools/*.json\n\n# JSON output for automation\ntool-scan --json my_tool.json \\\n  > report.json',
        },
        {
          title: 'Python API',
          code: 'from tool_scan import grade_tool\n\ntool = {\n  "name": "get_weather",\n  "description": "Gets weather.",\n  "inputSchema": {\n    "type": "object",\n    "properties": {\n      "city": {"type": "string"}\n    }\n  }\n}\n\nreport = grade_tool(tool)\nprint(f"{report.grade.letter} ({report.score})")',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'threats',
      title: 'Threat Detection',
      subtitle: 'What tool-scan catches.',
      columns: ['Category', 'Threats', 'Severity'],
      rows: [
        ['Prompt injection', 'Instruction overrides, role manipulation, fake system tags', 'Critical'],
        ['Tool poisoning', 'Covert actions, hidden instructions in descriptions', 'Critical'],
        ['Code injection', 'Shell metacharacters, SQL injection, XSS payloads', 'Critical'],
        ['Unicode attacks', 'Zero-width spaces, homoglyph substitution', 'High'],
        ['Network threats', 'SSRF (localhost, cloud metadata), data exfiltration URLs', 'Critical'],
        ['Path traversal', 'Directory traversal in default values', 'High'],
      ],
    },
    {
      kind: 'features',
      id: 'integration',
      title: 'CI/CD Integration',
      subtitle: 'Gate deployments on tool safety.',
      features: [
        { title: 'GitHub Actions', desc: 'Drop-in workflow step with --strict and --min-score flags. Upload SARIF reports as artifacts.' },
        { title: 'Pre-commit hooks', desc: 'Scan tool JSON files on every commit. Block unsafe tools before they reach the repo.' },
        { title: 'Exit codes', desc: '0 = all passed, 1 = failures found, 2 = file errors. Standard Unix conventions for pipeline integration.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'scorecard',
      title: 'Quality scorecard',
      subtitle: 'Ship Gate audit — 50/50.',
      columns: ['Category', 'Score', 'Notes'],
      rows: [
        ['A. Security', '10/10', 'SECURITY.md, no network, no telemetry, no code execution'],
        ['B. Error Handling', '10/10', 'Structured exit codes, actionable remarks, JSON + SARIF output'],
        ['C. Operator Docs', '10/10', 'README, CHANGELOG, CONTRIBUTING, CITATION, API docs'],
        ['D. Shipping Hygiene', '10/10', 'CI (ruff + mypy + pytest), 323 tests, dep-audit, verify script'],
        ['E. Identity', '10/10', 'Logo, translations, landing page, 10 topics'],
      ],
    },
  ],
};
