<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/context-window-manager/readme.png" alt="Context Window Manager" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/context-window-manager/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/context-window-manager/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/cwm-mcp/"><img src="https://img.shields.io/pypi/v/cwm-mcp" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/context-window-manager/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**通过 KV 缓存持久化实现 LLM 会话的无损上下文恢复**

---

## 这是什么？

Context Window Manager (CWM) 是一个 MCP 服务器，用于解决 LLM 应用中的 **上下文耗尽问题**。 与传统方法不同，当上下文达到上限时，CWM 不会丢失您的对话历史，而是允许您：

- **冻结**当前的上下文并将其保存到持久存储中
- 稍后以零信息损失的方式**恢复**它
- **克隆**上下文以探索不同的对话分支
- 准确地**恢复**到您上次离开的位置

与摘要或 RAG 方法不同，CWM 保留了实际的 KV 缓存张量，从而实现**真正的、无损的恢复**。

---

## 工作原理

```
Traditional Approach (Lossy):
┌─────────────────────────────────────────────┐
│ Context fills up → Summarize → Lose details │
└─────────────────────────────────────────────┘

CWM Approach (Lossless):
┌──────────────────────────────────────────────────────────────┐
│ Context fills up → Freeze KV cache → Store tensors → Thaw   │
│                                                    ↓        │
│                              Exact restoration, zero loss   │
└──────────────────────────────────────────────────────────────┘
```

CWM 利用：
- **vLLM 的前缀缓存**，使用 `cache_salt` 实现会话隔离
- **LMCache** 用于分层 KV 缓存存储（GPU → CPU → 磁盘 → Redis）
- **MCP 协议**，实现与 Claude Code 和其他 MCP 客户端的无缝集成

---

## 快速入门

### 先决条件

- Python 3.11+
- 启用了前缀缓存的 vLLM 服务器
- 已配置为与 vLLM 集成的 LMCache

### 安装

```bash
pip install cwm-mcp
```

### 配置

将以下内容添加到您的 Claude Code 设置 (`.claude/settings.json`)：

```json
{
  "mcpServers": {
    "context-window-manager": {
      "command": "python",
      "args": ["-m", "context_window_manager"],
      "env": {
        "CWM_VLLM_URL": "http://localhost:8000"
      }
    }
  }
}
```

### 用法

```
# Freeze your current session
> window_freeze session_abc123 my-coding-project

# Later, restore it
> window_thaw my-coding-project

# List all saved windows
> window_list

# Check status
> window_status my-coding-project
```

---

## 功能

### 核心操作

| Tool | 描述 |
| ------ | ------------- |
| `window_freeze` | 将会话上下文快照保存到存储 |
| `window_thaw` | 从已保存的窗口恢复上下文 |
| `window_list` | 列出可用的上下文窗口 |
| `window_status` | 获取有关会话/窗口的详细信息 |
| `window_clone` | 克隆上下文以进行探索 |
| `window_delete` | 删除已保存的窗口 |

### 存储层级

CWM 自动管理不同层级的存储：

1. **CPU 内存** - 速度快，容量有限
2. **磁盘** - 容量大，已压缩
3. **Redis** - 分布式，在多个实例之间共享

### 会话隔离

每个会话都分配一个唯一的 `cache_salt`，以确保：
- 没有跨会话的数据泄露
- 防止时间攻击
- 上下文的清晰分离

---

## 文档

| 文档 | 描述 |
| ---------- | ------------- |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | 入门和工作流程 |
| [API.md](docs/API.md) | 完整的 API 参考 |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | 技术架构深入分析 |
| [SECURITY.md](docs/SECURITY.md) | 安全注意事项 |
| [ERROR_HANDLING.md](docs/ERROR_HANDLING.md) | 错误分类和处理 |
| [ROADMAP.md](docs/ROADMAP.md) | 开发阶段和里程碑 |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | 开发指南 |

---

## 要求

### vLLM 服务器配置

```bash
vllm serve "meta-llama/Llama-3.1-8B-Instruct" \
  --enable-prefix-caching \
  --kv-transfer-config '{"kv_connector":"LMCacheConnectorV1","kv_role":"kv_both"}'
```

### LMCache 环境

```bash
export LMCACHE_USE_EXPERIMENTAL=True
export LMCACHE_LOCAL_CPU=True
export LMCACHE_MAX_LOCAL_CPU_SIZE=8.0
```

---

## 开发

```bash
# Clone and setup
git clone https://github.com/mcp-tool-shop-org/context-window-manager.git
cd context-window-manager
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -e ".[dev]"

# Run tests
pytest tests/unit/

# Run with coverage
pytest tests/unit/ --cov=src/context_window_manager
```

有关详细指南，请参阅 [CONTRIBUTING.md](docs/CONTRIBUTING.md)。

---

## 路线图

- [x] 阶段 0：文档和架构
- [x] 阶段 1：核心基础设施
- [x] 阶段 2：MCP 服务器 Shell
- [x] 阶段 3：冻结实现
- [x] 阶段 4：恢复实现
- [x] 阶段 5：高级功能（克隆、自动冻结）
- [x] 阶段 6：生产环境优化
- [x] 阶段 7：集成和完善

有关详细信息，请参阅 [ROADMAP.md](docs/ROADMAP.md)。

---

## 许可证

MIT 许可证 - 详情请参阅 [LICENSE](LICENSE)。

---

## 鸣谢

- [vLLM](https://github.com/vllm-project/vllm) - 高吞吐量 LLM 服务
- [LMCache](https://github.com/LMCache/LMCache) - KV 缓存持久化层
- [Model Context Protocol](https://modelcontextprotocol.io/) - 集成标准
- [Recursive Language Models](https://arxiv.org/abs/2512.24601) - 上下文管理的灵感来源

---

## 状态

**Beta 版本 (v0.6.4)** - 生产环境优化工作已完成。持续集成 (CI) 已整合 (2 个工作流程)。 366 个测试通过。
