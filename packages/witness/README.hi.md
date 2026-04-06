<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/witness/readme.png" alt="Witness" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/witness/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/witness/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://pypi.org/project/xrpl-witness/"><img src="https://img.shields.io/pypi/v/xrpl-witness" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/witness/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**स्थिति: v0.1.0 — पहला चरण पूरा, दूसरा चरण 2A जारी**

यह एक ऐसा उपकरण है जो स्थानीय रूप से काम करता है, केवल डेटा जोड़ता है, और क्रिप्टोग्राफिक रूप से सत्यापित किया जा सकता है, जो मानव और कृत्रिम बुद्धिमत्ता के बीच सहयोग के लिए उपयोगी है।

## आज आप क्या कर सकते हैं

```bash
# Generate a testimony report
witness testify --format json --emit-artifact ./output

# Verify events cryptographically
witness verify

# Include exact stored JSON for deep audits
witness testify --format json --include-events
```

**तीसरे पक्ष 'विटनेस' स्थापित किए बिना भी गवाही को सत्यापित कर सकते हैं** — JSON स्कीमा और सत्यापन नियम पूरी तरह से प्रलेखित हैं।

## यह क्यों महत्वपूर्ण है

'विटनेस' पोर्टेबल प्रमाण पथ बनाता है:
- **निश्चित**: समान इनपुट → समान आउटपुट बाइट्स (पुनरुत्पादन के लिए `--generated-at` का उपयोग करें)
- **सत्यापित**: Ed25519 हस्ताक्षर + मानक JSON पर SHA-256 डाइजेस्ट
- **पोर्टेबल**: इसे ईमेल करें, टिकटों में संलग्न करें, या रिपॉजिटरी में जोड़ें
- **सटीक**: `--include-events` विकल्प का उपयोग करके, डेटा को बाइट-दर-बाइट संग्रहीत किया जाता है।

## शुरुआत कैसे करें

```bash
# Install
pip install cryptography

# Initialize a store
witness init

# Record an event
witness record --action "example.action" --intent "Demonstrate recording"

# Generate testimony
witness testify --format md

# Verify all events
witness verify
```

## विश्वास मॉडल

सभी क्रिप्टोग्राफिक क्रियाएं **मानक JSON** का उपयोग करती हैं → **SHA-256 डाइजेस्ट** → **Ed25519 हस्ताक्षर**।

[VERIFICATION.md](VERIFICATION.md) में देखें:
- सटीक क्रमबद्धता नियम
- सत्यापन के उदाहरण
- एग्जिट कोड (0 = ठीक, 2 = ध्वज, 3 = क्रिप्टोग्राफिक त्रुटि)
- `--include-events` के लिए गोपनीयता संबंधी नोट्स

## स्थिर गारंटी

| आर्टिफैक्ट | स्थान | अनुबंध |
|----------|----------|----------|
| इवेंट स्कीमा | गोल्डन फिक्स्चर | `tests/fixtures/golden/*.json` |
| गवाही स्कीमा | `schemas/testimony.schema.v0.1.json` | JSON आउटपुट संरचना |
| एग्जिट कोड | [VERIFICATION.md](VERIFICATION.md) | 0/2/3 का अर्थ |
| Flags | [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | 4 प्रकार के ध्वज, केवल सूचनात्मक |

## दस्तावेज़

> **यहां से शुरुआत करें:** [CONTRACT.md](CONTRACT.md) — कानून क्या है बनाम उदाहरण

| दस्तावेज़ | उद्देश्य |
|----------|---------|
| [CONTRACT.md](CONTRACT.md) | मानक बनाम उदाहरण सामग्री |
| [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) | निश्चित अपरिवर्तनीय |
| [VERIFICATION.md](VERIFICATION.md) | क्रिप्टो नियम + उदाहरण |
| [docs/](docs/README.md) | पूर्ण दस्तावेज़ अनुक्रमणिका |

## चरण 2 की स्थिति

| Track | स्थिति |
|-------|--------|
| **2A: गवाही को आर्टिफैक्ट के रूप में** | ✅ जारी |
| **2B: पाइपलाइन** | ⏸️ रोका गया ([RFC](docs/RFC_PHASE2_PIPELINES.md)) |
| 2C–2E | शुरू नहीं हुआ |

अधिक जानकारी के लिए [docs/PHASE2_STATUS.md](docs/PHASE2_STATUS.md) देखें।

## परियोजना संरचना

```
witness/
├── src/witness/           # Core library
│   ├── canon.py           # Canonical JSON
│   ├── crypto.py          # Ed25519 signing/verification
│   ├── storage.py         # SQLite append-only store
│   ├── timeline.py        # Flag analysis
│   ├── testify.py         # Testimony generation
│   └── cli.py             # Command-line interface
├── schemas/               # JSON schemas
├── tests/                 # Test suite (124 tests)
│   └── fixtures/golden/   # Authoritative fixtures
├── tools/                 # Verification utilities
└── docs/                  # Documentation + ADRs
```

## दर्शन

> 'विटनेस' का उद्देश्य सत्यनिष्ठा है, निर्णय नहीं।
> रिकॉर्ड करें कि क्या हुआ। बाद में इसकी पुष्टि करें। मनुष्यों को यह तय करने दें कि इसका क्या अर्थ है।

## लाइसेंस

MIT — [LICENSE](LICENSE) देखें।
