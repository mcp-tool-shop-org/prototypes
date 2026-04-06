import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Training Studio',
  description: 'TensorFlow.js ML bundle validator with security-first design and zero code execution.',
  logoBadge: 'TS',
  brandName: 'Training Studio',
  repoUrl: 'https://github.com/mcp-tool-shop-org/training-studio',
  footerText: 'MIT Licensed — built by <a href="https://github.com/mcp-tool-shop-org" style="color:var(--color-muted);text-decoration:underline">mcp-tool-shop-org</a>',

  hero: {
    badge: 'Local-first · Zero code execution',
    headline: 'ML in your browser.',
    headlineAccent: 'Your data never leaves.',
    description: 'Train TensorFlow.js models locally, validate bundles cryptographically, and run batch inference — without uploading a single byte to the cloud.',
    primaryCta: { href: '#quickstart', label: 'Quick start' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Validate', code: 'training-studio validate ./my-bundle --json' },
      { label: 'Output', code: `{\n  "ok": true,\n  "exit_code": 0,\n  "artifacts_verified": 6,\n  "errors": [],\n  "warnings": []\n}` },
      { label: 'Build', code: `cd TrainingStudio.Web\nnpm install && npm run build` },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Three things done right.',
      features: [
        {
          title: 'Zero Code Execution',
          desc: 'The validator reads and checksums bundle files — it never loads weights into a TF.js session. Your model can\'t run code during validation.',
        },
        {
          title: 'Privacy by Design',
          desc: 'Training runs entirely in-browser via TensorFlow.js. No telemetry, no data upload, no cloud dependency. Works offline after install.',
        },
        {
          title: '283 Tests',
          desc: 'Comprehensive test coverage across the validator, bundle format, schema enforcement, and CLI exit codes. CI gates every merge.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'exit-codes',
      title: 'Validator Exit Codes',
      subtitle: 'Machine-readable output — pipe it into CI, scripts, or MCP tools.',
      columns: ['Code', 'Meaning'],
      rows: [
        ['0', 'Bundle is valid — all artifacts verified, no errors'],
        ['2', 'Valid with warnings — passes but has non-blocking issues'],
        ['3', 'Invalid bundle — schema violations, missing files, or digest mismatch'],
      ],
    },
    {
      kind: 'data-table',
      id: 'bundle-format',
      title: 'Bundle Format',
      subtitle: 'A portable, self-describing directory that carries everything a trained model needs.',
      columns: ['File', 'Purpose'],
      rows: [
        ['bundle.json', 'Manifest — references all artifacts, carries bundle ID and schema version'],
        ['model/model.json', 'TF.js topology — layer graph exported from the training run'],
        ['model/weights.bin', 'Binary weights — content-addressed and digest-verified'],
        ['metrics/metrics.jsonl', 'Per-epoch loss and accuracy for every training run'],
        ['metrics/summary.json', 'Final training summary — best epoch, convergence info'],
        ['config/run_config.json', 'Hyperparameters — layers, activation, dropout, split ratio'],
        ['data/schema.json', 'Feature and label schema — column names, types, encoding'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'quickstart',
      title: 'Quick Start',
      cards: [
        {
          title: 'Validate a bundle',
          code: `# From source
git clone https://github.com/mcp-tool-shop-org/training-studio
cd training-studio/TrainingStudio.Web
npm install

# Validate the included golden fixture
npm run validate ./src/tests/fixtures/golden-v1

# JSON output for scripting
training-studio validate --json ./my-bundle`,
        },
        {
          title: 'Train in the browser',
          code: `cd TrainingStudio.Web
npm run dev
# Open http://localhost:5173

# 1. Load sample_data/iris.csv
# 2. Select features + label column
# 3. Click "Start Training"
# 4. Watch live loss/accuracy charts
# 5. Export trained bundle`,
        },
      ],
    },
  ],
};
