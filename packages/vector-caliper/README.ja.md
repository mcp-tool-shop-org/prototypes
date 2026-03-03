<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

VectorCaliperは、トレーニング中にモデルの状態の軌跡を可視化します。表示されるすべての要素は、測定された変数に由来します。推測されたもの、平滑化されたもの、または推奨されるものは何もありません。

> 「顕微鏡であり、ダッシュボードではない。」

VectorCaliperは、何が起こったかを示しますが、それが何を意味するのかを教えてくれることはありません。

---

## VectorCaliperとは

- 学習の動態を測定するための測定器
- 最適化の軌跡をデバッグするための幾何学的デバッガー
- トレーニング状態の進化を検査するためのツール
- 状態から視覚表現への決定論的なマッピング

## VectorCaliperではないもの

- トレーニングダッシュボード
- 最適化ツールまたは推奨システム
- ヘルスモニタまたは異常検知ツール
- ハイパーパラメータ探索ツール

詳細については、[docs/WHAT-VECTORCALIPER-IS-NOT.md](docs/WHAT-VECTORCALIPER-IS-NOT.md) を参照してください。

---

## 主要な保証事項 (v1)

VectorCaliper v1.x は、変更されない意味論を提供します。

1. **決定性** — 同じ入力に対しては、常に同じ出力が得られます。
2. **解釈の排除** — 視覚的な表現は、意味を暗示しません。
3. **正確な劣化** — 部分集合は正確であり、近似ではありません。
4. **明示的な制限** — 予算超過は、拒否として扱われ、静かに劣化することはありません。

詳細仕様: [VECTORCALIPER_V1_GUARANTEES.md](VECTORCALIPER_V1_GUARANTEES.md)

---

## 最小限の例

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

## 標準的なデモ

[demo/](demo/) ディレクトリには、決定論的なデモジェネレーターが含まれています。

```bash
npx ts-node demo/canonical-demo.ts
```

出力:
- `demo/output/canonical-trajectory.json` — 500の状態
- `demo/output/canonical-trajectory.svg` — 可視化
- `demo/output/canonical-manifest.json` — SHA256 チェックサム

2回実行し、チェックサムを比較して、決定性を検証してください。

---

## 対象ユーザー

**研究者**：トレーニングの動態をデバッグする必要があり、次のようなものを必要とする方：
- 意味を解釈せずに、忠実な可視化
- 論文のための再現可能な出力
- 表示されるものに関する明確な保証

**エンジニア**：モデルの状態の進化を検査する必要があり、次のようなものを必要とする方：
- スケールを考慮した可視化（最大100万の状態まで）
- フレームワークに依存しない状態の取得
- 決定論的な CI アーティファクト

対象外：プロダクションモニタリング、自動アラート、またはハイパーパラメータ最適化。

---

## インストール

```bash
npm install @mcp-tool-shop/vector-caliper
```

Node.js 18+ が必要です。

---

## スケール制限

VectorCaliper は、明示的な制限を設けています。制限を超えると、**拒否**され、静かに劣化することはありません。

| スケールクラス | 最大状態数 | メモリ制限 | レンダリング予算 |
|-------------|------------|--------------|---------------|
| small | 1,000      | 50 MB | 16ms/フレーム |
| medium | 10,000     | 200 MB | 33ms/フレーム |
| large | 100,000    | 500 MB | 66ms/フレーム |
| extreme | 1,000,000  | 1 GB | 100ms/フレーム |

---

## ドキュメント

- [docs/README.md](docs/README.md) — ドキュメントインデックス
- [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) — フレームワーク統合
- [docs/HOW-STATE-BECOMES-VECTOR.md](docs/HOW-STATE-BECOMES-VECTOR.md) — マッピングパイプライン

---

## 引用方法

VectorCaliperを学術論文で使用する場合：

**APA:**
> mcp-tool-shop. (2026). *VectorCaliper: A Geometrical Debugger for Learning Dynamics* (Version 1.0.0) [ソフトウェア]. https://github.com/mcp-tool-shop-org/VectorCaliper

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

機械可読メタデータについては、[CITATION.cff](CITATION.cff) を参照してください。

---

## ライセンス

MIT。 [LICENSE](LICENSE) を参照してください。

---

## ステータス

**v1.0.0** — 2026年3月7日まで、機能の変更は凍結されています。 [STOP.md](STOP.md) を参照してください。

[MCP Tool Shop](https://mcp-tool-shop.github.io/) によって作成されました。
