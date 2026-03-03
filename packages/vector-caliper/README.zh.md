<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/VectorCaliper/readme.png" alt="VectorCaliper" width="400"></p>

<p align="center"><strong>Scientific instrument for faithful model-state visualization — turns vector graphics into calibrated representations.</strong></p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcp-tool-shop/vector-caliper"><img src="https://img.shields.io/npm/v/@mcp-tool-shop/vector-caliper.svg" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-18%2B-brightgreen.svg" alt="node 18+"></a>
  <a href="https://mcp-tool-shop-org.github.io/VectorCaliper/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

VectorCaliper 可视化模型训练过程中的状态轨迹。每个可视化元素都对应一个已测量的变量。没有任何推断、平滑或建议。

> “显微镜，而非仪表盘。”

VectorCaliper 显示发生了什么。它永远不会告诉你这意味着什么。

---

## VectorCaliper 的作用

- 用于学习动态的测量工具
- 用于优化轨迹的几何调试器
- 用于检查训练状态演变的工具
- 从状态到可视化表示的确定性映射

## VectorCaliper 不具备的功能

- 训练仪表盘
- 优化器或推荐系统
- 健康监控器或异常检测器
- 超参数搜索工具

详情请参见 [docs/WHAT-VECTORCALIPER-IS-NOT.md](docs/WHAT-VECTORCALIPER-IS-NOT.md)。

---

## 核心保证 (v1)

VectorCaliper v1.x 提供语义冻结：

1. **确定性** — 相同的输入产生相同的输出
2. **无解释** — 可视化编码不包含任何含义
3. **真实降级** — 子集是精确的，而不是近似值
4. **明确限制** — 预算超限会导致拒绝，而不是静默降级

完整规范：[VECTORCALIPER_V1_GUARANTEES.md](VECTORCALIPER_V1_GUARANTEES.md)

---

## 最小示例

```typescript
import {
  createModelState,
  SemanticMapper,
  ProjectionEngine,
  SceneBuilder,
  SVGRenderer,
} from '@mcp-tool-shop/vector-caliper';

// Create state from measured values
const state = createModelState({
  time: 0,
  geometry: { effectiveDimension: 3.0, anisotropy: 1.5, spread: 5.0, density: 0.7 },
  uncertainty: { entropy: 1.2, margin: 0.6, calibration: 0.08 },
  performance: { accuracy: 0.92, loss: 0.08 },
});

// Project, build scene, render
const projector = new ProjectionEngine();
projector.fit([state]);
const builder = new SceneBuilder(new SemanticMapper());
builder.addState(state, projector.project(state));
const svg = new SVGRenderer({ width: 800, height: 600 }).render(builder.getScene());
```

---

## 标准演示

[demo/](demo/) 目录包含一个确定性演示生成器：

```bash
npx ts-node demo/canonical-demo.ts
```

输出：
- `demo/output/canonical-trajectory.json` — 500 个状态
- `demo/output/canonical-trajectory.svg` — 可视化结果
- `demo/output/canonical-manifest.json` — SHA256 校验和

运行两次并比较校验和以验证确定性。

---

## 适用对象

**研究人员** 需要调试训练动态，并且需要：
- 忠实的可视化，不带任何解释
- 可重复的输出，用于发表论文
- 关于显示内容的明确保证

**工程师** 需要检查模型状态演变，并且需要：
- 具有可扩展性的可视化（最多 100 万个状态）
- 框架无关的状态捕获
- 确定性的 CI 产出

不适用于：生产监控、自动化告警或超参数优化。

---

## 安装

```bash
npm install @mcp-tool-shop/vector-caliper
```

需要 Node.js 18+。

---

## 规模限制

VectorCaliper 强制执行明确的限制。超过这些限制会导致 **拒绝**，而不是静默降级。

| 规模等级 | 最大状态数 | 内存限制 | 渲染预算 |
|-------------|------------|--------------|---------------|
| 小型 | 1,000      | 50 MB | 16 毫秒/帧 |
| 中型 | 10,000     | 200 MB | 33 毫秒/帧 |
| 大型 | 100,000    | 500 MB | 66 毫秒/帧 |
| 极大型 | 1,000,000  | 1 GB | 100 毫秒/帧 |

---

## 文档

- [docs/README.md](docs/README.md) — 文档索引
- [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) — 框架集成
- [docs/HOW-STATE-BECOMES-VECTOR.md](docs/HOW-STATE-BECOMES-VECTOR.md) — 映射流水线

---

## 引用方法

如果您在学术工作中使用了 VectorCaliper：

**APA:**
> mcp-tool-shop. (2026). *VectorCaliper: A Geometrical Debugger for Learning Dynamics* (Version 1.0.0) [Software]. https://github.com/mcp-tool-shop-org/VectorCaliper

**BibTeX:**
```bibtex
@software{vectorcaliper2026,
  author = {mcp-tool-shop},
  title = {VectorCaliper: A Geometrical Debugger for Learning Dynamics},
  year = {2026},
  version = {1.0.0},
  url = {https://github.com/mcp-tool-shop-org/VectorCaliper}
}
```

请参见 [CITATION.cff](CITATION.cff) 以获取机器可读的元数据。

---

## 许可证

MIT。请参见 [LICENSE](LICENSE)。

---

## 状态

**v1.0.0** — 直到 2026 年 3 月 7 日，功能已冻结。请参见 [STOP.md](STOP.md)。

由 [MCP Tool Shop](https://mcp-tool-shop.github.io/) 构建。
