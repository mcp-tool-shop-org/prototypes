<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nexus-suite/readme.png" alt="Nexus Suite" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nexus-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**MCP 工具生态系统的治理、认证和路由基础设施。**

---

## 概述

- **认证 (Attestation)**：使用 `nexus-attest` 对工具输出进行签名和验证。
- **治理 (Governance)**：使用 `nexus-control` 定义和执行策略。
- **路由 (Routing)**：使用 `nexus-router` 通过可插拔的适配器分发请求。
- **可组合性 (Composable)**：包含六个独立的软件包，您可以根据需要选择使用。
- **原生 Python 支持**：采用标准的 `pip install -e .` 安装流程，使用 `pytest` 进行测试。

---

## 项目

| 软件包 | 描述 |
| --------- | ------------- |
| `nexus-attest` | 用于签名和验证的认证模块。 |
| `nexus-control` | 用于管理治理策略的控制模块。 |
| `nexus-router` | 用于请求路由和分发的模块。 |
| `nexus-router-adapter-stdout` | 用于标准输出传输的路由器适配器。 |
| `nexus-router-adapter-http` | 用于 HTTP 传输的路由器适配器。 |
| `nexus-router-adapter-template` | 用于构建自定义适配器的模板。 |

---

## 快速入门

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/nexus-suite.git
cd nexus-suite

# Install a component
cd src/nexus-router
pip install -e .

# Run tests
pytest
```

---

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                     nexus-control                            │
│              (governance policies, config)                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-router                             │
│              (request dispatch + routing)                    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   stdout    │      │    http     │      │  (custom)   │
│   adapter   │      │   adapter   │      │   adapter   │
└─────────────┘      └─────────────┘      └─────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-attest                             │
│              (signature verification)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 许可证

[MIT](LICENSE)
