import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'civility-kernel',
  description: 'A policy layer that makes agent behavior preference-governed instead of purely efficiency-maximizing.',
  logoBadge: '🛡',
  brandName: 'civility-kernel',
  repoUrl: 'https://github.com/mcp-tool-shop-org/civility-kernel',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/civility-kernel',
  footerText: 'MIT Licensed',

  hero: {
    badge: 'Open source',
    headline: 'Agents with',
    headlineAccent: 'boundaries.',
    description: 'A modular policy layer for agent behavior. Hard constraints filter. Soft preferences score. Uncertainty asks. Nothing changes silently.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'npm i @mcptoolshop/civility-kernel' },
      { label: 'Quick start', code: "import { createKernel, PolicyBuilder } from '@mcptoolshop/civility-kernel';\nconst kernel = createKernel({ policy: new PolicyBuilder().setWeight('efficiency', 0.6).build() });" },
      { label: 'Decide', code: "const trace = kernel.decide('tool:file_write', [plan]);\n// trace.outcome: 'EXECUTE' | 'ASK_USER' | 'NO_VALID_PLAN'" },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Governance that works',
      subtitle: 'The safety machinery that lets you build agents with boundaries.',
      features: [
        {
          title: 'createKernel',
          desc: 'One-call setup. Wires constraints, scorers, and the decision engine. Sync and async. No boilerplate.',
        },
        {
          title: 'Async constraints',
          desc: 'Check account balances, call APIs, query databases — constraint evaluation supports full async I/O via decideAsync().',
        },
        {
          title: 'Lint + Diff + Canonicalize',
          desc: 'Validate policies, produce deterministic diffs, normalize to canonical form. Fail-closed on unknown constraints.',
        },
        {
          title: 'MCP adapter',
          desc: 'Convert MCP tool calls to Plans and results to FeedbackEvents. First-class integration with the MCP ecosystem.',
        },
        {
          title: 'Learning loop',
          desc: 'Propose policy adjustments from user feedback, then apply them. Close the loop between human signals and agent behavior.',
        },
        {
          title: 'Human governance',
          desc: 'preview → propose → explicit approval → apply. Context rule provenance in every decision trace. Nothing changes silently.',
        },
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      subtitle: 'From install to a governed agent in minutes.',
      cards: [
        {
          title: 'Install + setup',
          code: `npm i @mcptoolshop/civility-kernel

import { createKernel, PolicyBuilder } from '@mcptoolshop/civility-kernel';
const kernel = createKernel({ policy: new PolicyBuilder()
  .setWeight('efficiency', 0.6)
  .addConstraint('no_irreversible_changes')
  .build()
});`,
        },
        {
          title: 'Make decisions',
          code: `const trace = kernel.decide('tool:file_write', [plan1, plan2]);
// trace.outcome: 'EXECUTE' | 'ASK_USER' | 'NO_VALID_PLAN'
// trace.appliedContextRules: which rules fired and why

// Async (for I/O-bound constraint checks):
const trace = await kernel.decideAsync('tool:api_call', plans);`,
        },
        {
          title: 'MCP integration',
          code: `import { planFromMcpToolCall, feedbackFromMcpResult } from '@mcptoolshop/civility-kernel';

const plan = planFromMcpToolCall(toolCall, { stake: 0.5 });
const trace = kernel.decide('tool:' + toolCall.name, [plan]);
const feedback = feedbackFromMcpResult(result, plan.id);`,
        },
        {
          title: 'Load / save policies',
          code: `import { loadPolicy, dumpPolicy } from '@mcptoolshop/civility-kernel';

const policy = loadPolicy(JSON.parse(fs.readFileSync('policy.json', 'utf8')));
fs.writeFileSync('policy.json', dumpPolicy(policy));`,
        },
        {
          title: 'CLI: governance loop',
          code: `# Preview the policy contract
npm run policy:explain

# Propose an update (diff + approval prompt)
npm run policy:propose

# Canonicalize in place
npm run policy:canonicalize`,
        },
      ],
    },
    {
      kind: 'api',
      id: 'api',
      title: 'Public API',
      subtitle: 'From one-call setup to full programmatic control.',
      apis: [
        {
          signature: 'createKernel({ policy, constraints?, scorers?, onDecision? })',
          description: 'Pre-wired facade — decide, decideAsync, lint, explain, diff, proposePolicyUpdates, updatePolicy in one object.',
        },
        {
          signature: 'PolicyBuilder',
          description: 'Fluent API for constructing validated policies. Chain setWeight, addConstraint, setCalibration, then build().',
        },
        {
          signature: 'loadPolicy(json) / dumpPolicy(policy)',
          description: 'Zod-validated persistence. loadPolicy validates unknown input; dumpPolicy produces deterministic sorted JSON.',
        },
        {
          signature: 'decideAsync(policy, context, plans)',
          description: 'Async constraint evaluation via Promise.all for I/O-bound checks. Same logic as sync decide().',
        },
        {
          signature: 'planFromMcpToolCall(call, meta?)',
          description: 'Convert an MCP tool call to a Plan. feedbackFromMcpResult converts results to FeedbackEvents.',
        },
        {
          signature: 'applyPolicyProposal(policy, proposal)',
          description: 'Close the learning loop — merge a PolicyUpdateProposal back into a policy with calibration clamping.',
        },
      ],
    },
  ],
};
