<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

VectorCaliper प्रशिक्षण के दौरान मॉडल की स्थिति के प्रक्षेपवक्रों को दर्शाता है। प्रत्येक दृश्य तत्व एक मापे गए चर से जुड़ा होता है। इसमें कोई अनुमान, स्मूथिंग या सिफारिश शामिल नहीं है।

> "एक माइक्रोस्कोप, डैशबोर्ड नहीं।"

VectorCaliper दिखाता है कि क्या हुआ। यह कभी भी आपको यह नहीं बताता कि इसका क्या मतलब है।

---

## VectorCaliper क्या है

- सीखने की गतिशीलता के लिए एक मापन उपकरण
- अनुकूलन प्रक्षेपवक्रों के लिए एक ज्यामितीय डिबगर
- प्रशिक्षण अवस्था के विकास के लिए एक निरीक्षण उपकरण
- अवस्था से दृश्य प्रतिनिधित्व का एक निश्चित मानचित्रण

## VectorCaliper क्या नहीं है

- एक प्रशिक्षण डैशबोर्ड
- एक अनुकूलक या सिफारिश प्रणाली
- एक स्वास्थ्य मॉनिटर या विसंगति डिटेक्टर
- एक हाइपरपैरामीटर खोज उपकरण

विस्तृत जानकारी के लिए [docs/WHAT-VECTORCALIPER-IS-NOT.md](docs/WHAT-VECTORCALIPER-IS-NOT.md) देखें।

---

## मुख्य गारंटी (v1)

VectorCaliper v1.x स्थिर अर्थ प्रदान करता है:

1. **नियतिवाद** — समान इनपुट समान आउटपुट उत्पन्न करता है
2. **कोई व्याख्या नहीं** — दृश्य एन्कोडिंग का कोई अर्थ नहीं होता
3. **सत्यपूर्ण गिरावट** — उपसमुच्चय सटीक होते हैं, कभी भी अनुमानित नहीं होते
4. **स्पष्ट सीमाएं** — बजट उल्लंघन अस्वीकृति का कारण बनते हैं, चुपचाप गिरावट का नहीं

पूर्ण विनिर्देश: [VECTORCALIPER_V1_GUARANTEES.md](VECTORCALIPER_V1_GUARANTEES.md)

---

## न्यूनतम उदाहरण

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

## मानक प्रदर्शन

[demo/](demo/) निर्देशिका में एक नियतिवादी प्रदर्शन जनरेटर है:

```bash
npx ts-node demo/canonical-demo.ts
```

आउटपुट:
- `demo/output/canonical-trajectory.json` — 500 अवस्थाएं
- `demo/output/canonical-trajectory.svg` — दृश्य
- `demo/output/canonical-manifest.json` — SHA256 चेकसम

नियतिवाद को सत्यापित करने के लिए इसे दो बार चलाएं और चेकसम की तुलना करें।

---

## यह किसके लिए है

**शोधकर्ता** जो प्रशिक्षण गतिशीलता को डिबग करने की आवश्यकता है और जिन्हें:
- बिना व्याख्या के विश्वसनीय दृश्य
- पत्रों के लिए पुनरुत्पादित आउटपुट
- यह दिखाया जा रहा है, इसके बारे में स्पष्ट गारंटी

**इंजीनियर** जो मॉडल अवस्था के विकास का निरीक्षण करने की आवश्यकता है और जिन्हें:
- स्केल-जागरूक दृश्य (1 मिलियन तक अवस्थाएं)
- फ्रेमवर्क-अज्ञेय अवस्था कैप्चर
- नियतिवादी CI कलाकृतियाँ

यह किसके लिए नहीं है: उत्पादन निगरानी, स्वचालित अलर्टिंग या हाइपरपैरामीटर अनुकूलन।

---

## स्थापना

```bash
npm install @mcp-tool-shop/vector-caliper
```

Node.js 18+ की आवश्यकता है।

---

## स्केल सीमाएं

VectorCaliper स्पष्ट सीमाओं को लागू करता है। उनका उल्लंघन करने पर **अस्वीकृति** होती है, चुपचाप गिरावट नहीं होती।

| स्केल वर्ग | अधिकतम अवस्थाएं | मेमोरी सीमा | रेंडर बजट |
|-------------|------------|--------------|---------------|
| छोटा | 1,000      | 50 MB | 16ms/फ्रेम |
| मध्यम | 10,000     | 200 MB | 33ms/फ्रेम |
| बड़ा | 100,000    | 500 MB | 66ms/फ्रेम |
| अत्यधिक | 1,000,000  | 1 GB | 100ms/फ्रेम |

---

## प्रलेखन

- [docs/README.md](docs/README.md) — प्रलेखन अनुक्रमणिका
- [docs/INTEGRATION-GUIDE.md](docs/INTEGRATION-GUIDE.md) — फ्रेमवर्क एकीकरण
- [docs/HOW-STATE-BECOMES-VECTOR.md](docs/HOW-STATE-BECOMES-VECTOR.md) — मैपिंग पाइपलाइन

---

## उद्धरण कैसे करें

यदि आप शैक्षणिक कार्यों में VectorCaliper का उपयोग करते हैं:

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

मशीन-पठनीय मेटाडेटा के लिए [CITATION.cff](CITATION.cff) देखें।

---

## लाइसेंस

MIT। [LICENSE](LICENSE) देखें।

---

## स्थिति

**v1.0.0** — 2026-03-07 तक सुविधाओं को स्थिर किया गया है। [STOP.md](STOP.md) देखें।

यह उपकरण [MCP Tool Shop](https://mcp-tool-shop.github.io/) द्वारा बनाया गया है।
