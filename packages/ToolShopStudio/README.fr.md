<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ToolShopStudio/readme.png" width="400" alt="ToolShopStudio">
</p>

<h1 align="center">ToolShopStudio</h1>

<p align="center">
  Six outils MCP de production + Registre en direct — une seule installation pour les createurs.
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文</a> |
  <a href="README.es.md">Español</a> |
  <strong>Français</strong> |
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

## Outils Inclus

| Outil | Fonction |
|-------|----------|
| **FFmpeg YouTube MCP** | Presets YouTube (garanti + premium avec fallback), GOP ferme, double miniature |
| **Pandoc MCP** | Conversion de documents sans flags : blog, PDF academique, ebook, slides, newsletter |
| **FreeCAD MCP** | Export 3D CAD securise : STL, STEP, GLB, 3MF, OBJ — headless, sans code utilisateur |
| **GDAL MCP** | Transformations geospatiales : reprojection raster, conversion vectorielle, decoupage de regions — le FFmpeg du SIG |
| **OpenSCAD MCP** | CAD parametrique en texte pur : STL, OBJ, 3MF, apercu PNG, DXF — texte en entree, mesh en sortie |
| **Blender MCP** | Rendu 3D headless : apercu PNG, export GLB, video, mesh STL, Cycles — sans interface |

Les six outils partagent la meme surface : **schema-first, sandbox, observable, DI par contexte, zero arguments bruts**.

## Registre en Direct

ToolShopStudio inclut un **registre autodocumente** — interrogez n'importe quel outil, preset ou motif.

```typescript
import { registry } from "@mcptoolshop/toolshopstudio";

registry.findTool("openscad");           // ToolDefinition complet
registry.searchByPreset("academic-pdf"); // → { toolId: "pandoc", ... }
registry.searchByOutputFormat("STL");    // → presets FreeCAD + OpenSCAD + Blender
registry.getAllPremiumPresets();          // → 9 chaines premium→garanti
```

```bash
npm run toolshop registry list         # tableau de tous les outils + nombre de presets
npm run toolshop registry show ffmpeg  # details complets pour un outil
npm run toolshop registry summary      # 6 outils, 32 presets, 15 formats
```

## Demarrage Rapide

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

// ── FFmpeg : transcodage YouTube ────────────────────────────────
const video = await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  { signal, userId, notify, createAsset, runFfmpeg, runProbe },
);

// ── Pandoc : conversion de documents ────────────────────────────
const doc = await pandoc.convertDocument(
  { inputPath: "thesis.md", outputPath: "thesis.pdf", preset: "academic-pdf" },
  { signal, userId, notify, createAsset, runPandoc, checkInput, assertOutput, statFile },
);

// ── FreeCAD : export 3D CAD ─────────────────────────────────────
const part = await freecad.exportPart(
  { inputPath: "bracket.FCStd", outputPath: "bracket.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runFreeCAD, checkInput, assertOutput, statFile },
);

// ── GDAL : transformation geospatiale ───────────────────────────
const geo = await gdal.transformGeo(
  { inputPath: "terrain.tif", outputPath: "terrain_wgs84.tif", preset: "raster-wgs84-tiff" },
  { signal, userId, notify, createAsset, runGDAL, checkInput, assertOutput, statFile },
);

// ── OpenSCAD : rendu CAD parametrique ───────────────────────────
const model = await openscad.renderModel(
  { inputPath: "cube.scad", outputPath: "cube.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runOpenSCAD, checkInput, assertOutput, statFile },
);

// ── Blender : rendu 3D headless ─────────────────────────────────
const render = await blender.renderBlend(
  { inputPath: "scene.blend", outputPath: "render.png", preset: "png-preview" },
  { signal, userId, notify, createAsset, runBlender, checkInput, assertOutput, statFile },
);
```

## Architecture

- **Schema-first** : Schemas Zod pour chaque entree/sortie, entierement type
- **Context DI** : Tous les effets de bord injectes via des objets de contexte, 100% mockable
- **Isolation sandbox** : Prevention de path traversal sur chaque operation fichier
- **Observable** : Notifications typees (progression, avertissements, pret) a chaque etape
- **Annulation** : AbortController propage a chaque checkpoint du pipeline
- **Fallback** : Les presets premium se degradent automatiquement en garanti en cas d'echec
- **Execution securisee** : FreeCAD utilise des one-liners Python preconstruits (pas d'exec/eval/code utilisateur)
- **Multi-binaire** : GDAL dispatche vers gdalwarp, ogr2ogr ou gdal_translate selon le preset
- **CAD base sur le texte** : OpenSCAD rend du texte `.scad` pur en mesh/image (pas d'entree binaire)
- **Rendu 3D headless** : Blender tourne sans GUI avec des expressions Python preconstruites pour GLB/STL

## Docker

```bash
docker build -t toolshopstudio .
docker run -v ./sandbox:/sandbox toolshopstudio
```

Les six binaires (`ffmpeg`, `pandoc`, `freecad-cmd`, `gdal-bin`, `openscad`, `blender`) sont preinstalles dans l'image.

## Developpement

```bash
npm install          # dependances
npm run typecheck    # tsc --noEmit
npm test             # vitest (318 tests)
npm run build        # compiler vers dist/
npm run smoke        # smoke end-to-end (6 outils + registre, 15 tests)
```

## Licence

MIT
