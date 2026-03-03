<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nameops/readme.png" alt="NameOps" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml"><img src="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nameops/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

用于 [clearance-opinion-engine](https://github.com/mcp-tool-shop-org/clearance-opinion-engine) 的名称审查协调器。

它将标准的名称列表转换为批量审查流程，发布构建产物，并生成易于阅读的拉取请求（PR）摘要。

## 工作原理

1. `data/names.txt` 包含需要检查的标准名称列表。
2. `data/profile.json` 包含 COE CLI 的默认参数（例如：通道、风险、并发性等）。
3. `src/run.mjs` 负责协调：COE 批量处理、发布、验证。
4. `src/build-pr-body.mjs` 生成一个 Markdown 格式的 PR 内容，包含分级摘要、冲突信息卡和成本统计数据。
5. 营销仓库的定时工作流调用此逻辑，并创建包含已导入构建产物的 PR。

## 用法

```bash
# Install the clearance engine
npm install -g @mcptoolshop/clearance-opinion-engine

# Run the pipeline
node src/run.mjs --out artifacts --profile data/profile.json --names data/names.txt

# Build a PR body from the output
node src/build-pr-body.mjs artifacts
```

## 配置

### `data/names.txt`

每行一个名称。以 `#` 开头的行是注释。最多 500 个名称。

### `data/profile.json`

| Field | COE 参数 | 默认值 |
| ------- | ---------- | --------- |
| `channels` | `--channels` | `all` |
| `org` | `--org` | `mcp-tool-shop-org` |
| `dockerNamespace` | `--dockerNamespace` | `mcptoolshop` |
| `hfOwner` | `--hfOwner` | `mcptoolshop` |
| `risk` | `--risk` | `conservative` |
| `radar` | `--radar` | `true` |
| `concurrency` | `--concurrency` | `3` |
| `maxAgeHours` | `--max-age-hours` | `168` (7 天) |
| `variantBudget` | `--variantBudget` | `12` |
| `fuzzyQueryMode` | `--fuzzyQueryMode` | `registries` |
| `cacheDir` | `--cache-dir` | `.coe-cache` |
| `maxRuntimeMinutes` | 工作流超时时间 | `15` |

## 输出

```
artifacts/
  metadata.json           # Run metadata (date, duration, counts)
  pr-body.md              # Markdown PR body
  batch/                  # Raw COE batch output
  published/              # Published artifacts (for marketing site)
    runs.json             # Index of all runs
    <slug>/
      report.html
      summary.json
      clearance-index.json
      run.json
```

## 架构

NameOps 是一个协调器，而不是一个服务。它不拥有任何数据模型，并且除了 COE CLI 之外没有运行时依赖。营销仓库负责调度（遵循 CLAUDE.md 的规则）；NameOps 负责逻辑。

## 测试

```bash
npm test
```

## 许可证

MIT
