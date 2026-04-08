import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Nexus Suite',
  description: 'Governance, attestation, and routing infrastructure for MCP tool ecosystems',
  logoBadge: 'NX',
  brandName: 'Nexus Suite',
  repoUrl: 'https://github.com/mcp-tool-shop-org/nexus-suite',
  footerText: 'MIT Licensed \u2014 built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Python / MCP',
    headline: 'Nexus Suite,',
    headlineAccent: 'governance for tool ecosystems.',
    description: 'Attestation signing, governance policies, and request routing for MCP tool ecosystems. Six composable Python packages \u2014 plug in what you need, leave the rest.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'cd src/nexus-router && pip install -e .' },
      { label: 'Test', code: 'pytest' },
      { label: 'Route', code: 'nexus-router --adapter stdout' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Why Nexus Suite?',
      subtitle: 'Composable infrastructure for MCP ecosystems.',
      features: [
        { title: 'Attestation', desc: 'Sign and verify tool outputs with nexus-attest. Cryptographic proof that results came from the tool that claims them.' },
        { title: 'Governance', desc: 'Define and enforce policies with nexus-control. Rate limits, access rules, and audit trails in one place.' },
        { title: 'Routing', desc: 'Dispatch requests to the right tool with nexus-router. Pluggable adapters for stdout, HTTP, or custom transports.' },
        { title: 'Composable', desc: 'Six independent packages. Use attestation without routing, routing without governance, or the full stack together.' },
        { title: 'Adapter Pattern', desc: 'Swap transports without changing application code. Stdout for local dev, HTTP for production, or build your own from the template.' },
        { title: 'Python Native', desc: 'Standard Python packaging with pip install -e for development. pytest for testing. No exotic build tools.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      cards: [
        {
          title: 'Clone & install',
          code: 'git clone https://github.com/mcp-tool-shop-org/nexus-suite.git\ncd nexus-suite\n\n# Install a component\ncd src/nexus-router\npip install -e .\n\n# Run tests\npytest',
        },
        {
          title: 'Architecture',
          code: 'nexus-control    \u2190 governance policies, config\n    \u2502\nnexus-router     \u2190 request dispatch + routing\n    \u251c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u252c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n  stdout-adapter  http-adapter  custom-adapter\n    \u2502\nnexus-attest     \u2190 signature verification',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'projects',
      title: 'Projects',
      subtitle: 'Six composable packages in one monorepo.',
      columns: ['Package', 'Purpose'],
      rows: [
        ['nexus-attest', 'Attestation signing and verification'],
        ['nexus-control', 'Control plane for governance policies'],
        ['nexus-router', 'Request routing and dispatch'],
        ['nexus-router-adapter-stdout', 'Router adapter for stdout transport'],
        ['nexus-router-adapter-http', 'Router adapter for HTTP transport'],
        ['nexus-router-adapter-template', 'Template for building custom adapters'],
      ],
    },
    {
      kind: 'data-table',
      id: 'layers',
      title: 'Architecture Layers',
      subtitle: 'Three layers that compose independently.',
      columns: ['Layer', 'Responsibility'],
      rows: [
        ['Control', 'Governance policies, configuration, access rules, rate limits'],
        ['Routing', 'Request dispatch to tools via pluggable transport adapters'],
        ['Attestation', 'Cryptographic signing and verification of tool outputs'],
      ],
    },
    {
      kind: 'data-table',
      id: 'adapters',
      title: 'Router Adapters',
      subtitle: 'Swap transports without changing application code.',
      columns: ['Adapter', 'Use Case'],
      rows: [
        ['stdout', 'Local development, CLI tools, piped workflows'],
        ['http', 'Production deployments, remote tool invocation'],
        ['template', 'Starting point for building custom transport adapters'],
      ],
    },
  ],
};
