<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-session-copilot/readme.png" width="400" />
</p>

<p align="center">
  <strong>Session memory for Claude Code.</strong><br>
  Captures decisions, timelines, and patterns across sessions. Makes context recoverable after <code>/compact</code>.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-session-copilot/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-session-copilot"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-session-copilot" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-session-copilot/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/claude-session-copilot" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-session-copilot/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## क्यों?

क्लाउड कोड सत्र अस्थायी होते हैं। जब आप `/compact` कमांड का उपयोग करते हैं या शुरुआत करते हैं, तो आपकी सोच, निर्णय और प्रगति गायब हो जाती है। सेशन कोपायलट इन सभी चीजों को कैप्चर करता है और उन्हें पुनर्प्राप्त करने योग्य बनाता है।

**यह प्लगइन केवल क्लाउड कोड में ही काम करता है** — यह पोस्टटूलयूज़ हुक, कौशल, संसाधन सूचनाएं और CLAUDE.md संदर्भ इंजेक्शन पर निर्भर करता है, जो किसी अन्य MCP क्लाइंट में नहीं होता है।

## शुरुआत कैसे करें

```bash
npx @mcptoolshop/claude-session-copilot
```

### क्लाउड कोड प्लगइन

अपने प्रोजेक्ट की `.mcp.json` फ़ाइल में जोड़ें:

```json
{
  "mcpServers": {
    "session-copilot": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/claude-session-copilot"]
    }
  }
}
```

## यह क्या करता है

### 7 उपकरण

| उपकरण | उद्देश्य |
| ------ | --------- |
| `copilot.decision` | एक निर्णय लॉग करें (क्या, क्यों, अस्वीकृत विकल्प) |
| `copilot.snapshot` | निरंतरता के लिए सत्र की स्थिति सहेजें |
| `copilot.resume` | एक नए सत्र के लिए नवीनतम स्नैपशॉट + निर्णय लोड करें |
| `copilot.timeline_event` | एक टाइमलाइन घटना रिकॉर्ड करें |
| `copilot.query` | निर्णय/टाइमलाइन/स्नैपशॉट खोजें |
| `copilot.pulse` | परियोजना स्वास्थ्य डैशबोर्ड |
| `copilot.forget` | पुराने डेटा को हटाएं |

### 4 कौशल (केवल क्लाउड कोड)

| कौशल | यह क्या करता है |
| ------- | ------------- |
| `/copilot:resume` | अंतिम सत्र से वहीं से शुरू करें |
| `/copilot:snapshot` | `/compact` से पहले व्यापक स्थिति सहेजें |
| `/copilot:decisions` | निर्णय लॉग की समीक्षा करें |
| `/copilot:pulse` | परियोजना स्वास्थ्य डैशबोर्ड |

### 4 पोस्टटूलयूज़ हुक (केवल क्लाउड कोड)

निम्नलिखित के बाद स्वचालित रूप से टाइमलाइन में रिकॉर्ड करें:
- **बैश** — बिल्ड/टेस्ट परिणामों का पता लगाता है (पास/फेल)
- **राइट** — फ़ाइल निर्माण रिकॉर्ड करता है
- **एडिट** — फ़ाइल संशोधन रिकॉर्ड करता है
- **टुडूराइट** — कार्य स्थिति परिवर्तनों को रिकॉर्ड करता है

### पैटर्न डिटेक्शन

जब यह निम्नलिखित का पता लगाता है तो अलर्ट दिखाता है:
- **बार-बार विफलता** — एक ही कमांड 3+ बार विफल होता है
- **फ़ाइल परिवर्तन** — एक ही फ़ाइल एक सत्र में 5+ बार संपादित की जाती है
- **लंबा सत्र** — स्नैपशॉट के बिना 100+ घटनाएं

### 4 संसाधन

| URI | यह क्या दिखाता है |
| ----- | --------------- |
| `copilot://pulse` | लाइव परियोजना स्वास्थ्य |
| `copilot://timeline` | वर्तमान सत्र की घटनाएं |
| `copilot://decisions` | हालिया निर्णय लॉग |
| `copilot://snapshot/latest` | सबसे हालिया हैंडऑफ़ नोट |

## सत्र जीवनचक्र

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Session Start│ ──► │  /copilot:resume  │ ──► │   Work normally  │
└─────────────┘     └──────────────────┘     │  (hooks auto-    │
                                              │   track events)  │
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │ copilot.decision │
                                              │ (log key choices)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │/copilot:snapshot │
                                              │ (before /compact)│
                                              └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  Next session    │
                                              │  /copilot:resume │
                                              └─────────────────┘
```

## भंडारण

डेटा `.claude/copilot/store.json` (परियोजना-स्थानीय) या `~/.claude/copilot/store.json` (वैश्विक बैकअप) में बना रहता है।

`COPILOT_STORE_PATH` पर्यावरण चर के साथ इसे ओवरराइड किया जा सकता है।

## केवल क्लाउड कोड क्यों?

यह सर्वर वास्तुशिल्प रूप से क्लाउड कोड के मूलभूत तत्वों पर निर्भर है:

| विशेषता | क्लाउड कोड का मूलभूत तत्व | अन्य MCP क्लाइंट |
| --------- | ---------------------- | ------------------- |
| ऑटो-टाइमलाइन | पोस्टटूलयूज़ हुक | कोई हुक सिस्टम नहीं |
| स्लैश कमांड | कौशल (SKILL.md) | कोई कौशल नहीं |
| संदर्भ इंजेक्शन | CLAUDE.md | कोई समकक्ष नहीं |
| लाइव डैशबोर्ड | संसाधन सूचनाएं | संसाधनों को नहीं खोजते |
| कार्य समन्वय | TodoWrite हुक | कोई TodoWrite नहीं |

इनके बिना, सर्वर केवल एक JSON फ़ाइल है जिसमें इसे स्वचालित रूप से भरने का कोई तरीका नहीं है।

## लाइसेंस

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
