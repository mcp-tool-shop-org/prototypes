<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/xrpl-camp/readme.png" width="400" alt="xrpl-camp" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/xrpl-camp"><img src="https://img.shields.io/npm/v/@mcptoolshop/xrpl-camp" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-xrpl-camp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/xrpl-camp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

只需一次就能掌握 XRP Ledger 的知识——钱包、支付、验证、证书，10 分钟搞定。

**无需 Python。** 这个软件包会下载一个预编译的二进制文件并在本地运行。

## 安装与运行

```bash
npx @mcptoolshop/xrpl-camp start
```

就这么简单。无需 Python，无需 pip，无需虚拟环境。

## 运行过程

1. 首次运行会从 [GitHub 发布](https://github.com/mcp-tool-shop-org/xrpl-camp/releases) 下载特定平台的二进制文件（约 20 MB）。
2. 验证 SHA256 校验和。
3. 缓存在本地 (`~/.cache/mcptoolshop/xrpl-camp/`)。
4. 使用完整的参数传递进行运行。

后续运行会立即从缓存中启动。

## 命令

```bash
npx @mcptoolshop/xrpl-camp start      # begin the training
npx @mcptoolshop/xrpl-camp status     # check progress
npx @mcptoolshop/xrpl-camp --help     # see all commands
```

## 支持的平台

- Linux x64
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Windows x64

## 安全性

所有二进制文件在执行前都会进行 SHA256 校验和验证。 不会收集任何遥测数据。 除了从 GitHub 首次下载之外，不会进行任何网络访问。

由 [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) 提供支持。

## 替代方案：使用 Python 安装

如果您更喜欢使用 Python：

```bash
pipx install xrpl-camp
xrpl-camp start
```

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
