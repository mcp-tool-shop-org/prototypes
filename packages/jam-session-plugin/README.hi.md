<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/jam-session-plugin/readme.png" alt="Jam Session Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/jam-session-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

एक एआई पियानो प्लेयर जिसमें 100 गानों का संग्रह है, संरचित शिक्षण और सामूहिक संगीत सत्र शामिल हैं। यह आपके स्पीकर के माध्यम से चलता है - किसी बाहरी सॉफ़्टवेयर की आवश्यकता नहीं है।

यह प्लगइन [एआई जैम सेशन](https://github.com/mcp-tool-shop-org/ai_jam_session) एमसीपी सर्वर को लपेटता है, जिसमें स्लैश कमांड, एजेंट व्यक्तित्व और सीखने और सामूहिक संगीत के लिए संरचित कार्यप्रवाह शामिल हैं।

## इंस्टॉल करें

```bash
claude plugin add ai-jam-session
```

एमसीपी सर्वर (`@mcptoolshop/ai-jam-session`) स्वचालित रूप से npx के माध्यम से डाउनलोड हो जाता है। इसके लिए Node.js 18 या उससे ऊपर की आवश्यकता है।

## आपको क्या मिलेगा

### कौशल (स्लैश कमांड)

| कमांड | विवरण |
| --------- | ------------- |
| `/ai-jam-session:teach <song>` | एक संरचित शिक्षण सत्र शुरू करें। |
| `/ai-jam-session:practice <song> [level]` | एक व्यक्तिगत अभ्यास योजना प्राप्त करें। |
| `/ai-jam-session:explore [query]` | शैली, कठिनाई या कीवर्ड के आधार पर 100 गानों के संग्रह को ब्राउज़ करें। |
| `/ai-jam-session:jam <song or genre>` | एक सामूहिक संगीत सत्र शुरू करें - क्लाउड अपना स्वयं का व्याख्यान बनाता है। |

### एजेंट

| Agent | विवरण |
| ------- | ------------- |
| `piano-teacher` | एक धैर्यवान, शिक्षण देने वाला शिक्षक जो छात्रों की वर्तमान क्षमता के अनुसार मार्गदर्शन करता है। |
| `jam-musician` | एक शांत सामूहिक संगीत सत्र का संगीतकार - पहले ताल, प्रयोग को प्रोत्साहित करता है। |

### एमसीपी टूल्स (15)

गानों को ब्राउज़ करें, बजाएं, सिखाएं, सामूहिक संगीत सत्र करें और प्रबंधित करें। प्लगइन के कौशल इन उपकरणों को स्वचालित रूप से व्यवस्थित करते हैं, लेकिन वे सीधे उपयोग के लिए भी उपलब्ध हैं।

## उपयोग

स्लैश कमांड का उपयोग करें:

```
/ai-jam-session:explore jazz
/ai-jam-session:teach moonlight-sonata-mvt1
/ai-jam-session:practice let-it-be beginner
/ai-jam-session:jam autumn-leaves as blues
/ai-jam-session:jam jazz
```

या बस स्वाभाविक रूप से बात करें - एजेंट संदर्भ के आधार पर सक्रिय होते हैं:

```
I want to learn a beginner jazz song on piano.
Help me practice Fur Elise at half speed.
Let's jam on some blues.
```

## गाना संग्रह

10 शुरुआती, मध्यवर्ती और उन्नत स्तरों पर 10 शैलियों (शास्त्रीय, जैज़, पॉप, ब्लूज़, रॉक, आर एंड बी, लैटिन, फिल्म, रैगमटाइम, न्यू-एज) में 100 अंतर्निहित गाने।

## आवश्यकताएं

- Node.js 18+
- स्पीकर (पियानो आपके सिस्टम ऑडियो के माध्यम से बजता है)

## लिंक

- एमसीपी सर्वर: [@mcptoolshop/ai-jam-session](https://www.npmjs.com/package/@mcptoolshop/ai-jam-session)
- स्रोत: [mcp-tool-shop-org/ai_jam_session](https://github.com/mcp-tool-shop-org/ai_jam_session)

## लाइसेंस

MIT
