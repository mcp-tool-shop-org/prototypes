<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ToolShopStudio/readme.png" width="400" alt="ToolShopStudio">
</p>

<h1 align="center">ToolShopStudio</h1>

<p align="center">
  Seis herramientas MCP de produccion + Registro en vivo — una sola instalacion para creadores.
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文</a> |
  <strong>Español</strong> |
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

## Herramientas Incluidas

| Herramienta | Funcion |
|-------------|---------|
| **FFmpeg YouTube MCP** | Presets seguros para YouTube (garantizado + premium con fallback), GOP cerrado, miniaturas duales |
| **Pandoc MCP** | Conversion de documentos sin flags: blog, PDF academico, ebook, slides, newsletter |
| **FreeCAD MCP** | Exportacion 3D CAD segura: STL, STEP, GLB, 3MF, OBJ — sin interfaz, sin codigo de usuario |
| **GDAL MCP** | Transformaciones geoespaciales: reproyeccion raster, conversion vectorial, recorte de regiones — el FFmpeg del GIS |
| **OpenSCAD MCP** | CAD parametrico en texto puro: STL, OBJ, 3MF, vista previa PNG, DXF — texto entra, malla sale |
| **Blender MCP** | Renderizado 3D headless: vista previa PNG, exportacion GLB, video, malla STL, Cycles — sin GUI |

Las seis herramientas comparten la misma superficie: **schema-first, sandbox, observable, DI por contexto, cero argumentos crudos**.

## Registro en Vivo

ToolShopStudio incluye un **registro autodocumentado** — consulta cualquier herramienta, preset o patron.

```typescript
import { registry } from "@mcptoolshop/toolshopstudio";

registry.findTool("openscad");           // ToolDefinition completo
registry.searchByPreset("academic-pdf"); // → { toolId: "pandoc", ... }
registry.searchByOutputFormat("STL");    // → presets de FreeCAD + OpenSCAD + Blender
registry.getAllPremiumPresets();          // → 9 cadenas premium→garantizado
```

```bash
npm run toolshop registry list         # tabla de todas las herramientas + cantidad de presets
npm run toolshop registry show ffmpeg  # detalles completos de una herramienta
npm run toolshop registry summary      # 6 herramientas, 32 presets, 15 formatos
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

// ── FFmpeg: transcodificacion segura para YouTube ───────────────
const video = await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  { signal, userId, notify, createAsset, runFfmpeg, runProbe },
);

// ── Pandoc: conversion de documentos ────────────────────────────
const doc = await pandoc.convertDocument(
  { inputPath: "thesis.md", outputPath: "thesis.pdf", preset: "academic-pdf" },
  { signal, userId, notify, createAsset, runPandoc, checkInput, assertOutput, statFile },
);

// ── FreeCAD: exportacion 3D CAD ─────────────────────────────────
const part = await freecad.exportPart(
  { inputPath: "bracket.FCStd", outputPath: "bracket.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runFreeCAD, checkInput, assertOutput, statFile },
);

// ── GDAL: transformacion geoespacial ────────────────────────────
const geo = await gdal.transformGeo(
  { inputPath: "terrain.tif", outputPath: "terrain_wgs84.tif", preset: "raster-wgs84-tiff" },
  { signal, userId, notify, createAsset, runGDAL, checkInput, assertOutput, statFile },
);

// ── OpenSCAD: renderizado CAD parametrico ───────────────────────
const model = await openscad.renderModel(
  { inputPath: "cube.scad", outputPath: "cube.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runOpenSCAD, checkInput, assertOutput, statFile },
);

// ── Blender: renderizado 3D headless ────────────────────────────
const render = await blender.renderBlend(
  { inputPath: "scene.blend", outputPath: "render.png", preset: "png-preview" },
  { signal, userId, notify, createAsset, runBlender, checkInput, assertOutput, statFile },
);
```

## Arquitectura

- **Schema-first**: Esquemas Zod para cada entrada/salida, totalmente tipado
- **Context DI**: Todos los efectos secundarios inyectados via objetos de contexto, 100% mockeable
- **Aislamiento sandbox**: Prevencion de path traversal en cada operacion de archivo
- **Observable**: Notificaciones tipadas (progreso, advertencias, listo) en cada etapa
- **Cancelacion**: AbortController propagado a cada checkpoint del pipeline
- **Fallback**: Los presets premium degradan automaticamente a garantizado en caso de fallo
- **Ejecucion segura**: FreeCAD usa one-liners Python preconstruidos (sin exec/eval/codigo de usuario)
- **Multi-binario**: GDAL despacha a gdalwarp, ogr2ogr o gdal_translate segun el preset
- **CAD basado en texto**: OpenSCAD renderiza texto `.scad` puro a malla/imagen (sin entrada binaria)
- **Renderizado 3D headless**: Blender corre sin GUI con expresiones Python preconstruidas para GLB/STL

## Docker

```bash
docker build -t toolshopstudio .
docker run -v ./sandbox:/sandbox toolshopstudio
```

Los seis binarios (`ffmpeg`, `pandoc`, `freecad-cmd`, `gdal-bin`, `openscad`, `blender`) vienen preinstalados en la imagen.

## Desarrollo

```bash
npm install          # dependencias
npm run typecheck    # tsc --noEmit
npm test             # vitest (318 tests)
npm run build        # compilar a dist/
npm run smoke        # smoke end-to-end (6 herramientas + registro, 15 tests)
```

## Licencia

MIT
