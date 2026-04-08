<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/file-compass/readme.png" alt="File Compass" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/file-compass/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/file-compass/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/file-compass/"><img src="https://img.shields.io/pypi/v/file-compass" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/file-compass/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**基于 HNSW 向量索引的 AI 工作站语义文件搜索**

*通过描述您要查找的内容来查找文件，而不仅仅是根据文件名*

---

## 为什么选择 File Compass？

| 问题 | 解决方案 |
| --------- | ---------- |
| “那个数据库连接文件在哪里？” | `file-compass search "database connection handling"` |
| 关键词搜索无法匹配语义 | 向量嵌入理解含义 |
| 大型代码库中的搜索速度慢 | HNSW 索引：100 毫秒内搜索超过 1 万个文件 |
| 需要与 AI 助手集成 | 用于 Claude Code 的 MCP 服务器 |

## 快速开始

```bash
# Install
git clone https://github.com/mcp-tool-shop-org/file-compass.git
cd file-compass && pip install -e .

# Pull embedding model
ollama pull nomic-embed-text

# Index your code
file-compass index -d "C:/Projects"

# Search semantically
file-compass search "authentication middleware"
```

## 特性

- **语义搜索** - 通过描述您要查找的内容来查找文件
- **快速搜索** - 快速文件名/符号搜索（无需嵌入）
- **多语言 AST** - 对 Python、JS、TS、Rust、Go 提供 Tree-sitter 支持
- **结果解释** - 了解每个结果为何匹配
- **本地嵌入** - 使用 Ollama（无需 API 密钥）
- **快速搜索** - HNSW 索引，实现亚秒级的查询速度
- **Git 兼容** - 可选地仅过滤 Git 跟踪的文件
- **MCP 服务器** - 与 Claude Code 和其他 MCP 客户端集成
- **安全加固** - 输入验证，防止路径遍历攻击

## 安装

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/file-compass.git
cd file-compass

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -e .

# Pull the embedding model
ollama pull nomic-embed-text
```

### 要求

- Python 3.10+
- [Ollama](https://ollama.com/)，以及 `nomic-embed-text` 模型

## 使用方法

### 构建索引

```bash
# Index a directory
file-compass index -d "C:/Projects"

# Index multiple directories
file-compass index -d "C:/Projects" "D:/Code"
```

### 搜索文件

```bash
# Semantic search
file-compass search "database connection handling"

# Filter by file type
file-compass search "training loop" --types python

# Git-tracked files only
file-compass search "API endpoints" --git-only
```

### 快速搜索（无需嵌入）

```bash
# Search by filename or symbol name
file-compass scan -d "C:/Projects"  # Build quick index
```

### 检查状态

```bash
file-compass status
```

## MCP 服务器

File Compass 包含一个 MCP 服务器，可与 Claude Code 和其他 AI 助手集成。

### 可用工具

| Tool | 描述 |
| ------ | ------------- |
| `file_search` | 带有解释的语义搜索 |
| `file_preview` | 带有语法高亮的代码预览 |
| `file_quick_search` | 快速文件名/符号搜索 |
| `file_quick_index_build` | 构建快速搜索索引 |
| `file_actions` | 上下文、用法、相关内容、历史记录、符号 |
| `file_index_status` | 检查索引统计信息 |
| `file_index_scan` | 构建或重新构建完整的索引 |

### Claude Code 集成

添加到您的 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "file-compass": {
      "command": "python",
      "args": ["-m", "file_compass.gateway"],
      "cwd": "C:/path/to/file-compass"
    }
  }
}
```

## 配置

| 变量 | 默认值 | 描述 |
| ---------- | --------- | ------------- |
| `FILE_COMPASS_DIRECTORIES` | `F:/AI` | 逗号分隔的目录 |
| `FILE_COMPASS_OLLAMA_URL` | `http://localhost:11434` | Ollama 服务器 URL |
| `FILE_COMPASS_EMBEDDING_MODEL` | `nomic-embed-text` | 嵌入模型 |

## 工作原理

1. **扫描** - 发现匹配配置扩展名的文件，并尊重 `.gitignore`
2. **分块** - 将文件拆分为语义片段：
- Python/JS/TS/Rust/Go：通过 tree-sitter 实现基于 AST 的分块（函数、类）
- Markdown：基于标题的部分
- JSON/YAML：顶级键
- 其他：滑动窗口，带重叠
3. **嵌入** - 通过 Ollama 生成 768 维向量
4. **索引** - 将向量存储在 HNSW 索引中，元数据存储在 SQLite 中
5. **搜索** - 嵌入查询，找到最近的邻居，返回排序后的结果

## 性能

| 指标 | Value |
| -------- | ------- |
| 索引大小 | 每个片段约 1KB |
| 搜索延迟 | 100 毫秒内搜索超过 1 万个片段 |
| 快速搜索 | 文件名/符号搜索，小于 10 毫秒 |
| 嵌入速度 | 每个片段约 3-4 秒（本地） |

## 架构

```
file-compass/
├── file_compass/
│   ├── __init__.py      # Package init
│   ├── config.py        # Configuration
│   ├── embedder.py      # Ollama client with retry
│   ├── scanner.py       # File discovery
│   ├── chunker.py       # Multi-language AST chunking
│   ├── indexer.py       # HNSW + SQLite index
│   ├── quick_index.py   # Fast filename/symbol search
│   ├── explainer.py     # Result explanations
│   ├── merkle.py        # Incremental updates
│   ├── gateway.py       # MCP server
│   └── cli.py           # CLI
├── tests/               # 298 tests, 91% coverage
├── pyproject.toml
└── LICENSE
```

## 安全性

- **输入验证** - 所有 MCP 输入都经过验证。
- **路径遍历保护** - 阻止访问允许目录之外的文件。
- **SQL 注入防护** - 仅使用参数化查询。
- **错误处理** - 内部错误不会暴露。

## 开发

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=file_compass --cov-report=term-missing

# Type checking
mypy file_compass/
```

## 相关项目

该项目是 [**MCP Tool Shop**](https://mcp-tool-shop.github.io/) 的一部分，该项目是面向 AI 驱动开发的 Compass 套件。

- [Tool Compass](https://github.com/mcp-tool-shop-org/tool-compass) - 语义化的 MCP 工具发现。
- [Integradio](https://github.com/mcp-tool-shop-org/integradio) - 基于向量嵌入的 Gradio 组件。
- [Backpropagate](https://github.com/mcp-tool-shop-org/backpropagate) - 无头 LLM 微调。
- [Comfy Headless](https://github.com/mcp-tool-shop-org/comfy-headless) - 简化版的 ComfyUI。

## 支持

- **问题/帮助：** [讨论](https://github.com/mcp-tool-shop-org/file-compass/discussions)
- **Bug 报告：** [问题](https://github.com/mcp-tool-shop-org/file-compass/issues)

## 许可证

MIT 许可证 - 详情请参见 [LICENSE](LICENSE)。

## 鸣谢

- [Ollama](https://ollama.com/) 用于本地 LLM 推理。
- [hnswlib](https://github.com/nmslib/hnswlib) 用于快速向量搜索。
- [nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5) 用于嵌入。
- [tree-sitter](https://tree-sitter.github.io/) 用于多语言 AST 解析。
