<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/stresskit-mcp/readme.png" width="400" alt="StressKit-MCP">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/stresskit-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

用于 MCP（模型上下文协议）服务器的健康和安全测试工具包。通过压力测试、安全验证和性能分析，提供可信的证据，证明 MCP 服务器的可用性。

## 功能

- **负载测试**：模拟高并发的工具调用，以识别瓶颈。
- **安全扫描**：验证输入验证、身份验证流程和错误处理。
- **性能分析**：测量延迟、吞吐量和资源使用情况。
- **合规性检查**：验证是否符合 MCP 协议。
- **证据生成**：生成可验证的测试报告，并提供溯源信息。

## 快速开始

```bash
# Install
pip install stresskit-mcp

# Run basic health check
stresskit check http://localhost:3000

# Run full stress test suite
stresskit stress http://localhost:3000 --profile default

# Generate security report
stresskit security http://localhost:3000 --output report.json
```

## 配置

StressKit 使用配置文件来定义可配置的测试场景。

```json
{
  "profile": "production",
  "duration": 300,
  "concurrency": 50,
  "tools": ["*"],
  "checks": {
    "latency_p99_ms": 500,
    "error_rate_max": 0.01,
    "memory_mb_max": 512
  }
}
```

## 项目结构

```
stresskit-mcp/
├── engines/        # Test execution engines
├── profiles/       # Pre-built test profiles
├── schemas/        # JSON schemas for configuration
├── tests/          # Unit and integration tests
└── stresskit.targets.json  # Default target configuration
```

## 相关项目

- [tool-scan](https://github.com/mcp-tool-shop-org/tool-scan) — 用于 MCP 工具的安全扫描器。
- [mcp-stress-test](https://github.com/mcp-tool-shop-org/mcp-stress-test) — 用于扫描器验证的红队工具包。

## 许可证

MIT 许可证 — 详情请参见 [LICENSE](LICENSE)。

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
