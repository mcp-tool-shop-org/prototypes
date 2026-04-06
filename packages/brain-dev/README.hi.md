<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/brain-dev/readme.png" width="400" alt="brain-dev" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/brain-dev/actions/workflows/test.yml"><img src="https://github.com/mcp-tool-shop-org/brain-dev/actions/workflows/test.yml/badge.svg" alt="Tests" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/brain-dev/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
  <a href="https://pypi.org/project/dev-brain/"><img src="https://img.shields.io/pypi/v/dev-brain" alt="PyPI" /></a>
  <a href="https://www.python.org/downloads/"><img src="https://img.shields.io/badge/python-3.11+-blue.svg" alt="Python 3.11+" /></a>
</p>

**डेवलपरों के लिए इंटेलिजेंस लेयर:** एमसीपी के माध्यम से कवरेज विश्लेषण, टेस्ट जेनरेशन, रिफैक्टरिंग के सुझाव, सुरक्षा ऑडिट और यूएक्स (उपयोगकर्ता अनुभव) संबंधी जानकारी प्रदान करता है।

## विशेषताएं।

- **9 विश्लेषण उपकरण:** — कवरेज में कमियां, व्यवहार विश्लेषण, परीक्षण निर्माण, रीफैक्टरिंग, उपयोगकर्ता अनुभव (यूएक्स) संबंधी जानकारी, सुरक्षा ऑडिट, और बहुत कुछ।
- **एएसटी-आधारित परीक्षण निर्माण:** — स्वचालित रूप से pytest परीक्षण बनाएं जिनमें ऐसे मॉक शामिल हों जो वास्तव में संकलित होते हैं।
- **सुरक्षा भेद्यता का पता लगाना:** — OWASP-शैली का स्कैनिंग, जिसमें SQL इंजेक्शन, कमांड इंजेक्शन और हार्डकोडेड सीक्रेट्स की जांच शामिल है।
- **दस्तावेज़ विश्लेषण:** — गुम दस्तावेज़ स्ट्रिंग (docstrings) ढूंढें और टेम्पलेट सुझाएं।
- **MCP के साथ एकीकरण:** — क्लाउड (Claude) और अन्य MCP क्लाइंट के साथ सहजता से एकीकृत होता है।

## स्थापना।

```bash
pip install dev-brain
```

या विकास के लिए:

```bash
git clone https://github.com/mcp-tool-shop-org/brain-dev.git
cd brain-dev
pip install -e ".[dev]"
```

## शुरुआत कैसे करें।

```bash
# Run the MCP server
dev-brain
```

अपने क्लाउड डेस्कटॉप कॉन्फ़िगरेशन (`claude_desktop_config.json`) में निम्नलिखित जोड़ें:

```json
{
  "mcpServers": {
    "dev-brain": {
      "command": "dev-brain"
    }
  }
}
```

## उपकरण।

### विश्लेषण उपकरण।

| उपकरण। | विवरण। |
| "Please provide the English text you would like me to translate into Hindi." | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने के लिए तैयार हूं। |
| `coverage_analyze` | अवलोकित रुझानों की तुलना परीक्षण कवरेज से करें, और कमियों की पहचान करें। |
| `behavior_missing` | उन उपयोगकर्ता व्यवहारों की पहचान करें जिन्हें कोड में शामिल नहीं किया गया है। |
| `refactor_suggest` | जटिलता, दोहराव और नामकरण के आधार पर, कोड को फिर से लिखने (रिफैक्टरिंग) का सुझाव दें। |
| `ux_insights` | उपयोगकर्ता अनुभव (यूएक्स) से संबंधित जानकारी व्यवहार के पैटर्न (जैसे, वेबसाइट छोड़ने की दर, त्रुटियां) का विश्लेषण करके प्राप्त करें। |

### उत्पादन उपकरण।

| उपकरण। | विवरण। |
| "Please provide the English text you would like me to translate into Hindi." | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| `tests_generate` | कवरेज में कमियों को दूर करने के लिए परीक्षणों के सुझाव उत्पन्न करें। |
| `smart_tests_generate` | AST (एब्स्ट्रैक्ट सिंटैक्स ट्री) पर आधारित pytest कोड जनरेशन, जिसमें उचित मॉक और फिक्स्चर शामिल हों। |
| `docs_generate` | बिना दस्तावेज़ वाले कोड के लिए दस्तावेज़ टेम्पलेट तैयार करें। |

