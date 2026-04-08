<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ToolShopStudio/readme.png" width="400" alt="ToolShopStudio">
</p>

<h1 align="center">ToolShopStudio</h1>

<p align="center">
  छह प्रोडक्शन-ग्रेड MCP टूल्स + लाइव रजिस्ट्री — क्रिएटर्स के लिए एक इंस्टॉल।
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.zh.md">中文</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <strong>हिन्दी</strong> |
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

## शामिल टूल्स

| टूल | कार्य |
|------|-------|
| **FFmpeg YouTube MCP** | YouTube-सुरक्षित प्रीसेट (गारंटीड + प्रीमियम ऑटो-फ़ॉलबैक), क्लोज़्ड-GOP, दोहरे थंबनेल |
| **Pandoc MCP** | ज़ीरो-फ़्लैग डॉक्यूमेंट कन्वर्ज़न: ब्लॉग, एकेडमिक PDF, ebook, स्लाइड्स, न्यूज़लेटर |
| **FreeCAD MCP** | सुरक्षित 3D CAD एक्सपोर्ट: STL, STEP, GLB, 3MF, OBJ — हेडलेस, यूज़र कोड नहीं |
| **GDAL MCP** | भू-स्थानिक ट्रांसफ़ॉर्म: रैस्टर री-प्रोजेक्शन, वेक्टर कन्वर्ज़न, रीजन क्लिप — GIS का FFmpeg |
| **OpenSCAD MCP** | शुद्ध-टेक्स्ट पैरामेट्रिक CAD: STL, OBJ, 3MF, PNG प्रीव्यू, DXF — टेक्स्ट इन, मेश आउट |
| **Blender MCP** | हेडलेस 3D रेंडरिंग: PNG प्रीव्यू, GLB एक्सपोर्ट, वीडियो, STL मेश, Cycles — कोई GUI नहीं |

सभी छह टूल्स एक ही डिज़ाइन साझा करते हैं: **स्कीमा-फ़र्स्ट, सैंडबॉक्स्ड, ऑब्ज़र्वेबल, कॉन्टेक्स्ट DI, ज़ीरो रॉ आर्ग्स**।

## लाइव रजिस्ट्री

ToolShopStudio में एक **स्व-दस्तावेज़ीकरण रजिस्ट्री** शामिल है — किसी भी टूल, प्रीसेट या पैटर्न के बारे में पूछें।

```typescript
import { registry } from "@mcptoolshop/toolshopstudio";

registry.findTool("openscad");           // पूर्ण ToolDefinition
registry.searchByPreset("academic-pdf"); // → { toolId: "pandoc", ... }
registry.searchByOutputFormat("STL");    // → FreeCAD + OpenSCAD + Blender प्रीसेट
registry.getAllPremiumPresets();          // → 9 premium→गारंटीड फ़ॉलबैक चेन
```

```bash
npm run toolshop registry list         # सभी टूल्स + प्रीसेट काउंट की तालिका
npm run toolshop registry show ffmpeg  # एक टूल की पूरी जानकारी
npm run toolshop registry summary      # 6 टूल्स, 32 प्रीसेट, 15 फ़ॉर्मेट
```

## त्वरित शुरुआत

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

// ── FFmpeg: YouTube-सुरक्षित ट्रांसकोड ─────────────────────────
const video = await transcodeForYouTube(
  { inputPath: "input.mp4", outputPath: "output.mp4", preset: "yt-1080p-h264" },
  { signal, userId, notify, createAsset, runFfmpeg, runProbe },
);

// ── Pandoc: डॉक्यूमेंट कन्वर्ज़न ───────────────────────────────
const doc = await pandoc.convertDocument(
  { inputPath: "thesis.md", outputPath: "thesis.pdf", preset: "academic-pdf" },
  { signal, userId, notify, createAsset, runPandoc, checkInput, assertOutput, statFile },
);

// ── FreeCAD: 3D CAD एक्सपोर्ट ──────────────────────────────────
const part = await freecad.exportPart(
  { inputPath: "bracket.FCStd", outputPath: "bracket.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runFreeCAD, checkInput, assertOutput, statFile },
);

// ── GDAL: भू-स्थानिक ट्रांसफ़ॉर्म ──────────────────────────────
const geo = await gdal.transformGeo(
  { inputPath: "terrain.tif", outputPath: "terrain_wgs84.tif", preset: "raster-wgs84-tiff" },
  { signal, userId, notify, createAsset, runGDAL, checkInput, assertOutput, statFile },
);

// ── OpenSCAD: पैरामेट्रिक CAD रेंडर ────────────────────────────
const model = await openscad.renderModel(
  { inputPath: "cube.scad", outputPath: "cube.stl", preset: "stl-print-ready" },
  { signal, userId, notify, createAsset, runOpenSCAD, checkInput, assertOutput, statFile },
);

// ── Blender: हेडलेस 3D रेंडर ────────────────────────────────────
const render = await blender.renderBlend(
  { inputPath: "scene.blend", outputPath: "render.png", preset: "png-preview" },
  { signal, userId, notify, createAsset, runBlender, checkInput, assertOutput, statFile },
);
```

## आर्किटेक्चर

- **स्कीमा-फ़र्स्ट**: हर इनपुट/आउटपुट के लिए Zod स्कीमा, पूर्ण टाइप-सेफ़
- **कॉन्टेक्स्ट DI**: सभी साइड इफ़ेक्ट्स कॉन्टेक्स्ट ऑब्जेक्ट्स से इंजेक्ट, 100% मॉक करने योग्य
- **सैंडबॉक्स आइसोलेशन**: हर फ़ाइल ऑपरेशन पर पाथ ट्रैवर्सल रोकथाम
- **ऑब्ज़र्वेबल**: हर स्टेज पर टाइप्ड नोटिफ़िकेशन (प्रगति, चेतावनी, तैयार)
- **रद्दीकरण**: AbortController हर पाइपलाइन चेकपॉइंट तक प्रसारित
- **फ़ॉलबैक**: प्रीमियम प्रीसेट विफलता पर गारंटीड में स्वचालित डिग्रेड
- **सुरक्षित निष्पादन**: FreeCAD पूर्व-निर्मित Python वन-लाइनर्स का उपयोग करता है (कोई exec/eval/यूज़र कोड नहीं)
- **मल्टी-बाइनरी**: GDAL प्रीसेट के अनुसार gdalwarp, ogr2ogr या gdal_translate को डिस्पैच करता है
- **टेक्स्ट-फ़र्स्ट CAD**: OpenSCAD शुद्ध `.scad` टेक्स्ट को मेश/इमेज में रेंडर करता है (कोई बाइनरी इनपुट नहीं)
- **हेडलेस 3D रेंडरिंग**: Blender GLB/STL एक्सपोर्ट के लिए पूर्व-निर्मित Python एक्सप्रेशन के साथ GUI रहित चलता है

## Docker

```bash
docker build -t toolshopstudio .
docker run -v ./sandbox:/sandbox toolshopstudio
```

सभी छह रनटाइम बाइनरी (`ffmpeg`, `pandoc`, `freecad-cmd`, `gdal-bin`, `openscad`, `blender`) इमेज में प्री-इंस्टॉल्ड हैं।

## विकास

```bash
npm install          # डिपेंडेंसी
npm run typecheck    # tsc --noEmit
npm test             # vitest (318 टेस्ट)
npm run build        # dist/ में कंपाइल
npm run smoke        # एंड-टू-एंड स्मोक (6 टूल्स + रजिस्ट्री, 15 टेस्ट)
```

## लाइसेंस

MIT
