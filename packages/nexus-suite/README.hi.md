<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nexus-suite/readme.png" alt="Nexus Suite" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nexus-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**एमसीपी टूल इकोसिस्टम के लिए शासन, प्रमाणीकरण और रूटिंग इंफ्रास्ट्रक्चर।**

---

## एक नज़र में

- **प्रमाणीकरण:** `nexus-attest` के साथ टूल के आउटपुट पर हस्ताक्षर करें और उन्हें सत्यापित करें।
- **शासन:** `nexus-control` के साथ नीतियां परिभाषित करें और लागू करें।
- **रूटिंग:** `nexus-router` के साथ प्लग करने योग्य एडेप्टर के माध्यम से अनुरोधों को भेजें।
- **मॉड्यूलर:** छह स्वतंत्र पैकेज, आप जो चाहें उसका उपयोग करें।
- **पायथन मूल:** मानक `pip install -e .` वर्कफ़्लो, परीक्षण के लिए `pytest`।

---

## परियोजनाएं

| पैकेज | विवरण |
| --------- | ------------- |
| `nexus-attest` | प्रमाणीकरण हस्ताक्षर और सत्यापन |
| `nexus-control` | शासन नीतियों के लिए नियंत्रण प्रणाली |
| `nexus-router` | अनुरोध रूटिंग और प्रेषण |
| `nexus-router-adapter-stdout` | स्टैंडर्ड आउटपुट (stdout) परिवहन के लिए राउटर एडेप्टर |
| `nexus-router-adapter-http` | एचटीटीपी परिवहन के लिए राउटर एडेप्टर |
| `nexus-router-adapter-template` | कस्टम एडेप्टर बनाने के लिए टेम्पलेट |

---

## शुरुआत कैसे करें

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/nexus-suite.git
cd nexus-suite

# Install a component
cd src/nexus-router
pip install -e .

# Run tests
pytest
```

---

## आर्किटेक्चर

```
┌─────────────────────────────────────────────────────────────┐
│                     nexus-control                            │
│              (governance policies, config)                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-router                             │
│              (request dispatch + routing)                    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   stdout    │      │    http     │      │  (custom)   │
│   adapter   │      │   adapter   │      │   adapter   │
└─────────────┘      └─────────────┘      └─────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-attest                             │
│              (signature verification)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## लाइसेंस

[एमआईटी](LICENSE)
