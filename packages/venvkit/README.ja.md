<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/venvkit/readme.png" alt="venvkit" width="400">
</p>

# venvkit

> [MCP Tool Shop](https://mcptoolshop.com) の一部

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/venvkit/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/venvkit"><img src="https://img.shields.io/npm/v/@mcptoolshop/venvkit?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

**Windows環境における機械学習ワークフロー向けのPython仮想環境診断ツールキット。**

システム上のPython環境をスキャンし、問題箇所（SSL、DLL、ABIの不整合、パスの漏洩など）を診断し、タスクの実行履歴を追跡し、不安定なタスクを検出し、環境マップを生成します。

## 30秒で始める

```bash
git clone https://github.com/mcp-tool-shop-org/venvkit && cd venvkit
npm install && npm run build
node dist/map_cli.js --root C:\projects --httpsProbe
# Open .venvkit/venv-map.html in your browser
```

## 機能

- **doctorLite** - 任意のPythonインタプリタの高速ヘルスチェック
- SSL/TLSの検証
- DLLのロード失敗（PyTorch/CUDAでよく発生）
- ABIの不整合（ARM vs x86）
- pipの健全性チェック
- ユーザーサイトとPYTHONPATHの漏洩検出

- **scanEnvPaths** - システム上のすべてのPython環境を検出
- venv、conda環境、pyenvのバージョン、ベースインタプリタを検出
- 設定可能な深度とフィルタリング

- **mapRender** - Python環境を可視化
- プログラムでの利用を目的としたグラフのJSON出力
- ドキュメント用のMermaid図
- ベースインタプリタのグループ化と影響範囲分析
- タスクのルーティング可視化

- **runLog** - タスクの実行履歴を追跡
- 追記専用のJSONL形式
- どの環境でどのタスクが実行されたかを記録
- 成功/失敗を記録し、エラーを分類

- **taskCluster** - シグネチャごとにタスクの実行をまとめる
- 不安定なタスクの検出（一貫性のない成功/失敗）
- 環境に依存する不安定なタスクの検出
- 失敗のホットスポットの特定
- 感染分析（共通の根本原因）

## インストール

```bash
npm install
npm run build
```

## CLIの使用方法

```bash
# Scan current directory and generate ecosystem map
node dist/map_cli.js

# Scan specific directories
node dist/map_cli.js --root C:\projects --root D:\ml-experiments

# Include task run history
node dist/map_cli.js --runlog .venvkit/runs.jsonl

# Output options
node dist/map_cli.js --out ./output --minScore 50 --strict --httpsProbe
```

### CLIオプション

| フラグ | 説明 |
|------|-------------|
| `--root, -r` | スキャンするディレクトリ（複数指定可能） |
| `--out` | 出力ディレクトリ（デフォルト：`.venvkit`） |
| `--maxDepth` | スキャンする最大ディレクトリ深度（デフォルト：5） |
| `--strict` | 厳格モードのチェックを有効にする |
| `--httpsProbe` | HTTPS接続をテストする |
| `--minScore` | このヘルススコア以下の環境をフィルタリングする |
| `--concurrency` | 並列チェック（デフォルト：CPUコア数） |
| `--runlog` | タスク実行ログ（JSONL）へのパス |
| `--no-tasks` | タスクの可視化をスキップする |

### 出力ファイル

| ファイル | 説明 |
|------|-------------|
| `venv-map.json` | 完全なグラフデータ（ノード、エッジ、概要） |
| `venv-map.mmd` | Mermaid図のソース |
| `venv-map.html` | インタラクティブビューア |
| `reports.json` | 生のdoctorLiteレポート |
| `insights.json` | 実行可能な推奨事項 |

## プログラムによる利用方法

```typescript
import { doctorLite, scanEnvPaths, mapRender, readRunLog } from 'venvkit';

// Check a specific Python
const report = await doctorLite({
  pythonPath: 'C:\\project\\.venv\\Scripts\\python.exe',
  requiredModules: ['torch', 'transformers'],
  httpsProbe: true,
});

console.log(report.status); // 'good' | 'warn' | 'bad'
console.log(report.score);  // 0-100
console.log(report.findings); // Array of issues

// Scan for all Python environments
const scan = await scanEnvPaths({
  roots: ['C:\\projects'],
  maxDepth: 5,
});

// Run doctorLite on all found environments
const reports = await Promise.all(
  scan.pythonPaths.map(p => doctorLite({ pythonPath: p }))
);

// Load task execution history
const runs = await readRunLog('.venvkit/runs.jsonl');

// Generate ecosystem visualization
const { graph, mermaid, insights } = mapRender(reports, runs, {
  taskMode: 'clustered', // 'none' | 'runs' | 'clustered'
  includeHotEdgeLabels: true,
});
```

## 実行ログのスキーマ

JSONLファイルにイベントを追記することで、タスクの実行を追跡します。

```typescript
import { appendRunLog, newRunId } from 'venvkit';

await appendRunLog('.venvkit/runs.jsonl', {
  version: '1.0',
  runId: newRunId(),
  at: new Date().toISOString(),
  task: {
    name: 'train',
    command: 'python train.py --epochs 10',
    requirements: { packages: ['torch', 'transformers'] },
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

## タスクのクラスタリング

タスクの実行が多い場合、venvkitはシグネチャごとにそれらをクラスタリングします。

```typescript
import { clusterRuns, isFlaky, getFailingEnvs } from 'venvkit';

const clusters = clusterRuns(runs);

for (const c of clusters) {
  console.log(`${c.sig.name}: ${c.ok}/${c.runs} (${(c.successRate * 100).toFixed(0)}%)`);

  if (isFlaky(c)) {
    console.log(`  WARNING: Flaky task!`);
    const badEnvs = getFailingEnvs(c, 3);
    console.log(`  Failing most on: ${badEnvs.map(e => e.pythonPath).join(', ')}`);
  }
}
```

## グラフのスキーマ

`mapRender`の出力は、安定したJSONスキーマに従います。

```typescript
type GraphJSONv1 = {
  version: '1.0';
  generatedAt: string;
  host: { os: string; arch: string; hostname: string };
  summary: {
    envCount: number;
    baseCount: number;
    taskCount: number;
    healthy: number;
    warning: number;
    broken: number;
    runsPassed: number;
    runsFailed: number;
    topIssues: Array<{ code: string; count: number; hint: string }>;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
};
```

### ノードの種類

| 種類 | 説明 |
|------|-------------|
| `base` | ベースのPythonインタプリタ（例：`C:\Python311`） |
| `venv` | 仮想環境 |
| `task` | タスクのシグネチャ（クラスタリングされた実行） |

### エッジの種類

| 種類 | 説明 |
|------|-------------|
| `USES_BASE` | venvとベースの関係 |
| `ROUTES_TASK_TO` | タスクと環境のルーティング |
| `FAILED_RUN` | タスクと環境の失敗（Mermaidでは破線で表示） |

## エラーコード

| コード | 深刻度 | 説明 |
|------|----------|-------------|
| `SSL_BROKEN` | bad | SSLモジュールのインポートに失敗 |
| `CERT_STORE_FAIL` | warn | HTTPS証明書の検証に失敗 |
| `DLL_LOAD_FAIL` | bad | ネイティブ拡張DLLのロードに失敗 |
| `ABI_MISMATCH` | bad | バイナリの互換性がない（ARM/x86） |
| `PIP_MISSING` | warn | pipが利用できない |
| `PIP_CHECK_FAIL` | warn | 依存関係の競合が検出された |
| `USER_SITE_LEAK` | warn | venvでユーザーサイトパッケージが有効になっている |
| `PYTHONPATH_INJECTED` | warn | PYTHONPATH環境変数が設定されている |
| `ARCH_MISMATCH` | bad | 64ビットが必要な場合に32ビットのPythonが使用されている |
| `PYVENV_CFG_INVALID` | warn | 破損または紛失したpyvenv.cfg |

## 開発

```bash
npm install
npm run typecheck  # Type check
npm run test       # Run tests
npm run build      # Build to dist/
```

## セキュリティとデータ範囲

- **読み取り専用スキャン:** Pythonの実行ファイルとpyvenv.cfgファイルは読み込まれますが、変更されることはありません。
- **サブプロセス:** `python`を特定の引数で起動します。シェルによる実行は行われません。
- **ネットワーク:** オプションの`--httpsProbe`を使用すると、SSL証明書をテストできます。それ以外の外部へのリクエストは行われません。
- **テレメトリデータは収集も送信もされません。** 詳細については、[SECURITY.md](SECURITY.md) を参照してください。

## ライセンス

MIT

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/) によって作成されました。
