import type { SiteConfig } from '@mcptoolshop/site-theme/types/config';

export const config: SiteConfig = {
  title: 'Role OS Rollout',
  description:
    'Org-wide rollout control plane for Role OS — doctrine, decisions, repo tracking, and lockdown governance.',
  logoBadge: 'RR',
  brandName: 'role-os-rollout',
  repoUrl: 'https://github.com/mcp-tool-shop-org/role-os-rollout',
  footerText: 'MIT Licensed',

  hero: {
    badge: 'Governance',
    headline: 'Role OS',
    headlineAccent: 'Rollout Control Plane',
    description:
      'Tracks the org-wide deployment of <strong>Role OS</strong> across every repo. Doctrine, decisions, work queues, per-repo audit state, and lockdown proving packets — all in one place.',
    primaryCta: {
      href: 'https://github.com/mcp-tool-shop-org/role-os-rollout',
      label: 'View on GitHub',
    },
    secondaryCta: {
      href: '/role-os-rollout/handbook/',
      label: 'Read the Handbook',
    },
    previews: [
      {
        label: 'Rollout Question',
        code: 'What repo-specific law would\ngeneric orchestration miss,\nand what wrong change must\nthe system reject automatically?',
      },
      {
        label: 'Lock Formula',
        code: 'generic spine\n+ repo truth\n+ seam law\n+ proving packet\n+ enforced no',
      },
      {
        label: 'Stats',
        code: '15 repos locked\n21 org decisions\n11 seam families\n29% required repair',
      },
    ],
  },

  sections: [
    {
      id: 'contents',
      kind: 'features',
      title: 'What Lives Here',
      subtitle: 'Operational state for the entire org-wide Role OS rollout.',
      features: [
        {
          title: 'DOCTRINE.md',
          desc: 'Rollout law and the 7-step lockdown checklist — from init to proven lock.',
        },
        {
          title: 'ROLLOUT-DOCTRINE-v1.md',
          desc: 'Operating constitution: 11 seam families, 21 decisions, lock classifications.',
        },
        {
          title: 'DECISIONS.md',
          desc: 'Org-wide reusable answers promoted from individual repo lockdowns.',
        },
        {
          title: 'WORK-QUEUE.md',
          desc: 'Current claims, completed locks, next repos, and blocked items.',
        },
        {
          title: 'REPO-INDEX.md',
          desc: 'Every org repo classified and tracked: full treatment, lock candidate, init only, deferred.',
        },
        {
          title: 'repos/ directory',
          desc: 'Per-repo audit drafts, questions, lock packets, and status files.',
        },
      ],
    },
    {
      id: 'seam-families',
      kind: 'features',
      title: '11 Seam Families',
      subtitle:
        'Each family describes a class of truth risk discovered during the rollout.',
      features: [
        {
          title: 'Lifecycle Truth',
          desc: 'Session ownership, terminal passthrough, state transition boundaries.',
        },
        {
          title: 'Contract Truth',
          desc: 'Exit-code semantics, skip rules, gate pass/fail classification.',
        },
        {
          title: 'Bootstrap Truth',
          desc: 'Scaffold correctness, CLI/starter-pack sync, re-init safety.',
        },
        {
          title: 'Health/Budget Truth',
          desc: 'Operator-facing reassurance must track machine-facing semantics.',
        },
        {
          title: 'Dispatch Truth',
          desc: 'Routing determinism, fallback visibility, selection explainability.',
        },
        {
          title: 'Binding Truth',
          desc: 'Bound vs inferred state, hook failure visibility, staleness signaling.',
        },
        {
          title: 'Evaluator Truth',
          desc: 'Borderline verdicts must degrade visibly under weak evidence.',
        },
        {
          title: 'Ephemeral Truth',
          desc: 'TTL immutability, deduplication identity, resurrection prevention.',
        },
        {
          title: 'Mutation Truth',
          desc: 'Per-action results, retry visibility, idempotency claims.',
        },
        {
          title: 'Discovery Truth',
          desc: 'Completeness signaling, absence causes, cache freshness.',
        },
        {
          title: 'Identity Truth',
          desc: 'Canonical vs derived assets, manifest integrity, naming separation.',
        },
      ],
    },
    {
      id: 'workflow',
      kind: 'code-cards',
      title: 'Lockdown Workflow',
      subtitle: 'The 7-step sequence from init to proven lock.',
      cards: [
        {
          title: '1. Standard Init',
          code: 'npx role-os init',
        },
        {
          title: '2. Fill Context Files',
          code: 'context/product-brief.md\ncontext/repo-map.md\ncontext/brand-rules.md\ncontext/current-priorities.md',
        },
        {
          title: '3. Identify Highest-Risk Seam',
          code: '# Where would generic orchestration\n# cause the most damage?',
        },
        {
          title: '4. Write Repo-Local Workflow',
          code: '.claude/workflows/protect-<seam>.md\n# use-when, required-chain,\n# review-checks, reject-criteria',
        },
        {
          title: '5. Define Reject Conditions',
          code: '# Must appear in:\n# - repo-local workflow\n# - current-priorities.md\n# - product-brief.md\n# - brand-rules.md',
        },
        {
          title: '6. Run Proving Packet',
          code: '# Trace invariants to source\n# Verify routing recommends\n#   correct chain\n# Describe a hypothetical\n#   violation → confirm rejection',
        },
      ],
    },
  ],
};
