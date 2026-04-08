<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/file-compass/readme.png" alt="File Compass" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/file-compass/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/file-compass/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/file-compass/"><img src="https://img.shields.io/pypi/v/file-compass" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/file-compass/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**एआई वर्कस्टेशन के लिए एचएनएसडब्ल्यू वेक्टर इंडेक्सिंग का उपयोग करके सिमेंटिक फ़ाइल खोज**

*उन फ़ाइलों को खोजें जिनका आप वर्णन करते हैं, केवल नाम से नहीं।*

---

## फ़ाइल कम्पास क्यों?

| समस्या | समाधान |
| --------- | ---------- |
| "वह डेटाबेस कनेक्शन फ़ाइल कहां है?" | `file-compass search "database connection handling"` |
| कीवर्ड खोज सिमेंटिक मिलानों को नहीं खोज पाती। | वेक्टर एम्बेडिंग अर्थ को समझते हैं। |
| बड़े कोडबेस में धीमी खोज। | एचएनएसडब्ल्यू इंडेक्स: 10,000 से अधिक फ़ाइलों के लिए <100ms। |
| एआई सहायकों के साथ एकीकृत करने की आवश्यकता है। | क्लाउड कोड के लिए एमसीपी सर्वर। |

## शुरुआत कैसे करें

```bash
# Install
git clone https://github.com/mcp-tool-shop-org/file-compass.git
cd file-compass && pip install -e .

# Pull embedding model
ollama pull nomic-embed-text

# Index your code
file-compass index -d "C:/Projects"

# Search semantically
file-compass search "authentication middleware"
```

## विशेषताएं

- **सिमेंटिक खोज**: उन फ़ाइलों को खोजें जिनका आप वर्णन करते हैं।
- **त्वरित खोज**: त्वरित फ़ाइलनाम/प्रतीक खोज (एम्बेडिंग की आवश्यकता नहीं)।
- **मल्टी-लैंग्वेज एएसटी**: पायथन, जेएस, टीएस, रस्ट, गो के लिए ट्री-सिटर समर्थन।
- **परिणाम स्पष्टीकरण**: समझें कि प्रत्येक परिणाम क्यों मेल खाता है।
- **स्थानीय एम्बेडिंग**: ओलामा का उपयोग करता है (एपीआई कुंजियों की आवश्यकता नहीं)।
- **तेज़ खोज**: उप-सेकंड प्रश्नों के लिए एचएनएसडब्ल्यू इंडेक्सिंग।
- **गिट-जागरूक**: वैकल्पिक रूप से केवल गिट-ट्रैक्ड फ़ाइलों को फ़िल्टर करें।
- **एमसीपी सर्वर**: क्लाउड कोड और अन्य एमसीपी क्लाइंट के साथ एकीकृत होता है।
- **सुरक्षा-सक्षम**: इनपुट सत्यापन, पथ ट्रैवर्सल सुरक्षा।

## स्थापना

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/file-compass.git
cd file-compass

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# or: source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -e .

# Pull the embedding model
ollama pull nomic-embed-text
```

### आवश्यकताएं

- पायथन 3.10+
- [ओलामा](https://ollama.com/) `nomic-embed-text` मॉडल के साथ।

## उपयोग

### इंडेक्स बनाएं

```bash
# Index a directory
file-compass index -d "C:/Projects"

# Index multiple directories
file-compass index -d "C:/Projects" "D:/Code"
```

### फ़ाइलें खोजें

```bash
# Semantic search
file-compass search "database connection handling"

# Filter by file type
file-compass search "training loop" --types python

# Git-tracked files only
file-compass search "API endpoints" --git-only
```

### त्वरित खोज (कोई एम्बेडिंग नहीं)

```bash
# Search by filename or symbol name
file-compass scan -d "C:/Projects"  # Build quick index
```

### स्थिति जांचें

```bash
file-compass status
```

## एमसीपी सर्वर

फ़ाइल कम्पास में क्लाउड कोड और अन्य एआई सहायकों के साथ एकीकरण के लिए एक एमसीपी सर्वर शामिल है।

### उपलब्ध उपकरण

| Tool | विवरण |
| ------ | ------------- |
| `file_search` | सिमेंटिक खोज स्पष्टीकरण के साथ |
| `file_preview` | सिंटैक्स हाइलाइटिंग के साथ कोड पूर्वावलोकन |
| `file_quick_search` | तेज़ फ़ाइलनाम/प्रतीक खोज |
| `file_quick_index_build` | त्वरित खोज इंडेक्स बनाएं |
| `file_actions` | संदर्भ, उपयोग, संबंधित, इतिहास, प्रतीक |
| `file_index_status` | इंडेक्स आँकड़े जांचें |
| `file_index_scan` | पूरा इंडेक्स बनाएं या पुनर्निर्माण करें |

### क्लाउड कोड एकीकरण

अपने `claude_desktop_config.json` में जोड़ें:

```json
{
  "mcpServers": {
    "file-compass": {
      "command": "python",
      "args": ["-m", "file_compass.gateway"],
      "cwd": "C:/path/to/file-compass"
    }
  }
}
```

## कॉन्फ़िगरेशन

| चर | डिफ़ॉल्ट | विवरण |
| ---------- | --------- | ------------- |
| `FILE_COMPASS_DIRECTORIES` | `F:/AI` | कॉमा-सेपरेटेड डायरेक्टरी |
| `FILE_COMPASS_OLLAMA_URL` | `http://localhost:11434` | ओलामा सर्वर यूआरएल |
| `FILE_COMPASS_EMBEDDING_MODEL` | `nomic-embed-text` | एम्बेडिंग मॉडल |

