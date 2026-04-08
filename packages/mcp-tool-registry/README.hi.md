<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-tool-registry/readme.png" alt="MCP Tool Registry" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-tool-registry/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-tool-registry"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-tool-registry" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-tool-registry/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**यह केवल मेटाडेटा वाली रजिस्ट्री है—यह सभी MCP टूल शॉप उपकरणों के लिए एकमात्र विश्वसनीय स्रोत है।**

प्रत्येक बदलाव के साथ स्कीमा के अनुसार सत्यापित। नियमों के आधार पर तैयार किए गए बंडल। पहले से तैयार खोज अनुक्रमणिका पैकेज में शामिल है। किसी संस्करण को 'पिन' करें, और हर बार आपको एक समान मेटाडेटा मिलेगा।

## शुरुआत कैसे करें

```bash
npm install @mcptoolshop/mcp-tool-registry
```

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }

console.log(`${registry.tools.length} tools registered`)
```

## एक नज़र में

- **केवल डेटा:** कोई भी निष्पादन योग्य कोड नहीं, बल्कि पारिस्थितिकी तंत्र में मौजूद प्रत्येक उपकरण के लिए केवल JSON मेटाडेटा।
- **स्कीमा-सत्यापित:** प्रत्येक प्रविष्टि को कमिट और CI में JSON स्कीमा के अनुसार जांचा जाता है।
- **बंडल प्रणाली:** उपकरण नियमों के आधार पर 'कोर', 'एजेंट', 'ऑप्स', और 'मूल्यांकन' जैसे पूर्वनिर्धारित बंडलों में समूहीकृत किए जाते हैं, न कि मैन्युअल रूप से।
- **त्वरित खोज:** पहले से तैयार खोज अनुक्रमणिका, जिसमें कीवर्ड और पहलू शामिल हैं, पैकेज के अंदर उपलब्ध है।
- **न्यूनतम विशेषाधिकार:** डिफ़ॉल्ट रूप से, उपकरणों में कोई भी क्षमता नहीं होती है; साइड-इफेक्ट वैकल्पिक हैं और स्पष्ट रूप से घोषित किए जाते हैं।
- **पुनरुत्पादित:** रजिस्ट्री के किसी संस्करण को 'पिन' करें और हर बार आपको एक समान मेटाडेटा मिलेगा।

## उपयोगकर्ता

### पूरी रजिस्ट्री

```javascript
import registry from "@mcptoolshop/mcp-tool-registry/registry.json" with { type: "json" }
```

### बंडल

```javascript
import coreBundle from "@mcptoolshop/mcp-tool-registry/bundles/core.json" with { type: "json" }
import agents from "@mcptoolshop/mcp-tool-registry/bundles/agents.json" with { type: "json" }
```

उपलब्ध बंडल: `core`, `agents`, `ops`, `evaluation`.

### खोज अनुक्रमणिका

```javascript
import toolIndex from "@mcptoolshop/mcp-tool-registry/dist/registry.index.json" with { type: "json" }

const hits = toolIndex.filter(t => t.keywords.includes("accessibility"))
```

### LLM संदर्भ

```javascript
// Plain-text context file for LLM RAG pipelines
import llmContext from "@mcptoolshop/mcp-tool-registry/dist/registry.llms.txt"
```

## बंडल

| बंडल           | विवरण                                 | चयन तर्क                                  |
| -------------- | ------------------------------------- | ----------------------------------------- |
| **core**       | आवश्यक उपयोगिताएँ                     | स्पष्ट आईडी सूची                          |
| **agents**     | एजेंट ऑर्केस्ट्रेशन, नेविगेशन, संदर्भ | स्पष्ट आईडी + `agents` टैग                |
| **ops**        | डेवऑप्स, इंफ्रास्ट्रक्चर, परिनियोजन   | टैग: `automation`, `packaging`, `release` |
| **evaluation** | परीक्षण, बेंचमार्किंग, कवरेज          | टैग: `testing`, `evaluation`, `benchmark` |

## संरचना

```
mcp-tool-registry/
├── registry.json              # Canonical source of truth
├── schema/registry.schema.json
├── bundles/                   # Rules-generated subsets
├── dist/                      # Derived artifacts (generated at publish)
│   ├── registry.index.json    # Search index
│   ├── capabilities.json      # Capability reverse map
│   ├── derived.meta.json      # Build metadata + registry hash
│   └── registry.llms.txt      # LLM-native context
└── curation/featured.json     # Featured tools and collections
```

## एक उपकरण जोड़ना

1. [docs/registry-guidelines.md](docs/registry-guidelines.md) पढ़ें।
2. `registry.json` में एक प्रविष्टि जोड़ें (इसे `id` के अनुसार क्रमबद्ध रखें)।
3. `npm run validate` और `npm run policy` चलाएं।
4. एक पुल अनुरोध सबमिट करें।

## संस्करण

v1 संस्करण स्थिर है। नए वैकल्पिक फ़ील्ड छोटे संस्करणों में जोड़े जा सकते हैं; आवश्यक फ़ील्ड और मौजूदा फ़ील्ड संरचना किसी भी प्रमुख संस्करण में नहीं बदलेंगी।

## पारिस्थितिकी तंत्र

- **[mcpt CLI](https://github.com/mcp-tool-shop-org/mcpt)** — उपकरणों की खोज करें, स्थापित करें और चलाएं।
- **[एक उपकरण सबमिट करें](https://github.com/mcp-tool-shop-org/mcp-tool-registry/issues/new/choose)** — अपने उपकरण को पारिस्थितिकी तंत्र में जोड़ें।

## लाइसेंस

MIT — विवरण के लिए [LICENSE](LICENSE) देखें।
