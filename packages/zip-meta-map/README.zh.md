<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/zip-meta-map/readme.png" width="400" />
</p>

<p align="center">
  Turn a ZIP or folder into a guided, LLM-friendly metadata bundle.<br>
  <strong>Map + Route + Guardrails</strong> — inside the archive itself.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://pypi.org/project/zip-meta-map/"><img src="https://img.shields.io/pypi/v/zip-meta-map" alt="PyPI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/zip-meta-map" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/zip-meta-map/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## 它的作用/功能

zip-meta-map 生成一个确定性的元数据层，它可以为人工智能代理回答以下三个问题：

- **这里有什么？** — 带有置信度评分的角色分类文件清单。
- **什么最重要？** — 带有摘录的“开始”列表，按重要性排序。
- **我如何避免在大量信息中迷失方向？** — 带有字节预算的导航方案。

## 快速演示

```bash
$ zip-meta-map build my-project/ -o output/ --summary

Wrote META_ZIP_FRONT.md and META_ZIP_INDEX.json to output/
  Profile:  python_cli
  Files:    47
  Modules:  8
  Flagged:  2 file(s) with risk flags
```

```bash
$ zip-meta-map explain my-project/

Profile:  python_cli
Files:    47

Top files to read first:
  README.md                     [doc]        conf=0.95  README is primary documentation
  src/app/main.py               [entrypoint] conf=0.95  matches profile entrypoint pattern
  pyproject.toml                [config]     conf=0.95  Python project configuration

Overview plan:
  Quick orientation — what is this tool and how is it structured?
  1. READ README.md for project purpose and usage
  2. READ pyproject.toml for dependencies and entry points
  3. READ entrypoint file to understand CLI structure
  Budget: ~32 KB
```

请参考[示例代码](examples/tiny_python_cli/)，其中包含一个完整的演示示例。

## 安装

```bash
pip install zip-meta-map
```

