<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/venvkit/readme.png" alt="venvkit" width="400">
</p>

# venvkit

> [MCP Tool Shop](https://mcptoolshop.com) का हिस्सा

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/venvkit/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/venvkit"><img src="https://img.shields.io/npm/v/@mcptoolshop/venvkit?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

**विंडोज एमएल वर्कफ़्लो के लिए पायथन वर्चुअल एनवायरनमेंट डायग्नोस्टिक टूलकिट।**

यह आपके सिस्टम में पायथन एनवायरनमेंट की जांच करता है, स्वास्थ्य संबंधी समस्याओं (एसएसएल, डीएलएल, एबीआई मिसमैच, पाथ लीकेज) का निदान करता है, टास्क निष्पादन इतिहास को ट्रैक करता है, अस्थिर टास्क का पता लगाता है, और एक इकोसिस्टम मैप प्रदर्शित करता है।

## 30 सेकंड में शुरुआत

```bash
git clone https://github.com/mcp-tool-shop-org/venvkit && cd venvkit
npm install && npm run build
node dist/map_cli.js --root C:\projects --httpsProbe
# Open .venvkit/venv-map.html in your browser
```

## विशेषताएं

- **doctorLite** - किसी भी पायथन इंटरप्रेटर के लिए त्वरित स्वास्थ्य जांच
- एसएसएल/टीएलएस सत्यापन
- डीएलएल लोड विफलता (पायटॉर्च/CUDA के साथ आम)
- एबीआई मिसमैच (एआरएम बनाम x86)
- पिप की जांच
- यूजर-साइट और PYTHONPATH का पता लगाना

- **scanEnvPaths** - आपके सिस्टम में सभी पायथन एनवायरनमेंट खोजें
- वर्चुअल एनवायरनमेंट, कोंडा एनवायरनमेंट, पायएनव संस्करण, बेस इंटरप्रेटर खोजता है
- कॉन्फ़िगर करने योग्य गहराई और फ़िल्टरिंग

- **mapRender** - अपने पायथन इकोसिस्टम को विज़ुअलाइज करें
- प्रोग्रामेटिक उपयोग के लिए ग्राफ JSON आउटपुट
- दस्तावेज़ों के लिए मर्मेड आरेख
- बेस इंटरप्रेटर का समूहीकरण और ब्लास्ट रेडियस विश्लेषण
- टास्क रूटिंग विज़ुअलाइज़ेशन

- **runLog** - टास्क निष्पादन इतिहास को ट्रैक करें
- केवल अपेंड करने योग्य JSONL प्रारूप
- रिकॉर्ड करता है कि कौन सा एनवायरनमेंट कौन सा टास्क चला रहा था
- सफलता/विफलता को त्रुटि वर्गीकरण के साथ रिकॉर्ड करता है

- **taskCluster** - हस्ताक्षर द्वारा टास्क रन को एकत्रित करें
- अस्थिर टास्क का पता लगाना (असंगत पास/फेल)
- एनवायरनमेंट-निर्भर अस्थिरता का पता लगाना
- विफलता हॉटस्पॉट की पहचान
- संचरण विश्लेषण (साझा मूल कारण)

## स्थापना

```bash
npm install
npm run build
```

## सीएलआई उपयोग

```bash
# Scan current directory and generate ecosystem map
node dist/map_cli.js

# Scan specific directories
node dist/map_cli.js --root C:\projects --root D:\ml-experiments

# Include task run history
node dist/map_cli.js --runlog .venvkit/runs.jsonl

# Output options
node dist/map_cli.js --out ./output --minScore 50 --strict --httpsProbe
```

### सीएलआई विकल्प

| फ्लैग | विवरण |
|------|-------------|
| `--root, -r` | स्कैन करने के लिए डायरेक्टरी (एक से अधिक निर्दिष्ट कर सकते हैं) |
| `--out` | आउटपुट डायरेक्टरी (डिफ़ॉल्ट: `.venvkit`) |
| `--maxDepth` | स्कैन करने के लिए अधिकतम डायरेक्टरी गहराई (डिफ़ॉल्ट: 5) |
| `--strict` | सख्त मोड जांच सक्षम करें |
| `--httpsProbe` | एचटीटीपीएस कनेक्टिविटी का परीक्षण करें |
| `--minScore` | इस स्वास्थ्य स्कोर से नीचे के एनवायरनमेंट को फ़िल्टर करें |
| `--concurrency` | समानांतर जांच (डिफ़ॉल्ट: सीपीयू गणना) |
| `--runlog` | टास्क रन लॉग (JSONL) का पथ |
| `--no-tasks` | टास्क विज़ुअलाइज़ेशन को छोड़ें |

### आउटपुट

| फ़ाइल | विवरण |
|------|-------------|
| `venv-map.json` | पूरा ग्राफ डेटा (नोड्स, एज, सारांश) |
| `venv-map.mmd` | मर्मेड आरेख स्रोत |
| `venv-map.html` | इंटरैक्टिव दर्शक |
| `reports.json` | कच्चे doctorLite रिपोर्ट |
| `insights.json` | कार्रवाई योग्य सिफारिशें |

## प्रोग्रामेटिक उपयोग

```typescript
import { doctorLite, scanEnvPaths, mapRender, readRunLog } from 'venvkit';

// Check a specific Python
const report = await doctorLite({
  pythonPath: 'C:\\project\\.venv\\Scripts\\python.exe',
  requiredModules: ['torch', 'transformers'],
  httpsProbe: true,
});

console.log(report.status); // 'good' | 'warn' | 'bad'
console.log(report.score);  // 0-100
console.log(report.findings); // Array of issues

// Scan for all Python environments
const scan = await scanEnvPaths({
  roots: ['C:\\projects'],
  maxDepth: 5,
});

// Run doctorLite on all found environments
const reports = await Promise.all(
  scan.pythonPaths.map(p => doctorLite({ pythonPath: p }))
);

// Load task execution history
const runs = await readRunLog('.venvkit/runs.jsonl');

// Generate ecosystem visualization
const { graph, mermaid, insights } = mapRender(reports, runs, {
  taskMode: 'clustered', // 'none' | 'runs' | 'clustered'
  includeHotEdgeLabels: true,
});
```

## रन लॉग स्कीमा

JSONL फ़ाइल में घटनाओं को जोड़कर टास्क निष्पादन को ट्रैक करें:

```typescript
import { appendRunLog, newRunId } from 'venvkit';

await appendRunLog('.venvkit/runs.jsonl', {
  version: '1.0',
  runId: newRunId(),
  at: new Date().toISOString(),
  task: {
    name: 'train',
    command: 'python train.py --epochs 10',
    requirements: { packages: ['torch', 'transformers'] },
  },
  selected: {
    pythonPath: 'C:\\project\\.venv\\Scripts\\python.exe',
    score: 95,
    status: 'good',
  },
  outcome: {
    ok: true,
    exitCode: 0,
    durationMs: 45000,
  },
});
```

## टास्क क्लस्टरिंग

जब आपके पास कई टास्क रन होते हैं, तो venvkit उन्हें हस्ताक्षर द्वारा समूहीकृत करता है:

```typescript
import { clusterRuns, isFlaky, getFailingEnvs } from 'venvkit';

const clusters = clusterRuns(runs);

for (const c of clusters) {
  console.log(`${c.sig.name}: ${c.ok}/${c.runs} (${(c.successRate * 100).toFixed(0)}%)`);

  if (isFlaky(c)) {
    console.log(`  WARNING: Flaky task!`);
    const badEnvs = getFailingEnvs(c, 3);
    console.log(`  Failing most on: ${badEnvs.map(e => e.pythonPath).join(', ')}`);
  }
}
```

## ग्राफ स्कीमा

`mapRender` आउटपुट एक स्थिर JSON स्कीमा का पालन करता है:

```typescript
type GraphJSONv1 = {
  version: '1.0';
  generatedAt: string;
  host: { os: string; arch: string; hostname: string };
  summary: {
    envCount: number;
    baseCount: number;
    taskCount: number;
    healthy: number;
    warning: number;
    broken: number;
    runsPassed: number;
    runsFailed: number;
    topIssues: Array<{ code: string; count: number; hint: string }>;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
};
```

### नोड प्रकार

| प्रकार | विवरण |
|------|-------------|
| `base` | बेस पायथन इंटरप्रेटर (जैसे, `C:\Python311`) |
| `venv` | वर्चुअल एनवायरनमेंट |
| `task` | टास्क हस्ताक्षर (समूहीकृत रन) |

### एज प्रकार

| प्रकार | विवरण |
|------|-------------|
| `USES_BASE` | venv → बेस संबंध |
| `ROUTES_TASK_TO` | टास्क → एनवायरनमेंट रूटिंग |
| `FAILED_RUN` | टास्क → एनवायरनमेंट विफलता (मर्मेड में डैश) |

## खोज कोड

| कोड | गंभीरता | विवरण |
|------|----------|-------------|
| `SSL_BROKEN` | खराब | एसएसएल मॉड्यूल आयात करने में विफल रहता है |
| `CERT_STORE_FAIL` | चेतावनी | एचटीटीपीएस प्रमाणपत्र सत्यापन विफल रहता है |
| `DLL_LOAD_FAIL` | खराब | नेटिव एक्सटेंशन डीएलएल लोड करने में विफल रहता है |
| `ABI_MISMATCH` | खराब | बाइनरी असंगति (एआरएम/x86) |
| `PIP_MISSING` | चेतावनी | पिप उपलब्ध नहीं है |
| `PIP_CHECK_FAIL` | चेतावनी | निर्भरता संघर्ष का पता चला |
| `USER_SITE_LEAK` | चेतावनी | वर्चुअल एनवायरनमेंट में यूजर-साइट पैकेज सक्षम हैं |
| `PYTHONPATH_INJECTED` | चेतावनी | PYTHONPATH पर्यावरण चर सेट है |
| `ARCH_MISMATCH` | खराब | 64-बिट की आवश्यकता होने पर 32-बिट पायथन |
| `PYVENV_CFG_INVALID` | चेतावनी | टूटा हुआ या गुम pyvenv.cfg |

## विकास

```bash
npm install
npm run typecheck  # Type check
npm run test       # Run tests
npm run build      # Build to dist/
```

## सुरक्षा और डेटा स्कोप

- **केवल पढ़ने की सुविधा वाला स्कैनिंग:** पायथन एग्जीक्यूटेबल फाइलें और pyvenv.cfg फाइलें पढ़ी जाती हैं, लेकिन उनमें कभी भी बदलाव नहीं किया जाता।
- **उप-प्रक्रियाएं:** यह `python` को नियंत्रित तर्कों के साथ चलाता है — कोई भी शेल निष्पादन नहीं होता।
- **नेटवर्क:** वैकल्पिक `--httpsProbe` विकल्प एसएसएल प्रमाणपत्रों का परीक्षण करता है — कोई अन्य आउटगोइंग अनुरोध नहीं होते।
- कोई भी डेटा एकत्र या भेजा नहीं जाता — पूर्ण नीति के लिए [SECURITY.md](SECURITY.md) देखें।

## लाइसेंस

एमआईटी

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/) द्वारा निर्मित।