### सुरक्षा उपकरण।

| उपकरण। | विवरण। |
| "Please provide the English text you would like me to translate into Hindi." | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने के लिए तैयार हूं। |
| `security_audit` | कमजोरियों की जांच करें (जैसे कि एसक्यूएल इंजेक्शन, कमांड इंजेक्शन, गोपनीय जानकारी, आदि)। |

### उपयोगी उपकरण।

| उपकरण। | विवरण। |
| "Please provide the English text you would like me to translate into Hindi." | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने के लिए तैयार हूं। |
| `brain_stats` | सर्वर के आंकड़े और कॉन्फ़िगरेशन प्राप्त करें। |

## उदाहरण के तौर पर उपयोग।

### सुरक्षा ऑडिट।

```python
# Via MCP client
result = await client.call_tool("security_audit", {
    "symbols": [
        {
            "name": "execute_query",
            "file_path": "db.py",
            "line": 10,
            "source_code": "cursor.execute(f\"SELECT * FROM users WHERE id = {user_id}\")"
        }
    ],
    "severity_threshold": "medium"
})
# Returns: SQL injection vulnerability detected (CWE-89)
```

### स्मार्ट परीक्षण निर्माण।

```python
result = await client.call_tool("smart_tests_generate", {
    "file_path": "/path/to/your/module.py"
})
# Returns complete pytest file with fixtures and mocks
```

## आर्किटेक्चर।

```
┌─────────────────────────────────────────────────────────────┐
│                      DEV BRAIN MCP SERVER                    │
├─────────────────────────────────────────────────────────────┤
│  Analyzers                                                   │
│  ├─ CoverageAnalyzer    (test gaps)                         │
│  ├─ BehaviorAnalyzer    (unhandled flows)                   │
│  ├─ RefactorAnalyzer    (complexity, naming)                │
│  ├─ UXAnalyzer          (dropoff, errors)                   │
│  ├─ DocsAnalyzer        (missing docs)                      │
│  └─ SecurityAnalyzer    (vulnerabilities)                   │
├─────────────────────────────────────────────────────────────┤
│  Generators                                                  │
│  ├─ TestGenerator       (skeleton tests)                    │
│  └─ SmartTestGenerator  (AST-based pytest)                  │
└─────────────────────────────────────────────────────────────┘
```

## सुरक्षा संबंधी संभावित खतरे का पता चला।

| श्रेणी। | गंभीरता। | CWE (सीडब्ल्यूई) |
| ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | "The quick brown fox jumps over the lazy dog."

"यह फुर्तीला भूरा लोमड़ी आलसी कुत्ते के ऊपर से कूदता है।" |
| एसक्यूएल इंजेक्शन (SQL Injection) | महत्वपूर्ण। | CWE-89: यह एक प्रकार की सुरक्षा भेद्यता है। |
| कमांड इंजेक्शन। | महत्वपूर्ण। | CWE-78: असुरक्षित फ़ाइल और फ़ोल्डर एक्सेस (Insecure File and Folder Access)। |
| असुरक्षित डीसीरियलाइजेशन (Insecure Deserialization) | महत्वपूर्ण। | CWE-502: यह एक प्रकार की सुरक्षा भेद्यता है। |
| पहले से निर्धारित गुप्त जानकारी। | ऊँचा। | CWE-798 |
| फ़ाइल पाथ ट्रैवर्सल। | ऊँचा। | CWE-22 |
| असुरक्षित क्रिप्टोकरेंसी। | माध्यम। | CWE-327: यह एक सुरक्षा भेद्यता (सिक्योरिटी वल्नेरेबिलिटी) का कोड है। |

## विकास।

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=dev_brain --cov-report=html

# Type checking (optional)
mypy dev_brain
```

## लाइसेंस।

एमआईटी लाइसेंस - विवरण के लिए [LICENSE](LICENSE) देखें।

---

यह उपकरण <a href="https://mcp-tool-shop.github.io/">MCP टूल शॉप</a> द्वारा बनाया गया है।
