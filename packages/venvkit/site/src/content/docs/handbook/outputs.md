---
title: Outputs
description: Output files, run log schema, and graph schema reference for venvkit.
sidebar:
  order: 3
---

Every venvkit scan writes a set of output files to the output directory (default `.venvkit/`). This page documents each file and its schema.

## Output files

| File | Description |
|------|-------------|
| `venv-map.json` | Full graph data (nodes, edges, summary) |
| `venv-map.mmd` | Mermaid diagram source |
| `venv-map.html` | Interactive viewer — open in any browser |
| `reports.json` | Raw doctorLite reports for every scanned environment |
| `insights.json` | Actionable recommendations derived from the reports |

## Graph schema (v1.0)

The `venv-map.json` file follows a stable schema:

```typescript
type GraphJSONv1 = {
  version: '1.0';
  generatedAt: string;       // ISO 8601 timestamp
  host: {
    os: string;              // e.g. "win32"
    arch: string;            // e.g. "x64"
    hostname: string;
  };
  summary: {
    envCount: number;        // Total environments found
    baseCount: number;       // Distinct base interpreters
    taskCount: number;       // Unique task signatures
    healthy: number;         // Envs scoring "good"
    warning: number;         // Envs scoring "warn"
    broken: number;          // Envs scoring "bad"
    runsPassed: number;      // Total successful task runs
    runsFailed: number;      // Total failed task runs
    topIssues: Array<{       // Most common issues
      code: string;
      count: number;
      hint: string;
    }>;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
};
```

### Node types

| Type | Description |
|------|-------------|
| `base` | A base Python interpreter (e.g. `C:\Python311`) |
| `venv` | A virtual environment created from a base |
| `task` | A task signature representing clustered runs |
| `artifact` | A build artifact or output |

### Edge types

| Type | Description |
|------|-------------|
| `USES_BASE` | A venv depends on a base interpreter |
| `CREATED_FROM` | Tracks venv creation provenance |
| `ROUTES_TASK_TO` | A task was routed to a specific environment |
| `FAILED_RUN` | A task failed in a specific environment (rendered as dashed lines in Mermaid) |
| `SHARES_WHEELHOUSE` | Two environments share a common wheel cache |
| `SHADOWS_PATH` | One environment's path entries shadow another |

## Run log schema

The run log is an append-only JSONL file where each line records one task execution. You can write entries programmatically:

```typescript
import { appendRunLog, newRunId } from '@mcptoolshop/venvkit';

await appendRunLog('.venvkit/runs.jsonl', {
  version: '1.0',
  runId: newRunId(),              // Unique run identifier
  at: new Date().toISOString(),   // When it ran
  task: {
    name: 'train',
    command: 'python train.py --epochs 10',
    requirements: {
      packages: ['torch', 'transformers'],
    },
  },
  selected: {
    pythonPath: 'C:\\project\\.venv\\Scripts\\python.exe',
    score: 95,
    status: 'good',
  },
  outcome: {
    ok: true,
    exitCode: 0,
    durationMs: 45000,
  },
});
```

### Run log fields

| Field | Type | Description |
|-------|------|-------------|
| `version` | `string` | Schema version (currently `"1.0"`) |
| `runId` | `string` | Unique identifier for this run |
| `at` | `string` | ISO 8601 timestamp |
| `task.name` | `string` | Human-readable task name |
| `task.command` | `string` | The command that was executed |
| `task.requirements.packages` | `string[]` | Required Python packages |
| `selected.pythonPath` | `string` | Which interpreter was used |
| `selected.score` | `number` | Health score at time of selection |
| `selected.status` | `string` | `"good"`, `"warn"`, or `"bad"` |
| `outcome.ok` | `boolean` | Whether the task succeeded |
| `outcome.exitCode` | `number` | Process exit code |
| `outcome.durationMs` | `number` | Execution time in milliseconds |

## Task clustering

When you have many runs, venvkit can aggregate them by task signature to surface patterns:

```typescript
import { clusterRuns, isFlaky, getFailingEnvs } from '@mcptoolshop/venvkit';

const clusters = clusterRuns(runs);

for (const c of clusters) {
  console.log(`${c.sig.name}: ${c.ok}/${c.runs} (${(c.successRate * 100).toFixed(0)}%)`);

  if (isFlaky(c)) {
    console.log('  Flaky task detected');
    const badEnvs = getFailingEnvs(c, 3);
    console.log(`  Failing most on: ${badEnvs.map(e => e.pythonPath).join(', ')}`);
  }
}
```

A task is considered **flaky** when it inconsistently passes and fails across runs in the same or similar environments. The `getFailingEnvs` function ranks environments by failure frequency so you can pinpoint the problematic ones.

## Next steps

- **[Finding Codes](/venvkit/handbook/finding-codes/)** — Look up diagnostic codes from reports
- **[Reference](/venvkit/handbook/reference/)** — Full CLI and API reference
