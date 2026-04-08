import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'venvkit',
  description: 'Python virtual environment diagnostic toolkit for Windows ML workflows.',
  logoBadge: 'VK',
  brandName: 'venvkit',
  repoUrl: 'https://github.com/mcp-tool-shop-org/venvkit',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/venvkit',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'npm · Windows ML',
    headline: 'Python environments,',
    headlineAccent: 'diagnosed and mapped.',
    description: 'Scan, diagnose, visualize, and track Python virtual environments on Windows. Catches SSL failures, DLL mismatches, ABI conflicts, path leakage, and flaky tasks — before they break your ML workflow.',
    primaryCta: { href: '#quickstart', label: 'Quick start' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      {
        label: 'Install',
        code: 'npm install @mcptoolshop/venvkit\n# or run the CLI directly:\nnpm install && npm run build',
      },
      {
        label: 'Map your system',
        code: '# Scan and generate an ecosystem map\nnode dist/map_cli.js --root C:\\projects --httpsProbe\n\n# Open the interactive HTML report\nstart .venvkit/venv-map.html',
      },
      {
        label: 'Health check',
        code: 'import { doctorLite } from "@mcptoolshop/venvkit";\n\nconst result = await doctorLite("C:\\\\Python311\\\\python.exe");\nconsole.log(result.ssl);        // pass | fail | skip\nconsole.log(result.dllErrors);  // []\nconsole.log(result.abiMatch);   // true\nconsole.log(result.score);      // 0–100',
      },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Stop guessing why your venv is broken',
      subtitle: 'Five modules that cover the full lifecycle — from discovery to flake analysis.',
      features: [
        {
          title: 'doctorLite — health in seconds',
          desc: 'Runs SSL/TLS verification, DLL load checks, ABI mismatch detection, pip sanity, and PYTHONPATH leakage analysis against any interpreter. Returns a 0–100 score with per-check detail.',
        },
        {
          title: 'scanEnvPaths — find every environment',
          desc: 'Discovers venvs, conda envs, pyenv versions, and base interpreters across your system. Configurable depth and filtering — no environment hides from it.',
        },
        {
          title: 'mapRender — visualize the ecosystem',
          desc: 'Renders your Python ecosystem as a graph JSON, Mermaid diagram, or interactive HTML. Shows base interpreter groupings, blast radius analysis, and task routing at a glance.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'modules',
      title: 'All five modules',
      subtitle: 'Import individually or use the CLI for zero-config analysis.',
      columns: ['Module', 'What it does'],
      rows: [
        ['doctorLite', 'Health check: SSL, DLLs, ABI, pip, path leakage — scored 0–100'],
        ['scanEnvPaths', 'Discovers all Python environments (venvs, conda, pyenv, base)'],
        ['mapRender', 'Ecosystem graph: JSON, Mermaid diagram, or interactive HTML'],
        ['runLog', 'Append-only JSONL task execution history — what ran where and how'],
        ['taskCluster', 'Aggregate runs by signature: flaky detection, hotspots, contagion'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick start',
      cards: [
        {
          title: 'CLI — scan and map',
          code: 'npm install @mcptoolshop/venvkit\nnpm run build\n\n# Scan a directory and generate a map\nnode dist/map_cli.js --root C:\\projects --httpsProbe\n\n# Include task run history\nnode dist/map_cli.js --root C:\\projects --runlog .venvkit/runs.jsonl',
        },
        {
          title: 'Diagnose an interpreter',
          code: 'import { doctorLite } from "@mcptoolshop/venvkit";\n\nconst result = await doctorLite("C:\\\\Python311\\\\python.exe", {\n  httpsProbe: true,\n});\n\n// result.score      → 0–100\n// result.ssl        → "pass" | "fail" | "skip"\n// result.dllErrors  → string[]\n// result.abiMatch   → boolean\n// result.pipOk      → boolean',
        },
        {
          title: 'Detect flaky tasks',
          code: 'import { runLog, taskCluster } from "@mcptoolshop/venvkit";\n\n// Log a task run\nawait runLog.append(".venvkit/runs.jsonl", {\n  task: "train",\n  env: "C:\\\\projects\\\\.venv",\n  success: true,\n});\n\n// Analyze for flakes\nconst clusters = await taskCluster(".venvkit/runs.jsonl");\nconst flaky = clusters.filter(c => c.flaky);\nconsole.log("Flaky tasks:", flaky.map(c => c.signature));',
        },
        {
          title: 'Render the ecosystem map',
          code: 'import { scanEnvPaths, mapRender } from "@mcptoolshop/venvkit";\n\nconst envs = await scanEnvPaths(["C:\\\\projects"], { depth: 5 });\nconst map = await mapRender(envs, {\n  format: "html",   // "json" | "mermaid" | "html"\n  outDir: ".venvkit",\n});\n\n// Open .venvkit/venv-map.html',
        },
      ],
    },
    {
      kind: 'features',
      id: 'design',
      title: 'Built for Windows ML reality',
      subtitle: 'The problems it actually solves.',
      features: [
        {
          title: 'PyTorch and CUDA DLL hell',
          desc: 'DLL load failures are the most common source of silent ML environment breakage on Windows. doctorLite catches them before your training run starts — not 6 hours in.',
        },
        {
          title: 'Flaky task detection',
          desc: 'taskCluster aggregates run history to find tasks that inconsistently pass or fail across environments. Contagion analysis traces shared root causes across multiple flaky tasks.',
        },
        {
          title: 'Blast radius awareness',
          desc: 'mapRender groups environments by base interpreter and shows which venvs are at risk if the base breaks. Know the impact before you upgrade Python or swap a CUDA version.',
        },
      ],
    },
  ],
};
