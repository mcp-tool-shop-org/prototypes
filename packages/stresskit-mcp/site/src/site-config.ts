import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'StressKit-MCP',
  description: 'MCP Server Health & Security Testing — trustable evidence for MCP server readiness.',
  logoBadge: 'SK',
  brandName: 'StressKit-MCP',
  repoUrl: 'https://github.com/mcp-tool-shop-org/stresskit-mcp',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'stress testing · security · evidence',
    headline: 'StressKit-MCP',
    headlineAccent: '— prove your server is ready.',
    description: 'Health and security testing toolkit for MCP servers. Load test, security scan, profile performance, and generate verifiable evidence — all from one CLI.',
    primaryCta: { href: '#capabilities', label: 'Capabilities' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Health Check', code: 'stresskit check http://localhost:3000' },
      { label: 'Stress Test', code: 'stresskit stress http://localhost:3000 --profile default' },
      { label: 'Security', code: 'stresskit security http://localhost:3000 --output report.json' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'capabilities',
      title: 'Capabilities',
      subtitle: 'Everything you need to validate an MCP server.',
      features: [
        { title: 'Load Testing', desc: 'Simulate high-volume tool calls to identify bottlenecks. Configurable concurrency, duration, and target tools.' },
        { title: 'Security Scanning', desc: 'Validate input sanitization, auth flows, and error handling. Catch vulnerabilities before production.' },
        { title: 'Performance Profiling', desc: 'Measure latency (p50/p95/p99), throughput, and resource usage. Set thresholds and fail builds that exceed them.' },
      ],
    },
    {
      kind: 'features',
      id: 'evidence',
      title: 'Evidence & Compliance',
      subtitle: 'Trustable proof, not just test output.',
      features: [
        { title: 'Compliance Checks', desc: 'Verify MCP protocol adherence — correct tool schemas, proper error codes, standard lifecycle behavior.' },
        { title: 'Evidence Generation', desc: 'Produce verifiable test reports with provenance. Machine-readable JSON output for CI/CD integration.' },
        { title: 'Profile System', desc: 'Pre-built profiles for development, staging, and production. Custom thresholds for latency, error rate, and memory.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        { title: 'Install & Run', code: `# Install from PyPI
pip install stresskit-mcp

# Quick health check
stresskit check http://localhost:3000

# Full stress test with profile
stresskit stress http://localhost:3000 --profile production

# Security scan with JSON report
stresskit security http://localhost:3000 --output report.json` },
        { title: 'Profile Config', code: `{
  "profile": "production",
  "duration": 300,
  "concurrency": 50,
  "tools": ["*"],
  "checks": {
    "latency_p99_ms": 500,
    "error_rate_max": 0.01,
    "memory_mb_max": 512
  }
}` },
      ],
    },
    {
      kind: 'data-table',
      id: 'structure',
      title: 'Project Structure',
      subtitle: 'What lives where.',
      columns: ['Directory', 'Purpose'],
      rows: [
        ['engines/', 'Test execution engines — load, security, profiling'],
        ['profiles/', 'Pre-built test profiles (dev, staging, production)'],
        ['schemas/', 'JSON schemas for configuration validation'],
        ['tests/', 'Unit and integration tests'],
      ],
    },
  ],
};
