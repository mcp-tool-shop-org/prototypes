<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/edgepacks/readme.png" width="400" alt="EdgePacks" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/actions"><img src="https://github.com/mcp-tool-shop-org/edgepacks/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/edgepacks/"><img src="https://img.shields.io/badge/docs-landing%20page-brightgreen" alt="Landing Page" /></a>
</p>

用于训练小型模型，以完成特定任务的数据集集合。

## 这是什么

一个包含针对特定能力而设计、结构良好、无版权问题的训练数据集的库。每个数据集包含生成规则、验证规则、评估数据集以及用于常见微调工具的导出路径。

## 这不是什么

- 泛用数据集集合
- HuggingFace 接口
- 训练框架

## 安装

```bash
pip install edgepacks
```

## 快速开始

```bash
# List available packs
edgepacks list

# Inspect a pack
edgepacks info tool-routing

# Build a dataset (requires Ollama running locally)
edgepacks build tool-routing --count 2000 --model qwen2.5:7b

# Export for your trainer
edgepacks export tool-routing --format unsloth --output ./data/
```

## 启动数据集

| 数据集 | 任务 | 用于训练的内容 |
|------|------|---------------|
| `tool-routing` | 分类 | 自然语言请求 → 适用于特定工具 + 参数 |
| `structured-extraction` | 提取 | 非结构化文本 → 结构化 JSON |
| `error-triage` | 分类 | 错误日志 → 原因 + 严重程度 + 下一步 |

## 架构

三层结构：

1. **Schema（模式）** — 描述数据集的规范
2. **Foundry（数据集生成器）** — 用于创建、验证和分割数据集的工具
3. **Delivery（交付）** — 命令行界面 + 导出到 JSONL、HuggingFace、Unsloth、torchtune 等格式

## 每个数据集包含：

- 任务定义 + 标准模式
- 训练集/验证集/测试集
- 正样本和困难负样本
- 生成配方（通过 Ollama 模拟生成）
- 验证器，用于拒绝格式错误或信号较弱的数据行
- 评估数据集，用于在微调后测试实际技能
- 导出到可以直接集成到常用工具中的格式

## 安全与信任

**访问的数据：** 仅访问用户指定的输出目录中的本地 `.json` / `.jsonl` 文件。 种子示例包含在软件包中。 生成的示例写入到 `./output/` 目录或您指定的路径。

**网络：** 仅通过 HTTP 连接到本地 Ollama (`localhost:11434`) 进行模拟生成。 不使用任何云 API，不收集任何遥测数据，也不进行任何分析。 一旦 Ollama 可用，即可完全离线运行。

**未访问的数据：** 不访问任何凭据文件、系统文件或环境变量。 不读取或写入您指定的输出目录之外的文件。

**不收集或发送任何遥测数据。**

## 平台

- Python 3.11+
- 适用于 Linux、macOS、Windows
- 仅需要在 `generate`、`mutate` 和 `build` 命令中使用 Ollama

## 许可证

MIT

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
