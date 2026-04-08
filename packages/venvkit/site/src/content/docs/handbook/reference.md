---
title: Reference
description: Full CLI options and programmatic API reference for venvkit.
sidebar:
  order: 5
---

This page covers the complete CLI interface and the programmatic TypeScript/JavaScript API.

## CLI reference

```bash
node dist/map_cli.js [options]
```

### All options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--root, -r` | `string` | `.` | Directory to scan. Repeatable for multiple roots. |
| `--out` | `string` | `.venvkit` | Output directory for all generated files. |
| `--maxDepth` | `number` | `5` | Maximum directory depth when searching for environments. |
| `--strict` | `boolean` | `false` | Enable strict mode: additional checks and tighter thresholds. |
| `--httpsProbe` | `boolean` | `false` | Test HTTPS connectivity by verifying SSL certificates. |
| `--minScore` | `number` | — | Exclude environments scoring below this threshold (0-100). |
| `--concurrency` | `number` | CPU count | Number of parallel health checks to run simultaneously. |
| `--runlog` | `string` | — | Path to a JSONL file containing task execution history. |
| `--no-tasks` | `boolean` | `false` | Omit task nodes and edges from the generated map. |

### Exit codes

| Code | Meaning |
|------|---------|
| `0` | Scan completed successfully |
| `1` | Runtime error (unhandled exception, invalid arguments, filesystem issues) |

## Programmatic API

All modules are importable from the package root:

```typescript
import {
  doctorLite,
  scanEnvPaths,
  mapRender,
  renderMermaid,
  readRunLog,
  appendRunLog,
  newRunId,
  summarizeRuns,
  clusterRuns,
  isFlaky,
  isEnvDependentFlaky,
  getFailingEnvs,
  summarizeClusters,
  signatureForRun,
  envIdFromPythonPath,
  runCmd,
} from '@mcptoolshop/venvkit';
```

### doctorLite

Run a health check against a single Python interpreter.

```typescript
const report = await doctorLite({
  pythonPath: 'C:\\project\\.venv\\Scripts\\python.exe',
  requiredModules: ['torch', 'transformers'],
  httpsProbe: true,
});
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pythonPath` | `string` | Yes | Absolute path to the Python executable. |
| `requiredModules` | `string[]` | No | Modules to attempt importing as part of the check. |
| `httpsProbe` | `boolean` | No | Whether to test HTTPS certificate verification. |
| `requireX64` | `boolean` | No | Set `true` to flag 32-bit interpreters as an architecture mismatch. |
| `strict` | `boolean` | No | Enable heavier checks (`pip check`, multi-version scan). |
| `timeoutMs` | `number` | No | Timeout per subprocess in milliseconds (default: 6000). |
| `env` | `Record<string, string>` | No | Override environment variables passed to the Python subprocess. |

**Returns:** a report object with:

| Field | Type | Description |
|-------|------|-------------|
| `status` | `'good' \| 'warn' \| 'bad'` | Overall health status. |
| `score` | `number` | Health score from 0 to 100. |
| `findings` | `Finding[]` | Array of diagnostic findings (see [Finding Codes](/venvkit/handbook/finding-codes/)). |

### scanEnvPaths

Discover all Python environments under one or more root directories.

```typescript
const scan = await scanEnvPaths({
  roots: ['C:\\projects', 'D:\\ml-experiments'],
  maxDepth: 5,
});
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `roots` | `string[]` | Yes | Directories to search. |
| `maxDepth` | `number` | No | Max directory traversal depth (default: 5). |
| `includeHidden` | `boolean` | No | Include hidden directories in the scan (default: false). Well-known venv names like `.venv` are always included. |
| `includeUserHomeCache` | `boolean` | No | Also scan `~/.venvkit/envs` and `~/.virtualenvs` (default: true). |
| `dedupe` | `boolean` | No | Remove duplicate paths from results (default: true). |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `pythonPaths` | `string[]` | Absolute paths to discovered Python executables. |

### mapRender

Generate ecosystem visualization from doctorLite reports and optional run history.

```typescript
const { graph, mermaid, insights } = mapRender(reports, runs, {
  taskMode: 'clustered',
  includeHotEdgeLabels: true,
});
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `reports` | `DoctorLiteReport[]` | Yes | Array of doctorLite report objects. |
| `runs` | `RunLogEventV1[]` | No | Array of run log entries. |
| `options.format` | `'json' \| 'mermaid' \| 'both'` | No | Output format (default: `'both'`). |
| `options.taskMode` | `'none' \| 'runs' \| 'clustered'` | No | How to render tasks in the graph (default: `'clustered'`). |
| `options.includeBaseSubgraphs` | `boolean` | No | Group venvs under their base interpreter in Mermaid output. |
| `options.includeHotEdgeLabels` | `boolean` | No | Label edges with dominant issue codes. |
| `options.filter.minScore` | `number` | No | Exclude environments below this health score. |
| `options.maxTopIssues` | `number` | No | Max number of top issues in the summary. |

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `graph` | `GraphJSONv1` | The full graph data structure. |
| `mermaid` | `string` | Mermaid diagram source code. |
| `insights` | `Insight[]` | Actionable recommendations. |

