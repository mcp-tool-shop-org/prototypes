<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/escape-the-valley/readme.png" width="400" alt="Escape the Valley">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/escape-the-valley"><img src="https://img.shields.io/npm/v/@mcptoolshop/escape-the-valley" alt="npm version"></a>
  <a href="https://pypi.org/project/escape-the-valley/"><img src="https://img.shields.io/pypi/v/escape-the-valley" alt="PyPI"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-escape-the-valley/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/escape-the-valley/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

一款类似《俄勒冈开拓者》的生存游戏，具有AI旁白功能，并可选择使用XRPL测试网络账本背包。

**无需Python。** 此软件包会下载预编译的二进制文件并在本地运行。

## 安装与运行

```bash
npx @mcptoolshop/escape-the-valley tui --seed 42
```

安装完成即可。无需Python，无需pip，无需虚拟环境。

### 继续已保存的游戏

```bash
npx @mcptoolshop/escape-the-valley tui --continue
```

从上次停止的地方继续游戏——游戏会在每个检查点自动保存。

## 运行流程

1. 首次运行会从[GitHub发布页面](https://github.com/mcp-tool-shop-org/escape-the-valley/releases)下载适用于特定平台的二进制文件（约15MB）。
2. 验证SHA256校验和。
3. 缓存在本地（`~/.cache/mcptoolshop/escape-the-valley/`）。
4. 运行，并完整传递所有参数。

后续运行可立即从缓存中启动。

## 游戏内容

带领一群拓荒者穿越一个程序生成的荒野。管理食物、水、马车状况和士气，同时应对各种事件、危险和艰难的选择。 这片山谷既严酷又公平——一位熟练的玩家大约有1/3的成功率。

一个可选的**AI游戏主持人**（由Ollama提供支持）会用三种不同的叙述风格来讲述你的旅程。一个可选的**XRPL测试网络账本背包**会记录每一次物资变化，作为链上交易记录。

### 营地行动

| 行动 | 作用 |
|--------|-------------|
| **Travel** | 向出口移动——每回合不移动会浪费物资。 |
| **Rest** | 恢复健康和士气，有机会治愈疾病。 |
| **Hunt** | 在森林和草原中寻找食物。 |
| **Repair** | 修复马车损坏，防止被困。 |
| **Ration** | 当食物短缺时，减少食物供应到一半（会降低士气）。 |
| **Abandon** | 为了提高速度，丢弃部分货物（最后的选择）。 |

### 游戏主持人配置文件

| 配置文件 | 声音 |
|---------|-------|
| **Chronicler** | 干涩、客观、历史性的语调。 |
| **Fireside** | 温暖、亲切的讲故事风格。 |
| **Lantern-Bearer** | 怪异、充满氛围、令人不安的风格。 |

## 命令

```bash
npx @mcptoolshop/escape-the-valley tui                    # start a new game
npx @mcptoolshop/escape-the-valley tui --seed 42          # seeded world gen
npx @mcptoolshop/escape-the-valley tui --continue         # resume saved game
npx @mcptoolshop/escape-the-valley tui --gm chronicler    # choose GM voice
npx @mcptoolshop/escape-the-valley tui --callouts minimal # fewer warnings
npx @mcptoolshop/escape-the-valley ledger                 # print trail ledger
npx @mcptoolshop/escape-the-valley --help                 # see all commands
```

## 支持的平台

- Linux x64
- macOS ARM64 (Apple Silicon)
- Windows x64

## 故障排除

```bash
npx @mcptoolshop/escape-the-valley --print-cache-path  # show cached binary location
npx @mcptoolshop/escape-the-valley --clear-cache       # force fresh re-download
```

如果最新版本存在问题，**可以指定特定版本**。

```bash
npx @mcptoolshop/escape-the-valley@1.0.0 tui --seed 42
```

## 安全性

所有二进制文件在执行前都会通过SHA256校验和进行验证。 不会收集任何遥测数据。 除了从GitHub下载的初始文件之外，不会访问任何网络。

由[@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) 提供支持。

## 替代方案：使用Python安装

如果您更喜欢使用Python：

```bash
pip install escape-the-valley
trail tui --seed 42
```

---

由<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
