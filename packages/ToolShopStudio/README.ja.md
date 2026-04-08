<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ToolShopStudio/readme.png" width="400" alt="ToolShopStudio">
</p>

<h1 align="center">ToolShopStudio</h1>

<p align="center">
  6本のMCPツール + ライブレジストリ — クリエイター向け1回のインストール。
</p>

<p align="center">
  <a href="README.md">English</a> |
  <strong>日本語</strong> |
  <a href="README.zh.md">中文</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.hi.md">हिन्दी</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ToolShopStudio/actions"><img src="https://github.com/mcp-tool-shop-org/ToolShopStudio/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/toolshopstudio"><img src="https://img.shields.io/npm/v/@mcptoolshop/toolshopstudio" alt="npm version"></a>
  <img src="https://img.shields.io/badge/tools-FFmpeg%20%2B%20Pandoc%20%2B%20FreeCAD%20%2B%20GDAL%20%2B%20OpenSCAD%20%2B%20Blender-orange" alt="Tools">
  <img src="https://img.shields.io/badge/tests-318%20passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
</p>

---

## 搭載ツール

| ツール | 機能 |
|--------|------|
| **FFmpeg YouTube MCP** | YouTube安全プリセット（保証+プレミアム自動フォールバック）、クローズドGOP、デュアルサムネイル |
| **Pandoc MCP** | フラグ不要のドキュメント変換：ブログ、学術PDF、電子書籍、スライド、ニュースレター |
| **FreeCAD MCP** | 安全な3D CADエクスポート：STL, STEP, GLB, 3MF, OBJ — ヘッドレス、ユーザーコード不要 |
| **GDAL MCP** | 地理空間変換：ラスター再投影、ベクター変換、領域クリップ — GISのFFmpeg |
| **OpenSCAD MCP** | 純テキスト パラメトリック CAD：STL, OBJ, 3MF, PNGプレビュー, DXF — テキスト入力、メッシュ出力 |
| **Blender MCP** | ヘッドレス3Dレンダリング：PNGプレビュー、GLBエクスポート、動画、STLメッシュ、Cycles — GUI不要 |

6つのツールすべてが同じ設計原則を共有：**スキーマファースト、サンドボックス化、監視可能、コンテキストDI、生引数なし**。

## ライブレジストリ

ToolShopStudioには**自己文書化レジストリ**が含まれています — ツール、プリセット、パターンについて何でも照会できます。

```typescript
import { registry } from "@mcptoolshop/toolshopstudio";

registry.findTool("openscad");           // ToolDefinition全体
registry.searchByPreset("academic-pdf"); // → { toolId: "pandoc", ... }
registry.searchByOutputFormat("STL");    // → FreeCAD + OpenSCAD + Blenderプリセット
registry.getAllPremiumPresets();          // → 9本のpremium→保証フォールバックチェーン
```

```bash
npm run toolshop registry list         # 全ツール + プリセット数のテーブル
npm run toolshop registry show ffmpeg  # 1ツールの詳細
npm run toolshop registry summary      # 6ツール、32プリセット、15フォーマット
```

## クイックスタート

```bash
npm install @mcptoolshop/toolshopstudio
```

```typescript
import {
  transcodeForYouTube,
  createInMemoryCRUD,
  pandoc,
  freecad,
  gdal,
  openscad,
  blender,
} from "@mcptoolshop/toolshopstudio";

// ── FFmpeg: YouTube安全トランスコード ──────────────────────────
const video = await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  { signal, userId, notify, createAsset, runFfmpeg, runProbe },
);

// ── Pandoc: ドキュメント変換 ─────────────────────────────────────
const doc = await pandoc.convertDocument(
  { inputPath: "thesis.md", outputPath: "thesis.pdf", preset: "academic-pdf" },
  { signal, userId, notify, createAsset, runPandoc, checkInput, assertOutput, statFile },
);

// ── FreeCAD: 3D CADエクスポート ──────────────────────────────────
const part = await freecad.exportPart(
  { inputPath: "bracket.FCStd", outputPath: "bracket.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runFreeCAD, checkInput, assertOutput, statFile },
);

// ── GDAL: 地理空間変換 ──────────────────────────────────────────
const geo = await gdal.transformGeo(
  { inputPath: "terrain.tif", outputPath: "terrain_wgs84.tif", preset: "raster-wgs84-tiff" },
  { signal, userId, notify, createAsset, runGDAL, checkInput, assertOutput, statFile },
);

// ── OpenSCAD: パラメトリックCADレンダリング ─────────────────────
const model = await openscad.renderModel(
  { inputPath: "cube.scad", outputPath: "cube.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runOpenSCAD, checkInput, assertOutput, statFile },
);

// ── Blender: ヘッドレス3Dレンダリング ──────────────────────────
const render = await blender.renderBlend(
  { inputPath: "scene.blend", outputPath: "render.png", preset: "png-preview" },
  { signal, userId, notify, createAsset, runBlender, checkInput, assertOutput, statFile },
);
```

## アーキテクチャ

- **スキーマファースト**: すべての入出力にZodスキーマ、完全な型安全性
- **コンテキストDI**: すべての副作用をコンテキストオブジェクトで注入、100%モック可能
- **サンドボックス分離**: すべてのファイル操作でパストラバーサル防止
- **監視可能**: すべてのステージで型付き通知（進捗、警告、完了）
- **キャンセル対応**: AbortControllerをパイプラインの全チェックポイントに伝播
- **フォールバック**: プレミアムプリセットは失敗時に保証プリセットに自動降格
- **安全な実行**: FreeCADは事前構築されたPythonワンライナーを使用（exec/eval/ユーザーコードなし）
- **マルチバイナリ**: GDALはプリセットごとにgdalwarp, ogr2ogr, gdal_translateに振り分け
- **テキストファーストCAD**: OpenSCADは純粋な`.scad`テキストをメッシュ/画像にレンダリング（バイナリ入力なし）
- **ヘッドレス3Dレンダリング**: BlenderはGLB/STLエクスポート用の事前構築されたPython式でGUIなし実行

## Docker

```bash
docker build -t toolshopstudio .
docker run -v ./sandbox:/sandbox toolshopstudio
```

6つのランタイムバイナリ（`ffmpeg`, `pandoc`, `freecad-cmd`, `gdal-bin`, `openscad`, `blender`）がイメージにプリインストール済み。

## 開発

```bash
npm install          # 依存関係
npm run typecheck    # tsc --noEmit
npm test             # vitest（318テスト）
npm run build        # dist/にコンパイル
npm run smoke        # エンドツーエンドスモーク（6ツール + レジストリ、15テスト）
```

## ライセンス

MIT
