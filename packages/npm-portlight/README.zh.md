<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/portlight/readme.png" width="600" alt="Portlight">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/actions"><img src="https://github.com/mcp-tool-shop-org/npm-portlight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/portlight"><img src="https://img.shields.io/npm/v/@mcptoolshop/portlight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/npm-portlight/"><img src="https://img.shields.io/badge/docs-handbook-blue" alt="Handbook"></a>
</p>

这是一款以贸易为核心的海上策略游戏。通过路线优化、合同、基础设施、金融和声誉，在五个地区建立您的商业帝国——所有操作都在终端完成。无需Python知识。

## 安装

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
```

或者，全局安装：

```bash
npm install -g @mcptoolshop/portlight
portlight new "Captain Hawk" --type merchant
```

您也可以通过pip安装：`pip install portlight`

## 为什么选择Portlight

大多数贸易游戏将贸易简化为不断增长的数字。Portlight将贸易视为一种商业纪律：

- **价格会根据您的交易而变化。** 在某个港口倾销粮食会导致价格暴跌。每一次销售都会影响当地市场。
- **每个港口都有独特的经济特征。** 波尔托诺沃（Porto Novo）以低廉的价格生产粮食。丝绸港（Silk Haven）大量出口丝绸。这些是结构性的特点，而不是随机的。
- **航行充满风险。** 暴风雨、海盗、检查、季节性危险。您的补给、船体和船员都至关重要。
- **合同需要证明。** 在截止日期前将正确的货物运送到正确的港口。货物来源会被追踪。
- **基础设施会改变您的贸易方式。** 仓库用于储存货物。经纪人可以改善合同。许可证可以解锁高级权限。
- **声誉会打开和关闭机会。** 商业信任、海关检查、地区声誉和地下联系——这四个方面会影响您可以做什么以及去哪里。
- **游戏会根据您的成就进行评估。** 您的贸易历史、基础设施、声誉和航线会形成您的职业生涯档案。根据您最终成为哪种类型的商人，有四种不同的胜利途径。

## 世界

五个地区，二十个港口，四十三条航线，一个充满活力的经济。

| 地区 | 港口 | 角色 |
|--------|-------|-----------|
| **Mediterranean** | 波尔托诺沃（Porto Novo）、阿尔·马纳尔（Al-Manar）、西尔瓦湾（Silva Bay）、海盗避风港（Corsair's Rest） | 粮食、木材、香料市场。安全的起始海域。 |
| **North Atlantic** | 铁港（Ironhaven）、风暴之墙（Stormwall）、荆棘港（Thornport） | 铁矿、武器、军事贸易。严格的检查。 |
| **West Africa** | 阳光港（Sun Harbor）、棕榈湾（Palm Cove）、铁脊山（Iron Point）、珍珠浅滩（Pearl Shallows） | 棉花、朗姆酒、珍珠。最便宜的补给。 |
| **East Indies** | 玉石港（Jade Port）、季风海域（Monsoon Reach）、丝绸港（Silk Haven）、顺风岛（Crosswind Isle）、龙之门（Dragon's Gate）、香料狭道（Spice Narrows） | 丝绸、香料、瓷器、茶叶。最高的利润率。季风风险。 |
| **South Seas** | 火焰岛（Ember Isle）、台风锚地（Typhoon Anchorage）、珊瑚王座（Coral Throne） | 珍珠、药品。偏远的终局海域。 |

每个港口都有134个NPC。四个海盗派系控制不同的海域。季节性天气会影响危险和需求。文化层面包括节日、迷信和船员士气。

## 九位船长

| 船长 | 家 | 优势 | 权衡 |
|---------|------|------|-----------|
| **Merchant** | 波尔托诺沃（Porto Novo） | 更好的价格，信任增长迅速 | 海关检查惩罚加倍 |
| **Smuggler** | 海盗避风港（Corsair's Rest） | 黑市，走私贸易 | 更高的海关检查，更多检查 |
| **Navigator** | 季风海域（Monsoon Reach） | 更快的船，更远的航程 | 初始声誉较弱 |
| **Privateer** | 铁港（Ironhaven） | 海军战斗，登船优势 | 商人的声誉较差 |
| **Corsair** | 海盗避风港（Corsair's Rest） | 平衡的战斗 + 贸易 | 平庸 |
| **Scholar** | 玉石港（Jade Port） | 信息优势，更好的合同 | 资金不足，脆弱 |
| **Merchant Prince** | 波尔托诺沃（Porto Novo） | 较高的起始资金，高级权限 | 更高的费用，海盗目标 |
| **Dockhand** | 顺风岛（Crosswind Isle） | 最便宜的船员，精打细算 | 最低的起始资金 |
| **Bounty Hunter** | 风暴之墙（Stormwall） | 战斗精通，派系声誉 | 价格低廉，不受信任 |

## 快速开始

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
npx @mcptoolshop/portlight market
npx @mcptoolshop/portlight buy grain 10
npx @mcptoolshop/portlight routes
npx @mcptoolshop/portlight sail al_manar
npx @mcptoolshop/portlight advance
npx @mcptoolshop/portlight sell grain 10
npx @mcptoolshop/portlight milestones
```