或者，可以使用 [pipx](https://pipx.pypa.io/)：

```bash
pipx install zip-meta-map
```

来自：

```bash
git clone https://github.com/mcp-tool-shop-org/zip-meta-map
cd zip-meta-map
pip install -e ".[dev]"
```

## GitHub 动作/工作流

在持续集成（CI）环境中，可以使用 `zip-meta-map` 配合复合操作来实现以下功能：

```yaml
- name: Generate metadata map
  uses: mcp-tool-shop-org/zip-meta-map@v0
  with:
    path: .
```

此操作会安装工具，构建元数据，并生成操作摘要。输出结果包括 `index-path`、`front-path`、`profile`、`file-count` 和 `warnings-count`。设置 `pr-comment: 'true'` 可以将摘要以评论的形式发布到拉取请求中。

请参考 [examples/github-action/](examples/github-action/) 目录，了解完整的工作流程示例。

## 它能生成的内容

| 文件。 | 目的。 |
| 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 |
| `META_ZIP_FRONT.md` | 易于人类阅读的引导页面。 |
| `META_ZIP_INDEX.json` | 可供机器读取的索引（包含角色、置信度、计划、片段、摘录、风险标识等信息）。 |
| `META_ZIP_REPORT.md` | 提供详细的可浏览报告（使用 `--report md` 参数）。 |

## 命令行参考

```bash
# Build metadata for a folder or ZIP
zip-meta-map build path/to/repo -o output/
zip-meta-map build archive.zip -o output/

# Build with step summary and report
zip-meta-map build . -o output/ --summary --report md

# Output formats for piping
zip-meta-map build . --format json          # JSON to stdout
zip-meta-map build . --format ndjson        # one JSON line per file
zip-meta-map build . --manifest-only        # skip FRONT.md

# Explain what the tool detected
zip-meta-map explain path/to/repo
zip-meta-map explain path/to/repo --json

# Compare two indices (CI-friendly)
zip-meta-map diff old.json new.json             # human-readable
zip-meta-map diff old.json new.json --json       # JSON output
zip-meta-map diff old.json new.json --exit-code  # exit 1 if changes

# Validate an existing index
zip-meta-map validate META_ZIP_INDEX.json

# Policy overrides
zip-meta-map build . --policy META_ZIP_POLICY.json -o output/
```

## 个人资料

自动检测，基于仓库的结构。当前内置功能：

| 简介。 | 由...检测到。 | 计划。 |
| 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 |
| `python_cli` | `pyproject.toml`, `setup.py` | 概述、调试、添加功能、安全审查、深入分析。 |
| `node_ts_tool` | `package.json`, `tsconfig.json` | 概览、调试、添加功能、安全审查、深入分析。 |
| `monorepo` | `pnpm-workspace.yaml`, `lerna.json` | 概览、调试、添加功能、安全审查、深入分析。 |

请参考 [docs/PROFILES.md] 文件。

## 角色与自信

每个文件条目包含以下信息：**角色**（限定词汇表）、**置信度**（0.0–1.0）以及**原因**。

| 乐队。 | 范围。 | 含义。 |
| 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 | 好的，请提供需要翻译的英文文本。 |
| 高。 | 大于或等于 0.9。 | 强烈的结构性信号（文件名匹配、配置文件入口点）。 |
| 好的。 | 大于或等于 0.7。 | 模式匹配（目录命名规范、文件扩展名与位置）。 |
| 公平。 | 大于或等于 0.5。 | 仅提供扩展信息或信号强度较弱。 |
| 低。 | 小于0.5。 | 已分配为“未知”；原因解释了这种不确定性。 |

## 逐步展示 (版本 0.2)

- **文件分块地图**（适用于大于 32KB 的文件）：提供稳定标识符、行范围和标题信息。
- **模块摘要**：显示目录级别的角色分配和关键文件。
- **摘录**：展示高价值文件的开头几行内容。
- **风险标识**：标记潜在风险，包括 `exec_shell`（执行 shell 命令）、`secrets_like`（包含敏感信息）、`network_io`（网络输入/输出）、`path_traversal`（路径遍历）、`binary_masquerade`（二进制文件伪装）和 `binary_executable`（可执行二进制文件）。
- **功能**：`capabilities[]` 字段说明哪些可选功能已启用。

## 稳定性

- 规格版本遵循类似于语义化版本控制的规则：次版本更新会增加字段，而主版本更新可能会破坏现有客户端。
- `capabilities[]` 是官方的功能协商机制。
- 较旧的客户端，如果忽略未知字段，即使在次版本更新的情况下仍然可以正常工作。
- 请参阅 [docs/SPEC.md](docs/SPEC.md) 以获取完整的规范。

## 回购协议结构

```
src/zip_meta_map/
  cli.py        # argparse CLI (build, explain, diff, validate)
  builder.py    # scan -> index -> validate -> write
  diff.py       # index comparison (diff command)
  report.py     # GitHub step summary + detailed report
  scanner.py    # directory + ZIP scanning with SHA-256
  roles.py      # role assignment heuristics + confidence
  profiles.py   # built-in profiles + traversal plans
  chunker.py    # deterministic text chunking
  modules.py    # folder-level module summaries
  safety.py     # risk flag detection + warning generation
  schema/       # JSON Schemas and loaders
docs/
  SPEC.md       # v0.2 contract (format semantics)
  PROFILES.md   # profile behaviors + plans
examples/
  tiny_python_cli/   # golden demo output
  github-action/     # consumer workflow example
tests/
  fixtures/     # tiny fixture repos
```

## 贡献

这个项目的设计规模很小。如果您希望参与：

- 保持启发式算法的确定性。
- 限制角色的范围，并将细微之处体现在标签中。
- 为任何新的启发式算法添加测试。
- 不要修改模式，除非同时更新文档/SPEC.md 和示例文件。

```bash
pytest
```

## 文档

- [规范 (v0.2)](docs/SPEC.md) — 所有生成文件的约定。
- [配置方案](docs/PROFILES.md) — 内置的项目类型配置方案。
- [安全](SECURITY.md) — 漏洞报告。

## 许可证

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