## यह कैसे काम करता है

1. **स्कैनिंग**: कॉन्फ़िगर किए गए एक्सटेंशन से मेल खाने वाली फ़ाइलों की खोज करता है, `.gitignore` का सम्मान करता है।
2. **चंकिंग**: फ़ाइलों को सिमेंटिक टुकड़ों में विभाजित करता है:
- पायथन/जेएस/टीएस/रस्ट/गो: ट्री-सिटर के माध्यम से एएसटी-जागरूक (फ़ंक्शन, कक्षाएं)
- मार्कडाउन: हेडिंग-आधारित अनुभाग
- JSON/YAML: शीर्ष-स्तरीय कुंजियाँ
- अन्य: ओवरलैप के साथ स्लाइडिंग विंडो
3. **एम्बेडिंग**: ओलामा के माध्यम से 768-डायमेंशनल वेक्टर उत्पन्न करता है।
4. **इंडेक्सिंग**: एचएनएसडब्ल्यू इंडेक्स में वेक्टर संग्रहीत करता है, एसक्यूएलइट में मेटाडेटा।
5. **खोज**: क्वेरी को एम्बेड करता है, निकटतम पड़ोसियों को ढूंढता है, रैंक किए गए परिणाम लौटाता है।

## प्रदर्शन

| मेट्रिक | Value |
| -------- | ------- |
| इंडेक्स आकार | ~1KB प्रति टुकड़ा |
| खोज विलंबता | 10,000 से अधिक टुकड़ों के लिए <100ms |
| त्वरित खोज | फ़ाइलनाम/प्रतीक के लिए <10ms |
| एम्बेडिंग गति | ~3-4s प्रति टुकड़ा (स्थानीय) |

## आर्किटेक्चर

```
file-compass/
├── file_compass/
│   ├── __init__.py      # Package init
│   ├── config.py        # Configuration
│   ├── embedder.py      # Ollama client with retry
│   ├── scanner.py       # File discovery
│   ├── chunker.py       # Multi-language AST chunking
│   ├── indexer.py       # HNSW + SQLite index
│   ├── quick_index.py   # Fast filename/symbol search
│   ├── explainer.py     # Result explanations
│   ├── merkle.py        # Incremental updates
│   ├── gateway.py       # MCP server
│   └── cli.py           # CLI
├── tests/               # 298 tests, 91% coverage
├── pyproject.toml
└── LICENSE
```

## सुरक्षा

- **इनपुट सत्यापन** - सभी MCP इनपुटों का सत्यापन किया जाता है।
- **पाथ ट्रैवर्सल सुरक्षा** - अनुमत निर्देशिकाओं के बाहर की फ़ाइलों को ब्लॉक किया जाता है।
- **एसक्यूएल इंजेक्शन रोकथाम** - केवल पैरामीटराइज़्ड क्वेरी का उपयोग किया जाता है।
- **त्रुटि सैनिटाइजेशन** - आंतरिक त्रुटियों को प्रदर्शित नहीं किया जाता है।

## विकास

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=file_compass --cov-report=term-missing

# Type checking
mypy file_compass/
```

## संबंधित परियोजनाएं

[**MCP टूल शॉप**](https://mcp-tool-shop.github.io/) का हिस्सा — एआई-संचालित विकास के लिए कॉम्पस सुइट:

- [टूल कॉम्पस](https://github.com/mcp-tool-shop-org/tool-compass) - सिमेंटिक MCP टूल खोज
- [इंटीग्रैडियो](https://github.com/mcp-tool-shop-org/integradio) - वेक्टर-एम्बेडेड ग्राडियो घटक
- [बैकप्रोपैगेट](https://github.com/mcp-tool-shop-org/backpropagate) - हेडलेस एलएलएम फाइन-ट्यूनिंग
- [कॉम्फी हेडलेस](https://github.com/mcp-tool-shop-org/comfy-headless) - कॉम्फीयूआई, लेकिन बिना जटिलता के

## सहायता

- **प्रश्न / सहायता:** [चर्चाएं](https://github.com/mcp-tool-shop-org/file-compass/discussions)
- **बग रिपोर्ट:** [समस्याएं](https://github.com/mcp-tool-shop-org/file-compass/issues)

## लाइसेंस

एमआईटी लाइसेंस - विवरण के लिए [लाइसेंस](LICENSE) देखें।

## कृतज्ञता

- स्थानीय एलएलएम अनुमान के लिए [ओलामा](https://ollama.com/)
- तेज़ वेक्टर खोज के लिए [hnswlib](https://github.com/nmslib/hnswlib)
- एम्बेडिंग के लिए [nomic-embed-text](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)
- मल्टी-लैंग्वेज एएसटी पार्सिंग के लिए [tree-sitter](https://tree-sitter.github.io/)
