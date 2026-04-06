import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'brain-dev',
  description: 'MCP server for AI-powered code analysis — test generation, security audits, refactoring suggestions',
  logoBadge: '🧠',
  brandName: 'brain-dev',
  repoUrl: 'https://github.com/mcp-tool-shop-org/brain-dev',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'MCP Server',
    headline: 'Developer intelligence,',
    headlineAccent: 'on demand.',
    description: 'Coverage analysis, test generation, security audits, and refactoring suggestions — all accessible as MCP tools from your AI coding assistant.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'pip install dev-brain' },
      { label: 'Run', code: 'dev-brain' },
      { label: 'Audit', code: 'await client.call_tool("security_audit", {...})' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'What it does',
      subtitle: '9 tools that turn raw code into actionable developer insights.',
      features: [
        { title: 'Security Audits', desc: 'OWASP-style scanning detects SQL injection, command injection, hardcoded secrets, path traversal, and insecure crypto — with CWE references.' },
        { title: 'Smart Test Generation', desc: 'AST-based pytest generation with proper mocks, fixtures, and imports that actually compile and run.' },
        { title: 'Coverage Analysis', desc: 'Compare observed behavior patterns against test coverage to surface the gaps that matter most.' },
        { title: 'Refactoring Suggestions', desc: 'Spot complexity hotspots, duplicated logic, and naming inconsistencies across your codebase.' },
        { title: 'UX Insights', desc: 'Extract UX signals — dropoff points, error clusters, and behavior anomalies — from usage patterns.' },
        { title: 'Documentation Gaps', desc: 'Find missing docstrings and generate templated documentation stubs for undocumented code.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        { title: 'Install', code: 'pip install dev-brain' },
        { title: 'Claude Desktop config', code: '{\n  "mcpServers": {\n    "dev-brain": {\n      "command": "dev-brain"\n    }\n  }\n}' },
        { title: 'Security audit', code: 'result = await client.call_tool("security_audit", {\n    "symbols": [{\n        "name": "execute_query",\n        "file_path": "db.py",\n        "line": 10,\n        "source_code": "cursor.execute(f\\"SELECT ...\\")"\n    }],\n    "severity_threshold": "medium"\n})' },
        { title: 'Generate tests', code: 'result = await client.call_tool(\n    "smart_tests_generate",\n    { "file_path": "/path/to/module.py" }\n)\n# Returns complete pytest file' },
      ],
    },
    {
      kind: 'data-table',
      id: 'security-patterns',
      title: 'Security Patterns Detected',
      subtitle: 'Vulnerability classes the security auditor catches out of the box.',
      columns: ['Category', 'Severity', 'CWE'],
      rows: [
        ['SQL Injection', 'Critical', 'CWE-89'],
        ['Command Injection', 'Critical', 'CWE-78'],
        ['Insecure Deserialization', 'Critical', 'CWE-502'],
        ['Hardcoded Secrets', 'High', 'CWE-798'],
        ['Path Traversal', 'High', 'CWE-22'],
        ['Insecure Crypto', 'Medium', 'CWE-327'],
      ],
    },
    {
      kind: 'data-table',
      id: 'tools',
      title: 'All Tools',
      subtitle: 'The complete brain-dev toolkit.',
      columns: ['Tool', 'Category', 'Description'],
      rows: [
        ['coverage_analyze', 'Analysis', 'Compare patterns to test coverage, find gaps'],
        ['behavior_missing', 'Analysis', 'Find user behaviors not handled in code'],
        ['refactor_suggest', 'Analysis', 'Complexity, duplication, and naming suggestions'],
        ['ux_insights', 'Analysis', 'Extract UX signals from behavior patterns'],
        ['tests_generate', 'Generation', 'Generate test suggestions for coverage gaps'],
        ['smart_tests_generate', 'Generation', 'AST-based pytest with mocks and fixtures'],
        ['docs_generate', 'Generation', 'Documentation templates for undocumented code'],
        ['security_audit', 'Security', 'Scan for OWASP-style vulnerabilities'],
        ['brain_stats', 'Utility', 'Server statistics and configuration'],
      ],
    },
  ],
};
