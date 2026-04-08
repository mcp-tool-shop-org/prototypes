<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/feature-reacher/readme.png" alt="Feature-Reacher" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/feature-reacher/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**在功能成为技术债务之前，发现并利用未充分发挥的功能。**

Feature-Reacher 分析您的产品文档（发布说明、文档、常见问题解答），并生成一份“采用风险审计报告”，该报告是一个按风险等级排列的、基于证据的功能列表，列出了用户可能永远不会发现的功能。

---

## 这是什么

一个诊断工具，可以：
- 导入产品文档和发布说明
- 提取带有证据的功能描述
- 根据新旧程度、可见性和文档密度对功能进行评分
- 提供可执行的采用风险诊断

## 这不是什么

- 一个分析平台（不包含任何使用数据导入）
- 一个功能开关系统
- 一个连接到您的代码库的仪表盘
- 一个能够猜测用户需求的 AI 系统

这是一个“可解释的智能”系统——每个诊断都附带引用的证据和清晰的推理。

---

## 第一阶段的功能

- **文档上传**: 粘贴文本或上传 .txt/.md 文件
- **功能提取**: 标题、项目列表、重复的短语
- **评分规则**: 新旧程度衰减、可见性信号、文档密度
- **诊断引擎**: 6 种诊断类型，带有触发信号和证据
- **排序后的审计报告**: 功能按采用风险排序
- **操作建议**: 每个诊断都提供可复制的操作
- **导出**: 纯文本和可打印的 HTML 报告

## 第二阶段的改进（可重复性和持久性）

- **审计历史**: 所有审计都保存到 IndexedDB 中，支持浏览、重命名和删除
- **自动保存开关**: 运行一次审计，自动保存（或手动保存）
- **文档集合**: 命名集合，用于可重复的审计流程
- **审计比较**: 并排显示差异，显示新增/已解决的风险，以及诊断的变化
- **功能趋势**: 使用折线图可视化风险随时间的变化
- **管理层摘要**: 基于模板的摘要，用于与合作伙伴共享（不使用 AI）
- **测试套件**: Jest + ts-jest，包含安全测试

## 第三阶段的改进（可用于市场）

- **公共着陆页**: `/landing`，包含价值主张和行动号召
- **演示模式**: `/demo`，自动加载示例数据，提供即时体验
- **法律页面**: 隐私政策、服务条款、支持联系方式
- **数据处理面板**: 透明地显示本地存储信息，并提供清除选项
- **新手引导**: 4 步引导，帮助新用户入门
- **方法论页面**: `/methodology`，解释评分规则（不包含任何 AI 炒作）
- **错误处理**: 崩溃安全的用户体验，并提供诊断导出功能
- **辅助功能工具**: 键盘导航、ARIA 辅助功能、屏幕阅读器支持
- **市场推广素材**: 产品描述、PDF 文档、提交清单

## 此工具有意不执行以下操作

- 连接到分析平台
- 集成到 GitHub、Jira 或其他工具
- 使用机器学习模型进行功能检测
- 提供实时监控
- 需要身份验证或帐户
- 使用 AI 生成叙述（仅使用确定性模板）

这是设计上的选择。第三阶段证明了市场推广的准备情况，然后再添加集成。

---

## 入门

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

### 快速测试

1. 粘贴一些发布说明或文档
2. 点击“运行审计”
3. 审查排序后的功能列表
4. 展开功能以查看证据和建议
5. 导出报告

### 第二阶段的工作流程

**可重复性流程：**
1. 运行审计 → 自动保存到历史记录
2. 转到 `/history` 浏览已保存的审计
3. 保存文档集合，以便重复运行
4. 在 `/compare` 中比较两个审计
5. 在 `/trends` 中查看趋势

**与合作伙伴共享的流程：**
1. 运行审计 → 点击“导出”→“管理层摘要”
2. 或者比较两个审计 → “导出比较报告”

---

## 项目结构

```
/src/app       # Next.js app router pages
/src/domain    # Core feature model and business logic
/src/analysis  # Diagnostics, heuristics, scoring, diff, trend
/src/storage   # IndexedDB persistence layer
/src/ui        # Reusable UI components
/tests         # Jest test suite
/docs          # Project documentation
```

### 关键文件

- `src/domain/feature.ts` - 规范的特征模型
- `src/domain/diagnosis.ts` - 诊断类型和严重程度
- `src/analysis/extractor.ts` - 特征提取的启发式方法
- `src/analysis/scoring.ts` - 近期性和可见性评分
- `src/analysis/diagnose.ts` - 诊断引擎
- `src/analysis/ranking.ts` - 风险排序和审计报告生成
- `src/analysis/actions.ts` - 行为建议
- `src/analysis/export.ts` - 报告生成以及管理层摘要
- `src/analysis/diff.ts` - 审计比较引擎
- `src/analysis/trend.ts` - 特征趋势分析
- `src/storage/types.ts` - 持久化类型
- `src/storage/indexeddb.ts` - IndexedDB 接口实现

---

## 架构

```
Artifact Upload → Text Normalization → Feature Extraction
                                              ↓
                                       Evidence Linking
                                              ↓
                                    Heuristic Scoring
                                              ↓
                                    Diagnosis Generation
                                              ↓
                                      Risk Ranking
                                              ↓
                                    Audit Report + Actions
```

### 设计原则

1. **没有“魔法”**: 每一个诊断都可以通过引用证据进行解释。
2. **优先使用启发式方法**: 只有在启发式方法证明不足时，才使用机器学习。
3. **确定性**: 相同的输入始终产生相同的输出。
4. **透明性**: 用户可以追溯任何结论到其原始来源。

---

## 许可证

MIT

---

## 发布标签

```bash
git checkout phase-1-foundation    # Phase 1: Core diagnostic engine
git checkout phase-2-repeatability # Phase 2: Persistence, compare, trends
git checkout phase-3-marketplace   # Phase 3: Marketplace-ready packaging
git checkout phase-3.5-teams-tab   # Phase 3.5: Teams tab integration
```

## 运行测试

```bash
npm test
```

测试验证了安全机制：风险评分范围在 0-1 之间，审计 ID 格式正确，能够优雅地处理边界情况。
