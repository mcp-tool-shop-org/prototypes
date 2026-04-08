---
title: Getting Started
description: Install Civility Kernel and run your first policy check in under five minutes.
sidebar:
  order: 1
---

## Requirements

- Node.js 20 or later
- npm (included with Node.js)

## Installation

Install the package from npm:

```bash
npm i @mcptoolshop/civility-kernel
```

For development (running examples, tests, and the policy-check CLI):

```bash
git clone https://github.com/mcp-tool-shop-org/civility-kernel.git
cd civility-kernel
npm install
```

## Quick start (programmatic)

The fastest path is `createKernel` + `PolicyBuilder`:

```typescript
import { createKernel, PolicyBuilder } from '@mcptoolshop/civility-kernel';

const policy = new PolicyBuilder()
  .setWeight('efficiency', 0.5)
  .setWeight('low_risk', 0.3)
  .setWeight('concise', 0.2)
  .addConstraint('no_irreversible_changes')
  .addConstraint({ id: 'max_spend_without_confirm', params: { amount: 50 } })
  .setUncertaintyThreshold(0.7)
  .setCalibration({ riskTolerance: 0.3, verbosity: 0.5, initiative: 0.4 })
  .build();

const kernel = createKernel({ policy });
```

### Make a decision

```typescript
const plans = [
  {
    id: 'plan-a',
    summary: 'Quick automated fix',
    steps: [{ kind: 'code', detail: 'Apply patch' }],
    meta: { estimatedTimeSec: 30, reversibility: 1, stake: 0.2, uncertainty: 0.3 },
  },
  {
    id: 'plan-b',
    summary: 'Full rewrite',
    steps: [{ kind: 'code', detail: 'Rewrite module' }],
    meta: { estimatedTimeSec: 3600, reversibility: 0, stake: 0.8, uncertainty: 0.6 },
  },
];

const trace = kernel.decide('code-review', plans);

console.log('Outcome:', trace.outcome);
// "EXECUTE" — plan-a passes constraints, plan-b is irreversible
```

### Async constraints (for I/O-bound checks)

```typescript
const trace = await kernel.decideAsync('code-review', plans);
```

### Lint and explain

```typescript
const report = kernel.lint();
if (!report.ok) console.error('Policy issues:', report.issues);

const lines = kernel.explain();
lines.forEach(l => console.log(l));
```

### Load/save policies from disk

```typescript
import { loadPolicy, dumpPolicy } from '@mcptoolshop/civility-kernel';

const policy = loadPolicy(JSON.parse(fs.readFileSync('policy.json', 'utf8')));
fs.writeFileSync('policy.json', dumpPolicy(policy));
```

### MCP integration

```typescript
import { planFromMcpToolCall, feedbackFromMcpResult } from '@mcptoolshop/civility-kernel';

const plan = planFromMcpToolCall(toolCall, { stake: 0.5 });
const trace = kernel.decide('tool:file_write', [plan]);

// After execution:
const feedback = feedbackFromMcpResult(result, plan.id);
const proposals = kernel.proposePolicyUpdates([feedback]);
```

## Quick start (CLI)

The policy-check CLI provides a governance loop for managing policy files on disk.

### Preview a policy

See a human-readable summary of what your policy does:

```bash
npm run policy:explain
```

### Propose a change

Lint the proposed policy, canonicalize it, and show a diff against the current one:

```bash
npm run policy:propose
```

The CLI will prompt for approval before applying any changes.

### Canonicalize in place

Normalize the active policy file (sort keys, fill defaults, deduplicate constraints):

```bash
npm run policy:canonicalize
```

## Running examples

The repo includes runnable examples:

```bash
npm run example:basic          # Basic constraint evaluation
npm run example:parameterized  # Parameterized constraints with Zod schemas
npm run example:explain        # Policy explanation output
```

## Running tests

```bash
npm test                # Run all tests
npm run test:coverage   # Run with coverage report
npm run verify          # Build + test (CI equivalent)
```

## Next steps

- Read [Policy Files](/civility-kernel/handbook/policy-files/) to understand the full policy format
- See the [API Reference](/civility-kernel/handbook/api/) for programmatic usage
- Check the [CLI & Security Reference](/civility-kernel/handbook/reference/) for all CLI flags and the security model
