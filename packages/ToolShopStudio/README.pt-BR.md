<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ToolShopStudio/readme.png" width="400" alt="ToolShopStudio">
</p>

<h1 align="center">ToolShopStudio</h1>

<p align="center">
  Seis ferramentas MCP de producao + Registro ao vivo — uma instalacao para criadores.
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.hi.md">हिन्दी</a> |
  <a href="README.it.md">Italiano</a> |
  <strong>Português</strong>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ToolShopStudio/actions"><img src="https://github.com/mcp-tool-shop-org/ToolShopStudio/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/toolshopstudio"><img src="https://img.shields.io/npm/v/@mcptoolshop/toolshopstudio" alt="npm version"></a>
  <img src="https://img.shields.io/badge/tools-FFmpeg%20%2B%20Pandoc%20%2B%20FreeCAD%20%2B%20GDAL%20%2B%20OpenSCAD%20%2B%20Blender-orange" alt="Tools">
  <img src="https://img.shields.io/badge/tests-318%20passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
</p>

---

## Ferramentas Incluidas

| Ferramenta | Funcao |
|------------|--------|
| **FFmpeg YouTube MCP** | Presets seguros para YouTube (garantido + premium com fallback), GOP fechado, miniaturas duplas |
| **Pandoc MCP** | Conversao de documentos sem flags: blog, PDF academico, ebook, slides, newsletter |
| **FreeCAD MCP** | Exportacao 3D CAD segura: STL, STEP, GLB, 3MF, OBJ — headless, sem codigo do usuario |
| **GDAL MCP** | Transformacoes geoespaciais: reprojecao raster, conversao vetorial, recorte de regioes — o FFmpeg do GIS |
| **OpenSCAD MCP** | CAD parametrico em texto puro: STL, OBJ, 3MF, preview PNG, DXF — texto entra, malha sai |
| **Blender MCP** | Renderizacao 3D headless: preview PNG, exportacao GLB, video, malha STL, Cycles — sem GUI |

As seis ferramentas compartilham a mesma superficie: **schema-first, sandbox, observavel, DI por contexto, zero argumentos brutos**.

## Registro ao Vivo

ToolShopStudio inclui um **registro autodocumentado** — consulte qualquer ferramenta, preset ou padrao.

```typescript
import { registry } from "@mcptoolshop/toolshopstudio";

registry.findTool("openscad");           // ToolDefinition completo
registry.searchByPreset("academic-pdf"); // → { toolId: "pandoc", ... }
registry.searchByOutputFormat("STL");    // → presets FreeCAD + OpenSCAD + Blender
registry.getAllPremiumPresets();          // → 9 cadeias premium→garantido
```

```bash
npm run toolshop registry list         # tabela de todas as ferramentas + contagem de presets
npm run toolshop registry show ffmpeg  # detalhes completos de uma ferramenta
npm run toolshop registry summary      # 6 ferramentas, 32 presets, 15 formatos
```

## Inicio Rapido

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

// ── FFmpeg: transcodificacao segura para YouTube ────────────────
const video = await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  { signal, userId, notify, createAsset, runFfmpeg, runProbe },
);

// ── Pandoc: conversao de documentos ─────────────────────────────
const doc = await pandoc.convertDocument(
  { inputPath: "thesis.md", outputPath: "thesis.pdf", preset: "academic-pdf" },
  { signal, userId, notify, createAsset, runPandoc, checkInput, assertOutput, statFile },
);

// ── FreeCAD: exportacao 3D CAD ──────────────────────────────────
const part = await freecad.exportPart(
  { inputPath: "bracket.FCStd", outputPath: "bracket.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runFreeCAD, checkInput, assertOutput, statFile },
);

// ── GDAL: transformacao geoespacial ─────────────────────────────
const geo = await gdal.transformGeo(
  { inputPath: "terrain.tif", outputPath: "terrain_wgs84.tif", preset: "raster-wgs84-tiff" },
  { signal, userId, notify, createAsset, runGDAL, checkInput, assertOutput, statFile },
);

// ── OpenSCAD: renderizacao CAD parametrico ──────────────────────
const model = await openscad.renderModel(
  { inputPath: "cube.scad", outputPath: "cube.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runOpenSCAD, checkInput, assertOutput, statFile },
);

// ── Blender: renderizacao 3D headless ───────────────────────────
const render = await blender.renderBlend(
  { inputPath: "scene.blend", outputPath: "render.png", preset: "png-preview" },
  { signal, userId, notify, createAsset, runBlender, checkInput, assertOutput, statFile },
);
```

## Arquitetura

- **Schema-first**: Schemas Zod para cada entrada/saida, totalmente tipado
- **Context DI**: Todos os efeitos colaterais injetados via objetos de contexto, 100% mockavel
- **Isolamento sandbox**: Prevencao de path traversal em cada operacao de arquivo
- **Observavel**: Notificacoes tipadas (progresso, avisos, pronto) em cada etapa
- **Cancelamento**: AbortController propagado a cada checkpoint do pipeline
- **Fallback**: Presets premium degradam automaticamente para garantido em caso de falha
- **Execucao segura**: FreeCAD usa one-liners Python preconstruidos (sem exec/eval/codigo do usuario)
- **Multi-binario**: GDAL despacha para gdalwarp, ogr2ogr ou gdal_translate conforme o preset
- **CAD baseado em texto**: OpenSCAD renderiza texto `.scad` puro em malha/imagem (sem entrada binaria)
- **Renderizacao 3D headless**: Blender roda sem GUI com expressoes Python preconstruidas para GLB/STL

## Docker

```bash
docker build -t toolshopstudio .
docker run -v ./sandbox:/sandbox toolshopstudio
```

Os seis binarios (`ffmpeg`, `pandoc`, `freecad-cmd`, `gdal-bin`, `openscad`, `blender`) estao pre-instalados na imagem.

## Desenvolvimento

```bash
npm install          # dependencias
npm run typecheck    # tsc --noEmit
npm test             # vitest (318 testes)
npm run build        # compilar para dist/
npm run smoke        # smoke end-to-end (6 ferramentas + registro, 15 testes)
```

## Licenca

MIT
