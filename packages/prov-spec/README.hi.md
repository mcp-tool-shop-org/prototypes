> ⚠️ **यह रिपॉजिटरी अब [accessibility-suite](https://github.com/mcp-tool-shop-org/accessibility-suite) पर स्थानांतरित हो गई है।**
> स्रोत अब `docs/prov-spec/` पर उपलब्ध है।

---

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/prov-spec/readme.png" alt="Prov-Spec — Provenance Specification Framework" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="spec/PROV_METHODS_SPEC.md"><img src="https://img.shields.io/badge/spec-v0.1.0-blue" alt="Spec Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/prov-spec/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

यह एक औपचारिक, संस्करणित विनिर्देश और अनुपालन पैकेज है, जो प्रूवेनेंस मेथड आईडी, रिकॉर्ड और सत्यापन के लिए है।

---

## यह क्या है?

यह एक मानक विनिर्देश है जो निम्नलिखित को परिभाषित करता है:
- **मेथड आईडी** — प्रूवेनेंस कार्यों के लिए स्थिर, नामस्थान वाले पहचानकर्ता।
- **प्रूवेनेंस रिकॉर्ड** — टूल के उपयोग को दर्शाने वाले संरचित JSON दस्तावेज़।
- **अनुपालन स्तर** — परीक्षण योग्य अनुपालन स्तर।
- **परीक्षण वेक्टर** — इंटरऑपरेबिलिटी के लिए मानक इनपुट/आउटपुट।

## यह क्या नहीं है?

- यह कोई फ्रेमवर्क नहीं है।
- यह कोई SDK नहीं है।
- यह MCP-विशिष्ट नहीं है।
- यह Python-विशिष्ट नहीं है।

## यह किसके लिए है?

- **इंजन लेखक** — किसी भी भाषा में प्रूवेनेंस को लागू करें।
- **टूल इंटीग्रेटर** — मौजूदा टूल को प्रूवेनेंस के साथ एकीकृत करें।
- **ऑडिटर** — प्रूवेनेंस दावों को सत्यापित करें।
- **इंफ्रास्ट्रक्चर बिल्डर** — प्रूवेनेंस-जागरूक सिस्टम बनाएं।

---

## स्थिरता गारंटी

> **`stable` चिह्नित मेथड आईडी केवल जोड़ने योग्य हैं और उनका अर्थ कभी नहीं बदलेगा।**
> **एक प्रमुख संस्करण के भीतर अनुकूलता की गारंटी है।**

---

## शुरुआत कैसे करें

### 10 सेकंड में सत्यापित करें।

```bash
# Clone and run a test vector
git clone https://github.com/mcp-tool-shop-org/prov-spec
cd prov-spec
python tools/python/prov_validator.py check-vector integrity.digest.sha256
```

अपेक्षित आउटपुट: `INFO: Test vector integrity.digest.sha256 passed`

---

### 1. विनिर्देश को समझें

[`spec/PROV_METHODS_SPEC.md`](spec/PROV_METHODS_SPEC.md) पढ़ें — यह मानक विनिर्देश है।

### 2. कैटलॉग की जांच करें

[`spec/methods.json`](spec/methods.json) ब्राउज़ करें — मशीन-पठनीय मेथड रजिस्ट्री।

### 3. अनुपालन घोषित करें

अपने प्रोजेक्ट में `prov-capabilities.json` फ़ाइल जोड़ें:

```json
{
  "schema": "prov-capabilities@v0.1",
  "engine": {
    "name": "your-engine",
    "version": "1.0.0"
  },
  "implements": [
    "adapter.wrap.envelope_v0_1",
    "integrity.digest.sha256"
  ],
  "conformance_level": "fully-conformant"
}
```

### 4. सत्यापित करें (वैकल्पिक)

संदर्भ सत्यापनकर्ता का उपयोग करें:

```bash
# List known methods
python -m prov_validator list-methods

# Validate a provenance record
python -m prov_validator validate-methods record.json --strict

# Run test vectors
python -m prov_validator check-vector integrity.digest.sha256
```

---

## रिपॉजिटरी संरचना

```
prov-spec/
├── spec/                    # Normative specification
│   ├── PROV_METHODS_SPEC.md # Main specification document
│   ├── methods.json         # Machine-readable method catalog
│   ├── schemas/             # JSON Schemas
│   │   ├── prov.record.schema.v0.1.json
│   │   ├── artifact.schema.v0.1.json
│   │   ├── evidence.schema.v0.1.json
│   │   ├── mcp.envelope.schema.v0.1.json
│   │   └── prov-capabilities.schema.json
│   └── vectors/             # Test vectors
│       ├── integrity.digest.sha256/
│       ├── adapter.wrap.envelope_v0_1/
│       └── ...
├── tools/                   # Reference implementations (optional)
│   └── python/              # Python reference validator
├── examples/                # Example files
├── CONFORMANCE_LEVELS.md    # Conformance tiers
└── CHANGELOG.md             # Version history
```

**ध्यान दें:** संदर्भ उपकरण सुविधा के लिए प्रदान किए गए हैं और अनुपालन के लिए आवश्यक नहीं हैं।

---

## अनुपालन स्तर

| Level | Name | आवश्यकताएं |
| ------- | ------ | -------------- |
| **1** | अखंडता | `integrity.digest.*` विधियाँ |
| **2** | इंजन | स्तर 1 + `engine.*` विधियाँ |
| **3** | उत्पत्ति | स्तर 2 + `lineage.*` विधियाँ |

विस्तार के लिए [`CONFORMANCE_LEVELS.md`](CONFORMANCE_LEVELS.md) देखें।

---

## मेथड नेमस्पेस

| नेमस्पेस | उद्देश्य |
| ----------- | --------- |
| `adapter.*` | एनवेलप रैपिंग, परिवहन |
| `engine.*` | सबूत निष्कर्षण, प्रूवेनेंस निर्माण |
| `integrity.*` | हैशिंग, हस्ताक्षर, सत्यापन |
| `lineage.*` | पैरेंट लिंकिंग, ग्राफ ऑपरेशन |

भविष्य के उपयोग के लिए आरक्षित: `policy.*`, `attestation.*`, `execution.*`, `audit.*`

---

## संस्करण

- **विनिर्देश संस्करण:** `v0.1.0`
- **मेथड कैटलॉग:** प्रमुख संस्करण के भीतर केवल जोड़ने योग्य।
- **स्कीमा:** `additionalProperties: false` — पैच के भीतर आगे-संगत।

---

## योगदान

1. नई मेथड आईडी: उपयोग के मामले के साथ एक मुद्दा खोलें।
2. विनिर्देश स्पष्टीकरण: `spec/` में PR सबमिट करें।
3. संदर्भ उपकरण: `tools/` में PR सबमिट करें।

मेथड आईडी के लिए वास्तविक दुनिया के औचित्य की आवश्यकता होती है। हम अनुमानित रूप से आईडी नहीं जोड़ते हैं।

---

## लाइसेंस

MIT — [LICENSE](LICENSE) देखें।

---

## संदर्भ

- [PROV_METHODS_SPEC.md](spec/PROV_METHODS_SPEC.md) — मानक विनिर्देश
- [PROV_METHODS_CATALOG.md](spec/PROV_METHODS_CATALOG.md) — मानव-पठनीय कैटलॉग
- [CONFORMANCE_LEVELS.md](CONFORMANCE_LEVELS.md) — अनुपालन स्तर
- [MCP_COMPATIBILITY.md](spec/MCP_COMPATIBILITY.md) — MCP एनवेलप अनुकूलता
