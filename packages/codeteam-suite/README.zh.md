<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/codeteam-suite/readme.png" alt="CodeTeam Suite" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/codeteam-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**权威的 CodeTeam 实现**——一个基于 .NET 的命令行工具和库，用于包的验证、批准和签名。

## 状态

**v0.2.0 版本发布**——密码学信任循环已完成。互操作协议已确定。

### 稳定内容

以下内容已冻结并受到 CI 保护：

| 构建产物 | 位置 | 保证 |
| ---------- | ---------- | ----------- |
| JSON 模式 | `/schemas/*.v0.1.json` | 仅支持增量更改 |
| CLI `verify --json` 命令的输出 | `codeteam.cli.verify.schema.v0.1.json` | 向后兼容 |
| 错误代码 | `ErrorCode.cs` | 没有删除或重命名 |
| 严重程度映射 | `severity-map.v0.1.json` | 新的代码需要映射 |

互操作性测试会强制执行这些保证。任何破坏性更改都会导致 CI 构建失败。

## NuGet 包

| 包 | 描述 |
| --------- | ------------- |
| `CodeTeam` | 用于包验证、批准和签名的 .NET 全局工具。使用 `dotnet tool install -g CodeTeam` 进行安装。 |
| `CodeTeam.Core` | 领域模型、验证逻辑、规范 JSON 以及基于配额的策略评估。 |
| `CodeTeam.Crypto` | 通过 NSec.Cryptography 实现 Ed25519 签名验证和 SHA-256 摘要计算。 |
| `CodeTeam.Packaging` | 具有路径遍历保护和 JSON 模式验证的包读取和验证。 |

## 概述

CodeTeam Suite 是所有编辑器扩展（VS Code、Visual Studio）所依赖的“权威”实现。扩展程序会调用 CLI 并渲染结果；它们不实现验证逻辑。

## 架构

```
CodeTeam.Core       → Domain models, status codes, error types
CodeTeam.Crypto     → Ed25519 signatures, SHA-256 hashing
CodeTeam.Packaging  → Package loading and verification
CodeTeam.Cli        → CLI entry point (codeteam verify/approve/sign)
```

## CLI 使用方法

```bash
# Verify a package
codeteam verify <package-path> --json

# Approve a package
codeteam approve <package-path> --key <key-id> --json

# Sign a package
codeteam sign <package-path> --key <key-id> --json
```

## 退出码

| Code | 状态 | 含义 |
| ------ | -------- | --------- |
| 0 | OK_VERIFIED | 包已验证，签名有效 |
| 1 | OK_UNSIGNED | 包有效，但未签名 |
| 2 | FAIL_INTEGRITY | 缺少文件，文件大小/摘要不匹配 |
| 3 | FAIL_SCHEMA | 模式验证失败 |
| 4 | FAIL_SIGNATURE | 签名验证失败 |
| 5 | FAIL_THRESHOLD | 未达到批准阈值 |
| 6 | FAIL_UNAUTHORIZED | 用户未授权 |

## 文档

- [CONTRACT.md](CONTRACT.md) — 权威的包语义
- [VERIFICATION.md](VERIFICATION.md) — 规范的验证规则
- [docs/EDITOR_INTEGRATION.md](docs/EDITOR_INTEGRATION.md) — 编辑器扩展协议（VS Code、Visual Studio）
- [docs/PRESS_KIT.md](docs/PRESS_KIT.md) — 发布营销材料
- [docs/sealing.md](docs/sealing.md) — 密封设计（信息性）

## 黄金测试用例

测试用例定义了预期的验证结果：

| 测试用例 | 预期状态 |
| --------- | ----------------- |
| `fixtures/minimal_unsigned/` | OK_UNSIGNED |
| `fixtures/approved_threshold_met/` | OK_UNSIGNED |
| `fixtures/signed_verified/` | OK_VERIFIED |
| `fixtures/tampered_artifact/` | FAIL_INTEGRITY |
| `fixtures/invalid_manifest/` | FAIL_SCHEMA |
| `fixtures/signed_verified_real/` | OK_VERIFIED |
| `fixtures/signed_invalid_sig/` | FAIL_SIGNATURE |

## 构建

```bash
dotnet build
dotnet test
```

## 许可证

MIT
