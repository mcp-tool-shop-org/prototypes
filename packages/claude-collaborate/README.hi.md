<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-collaborate/readme.png" alt="Claude Collaborate" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-collaborate/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-collaborate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-collaborate/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

> *जहां मानवीय रचनात्मकता और कृत्रिम बुद्धिमत्ता का मिलन होता है*

क्लाउड कोलाबरेट एक एकीकृत सैंडबॉक्स वातावरण है जो वास्तविक समय में मानव-कृत्रिम बुद्धिमत्ता के सहयोग को बढ़ावा देता है। यह इंटरैक्टिव कार्यक्षेत्रों, निर्बाध संचार और रचनात्मक उपकरणों को एक सुंदर इंटरफ़ेस में एक साथ लाता है।

## ✨ दृष्टिकोण

कल्पना कीजिए एक ऐसे कार्यक्षेत्र की जहां आप:
- एक साझा व्हाइटबोर्ड पर **चित्र बना सकते हैं और विचार-विमर्श कर सकते हैं**
- तत्काल पूर्वावलोकन के साथ **एक साथ कोड लिख सकते हैं**
- **शतरंज खेल सकते हैं** और रणनीति पर चर्चा कर सकते हैं
- GitHub-तैयार उपकरणों के साथ **सामग्री बना सकते हैं**
- WebSocket पुल के माध्यम से **वास्तविक समय में संवाद कर सकते हैं**

सब कुछ एक ही स्थान पर। सब कुछ खूबसूरती से एकीकृत।

## 🚀 त्वरित शुरुआत

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/claude-collaborate.git
cd claude-collaborate

# Install dependencies
pip install aiohttp

# Start the server
python server.py

# Open in browser
# http://localhost:8877
```

## 🎨 वातावरण

| वातावरण | विवरण |
| ------------- | ------------- |
| **Whiteboard** | दृश्य रूप से चित्र बनाएं, स्केच करें और विचार-विमर्श करें |
| **Code Workshop** | HTML/CSS/JS संपादक जिसमें लाइव पूर्वावलोकन हो |
| **Chess Workshop** | रणनीति और रणनीति का अभ्यास करने का क्षेत्र |
| **Capture Viewer** | स्क्रीनशॉट और रिकॉर्डिंग दर्शक |
| **GitHub Toolkit** | README और मार्केटिंग जनरेटर |
| **Creative Lab** | इंटरैक्टिव प्रयोग |
| **Template** | नए वातावरण बनाने के लिए शुरुआती टेम्पलेट |

## 🏗️ आर्किटेक्चर

```
claude-collaborate/
├── index.html           # Main UI with environment switcher
├── server.py            # aiohttp server
├── ws_bridge.py         # WebSocket bridge for Claude Code
├── whiteboard.html      # Drawing and brainstorming
├── code-playground.html # Live HTML/CSS/JS editor
├── chess.html           # Chess analysis board
├── capture-viewer.html  # Screenshot/recording viewer
├── github-toolkit.html  # README and marketing tools
├── template.html        # Starter for new environments
└── adventures/          # Creative Lab experiments
    └── index.html
```

## 🔌 WebSocket प्रोटोकॉल

क्लाउड कोलाबरेट में क्लाउड कोड के साथ वास्तविक समय संचार के लिए एक WebSocket पुल शामिल है:

```javascript
// Browser sends to Claude
{ "type": "user_message", "content": "Hello!" }

// Claude responds
{ "type": "claude_response", "content": "Hi there!" }

// Connection status
{ "type": "connected", "message": "Connected to Claude Collaborate Bridge" }
```

## 🔗 एपीआई एंडपॉइंट

| एंडपॉइंट | विधि | विवरण |
| ---------- | -------- | ------------- |
| `/` | GET | मुख्य क्लाउड कोलाबरेट यूआई |
| `/{file}` | GET | स्थैतिक फाइलें (व्हाइटबोर्ड, आदि) |
| `/ws` | WS | WebSocket पुल |
| `/api/ws/messages` | GET | लंबित उपयोगकर्ता संदेश पढ़ें |
| `/api/ws/respond` | POST | ब्राउज़र को प्रतिक्रिया भेजें |
| `/api/ws/status` | GET | WebSocket पुल स्थिति |
| `/health` | GET | सर्वर स्वास्थ्य जांच |

## 💬 क्लाउड कोड उपयोगकर्ताओं के लिए

WebSocket पुल के माध्यम से क्लाउड कोलाबरेट के साथ एकीकृत करें:

```bash
# Read messages from the UI
curl http://localhost:8877/api/ws/messages

# Send a response back
curl -X POST http://localhost:8877/api/ws/respond \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from Claude!"}'
```

## 🎭 वैकल्पिक: वॉयस इंटीग्रेशन

क्लाउड कोलाबरेट [वॉयस साउंडबोर्ड](https://github.com/mcp-tool-shop-org/voice-soundboard) के साथ खूबसूरती से काम करता है:

```bash
# In another terminal, start Voice Soundboard
cd voice-soundboard
python -m voice_soundboard.web_server

# Voice Studio will be available at http://localhost:8080/studio
```

## 🛠️ नए वातावरण बनाना

1. `template.html` को `your-environment.html` में कॉपी करें
2. इसे `index.html` में साइडबार में जोड़ें:
```html
<div class="env-item" data-url="/your-environment.html" data-name="Your Environment">
    <div class="env-icon" style="background: linear-gradient(...);">🎯</div>
    <div class="env-info">
        <h3>Your Environment</h3>
        <p>Description</p>
    </div>
</div>
```
3. रीफ्रेश करें और निर्माण शुरू करें!

## 📋 आवश्यकताएँ

- Python 3.10+
- aiohttp
- WebSocket समर्थन वाला आधुनिक ब्राउज़र

## 🤝 योगदान

हम योगदान का स्वागत करते हैं! चाहे वह:
- नए वातावरण टेम्पलेट
- यूआई/यूएक्स सुधार
- बग फिक्स
- दस्तावेज़

कृपया एक मुद्दा खोलें या एक पीआर सबमिट करें।

## 📄 लाइसेंस

MIT लाइसेंस - विवरण के लिए [LICENSE](LICENSE) देखें।

## 🙏 आभार

- **एंथ्रोपिक** - क्लाउड और सहायक कृत्रिम बुद्धिमत्ता के दृष्टिकोण के लिए
- **समुदाय** - मानव-कृत्रिम बुद्धिमत्ता के सहयोग की सीमाओं को आगे बढ़ाने के लिए

---

<p align="center">
  <i>Built with ❤️ for the future of collaboration</i><br>
  <a href="https://github.com/mcp-tool-shop-org">MCP Tool Shop</a>
</p>
