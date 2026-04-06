⚠️ **此仓库已迁移至 [accessibility-suite](https://github.com/mcp-tool-shop-org/accessibility-suite)**
源代码现在位于：`docs/prov-spec/`

---

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/prov-spec/readme.png" alt="Prov-Spec — Provenance Specification Framework" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="spec/PROV_METHODS_SPEC.md"><img src="https://img.shields.io/badge/spec-v0.1.0-blue" alt="Spec Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/prov-spec/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**一个正式的版本控制的规范和合规性套件，用于溯源方法 ID、记录和验证。**

---

## 这是什么？

这是一个规范，定义了：
- **方法 ID** — 用于溯源操作的稳定、命名空间标识符
- **溯源记录** — 结构化的 JSON 文档，记录工具的调用情况
- **合规性级别** — 可测试的合规性等级
- **测试向量** — 用于互操作性的标准输入/输出

## 这又不是什么？

- 不是一个框架
- 不是一个 SDK
- 不是 MCP 专用的
- 不是 Python 专用的

## 它面向哪些用户？

- **引擎开发者** — 可以使用任何语言实现溯源功能
- **工具集成者** — 可以将现有工具与溯源功能集成
- **审计员** — 可以验证溯源声明
- **基础设施构建者** — 可以构建具有溯源功能的系统

---

## 稳定性保证

> **标记为 `stable` 的方法 ID 只能追加，并且永远不会改变其语义。**
> **在主要版本内保证兼容性。**

---

## 快速开始

### 验证：10 秒

```bash
# Clone and run a test vector
git clone https://github.com/mcp-tool-shop-org/prov-spec
cd prov-spec
python tools/python/prov_validator.py check-vector integrity.digest.sha256
```

预期输出：`INFO: Test vector integrity.digest.sha256 passed`

---

### 1. 了解规范

阅读 [`spec/PROV_METHODS_SPEC.md`](spec/PROV_METHODS_SPEC.md) — 规范文档。

### 2. 查看目录

浏览 [`spec/methods.json`](spec/methods.json) — 机器可读的方法注册表。

### 3. 声明合规性

在您的项目中添加一个 `prov-capabilities.json` 文件：

```json
{
  "schema": "prov-capabilities@v0.1",
  "engine": {
    "name": "your-engine",
    "version": "1.0.0"
  },
  "implements": [
    "adapter.wrap.envelope_v0_1",
    "integrity.digest.sha256"
  ],
  "conformance_level": "fully-conformant"
}
```

### 4. 验证（可选）

使用参考验证器：

```bash
# List known methods
python -m prov_validator list-methods

# Validate a provenance record
python -m prov_validator validate-methods record.json --strict

# Run test vectors
python -m prov_validator check-vector integrity.digest.sha256
```

---

## 仓库结构

```
prov-spec/
├── spec/                    # Normative specification
│   ├── PROV_METHODS_SPEC.md # Main specification document
│   ├── methods.json         # Machine-readable method catalog
│   ├── schemas/             # JSON Schemas
│   │   ├── prov.record.schema.v0.1.json
│   │   ├── artifact.schema.v0.1.json
│   │   ├── evidence.schema.v0.1.json
│   │   ├── mcp.envelope.schema.v0.1.json
│   │   └── prov-capabilities.schema.json
│   └── vectors/             # Test vectors
│       ├── integrity.digest.sha256/
│       ├── adapter.wrap.envelope_v0_1/
│       └── ...
├── tools/                   # Reference implementations (optional)
│   └── python/              # Python reference validator
├── examples/                # Example files
├── CONFORMANCE_LEVELS.md    # Conformance tiers
└── CHANGELOG.md             # Version history
```

**注意：** 参考工具仅供参考，并非合规性的必要条件。

---

## 合规性级别

| Level | Name | 要求 |
| ------- | ------ | -------------- |
| **1** | 完整性 | `integrity.digest.*` 方法 |
| **2** | 引擎 | 级别 1 + `engine.*` 方法 |
| **3** | 溯源 | 级别 2 + `lineage.*` 方法 |

详情请参阅 [`CONFORMANCE_LEVELS.md`](CONFORMANCE_LEVELS.md)。

---

## 方法命名空间

| 命名空间 | 用途 |
| ----------- | --------- |
| `adapter.*` | 信封封装、传输 |
| `engine.*` | 证据提取、溯源构建 |
| `integrity.*` | 哈希、签名、验证 |
| `lineage.*` | 父链接、图操作 |

保留用于未来使用：`policy.*`, `attestation.*`, `execution.*`, `audit.*`

---

## 版本控制

- **规范版本：** `v0.1.0`
- **方法目录：** 在主要版本内只能追加
- **模式：** `additionalProperties: false` — 在补丁版本内向前兼容

---

## 贡献

1. 新方法 ID：打开一个问题，说明用例
2. 规范澄清：向 `spec/` 提交 PR
3. 参考工具：向 `tools/` 提交 PR

方法 ID 需要有实际的应用场景作为依据。我们不会随意添加 ID。

---

## 许可证

MIT — 参见 [LICENSE](LICENSE)

---

## 参考资料

- [PROV_METHODS_SPEC.md](spec/PROV_METHODS_SPEC.md) — 规范文档
- [PROV_METHODS_CATALOG.md](spec/PROV_METHODS_CATALOG.md) — 人类可读的目录
- [CONFORMANCE_LEVELS.md](CONFORMANCE_LEVELS.md) — 合规性等级
- [MCP_COMPATIBILITY.md](spec/MCP_COMPATIBILITY.md) — MCP 信封兼容性
