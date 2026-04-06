<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-app-builder/readme.png" alt="MCP App Builder" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-app-builder/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder"><img src="https://codecov.io/gh/mcp-tool-shop-org/mcp-app-builder/branch/main/graph/badge.svg" alt="codecov" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-1.0-green" alt="MCP" /></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-app-builder/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

वीएस कोड के माध्यम से, इंटरैक्टिव यूआई घटकों के साथ एमसीपी सर्वर बनाएं।

## सारांश।

**MCP ऐप बिल्डर** डेवलपर्स को MCP (मॉडल कॉन्टेक्स्ट प्रोटोकॉल) सर्वर को तेजी से बनाने, परीक्षण करने और तैनात करने में मदद करता है। यह नए **MCP ऐप्स** मानक (जनवरी 2026) का समर्थन करता है, जिससे एआई (कृत्रिम बुद्धिमत्ता) वार्तालापों में सीधे इंटरैक्टिव यूआई (उपयोगकर्ता इंटरफ़ेस) घटक जोड़े जा सकते हैं।

## विशेषताएं।

### मचान।
- **नया सर्वर विजार्ड:** निर्देशित सेटअप के साथ MCP सर्वर बनाएं।
- **टेम्प्लेट:** बुनियादी, यूआई-आधारित और पूर्ण सर्वर कॉन्फ़िगरेशन।
- **स्वचालित कॉन्फ़िगरेशन:** टाइपस्क्रिप्ट, MCP SDK और प्रोजेक्ट संरचना।

### विकास।
- **स्कीमा सत्यापन:** `mcp.json` और `mcp-tools.json` फ़ाइलों का वास्तविक समय में सत्यापन।
- **सेव करते समय स्वचालित सत्यापन:** जब आप फ़ाइल को सेव करते हैं, तो स्कीमा स्वचालित रूप से जांचे जाते हैं (इसे अनुकूलित किया जा सकता है)।
- **टाइप निर्माण:** टूल परिभाषाओं से टाइपस्क्रिप्ट प्रकार उत्पन्न करें।
- **इंटेलिसेन्स:** कॉन्फ़िगरेशन फ़ाइलों के लिए JSON स्कीमा समर्थन।

### परीक्षण।
- **परीक्षण उपकरण (टेस्ट हार्नेस):** अपने एमसीपी उपकरणों के लिए परीक्षण चलाएं।
- **स्वचालित रूप से उत्पन्न परीक्षण:** उपकरण परिभाषाओं और उदाहरणों से बनाए गए परीक्षण।
- **आउटपुट चैनल:** स्वरूपित परीक्षण परिणाम, जिसमें पास/फेल की स्थिति दर्शाई गई है।

### डैशबोर्ड।
- **दृश्य इंटरफ़ेस:** सभी कमांडों तक त्वरित पहुंच।
- **कार्यक्षेत्र एकीकरण:** स्वचालित रूप से एमसीपी (MCP) परियोजनाओं का पता लगाता है।
- **स्टेटस बार:** जब आप किसी एमसीपी परियोजना में हों, तो एमसीपी संकेतक प्रदर्शित होता है।

## शुरुआत कैसे करें।

1. **एक्सटेंशन स्थापित करें:** वीएस कोड मार्केटप्लेस से (जल्द ही उपलब्ध होगा)।
2. **एक नया सर्वर बनाएं:** `Cmd+Shift+P` → "MCP: नया सर्वर"
3. **एक टेम्पलेट चुनें:**
- `basic` - एक साधारण "हेलो वर्ल्ड" सर्वर।
- `with-ui` - टेबल और चार्ट यूआई घटकों वाला सर्वर।
- `full` - उपकरणों, संसाधनों और सुझावों के साथ एक पूर्ण सर्वर।

## कीबोर्ड शॉर्टकट।

| शॉर्टकट। | आदेश। |
|----------|---------|
| `Ctrl+Alt+N` (मैक पर `Cmd+Alt+N`)। | नया सर्वर। |
| `Ctrl+Alt+V` (मैक पर `Cmd+Alt+V`)। | स्कीमा को सत्यापित करें। |

## आदेश।

| आदेश। | विवरण। |
|---------|-------------|
| `MCP: New Server` | एक नया एमसीपी सर्वर प्रोजेक्ट बनाएं। |
| `MCP: Validate Schema` | वर्तमान `mcp.json` या `mcp-tools.json` फ़ाइल की वैधता की जांच करें। |
| `MCP: Generate Types` | टूल की परिभाषाओं से टाइपस्क्रिप्ट प्रकार (टाइप) उत्पन्न करें। |
| `MCP: Test Server` | अपने एमसीपी (MCP) उपकरणों पर परीक्षण चलाएं। |
| `MCP: Open Dashboard` | विज़ुअल डैशबोर्ड खोलें। |

## सेटिंग्स

