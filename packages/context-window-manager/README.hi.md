<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/context-window-manager/readme.png" alt="Context Window Manager" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/context-window-manager/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/context-window-manager/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/cwm-mcp/"><img src="https://img.shields.io/pypi/v/cwm-mcp" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/context-window-manager/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**एलएलएम सत्रों के लिए बिना किसी डेटा हानि के संदर्भ को पुनर्स्थापित करना (Lossless context restoration for LLM sessions)**

---

## यह क्या है?

कॉन्टेक्स्ट विंडो मैनेजर (CWM) एक एमसीपी सर्वर है जो एलएलएम अनुप्रयोगों में "**संदर्भ की कमी की समस्या**" को हल करता है। जब संदर्भ भर जाता है, तो आपके वार्तालाप इतिहास को खोने के बजाय, CWM आपको निम्नलिखित करने की अनुमति देता है:

- अपने वर्तमान संदर्भ को स्थायी भंडारण में **फ्रीज** करें।
- बिना किसी डेटा हानि के इसे बाद में **डी-फ्रीज** करें।
- विभिन्न वार्तालाप शाखाओं का पता लगाने के लिए संदर्भों को **क्लोन** करें।
- ठीक उसी स्थान से **फिर से शुरू** करें जहां आपने छोड़ा था।

सारांश या RAG दृष्टिकोण के विपरीत, CWM वास्तविक KV कैश टेन्सर को संरक्षित करता है, जिससे आपको **वास्तविक, बिना किसी डेटा हानि के पुनर्स्थापन** मिलता है।

---

## यह कैसे काम करता है

```
Traditional Approach (Lossy):
┌─────────────────────────────────────────────┐
│ Context fills up → Summarize → Lose details │
└─────────────────────────────────────────────┘

CWM Approach (Lossless):
┌──────────────────────────────────────────────────────────────┐
│ Context fills up → Freeze KV cache → Store tensors → Thaw   │
│                                                    ↓        │
│                              Exact restoration, zero loss   │
└──────────────────────────────────────────────────────────────┘
```

CWM निम्नलिखित का उपयोग करता है:
- सत्र अलगाव के लिए `cache_salt` के साथ **vLLM की उपसर्ग कैशिंग**।
- GPU → CPU → डिस्क → Redis तक स्तरीय KV कैश भंडारण के लिए **LMCache**।
- क्लाउड कोड और अन्य एमसीपी क्लाइंट के साथ सहज एकीकरण के लिए **MCP प्रोटोकॉल**।

---

## शुरुआत कैसे करें

### आवश्यकताएं

- Python 3.11+
- उपसर्ग कैशिंग सक्षम vLLM सर्वर
- vLLM के साथ कॉन्फ़िगर किया गया LMCache

### स्थापना

```bash
pip install cwm-mcp
```

### कॉन्फ़िगरेशन

अपने क्लाउड कोड सेटिंग्स (`.claude/settings.json`) में जोड़ें:

```json
{
  "mcpServers": {
    "context-window-manager": {
      "command": "python",
      "args": ["-m", "context_window_manager"],
      "env": {
        "CWM_VLLM_URL": "http://localhost:8000"
      }
    }
  }
}
```

### उपयोग

```
# Freeze your current session
> window_freeze session_abc123 my-coding-project

# Later, restore it
> window_thaw my-coding-project

# List all saved windows
> window_list

# Check status
> window_status my-coding-project
```

---

## विशेषताएं

### मुख्य कार्य

| Tool | विवरण |
| ------ | ------------- |
| `window_freeze` | भंडारण में सत्र संदर्भ को फ्रीज करें। |
| `window_thaw` | सहेजे गए विंडो से संदर्भ को पुनर्स्थापित करें। |
| `window_list` | उपलब्ध संदर्भ विंडो की सूची प्राप्त करें। |
| `window_status` | सत्र/विंडो के बारे में विस्तृत जानकारी प्राप्त करें। |
| `window_clone` | अन्वेषण के लिए एक संदर्भ को ब्रांच करें। |
| `window_delete` | सहेजी गई विंडो को हटाएं। |

