<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/witness/readme.png" alt="Witness" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/witness/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/witness/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/xrpl-witness/"><img src="https://img.shields.io/pypi/v/xrpl-witness" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/witness/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**状态：v0.1.0 — 第一阶段完成，第二阶段A已发布**

一个以本地优先、只追加、可进行密码学验证的事件记录，用于人与人工智能的协作。

## 您可以今天做什么

```bash
# Generate a testimony report
witness testify --format json --emit-artifact ./output

# Verify events cryptographically
witness verify

# Include exact stored JSON for deep audits
witness testify --format json --include-events
```

**第三方可以在未安装Witness的情况下验证证词** — JSON模式和验证规则已完整记录。

## 重要性

Witness创建可移植的证据链：
- **确定性**: 相同的输入 → 相同的输出字节 (使用`--generated-at`参数可实现可重复性)
- **可验证性**: 使用Ed25519签名 + SHA-256哈希值对规范JSON进行验证
- **可移植性**: 可以通过电子邮件发送，附加到工单，或提交到代码仓库
- **精确性**: `--include-events`参数可以嵌入原始数据的字节级内容

## 快速入门

```bash
# Install
pip install cryptography

# Initialize a store
witness init

# Record an event
witness record --action "example.action" --intent "Demonstrate recording"

# Generate testimony
witness testify --format md

# Verify all events
witness verify
```

## 信任模型

所有密码学操作都使用**规范JSON** → **SHA-256哈希值** → **Ed25519签名**。

请参阅[VERIFICATION.md](VERIFICATION.md)以获取以下信息：
- 精确的序列化规则
- 验证示例
- 退出码 (0 = 正常, 2 = 警告, 3 = 密码学错误)
- `--include-events`参数的隐私说明

## 稳定保证

| 制品 | 位置 | 协议 |
|----------|----------|----------|
| 事件模式 | 黄金测试用例 | `tests/fixtures/golden/*.json` |
| 证词模式 | `schemas/testimony.schema.v0.1.json` | JSON输出结构 |
| 退出码 | [VERIFICATION.md](VERIFICATION.md) | 0/2/3的含义 |
| Flags | [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | 4种标志类型，仅供参考 |

## 文档

> **从这里开始：** [CONTRACT.md](CONTRACT.md) — 法律定义与示例

| 文档 | 目的 |
|----------|---------|
| [CONTRACT.md](CONTRACT.md) | 规范内容与示例内容 |
| [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | 固定不变项 |
| [VERIFICATION.md](VERIFICATION.md) | 密码学规则 + 示例 |
| [docs/](docs/README.md) | 完整文档索引 |

## 第二阶段状态

| Track | 状态 |
|-------|--------|
| **2A: 证词作为制品** | ✅ 已发布 |
| **2B: 流水线** | ⏸️ 暂停 ([RFC](docs/RFC_PHASE2_PIPELINES.md)) |
| 2C–2E | 未开始 |

详情请参阅[docs/PHASE2_STATUS.md](docs/PHASE2_STATUS.md)。

## 项目结构

```
witness/
├── src/witness/           # Core library
│   ├── canon.py           # Canonical JSON
│   ├── crypto.py          # Ed25519 signing/verification
│   ├── storage.py         # SQLite append-only store
│   ├── timeline.py        # Flag analysis
│   ├── testify.py         # Testimony generation
│   └── cli.py             # Command-line interface
├── schemas/               # JSON schemas
├── tests/                 # Test suite (124 tests)
│   └── fixtures/golden/   # Authoritative fixtures
├── tools/                 # Verification utilities
└── docs/                  # Documentation + ADRs
```

## 设计理念

> Witness关注的是真实性，而不是判断。
> 记录发生了什么。稍后进行验证。由人类决定其含义。

## 许可证

MIT — 参见[LICENSE](LICENSE)。