| स्थापना। | डिफ़ॉल्ट। | विवरण। |
|---------|---------|-------------|
| `mcp-app-builder.defaultTemplate` | `basic` | नए सर्वरों के लिए डिफ़ॉल्ट टेम्पलेट (बुनियादी/यूआई के साथ/पूर्ण)। |
| `mcp-app-builder.autoValidate` | `true` | सेव करते समय स्कीमा को स्वचालित रूप से सत्यापित करें। |
| `mcp-app-builder.testPort` | `3000` | एमसीपी परीक्षण सर्वर के लिए पोर्ट। |

## MCP एप्लिकेशन के यूजर इंटरफेस (यूआई) घटक।

यह एक्सटेंशन, एमसीपी ऐप्स के यूआई घटकों के लिए बिल्डर प्रदान करता है:

```typescript
import { table, chart, form, card } from '@mcp-app-builder/ui-components';

// Create a search results table
const results = table(
  [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'status', header: 'Status' },
  ],
  data,
  { pageSize: 10 }
);

// Create a dashboard with metrics
const dashboard = dashboard({
  title: 'Analytics',
  metrics: [
    { label: 'Users', value: 1234, change: 12 },
    { label: 'Revenue', value: '$5,678', change: -3 },
  ],
  chart: lineChart,
});
```

## फ़ाइल संरचना।

उत्पन्न एमसीपी सर्वर प्रोजेक्ट्स निम्नलिखित संरचना का पालन करते हैं:

```
my-mcp-server/
├── mcp.json           # Server configuration
├── mcp-tools.json     # Tool definitions
├── package.json       # Node.js dependencies
├── tsconfig.json      # TypeScript configuration
└── src/
    ├── index.ts       # Server entry point
    ├── resources.ts   # Resource handlers (full template)
    └── prompts.ts     # Prompt handlers (full template)
```

## विकास।

### आवश्यक शर्तें।

- नोड.जेएस 18 या उससे ऊपर का संस्करण
- वीएस कोड 1.85 या उससे ऊपर का संस्करण

### स्थापना।

```bash
git clone https://github.com/mcp-tool-shop-org/mcp-app-builder
cd mcp-app-builder
npm install
npm run compile
```

### दौड़ना।

वीएस कोड में एक्सटेंशन डेवलपमेंट होस्ट शुरू करने के लिए, `F5` कुंजी दबाएं।

### परीक्षण।

```bash
npm test
```

## रणनीति।

### पहला चरण (वर्तमान) - निश्चित आधार।
- [x] टेम्पलेट्स के साथ प्रोजेक्ट संरचना तैयार करना।
- [x] स्कीमा सत्यापन प्रणाली।
- [x] स्कीमा से डेटा प्रकारों का निर्माण।
- [x] यूआई (UI) घटक के बुनियादी तत्व।
- [x] परीक्षण प्रणाली का आधार।
- [x] डैशबोर्ड वेब दृश्य।

### चरण 2 - कृत्रिम बुद्धिमत्ता (एआई) द्वारा समर्थित विकास।
- [ ] प्राकृतिक भाषा से एआई टूल का निर्माण।
- [ ] टूल संचालकों के लिए स्मार्ट कोड सुझाव।
- [ ] स्वचालित दस्तावेज़ निर्माण।

### चरण 3 - प्रकाशन और वितरण।
- [ ] एमसीपी (MCP) रजिस्ट्री में एक क्लिक से प्रकाशन।
- [ ] संस्करण प्रबंधन।
- [ ] निर्भरता समाधान।

### चरण 4 - विज़ुअल बिल्डर।
- [ ] ड्रैग-एंड-ड्रॉप यूआई (UI) घटक निर्माता।
- [ ] एमसीपी (MCP) ऐप्स का लाइव पूर्वावलोकन।
- [ ] विज़ुअल फ्लो एडिटर।

## योगदान

योगदान का स्वागत है! कृपया हमारे योगदान दिशानिर्देश (जल्द ही उपलब्ध होंगे) पढ़ें।

## सुरक्षा और गोपनीयता

**जिन डेटा तक पहुंचा जाता है:** कार्यक्षेत्र फ़ाइलें (mcp.json, mcp-tools.json, उत्पन्न TypeScript), VS Code सेटिंग्स, एक्सटेंशन आउटपुट चैनल।

**जिन डेटा तक नहीं पहुंचा जाता:** MCP कॉन्फ़िगरेशन से परे स्रोत कोड, गिट इतिहास, नेटवर्क (सिवाय localhost परीक्षण उपकरण के), क्रेडेंशियल, पर्यावरण चर। कोई भी टेलीमेट्री एकत्र या भेजा नहीं जाता है।

**अनुमतियाँ:** कार्यक्षेत्र फ़ाइलों के लिए फ़ाइल सिस्टम पढ़ने/लिखने की अनुमति, परीक्षण उपकरण के लिए localhost नेटवर्क। पूर्ण नीति के लिए [SECURITY.md](SECURITY.md) देखें।

## लाइसेंस

MIT

## लिंक

- [मॉडल कॉन्टेक्स्ट प्रोटोकॉल](https://modelcontextprotocol.io)
- [MCP ऐप्स विनिर्देश](http://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/)
- [GitHub संगठन](https://github.com/mcp-tool-shop-org)

---

<a href="https://mcp-tool-shop.github.io/">MCP टूल शॉप</a> द्वारा निर्मित।