## 系统

**经济** — 20个港口，18种商品，43条航线，价格受供需关系影响。洪水惩罚机制会惩罚低价倾销行为。区域需求调整器意味着每个港口都有明确的进出口特征。

**航行** — 多日航行，涉及天气、海盗遭遇、检查等。补给品每天消耗。船体会受到损伤。季节性危险区域会改变航线的安全性。

**合同** — 六个家族，以信任和声誉为基础。包括采购、缓解短缺、高端商品、回程货物、循环贸易以及帮派委托等。有真实的截止日期和真实的后果。

**声誉** — 四个维度：区域声誉、商业信誉、海关关注度以及地下世界关系。不同的船长会遵循不同的道德准则。

**战斗** — 个人战斗（姿势三角），包括7种近战武器和7种远程武器，以及区域性的战斗风格。海军战斗包括登船和使用火炮。

**海盗派系** — 猩红浪潮、铁狼、深礁兄弟会、季风集团。每个派系都有自己的领地、指定船长以及对你的态度。

**基础设施** — 仓库、经纪人办公室、许可证。需要实际维护。每个设施都会改变贸易的时机、规模或可访问性。

**金融** — 保险和信贷。具有实际约束力的杠杆。

**伙伴** — 五个军官角色，具有个性、士气以及离职触发条件。

**职业** — 27个里程碑。13个个人资料标签。四个胜利路径：合法贸易公司、影子网络、海洋霸权、商业帝国。

## 胜利路径

- **合法贸易公司** — 高信誉、优质合同、良好声誉、广泛的基础设施。
- **影子网络** — 在严格审查下进行高端商品贸易，注重风险管理，具有强大的运营能力。
- **海洋霸权** — 能够进入东印度群岛，拥有远距离的基础设施，精通航线。
- **商业帝国** — 遍布各地的基础设施，多元化的收入来源，强大的金融杠杆。

## 此软件包的工作原理

此npm软件包会从GitHub Releases下载适用于您平台的预构建Portlight二进制文件，并将其缓存在本地。无需安装Python。

| 注意事项 | 详细信息 |
|---------|--------|
| **Network** | 仅通过HTTPS访问`github.com` CDN |
| **Filesystem** | 仅使用用户缓存（`~/.cache/mcptoolshop/portlight/`） |
| **Verification** | 每次下载都进行SHA256校验和验证 |
| **Telemetry** | 无 |
| **Platforms** | Windows (x64)、macOS (x64/arm64)、Linux (x64) |

## 安全性

- 仅通过HTTPS从`github.com`下载二进制文件
- 每次下载都进行SHA256校验和验证
- 仅写入用户范围的缓存，不会修改系统目录
- 没有遥测数据，没有敏感信息，没有存储凭据
- 除了初始的二进制文件下载之外，没有网络访问

请参阅[SECURITY.md](SECURITY.md)以获取完整策略。

## 许可证

MIT

---

由<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>构建。
