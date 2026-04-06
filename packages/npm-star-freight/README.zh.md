<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/star-freight/readme.png" alt="Star Freight -- Trade. Decide. Survive." width="400">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/star-freight"><img src="https://img.shields.io/npm/v/@mcptoolshop/star-freight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

# @mcptoolshop/star-freight

> 一款太空商人角色扮演游戏，通过命令行界面运行，无需任何前提条件，使用 npx 进行安装。

```bash
npx @mcptoolshop/star-freight
```

或者，全局安装：

```bash
npm i -g @mcptoolshop/star-freight
star-freight
```

无需 Python、pip 或构建工具。预编译的二进制文件将被下载、经过 SHA256 验证，并缓存在本地。

---

## 游戏

你曾是一名军用飞行员。然后，你成为了一个耻辱。现在，你是一名船长，拥有一艘破旧的飞船，没有任何地位，并且身处一个在你到达之前就已经开始移动的星系。

**Star Freight** 是一款以文本为基础的战术商人角色扮演游戏，讲述了在政治分裂的星系中运输货物的故事。 包含五个文明，一个经济体系，以及四个真理，它们将确保你无法重复第二次人生。

你会在各个站点停靠，每个站点都有不同的文化，这会影响你的谈判方式。 你会选择不同的航线，不同的地形会影响你的战斗方式。 你会雇佣船员，他们会改变你能够做什么，你能够访问什么，以及你欠什么。 你会接受看似简单的合同，但当文件出现问题、供货短缺导致价格上涨，或者货物实际上是证据时，情况就会变得复杂。

## 它与众不同的原因

**船员是约束力的法律。** Thal 不仅仅是一个+10%的维修加成。 Thal 是*你*能够停靠在 Keth 站点的*原因*，*你*的飞船拥有紧急维修能力的原因，以及*你*注意到医疗货物与季节不符的原因。 失去 Thal，三个星系的能力就会同时下降。

**战斗是一种战役事件。** 胜利会带来回收的信用和派系声望。 撤退会消耗掉的货物和“逃兵”的名声。 失败意味着被没收的货物、受伤的船员，以及一艘飞船以高价勉强到达最近的站点。

**文化是社会逻辑。** Keth 人不仅仅是价格不同。 他们拥有一个季节性的生物日历，它会改变礼物赠送的含义，以及何时提出要求会被视为一种冒犯。 Veshan 人会提出挑战，拒绝比失败更糟糕。

**调查是从生活中诞生的。** 你会注意到医疗货物与季节不符，是因为你一直在运输它。 阴谋不会主动暴露。 你会通过完成工作而偶然发现它。

## 世界

五个文明共享一个名为 Threshold 的星系。

**Terran Compact**：一个官僚主义的人类政府。 他们让你蒙羞。 要重新获得他们的认可，需要许可证、耐心，以及放下自尊。

**Keth Communion**：一个基于生物日历的节肢动物集体。 如果你了解季节，他们可以提供最佳的利润空间。 如果你不了解，你的声誉会迅速崩溃。

**Veshan Principalities**：痴迷于荣誉和债务的爬行动物封建家族。 债务账簿不仅仅是背景设定，它是杠杆。

**Orryn Drift**：一个移动的经纪人文明。 他们与所有人交易，了解一切，并对所有服务都收费。

**Sable Reach**：海盗派系、祖先科技回收者，以及 Terran Compact 宁愿忘记的人。 没有法律，没有习俗，没有退款。

## 三种类型的船长

**补给船长。** 遵守纪律，基于信任的访问权限，公开的后果。 你负责让人们吃饱，但也会因为合法性而陷入困境。

**灰色走私者。** 利用文件，利用时机，承担机构风险。 你通过保持难以捉摸来赚钱。

**荣誉船长。** 直接对抗，家族政治，声誉波动。 你会直接面对问题。

这些不是职业。 它们是你所做的选择将你塑造成什么。

## 此软件包的工作原理

此 npm 软件包使用 [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) 来：

1. 从[GitHub 发布](https://github.com/mcp-tool-shop-org/star-freight/releases)下载预编译的 Star Freight 二进制文件。
2. 验证 SHA256 校验和。
3. 缓存在本地 (`~/.cache/mcptoolshop/star-freight/`)。
4. 使用您的参数运行。

### 缓存管理

```bash
star-freight --print-cache-path
star-freight --clear-cache
```

### 平台支持

| 平台 | 二进制文件 |
|----------|--------|
| Linux x64 | `star-freight-<version>-linux-x64` |
| macOS ARM64 | `star-freight-<version>-darwin-arm64` |
| Windows x64 | `star-freight-<version>-win-x64.exe` |

## 安全性

**安全模型：** 该软件包从 GitHub 发布页面下载预编译的二进制文件，并通过 HTTPS 连接进行传输，并在执行前验证 SHA256 校验和。它不收集任何遥测数据，不存储凭据，不发起任何超出 `github.com` 的网络请求，也不在用户缓存目录之外进行写入 (`~/.cache/mcptoolshop/star-freight/`)。 运行的二进制文件以调用者的权限运行，并将游戏存档仅写入当前工作目录。 详细的安全策略请参见 [SECURITY.md](SECURITY.md)。

## 源代码仓库

游戏源代码位于 [mcp-tool-shop-org/star-freight](https://github.com/mcp-tool-shop-org/star-freight)。

## 许可证

MIT

---

*Star Freight 是一款关于在权力系统中穿梭，但从未完全属于其中的游戏。*

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
