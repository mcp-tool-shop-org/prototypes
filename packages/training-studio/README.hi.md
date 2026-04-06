<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# ट्रेनिंग स्टूडियो

[![CI](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/mcp-tool-shop-org/training-studio)](LICENSE)
[![Landing Page](https://img.shields.io/badge/Landing_Page-live-blue)](https://mcp-tool-shop-org.github.io/training-studio/)

**अपने ब्राउज़र में सीधे मशीन लर्निंग मॉडल को प्रशिक्षित करें। किसी क्लाउड की आवश्यकता नहीं। कोई डेटा अपलोड नहीं। कोई पायथन सेटअप नहीं।**

ट्रेनिंग स्टूडियो एक TensorFlow.js-आधारित एमएल प्रशिक्षण एप्लिकेशन है जो पूरी तरह से स्थानीय रूप से चलता है। आपका डेटा कभी भी आपके डिवाइस को नहीं छोड़ता है।

## ट्रेनिंग स्टूडियो क्यों?

| समस्या | समाधान |
| --------- | ---------- |
| पायथन वातावरण की जटिलताएं | **शून्य सेटअप** - बस खोलें और प्रशिक्षित करें |
| क्लाउड एमएल के साथ गोपनीयता संबंधी चिंताएं | **100% स्थानीय** - डेटा कभी भी आपके डिवाइस को नहीं छोड़ता |
| जटिल एमएल उपकरण | **सरल कार्यप्रवाह** - CSV इनपुट, प्रशिक्षित मॉडल आउटपुट |
| धीमी पुनरावृत्ति चक्र | **वास्तविक समय में प्रतिक्रिया** - लाइव चार्ट और मेट्रिक्स |

## विशेषताएं

### कोर प्रशिक्षण
- **CSV डेटासेट लोड करें** - स्वचालित फीचर/लेबल का पता लगाना
- **MLP मॉडल कॉन्फ़िगर करें** - छिपी हुई परतें, सक्रियण, ड्रॉपआउट
- **वास्तविक समय प्रशिक्षण चार्ट** - हानि और सटीकता का दृश्य
- **अर्ली स्टॉपिंग** - स्वचालित अभिसरण का पता लगाना
- **GPU त्वरण** - तेज़ प्रशिक्षण के लिए WebGPU/WebGL

### मूल्यांकन और भविष्यवाणी
- **भ्रम मैट्रिक्स** - दृश्य वर्गीकरण प्रदर्शन
- **प्रति-वर्ग मेट्रिक्स** - परिशुद्धता, रिकॉल, F1 स्कोर
- **एकल भविष्यवाणियां** - व्यक्तिगत नमूनों का परीक्षण करें
- **बैच अनुमान** - CSV फ़ाइलों पर भविष्यवाणी करें
- **परिणाम निर्यात करें** - भविष्यवाणियों को CSV के रूप में डाउनलोड करें

### डेटा उपकरण
- **प्रीप्रोसेसिंग** - सामान्यीकरण, गुम मानों का प्रबंधन
- **वन-हॉट एन्कोडिंग** - स्वचालित श्रेणीबद्ध रूपांतरण
- **ट्रेन/टेस्ट स्प्लिट** - कॉन्फ़िगर करने योग्य सत्यापन प्रतिशत
- **प्रशिक्षण इतिहास** - रन की तुलना करें, सर्वोत्तम मॉडल खोजें

### उत्पादन के लिए तैयार
- **283 परीक्षण** - व्यापक परीक्षण कवरेज
- **पहुंच योग्य** - WCAG 2.1 AA आधार
- **उत्तरदायी** - टैबलेट और मोबाइल पर काम करता है
- **ऑफ़लाइन सक्षम** - इंस्टॉलेशन के बाद इंटरनेट की आवश्यकता नहीं

## स्थापना

### स्रोत से

```bash
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web
npm install
npm run build
```

## क्विकस्टार्ट

### एक बंडल को मान्य करें (30 सेकंड)

```bash
# From source
npm run validate ./src/tests/fixtures/golden-v1

# JSON output
training-studio validate --json ./my-bundle
```

### JSON आउटपुट

```json
{
  "ok": true,
  "exit_code": 0,
  "bundle_id": "00000000-0000-4000-8000-000000000001",
  "bundle_digest": "719823b86e10fe388aa8a9b14cb135624e73c253dc69f5065f78871403c3df3f",
  "version": "0.1",
  "schema_uri": "https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json",
  "schema_version": "0.1",
  "errors": [],
  "warnings": [],
  "stats": {
    "files_total": 7,
    "artifacts_listed": 6,
    "artifacts_verified": 6
  }
}
```

### एग्जिट कोड

| Code | अर्थ |
| ------ | --------- |
| 0 | वैध बंडल |
| 2 | चेतावनी के साथ वैध |
| 3 | अवैध बंडल |

## बंडल प्रारूप

पूर्ण बंडल विनिर्देश के लिए [SPEC.md](SPEC.md) देखें।

### डायरेक्टरी संरचना

```
bundle/
├── bundle.json           # Manifest
├── model/
│   ├── model.json        # TF.js topology
│   └── weights.bin       # Model weights
├── metrics/
│   ├── metrics.jsonl     # Per-epoch metrics
│   └── summary.json      # Training summary
├── config/
│   └── run_config.json   # Hyperparameters
└── data/
    └── schema.json       # Feature/label schema
```

## क्विक स्टार्ट (वेब ऐप)

```bash
cd TrainingStudio.Web
npm install
npm run dev
```

फिर अपने ब्राउज़र में http://localhost:5173 खोलें।

### नमूना डेटा के साथ प्रयास करें

1. **डेटासेट** टैब पर क्लिक करें
2. `sample_data/iris.csv` लोड करें
3. विशेषताएं चुनें: sepal_length, sepal_width, petal_length, petal_width
4. लेबल चुनें: species
5. **मॉडल** टैब पर जाएं, डिफ़ॉल्ट का उपयोग करें (64, 32 छिपी हुई परतें)
6. **प्रशिक्षण** टैब पर जाएं, **प्रशिक्षण शुरू करें** पर क्लिक करें
7. वास्तविक समय में चार्ट को अपडेट होते हुए देखें!

## डेस्कटॉप ऐप (विंडोज)

```bash
cd TrainingStudio.Web && npm run build
cd ../TrainingStudio.App
dotnet build -c Release
dotnet run
```

विंडोज 10 1809+, 4 जीबी रैम (8 जीबी अनुशंसित), WebGL 2.0 या WebGPU वाला GPU (वैकल्पिक, CPU बैकअप) की आवश्यकता है।

## विकास

```bash
cd TrainingStudio.Web

# Run all 283 tests
npm test

# Watch mode
npm test -- --watch

# Build production web app
npm run build
```

## प्रलेखन

| दस्तावेज़ | विवरण |
| ---------- | ------------- |
| [SPEC.md](SPEC.md) | बंडल प्रारूप विनिर्देश |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | सामान्य समस्याएं और समाधान |
| [CHANGELOG.md](CHANGELOG.md) | संस्करण इतिहास |
| [ROADMAP.md](ROADMAP.md) | विकास योजना |
| [CONTRIBUTING.md](CONTRIBUTING.md) | योगदान कैसे करें |

## नमूना डेटासेट

| File | Task | विशेषताएं | वर्ग |
| ------ | ------ | ---------- | --------- |
| `sample_data/iris.csv` | बहु-वर्ग वर्गीकरण | 4 | 3 |
| `sample_data/binary_classification.csv` | द्विआधारी वर्गीकरण | 2 | 2 |

## गोपनीयता और सुरक्षा

- **शून्य डेटा संग्रह** - आपका डेटा आपके डिवाइस पर ही रहता है।
- **कोई टेलीमेट्री नहीं** - हम उपयोग की निगरानी नहीं करते हैं।
- **ऑफ़लाइन कार्यक्षमता** - इंटरनेट के बिना काम करता है।
- **ओपन सोर्स** - आप स्वयं कोड की जांच कर सकते हैं।

विस्तृत जानकारी के लिए [PRIVACY.md](PRIVACY.md) और [SECURITY.md](SECURITY.md) देखें।

## लाइसेंस

एमआईटी - विस्तृत जानकारी के लिए [LICENSE](LICENSE) देखें।

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/) द्वारा निर्मित।