### भंडारण स्तर

CWM स्वचालित रूप से सभी स्तरों में भंडारण का प्रबंधन करता है:

1. **सीपीयू मेमोरी** - तेज़, सीमित क्षमता।
2. **डिस्क** - बड़ी क्षमता, संपीड़ित।
3. **Redis** - वितरित, विभिन्न इंस्टेंस में साझा।

### सत्र अलगाव

प्रत्येक सत्र को एक अद्वितीय `cache_salt` मिलता है, जो यह सुनिश्चित करता है:
- क्रॉस-सेशन डेटा का कोई रिसाव नहीं।
- टाइमिंग हमलों से सुरक्षा।
- संदर्भों का स्पष्ट अलगाव।

---

## दस्तावेज़

| दस्तावेज़ | विवरण |
| ---------- | ------------- |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | शुरुआत और कार्यप्रवाह |
| [API.md](docs/API.md) | पूर्ण एपीआई संदर्भ |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | तकनीकी आर्किटेक्चर का विस्तृत विवरण |
| [SECURITY.md](docs/SECURITY.md) | सुरक्षा संबंधी विचार |
| [ERROR_HANDLING.md](docs/ERROR_HANDLING.md) | त्रुटि वर्गीकरण और प्रबंधन |
| [ROADMAP.md](docs/ROADMAP.md) | विकास चरण और मील के पत्थर |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | विकास दिशानिर्देश |

---

## आवश्यकताएं

### vLLM सर्वर कॉन्फ़िगरेशन

```bash
vllm serve "meta-llama/Llama-3.1-8B-Instruct" \
  --enable-prefix-caching \
  --kv-transfer-config '{"kv_connector":"LMCacheConnectorV1","kv_role":"kv_both"}'
```

### LMCache वातावरण

```bash
export LMCACHE_USE_EXPERIMENTAL=True
export LMCACHE_LOCAL_CPU=True
export LMCACHE_MAX_LOCAL_CPU_SIZE=8.0
```

---

## विकास

```bash
# Clone and setup
git clone https://github.com/mcp-tool-shop-org/context-window-manager.git
cd context-window-manager
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -e ".[dev]"

# Run tests
pytest tests/unit/

# Run with coverage
pytest tests/unit/ --cov=src/context_window_manager
```

विस्तृत दिशानिर्देशों के लिए [CONTRIBUTING.md](docs/CONTRIBUTING.md) देखें।

---

## रोडमैप

- [x] चरण 0: दस्तावेज़ और आर्किटेक्चर
- [x] चरण 1: मुख्य बुनियादी ढांचा
- [x] चरण 2: एमसीपी सर्वर शेल
- [x] चरण 3: फ्रीज कार्यान्वयन
- [x] चरण 4: डी-फ्रीज कार्यान्वयन
- [x] चरण 5: उन्नत विशेषताएं (क्लोन, ऑटो-फ्रीज)
- [x] चरण 6: उत्पादन हार्डनिंग
- [x] चरण 7: एकीकरण और पॉलिश

विस्तृत जानकारी के लिए [ROADMAP.md](docs/ROADMAP.md) देखें।

---

## लाइसेंस

MIT लाइसेंस - विवरण के लिए [LICENSE](LICENSE) देखें।

---

## स्वीकृतियां

- [vLLM](https://github.com/vllm-project/vllm) - उच्च-थ्रूपुट एलएलएम सेवा
- [LMCache](https://github.com/LMCache/LMCache) - KV कैश दृढ़ता परत
- [Model Context Protocol](https://modelcontextprotocol.io/) - एकीकरण मानक
- [Recursive Language Models](https://arxiv.org/abs/2512.24601) - संदर्भ प्रबंधन के लिए प्रेरणा

---

## स्थिति

**बीटा (v0.6.4)** - उत्पादन के लिए तैयारी पूरी। निरंतर एकीकरण (CI) को समेकित किया गया (2 कार्यप्रवाह)। 366 परीक्षण सफल हुए।