### readRunLog / appendRunLog

Read and append entries to a run log file.

```typescript
// Read all entries
const runs = await readRunLog('.venvkit/runs.jsonl');

// Append a new entry
await appendRunLog('.venvkit/runs.jsonl', {
  version: '1.0',
  runId: newRunId(),
  at: new Date().toISOString(),
  task: { name: 'train', command: 'python train.py' },
  selected: { pythonPath: '...', score: 95, status: 'good' },
  outcome: { ok: true, exitCode: 0, durationMs: 45000 },
});
```

### clusterRuns / isFlaky / getFailingEnvs

Aggregate runs by task signature and detect flaky tasks.

```typescript
const clusters = clusterRuns(runs);

for (const c of clusters) {
  if (isFlaky(c)) {
    const badEnvs = getFailingEnvs(c, 3); // top 3 failing envs
    console.log(`Flaky: ${c.sig.name}, worst envs:`, badEnvs);
  }
}
```

| Function | Description |
|----------|-------------|
| `clusterRuns(runs)` | Groups run entries by task signature. Returns an array of cluster objects sorted by run count. |
| `isFlaky(cluster)` | Returns `true` if the cluster shows inconsistent pass/fail behavior (success rate between 20% and 95%). |
| `isEnvDependentFlaky(cluster)` | Returns `true` if the task succeeds on some envs and fails on others (environment-specific flakiness). |
| `getFailingEnvs(cluster, n)` | Returns the top `n` environments ranked by failure frequency. |
| `signatureForRun(run)` | Extracts a stable task signature from a run event. Runs with the same signature are clustered together. |
| `summarizeClusters(clusters)` | Returns aggregate statistics: total tasks/runs, overall success rate, flaky counts. |

### summarizeRuns

Aggregate pass/fail counts from a set of run log entries, broken down by task name and environment.

```typescript
const summary = summarizeRuns(runs);
console.log(`${summary.passed} passed, ${summary.failed} failed out of ${summary.total}`);
```

### renderMermaid

Generate a Mermaid diagram string directly from a `GraphJSONv1` object (useful when you already have the graph and want to re-render the diagram with different options).

```typescript
const mermaidStr = renderMermaid(graph, { includeHotEdgeLabels: true });
```

### envIdFromPythonPath

Generate a stable, deterministic environment identifier from a Python executable path. Useful for mapping and logging.

```typescript
const id = envIdFromPythonPath('C:\\project\\.venv\\Scripts\\python.exe');
// Returns "py:c:\\project\\.venv\\scripts\\python.exe" on Windows
```

### runCmd

Execute a subprocess with a timeout, capturing stdout and stderr. This is the same runner used internally by `doctorLite` and can be injected as a custom runner.

```typescript
const result = await runCmd('python', ['-c', 'print("hello")'], { timeoutMs: 5000 });
console.log(result.ok, result.stdout);
```

## Security and data scope

- **Read-only scanning** — Python executables and `pyvenv.cfg` are read but never modified.
- **Controlled subprocesses** — spawns `python` with controlled arguments; no shell execution.
- **Optional network** — the `--httpsProbe` flag tests SSL certificates; no other outbound requests.
- **No telemetry** — nothing is collected or sent. See [SECURITY.md](https://github.com/mcp-tool-shop-org/venvkit/blob/main/SECURITY.md) for the full policy.

## Development

```bash
npm install
npm run typecheck  # Type check
npm run test       # Run tests
npm run build      # Build to dist/
```
