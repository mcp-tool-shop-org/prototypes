<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" alt="receipt-factory">
</p>

<p align="center">
  Receipts are how we prove work happened — without trusting vibes.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/receipt-factory/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

收据是一种经过签名、带有时间戳且可重现的记录，用于记录**发生了什么**：

- **做了什么** — 动作、输入、输出
- **为什么这样做** — 意图、策略、上下文
- **谁/什么执行的** — 执行者、运行器、工具版本
- **证明它发生了** — 哈希值、链接、校验和、日志
- **如何验证它** — 命令、重新运行说明

您可以在 30 秒内阅读收据，并在 2 分钟内验证它。所有内容都是可重现的。如果不是，那它就不是一个收据。

## 软件包

| 软件包 | 描述 |
|---------|-------------|
| [`@receipt-factory/core`](packages/core) | 收据模式、规范化、SHA-256 哈希、流畅的构建器 API |
| [`@receipt-factory/render`](packages/render) | Markdown + 独立 HTML 渲染器 |
| [`@receipt-factory/verify`](packages/verify) | 模式验证、哈希完整性、链接验证、策略执行 |
| [`@receipt-factory/sign`](packages/sign) | 基于 Cosign 的签名 — 收据、策略、捆绑包（分离的附加组件） |
| [`@receipt-factory/evidence`](packages/evidence) | 证据包 — 便携式、基于内容的证据捆绑包 |
| [`@receipt-factory/index`](packages/index) | 收据索引 — 扫描、搜索、过滤收据目录 |
| [`@receipt-factory/policy`](packages/policy) | 策略包 — 便携式、版本化的代码检查配置 |
| [`@receipt-factory/bundle`](packages/bundle) | 收据捆绑包 — 自验证的真值封装（zip 格式） |
| [`@receipt-factory/adapter-github`](packages/adapters/github) | 通过 `gh` CLI 获取 GitHub Actions 数据 |
| [`@receipt-factory/cli`](apps/factory-cli) | `rf` 命令 — 创建、收集、渲染、验证、签名收据 |

## 流水线

| 流水线 | 收据类型 | 它证明了什么 |
|----------|-------------|----------------|
| [`ci-receipts`](pipelines/ci-receipts) | `ci_run` | 一个 CI 构建/测试过程，具有特定的输入和结果 |
| [`release-receipts`](pipelines/release-receipts) | `release` | 发布了一个版本，其中包含特定的资源和提交 |
| [`registry-sync`](pipelines/registry-sync) | `registry_sync` | 已发布的内容与仓库中的内容之间的差异 |
| [`security-audit`](pipelines/security-audit) | `audit` | 扫描了什么，使用了什么工具，发现了哪些漏洞 |
| [`sbom`](pipelines/sbom) | `sbom` | 生成并验证了软件物料清单 |

## 快速开始

```bash
# Install the CLI
npm install -g @receipt-factory/cli

# Create a receipt from a GitHub Actions run
rf make ci --from github --run 12345678

# Render it
rf render receipts/ci/2026-03-03/12345678.json --format html

# Verify it
rf verify receipts/ci/2026-03-03/12345678.json

# Verify with strict lint + policy
rf verify receipts/ci/2026-03-03/12345678.json --strict --policy policy.json

# Bundle receipts into a portable capsule
rf bundle create receipts/ci/2026-03-03/12345678.json --follow --policy policy.json

# Sign the bundle
rf bundle sign bundles/abc123.bundle.zip --keyless
```

## 信任层

receipt-factory 提供了四层可堆叠的信任层：

1. **收据完整性** — 基于 SHA-256 的内容寻址收据（防篡改）
2. **治理完整性** — 基于策略的代码检查规则，并带有签名策略文件
3. **捆绑包完整性** — 自验证的 zip 捆绑包，包含哈希清单
4. **捆绑包权威性** — 捆绑包上的分离的 Cosign 签名（防篡改）

验证顺序：签名 → 文件完整性 → 语义完整性 → 治理。

## 这证明了什么

- 在特定时间，发生了构建、测试、发布、审计或 SBOM 生成过程
- 输入和输出是基于内容的，并且具有防篡改性
- 您可以使用 `rf verify` 在任何时间重新验证收据
- 您可以使用 `rf graph` 跟踪完整的溯源链

## 这没有证明什么

- 底层代码是否正确（收据证明的是过程，而不是质量）
- CI 环境本身是否没有被破坏（这是供应链问题）
- 发布的工件在创建收据后是否被修改过（使用签名来解决这个问题）

## 安全

请参阅 [SECURITY.md](SECURITY.md)，了解威胁模型和报告。

**没有遥测。** receipt-factory 绝不会向服务器发送数据、跟踪使用情况或收集分析数据。

## 许可证

MIT

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建
