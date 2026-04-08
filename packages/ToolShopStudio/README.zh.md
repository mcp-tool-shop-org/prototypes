<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ToolShopStudio/readme.png" width="400" alt="ToolShopStudio">
</p>

<h1 align="center">ToolShopStudio</h1>

<p align="center">
  六款生产级 MCP 工具 + 实时注册表 — 一次安装，为普通创作者而生。
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.ja.md">日本語</a> |
  <strong>中文</strong> |
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

## 已搭载工具

| 工具 | 功能 |
|------|------|
| **FFmpeg YouTube MCP** | YouTube 安全预设（保证级 + 高级自动降级）、封闭 GOP、双缩略图 |
| **Pandoc MCP** | 零参数文档转换：博客、学术 PDF、电子书、幻灯片、邮件通讯 |
| **FreeCAD MCP** | 安全 3D CAD 导出：STL、STEP、GLB、3MF、OBJ — 无头模式、无用户代码 |
| **GDAL MCP** | 地理空间变换：栅格重投影、矢量转换、区域裁剪 — GIS 领域的 FFmpeg |
| **OpenSCAD MCP** | 纯文本参数化 CAD：STL、OBJ、3MF、PNG 预览、DXF — 文本输入，网格输出 |
| **Blender MCP** | 无头 3D 渲染：PNG 预览、GLB 导出、视频、STL 网格、Cycles — 无需 GUI |

六款工具共享同一设计理念：**模式优先、沙箱隔离、可观测、上下文依赖注入、零原始参数**。

## 实时注册表

ToolShopStudio 内置**自文档化注册表** — 可查询任意工具、预设或模式。

```typescript
import { registry } from "@mcptoolshop/toolshopstudio";

registry.findTool("openscad");           // 完整 ToolDefinition
registry.searchByPreset("academic-pdf"); // → { toolId: "pandoc", ... }
registry.searchByOutputFormat("STL");    // → FreeCAD + OpenSCAD + Blender 预设
registry.getAllPremiumPresets();          // → 9 条高级→保证降级链
```

```bash
npm run toolshop registry list         # 所有工具 + 预设数量表格
npm run toolshop registry show ffmpeg  # 某一工具的完整详情
npm run toolshop registry summary      # 6 个工具，32 个预设，15 种格式
```

## 快速开始

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

// ── FFmpeg: YouTube 安全转码 ────────────────────────────────────
const video = await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  { signal, userId, notify, createAsset, runFfmpeg, runProbe },
);

// ── Pandoc: 文档转换 ────────────────────────────────────────────
const doc = await pandoc.convertDocument(
  { inputPath: "thesis.md", outputPath: "thesis.pdf", preset: "academic-pdf" },
  { signal, userId, notify, createAsset, runPandoc, checkInput, assertOutput, statFile },
);

// ── FreeCAD: 3D CAD 导出 ────────────────────────────────────────
const part = await freecad.exportPart(
  { inputPath: "bracket.FCStd", outputPath: "bracket.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runFreeCAD, checkInput, assertOutput, statFile },
);

// ── GDAL: 地理空间变换 ──────────────────────────────────────────
const geo = await gdal.transformGeo(
  { inputPath: "terrain.tif", outputPath: "terrain_wgs84.tif", preset: "raster-wgs84-tiff" },
  { signal, userId, notify, createAsset, runGDAL, checkInput, assertOutput, statFile },
);

// ── OpenSCAD: 参数化 CAD 渲染 ───────────────────────────────────
const model = await openscad.renderModel(
  { inputPath: "cube.scad", outputPath: "cube.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runOpenSCAD, checkInput, assertOutput, statFile },
);

// ── Blender: 无头 3D 渲染 ───────────────────────────────────────
const render = await blender.renderBlend(
  { inputPath: "scene.blend", outputPath: "render.png", preset: "png-preview" },
  { signal, userId, notify, createAsset, runBlender, checkInput, assertOutput, statFile },
);
```

## 架构

- **模式优先**: 所有输入输出使用 Zod 模式，完全类型安全
- **上下文 DI**: 通过上下文对象注入所有副作用，100% 可模拟
- **沙箱隔离**: 每次文件操作均防止路径穿越
- **可观测**: 每个阶段提供类型化通知（进度、警告、就绪）
- **取消支持**: AbortController 传播至每个管道检查点
- **降级**: 高级预设在失败时自动降级为保证级预设
- **安全执行**: FreeCAD 使用预构建的 Python 单行命令（无 exec/eval/用户代码）
- **多二进制**: GDAL 按预设分派到 gdalwarp、ogr2ogr 或 gdal_translate
- **文本优先 CAD**: OpenSCAD 将纯 `.scad` 文本渲染为网格/图像（无二进制输入）
- **无头 3D 渲染**: Blender 使用预构建的 Python 表达式无 GUI 运行，用于 GLB/STL 导出

## Docker

```bash
docker build -t toolshopstudio .
docker run -v ./sandbox:/sandbox toolshopstudio
```

六个运行时二进制文件（`ffmpeg`、`pandoc`、`freecad-cmd`、`gdal-bin`、`openscad`、`blender`）已预装在镜像中。

## 开发

```bash
npm install          # 安装依赖
npm run typecheck    # tsc --noEmit
npm test             # vitest（318 个测试）
npm run build        # 编译到 dist/
npm run smoke        # 端到端冒烟测试（6 款工具 + 注册表，15 个测试）
```

## 许可证

MIT
