<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ToolShopStudio/readme.png" width="400" alt="ToolShopStudio">
</p>

<h1 align="center">ToolShopStudio</h1>

<p align="center">
  Sei strumenti MCP di produzione + Registro live — un'unica installazione per creatori.
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.hi.md">हिन्दी</a> |
  <strong>Italiano</strong> |
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

## Strumenti Inclusi

| Strumento | Funzione |
|-----------|----------|
| **FFmpeg YouTube MCP** | Preset sicuri per YouTube (garantito + premium con fallback), GOP chiuso, doppia miniatura |
| **Pandoc MCP** | Conversione documenti senza flag: blog, PDF accademico, ebook, slide, newsletter |
| **FreeCAD MCP** | Esportazione 3D CAD sicura: STL, STEP, GLB, 3MF, OBJ — headless, nessun codice utente |
| **GDAL MCP** | Trasformazioni geospaziali: riproiezione raster, conversione vettoriale, ritaglio regioni — l'FFmpeg del GIS |
| **OpenSCAD MCP** | CAD parametrico in testo puro: STL, OBJ, 3MF, anteprima PNG, DXF — testo in entrata, mesh in uscita |
| **Blender MCP** | Rendering 3D headless: anteprima PNG, export GLB, video, mesh STL, Cycles — senza interfaccia |

Tutti e sei gli strumenti condividono la stessa superficie: **schema-first, sandbox, osservabile, DI per contesto, zero argomenti grezzi**.

## Registro Live

ToolShopStudio include un **registro autodocumentato** — interroga qualsiasi strumento, preset o pattern.

```typescript
import { registry } from "@mcptoolshop/toolshopstudio";

registry.findTool("openscad");           // ToolDefinition completo
registry.searchByPreset("academic-pdf"); // → { toolId: "pandoc", ... }
registry.searchByOutputFormat("STL");    // → preset FreeCAD + OpenSCAD + Blender
registry.getAllPremiumPresets();          // → 9 catene premium→garantito
```

```bash
npm run toolshop registry list         # tabella di tutti gli strumenti + conteggio preset
npm run toolshop registry show ffmpeg  # dettagli completi per uno strumento
npm run toolshop registry summary      # 6 strumenti, 32 preset, 15 formati
```

## Avvio Rapido

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

// ── FFmpeg: transcodifica sicura per YouTube ────────────────────
const video = await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  { signal, userId, notify, createAsset, runFfmpeg, runProbe },
);

// ── Pandoc: conversione documenti ───────────────────────────────
const doc = await pandoc.convertDocument(
  { inputPath: "thesis.md", outputPath: "thesis.pdf", preset: "academic-pdf" },
  { signal, userId, notify, createAsset, runPandoc, checkInput, assertOutput, statFile },
);

// ── FreeCAD: esportazione 3D CAD ────────────────────────────────
const part = await freecad.exportPart(
  { inputPath: "bracket.FCStd", outputPath: "bracket.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runFreeCAD, checkInput, assertOutput, statFile },
);

// ── GDAL: trasformazione geospaziale ────────────────────────────
const geo = await gdal.transformGeo(
  { inputPath: "terrain.tif", outputPath: "terrain_wgs84.tif", preset: "raster-wgs84-tiff" },
  { signal, userId, notify, createAsset, runGDAL, checkInput, assertOutput, statFile },
);

// ── OpenSCAD: rendering CAD parametrico ─────────────────────────
const model = await openscad.renderModel(
  { inputPath: "cube.scad", outputPath: "cube.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runOpenSCAD, checkInput, assertOutput, statFile },
);

// ── Blender: rendering 3D headless ──────────────────────────────
const render = await blender.renderBlend(
  { inputPath: "scene.blend", outputPath: "render.png", preset: "png-preview" },
  { signal, userId, notify, createAsset, runBlender, checkInput, assertOutput, statFile },
);
```

## Architettura

- **Schema-first**: Schemi Zod per ogni input/output, completamente tipizzato
- **Context DI**: Tutti gli effetti collaterali iniettati tramite oggetti di contesto, 100% mockabile
- **Isolamento sandbox**: Prevenzione path traversal su ogni operazione file
- **Osservabile**: Notifiche tipizzate (progresso, avvertimenti, pronto) ad ogni fase
- **Cancellazione**: AbortController propagato ad ogni checkpoint della pipeline
- **Fallback**: I preset premium degradano automaticamente a garantito in caso di errore
- **Esecuzione sicura**: FreeCAD usa one-liner Python precostituiti (nessun exec/eval/codice utente)
- **Multi-binario**: GDAL dispatcha verso gdalwarp, ogr2ogr o gdal_translate in base al preset
- **CAD basato su testo**: OpenSCAD renderizza testo `.scad` puro in mesh/immagine (nessun input binario)
- **Rendering 3D headless**: Blender gira senza GUI con espressioni Python precostuite per GLB/STL

## Docker

```bash
docker build -t toolshopstudio .
docker run -v ./sandbox:/sandbox toolshopstudio
```

Tutti e sei i binari (`ffmpeg`, `pandoc`, `freecad-cmd`, `gdal-bin`, `openscad`, `blender`) sono preinstallati nell'immagine.

## Sviluppo

```bash
npm install          # dipendenze
npm run typecheck    # tsc --noEmit
npm test             # vitest (318 test)
npm run build        # compilare in dist/
npm run smoke        # smoke end-to-end (6 strumenti + registro, 15 test)
```

## Licenza

MIT
