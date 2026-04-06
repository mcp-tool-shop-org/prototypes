<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/sovereignty/readme.png" width="400" alt="sovereignty" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/sovereignty"><img src="https://img.shields.io/npm/v/@mcptoolshop/sovereignty" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-sovereignty/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/sovereignty/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

一款关于治理、信任和贸易的策略游戏——离线桌游 + XRPL 在线验证。

**无需 Python。** 此软件包下载预编译的二进制文件并在本地运行。

## 安装与运行

```bash
npx @mcptoolshop/sovereignty tutorial
```

就这些。无需 Python，无需 pip，无需虚拟环境。

## 运行过程

1. 首次运行会从 [GitHub 发布](https://github.com/mcp-tool-shop-org/sovereignty/releases) 下载特定平台的二进制文件（约 25 MB）。
2. 验证 SHA256 校验和。
3. 缓存在本地 (`~/.cache/mcptoolshop/sovereignty/`)。
4. 运行，并完整传递所有参数。

后续运行将从缓存中立即启动。

## 命令

```bash
npx @mcptoolshop/sovereignty tutorial    # learn the rules
npx @mcptoolshop/sovereignty new         # start a new game
npx @mcptoolshop/sovereignty status      # check game state
npx @mcptoolshop/sovereignty --help      # see all commands
```

## 支持的平台

- Linux x64
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Windows x64

## 安全性

所有二进制文件在执行前都会通过 SHA256 校验和进行验证。 不会收集任何遥测数据。 除了从 GitHub 初始下载之外，不会进行任何网络访问。

由 [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) 提供支持。

## 替代方案：通过 Python 安装

如果您更喜欢使用 Python：

```bash
pipx install sovereignty-game
sov tutorial
```

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
