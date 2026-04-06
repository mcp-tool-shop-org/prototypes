<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/prov-engine-js/readme.png" alt="prov-engine-js" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/prov-engine-js/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/prov-engine-js/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/prov-engine-js"><img src="https://img.shields.io/npm/v/@mcptoolshop/prov-engine-js" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/prov-engine-js/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**一个实现 prov-spec 标准的、轻量级、无依赖的 Node.js 溯源引擎。**

---

## 概述

- **无依赖**：仅使用 Node.js 内置模块 (`node:fs`, `node:crypto`, `node:process`)
- **单文件引擎**：整个实现都包含在 `prov-engine.js` 文件中
- **命令行 + 编程接口**：可以通过命令行运行，也可以导入到您自己的代码中
- **符合 prov-spec L1 标准**：通过所有 Level 1 (完整性) 的测试用例
- **JCS 子集规范化**：按照 prov-spec 第 6 节，进行确定性的 JSON 序列化

---

## 安装

```bash
# Add to your project
pnpm add @mcptoolshop/prov-engine-js

# Or run directly without installing
npx @mcptoolshop/prov-engine-js describe
```

您也可以克隆代码仓库，并直接运行引擎：

```bash
git clone https://github.com/mcp-tool-shop-org/prov-engine-js.git
cd prov-engine-js
node prov-engine.js describe
```

---

## 命令行命令

该引擎提供了五个命令。所有输出都以 JSON 格式写入到标准输出。

### `describe` -- 打印能力清单

```bash
npx @mcptoolshop/prov-engine-js describe
```

```json
{
  "schema": "prov-capabilities@v0.1",
  "engine": {
    "name": "prov-engine-js",
    "version": "0.1.0",
    "vendor": "prov-spec",
    "repo": "https://github.com/mcp-tool-shop-org/prov-engine-js",
    "license": "MIT"
  },
  "implements": [
    "adapter.wrap.envelope_v0_1",
    "integrity.digest.sha256"
  ],
  "conformance_level": "fully-conformant"
}
```

### `digest <input.json>` -- 计算规范化形式和 SHA-256 摘要

```bash
echo '{"b":2,"a":1}' > input.json
npx @mcptoolshop/prov-engine-js digest input.json
```

```json
{
  "canonical_form": "{\"a\":1,\"b\":2}",
  "digest": {
    "alg": "sha256",
    "value": "abd8d7fa4bab05cdd8da39bee28237e3b2c9cb08ccfc73e0af3e5a6f17eaee5a"
  }
}
```

### `wrap <payload.json>` -- 将有效负载封装在 MCP 报文中

```bash
echo '{"tool":"example","result":"ok"}' > payload.json
npx @mcptoolshop/prov-engine-js wrap payload.json
```

```json
{
  "schema_version": "mcp.envelope.v0.1",
  "result": {
    "tool": "example",
    "result": "ok"
  }
}
```

如果输入已经是报文（`schema_version` 等于 `mcp.envelope.v0.1`），则将其原样通过（不进行双重封装）。

### `verify-digest <artifact.json>` -- 验证摘要

输入文件必须包含 `content` 字段和一个 `digest` 字段，其中包含 `alg` 和 `value`：

```bash
cat > artifact.json << 'EOF'
{
  "content": {"a": 1, "b": 2},
  "digest": {
    "alg": "sha256",
    "value": "abd8d7fa4bab05cdd8da39bee28237e3b2c9cb08ccfc73e0af3e5a6f17eaee5a"
  }
}
EOF
npx @mcptoolshop/prov-engine-js verify-digest artifact.json
# Exit code 0 = valid, exit code 1 = mismatch
echo $?  # 0
```

### `check-vector <vector-dir>` -- 运行 prov-spec 测试用例

```bash
npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/integrity.digest.sha256
# PASS: integrity.digest.sha256 vector

npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/adapter.wrap.envelope_v0_1
# PASS: adapter.wrap.envelope_v0_1 vector
```

向量目录必须包含 `input.json` 和 `expected.json`。引擎会自动检测向量类型，基于预期的输出结构。

---

## 编程使用

该引擎是一个 ES 模块。您可以导入其内部模块，并在您自己的代码中使用：

```js
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// -- Canonicalization (inline, since not exported yet) --
function canonicalize(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite numbers not allowed");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
  }
  throw new Error(`Non-JSON value type: ${typeof value}`);
}

// Compute a digest
const payload = { tool: "demo", version: 1 };
const canonical = canonicalize(payload);
const hash = createHash("sha256").update(canonical, "utf8").digest("hex");

console.log("Canonical:", canonical);
console.log("SHA-256:  ", hash);

// Wrap in an MCP envelope
const envelope = {
  schema_version: "mcp.envelope.v0.1",
  result: payload,
};
console.log("Envelope: ", JSON.stringify(envelope, null, 2));
```

> **提示：** 在未来的版本中，`canonicalize`、`computeDigest` 和 `wrapEnvelope` 将作为命名导出，以便您可以直接 `import { canonicalize } from "@mcptoolshop/prov-engine-js"`。

---

## 方法

| 方法 | 描述 |
| -------- | ------------- |
| `integrity.digest.sha256` | 按照 prov-spec 第 6 节进行 JSON 规范化，然后计算 UTF-8 字节的 SHA-256 摘要。返回 `{ alg: "sha256", value: "<hex>" }`。 |
| `adapter.wrap.envelope_v0_1` | 将任何 JSON 有效负载封装在 `{ schema_version: "mcp.envelope.v0.1", result: <payload> }` 中。已经封装的报文将原样通过。 |

---

## 规范化的工作原理

prov-spec 要求进行确定性的 JSON 序列化，以便相同的逻辑对象始终产生相同的字节序列（因此产生相同的摘要）。该引擎实现了 JCS 子集规范化，具体参见 prov-spec 第 6 节：

1. **排序的键**：对象键按 Unicode 代码点顺序进行词法排序。
2. **无空格**：在令牌之间没有空格或换行符。分隔符仅为 `,` 和 `:`。
3. **数字规范化**：没有前导零，没有小数点后的尾随零，没有正号，`-0` 变为 `0`。
4. **最小的转义**：仅输出必需的转义序列。
5. **UTF-8 编码**：在哈希之前，将规范字符串编码为 UTF-8。

示例：`{"b": 2, "a": 1}` 规范化为 `{"a":1,"b":2}`。

---

## 兼容性

该引擎声明对 prov-spec 标准的 **Level 1 (完整性)** 具有 **完全兼容** 的状态。

- 通过所有 `integrity.digest.sha256` 测试用例
- 通过所有 `adapter.wrap.envelope_v0_1` 测试用例
- 没有已知的偏差

请参阅 `prov-capabilities.json` 以获取完整的兼容性清单。

---

## 文档

| 文档 | 描述 |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | 深入指南：溯源概念、prov-spec 机制、集成模式、架构、常见问题解答 |
| [CONTRIBUTING.md](CONTRIBUTING.md) | 如何参与、开发流程、设计原则 |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | 社区规范 |
| [CHANGELOG.md](CHANGELOG.md) | 版本发布历史（采用 Changelog 格式） |

---

## 许可证

[MIT](LICENSE)
