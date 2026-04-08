<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/venvkit/readme.png" alt="venvkit" width="400">
</p>

# venvkit

> [MCP Tool Shop](https://mcptoolshop.com) 的一部分

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/venvkit/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/venvkit"><img src="https://img.shields.io/npm/v/@mcptoolshop/venvkit?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

**适用于 Windows 机器学习工作流程的 Python 虚拟环境诊断工具包。**

该工具会扫描您的系统中的 Python 环境，诊断健康问题（SSL、DLL、ABI 不匹配、路径泄露），跟踪任务执行历史记录，检测不可靠的任务，并生成一个生态系统地图。

## 30 秒快速入门

```bash
git clone https://github.com/mcp-tool-shop-org/venvkit && cd venvkit
npm install && npm run build
node dist/map_cli.js --root C:\projects --httpsProbe
# Open .venvkit/venv-map.html in your browser
```

## 功能

- **doctorLite** - 快速检查任何 Python 解释器的健康状况
- SSL/TLS 验证
- DLL 加载失败（常见于 PyTorch/CUDA）
- ABI 不匹配（ARM 与 x86）
- pip 检查
- 检测用户站点和 PYTHONPATH 泄露

- **scanEnvPaths** - 发现系统中的所有 Python 环境
- 查找 venvs、conda 环境、pyenv 版本、基本解释器
- 可配置的深度和过滤

- **mapRender** - 可视化您的 Python 生态系统
- 图形 JSON 输出，用于程序化使用
- Mermaid 图表，用于文档
- 基本解释器分组，并进行影响范围分析
- 任务路由可视化

- **runLog** - 跟踪任务执行历史记录
- 仅追加的 JSONL 格式
- 记录哪个环境运行了哪个任务
- 记录成功/失败，并进行错误分类

- **taskCluster** - 按签名聚合任务运行
- 检测不可靠的任务（一致性不通过）
- 检测与环境相关的不可靠性
- 识别失败热点
- 传染分析（共享的根本原因）

## 安装

```bash
npm install
npm run build
```

## 命令行用法

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

### 命令行选项

| 标志 | 描述 |
|------|-------------|
| `--root, -r` | 要扫描的目录（可以指定多个） |
| `--out` | 输出目录（默认为：`.venvkit`） |
| `--maxDepth` | 要扫描的最大目录深度（默认为：5） |
| `--strict` | 启用严格模式检查 |
| `--httpsProbe` | 测试 HTTPS 连接 |
| `--minScore` | 过滤健康评分低于此值的环境 |
| `--concurrency` | 并行检查（默认为：CPU 数量） |
| `--runlog` | 任务运行日志的路径（JSONL） |
| `--no-tasks` | 跳过任务可视化 |

### 输出

| 文件 | 描述 |
|------|-------------|
| `venv-map.json` | 完整的图形数据（节点、边、摘要） |
| `venv-map.mmd` | Mermaid 图表源代码 |
| `venv-map.html` | 交互式查看器 |
| `reports.json` | 原始的 doctorLite 报告 |
| `insights.json` | 可操作的建议 |

## 程序化用法

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

## 运行日志模式

通过将事件追加到 JSONL 文件来跟踪任务执行：

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

## 任务聚类

当您有许多任务运行时，venvkit 会根据签名对它们进行聚类：

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

## 图形模式

`mapRender` 输出遵循稳定的 JSON 模式：

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

### 节点类型

| 类型 | 描述 |
|------|-------------|
| `base` | 基本 Python 解释器（例如：`C:\Python311`） |
| `venv` | 虚拟环境 |
| `task` | 任务签名（聚类运行） |

### 边类型

| 类型 | 描述 |
|------|-------------|
| `USES_BASE` | venv → 基本关系 |
| `ROUTES_TASK_TO` | 任务 → 环境 路由 |
| `FAILED_RUN` | 任务 → 环境 失败（Mermaid 中为虚线） |

## 错误代码

| 代码 | 严重性 | 描述 |
|------|----------|-------------|
| `SSL_BROKEN` | bad | SSL 模块导入失败 |
| `CERT_STORE_FAIL` | warn | HTTPS 证书验证失败 |
| `DLL_LOAD_FAIL` | bad | 本机扩展 DLL 加载失败 |
| `ABI_MISMATCH` | bad | 二进制不兼容（ARM/x86） |
| `PIP_MISSING` | warn | pip 不可用 |
| `PIP_CHECK_FAIL` | warn | 检测到依赖项冲突 |
| `USER_SITE_LEAK` | warn | venv 中启用了用户站点包 |
| `PYTHONPATH_INJECTED` | warn | 设置了 PYTHONPATH 环境变量 |
| `ARCH_MISMATCH` | bad | 当需要 64 位的 Python 时，使用了 32 位的 Python |
| `PYVENV_CFG_INVALID` | warn | pyvenv.cfg 文件损坏或缺失 |

## 开发

```bash
npm install
npm run typecheck  # Type check
npm run test       # Run tests
npm run build      # Build to dist/
```

## 安全与数据范围

- **只读扫描：** Python 可执行文件和 pyvenv.cfg 文件会被读取，但绝不会被修改。
- **子进程：** 使用受控参数启动 `python` 进程，不涉及 shell 执行。
- **网络：** 可选的 `--httpsProbe` 参数用于测试 SSL 证书，不会发送其他类型的网络请求。
- **不收集或发送任何遥测数据**，详细的安全策略请参见 [SECURITY.md](SECURITY.md) 文件。

## 许可证

MIT

---

由 [MCP Tool Shop](https://mcp-tool-shop.github.io/) 构建。
