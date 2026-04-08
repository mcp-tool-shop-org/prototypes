<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/edgepacks/readme.png" width="400" alt="EdgePacks" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/actions"><img src="https://github.com/mcp-tool-shop-org/edgepacks/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/edgepacks/"><img src="https://img.shields.io/badge/docs-landing%20page-brightgreen" alt="Landing Page" /></a>
</p>

छोटे मॉडलों को विशिष्ट कार्यों पर प्रशिक्षित करने के लिए टास्क-डेटासेट फाउंड्री।

## यह क्या है

यह विशिष्ट क्षमताओं के लिए संरचित, उच्च-गुणवत्ता वाले प्रशिक्षण डेटासेट का एक संग्रह है, जो लाइसेंस-अनुकूल है। प्रत्येक डेटासेट में पीढ़ी के नियम, सत्यापन नियम, मूल्यांकन सेट और सामान्य फाइन-ट्यूनिंग टूल के लिए निर्यात पथ शामिल हैं।

## यह क्या नहीं है

- एक सामान्य डेटासेट संग्रह
- एक HuggingFace रैपर
- एक प्रशिक्षण ढांचा

## इंस्टॉल करें

```bash
pip install edgepacks
```

## शुरुआत कैसे करें

```bash
# List available packs
edgepacks list

# Inspect a pack
edgepacks info tool-routing

# Build a dataset (requires Ollama running locally)
edgepacks build tool-routing --count 2000 --model qwen2.5:7b

# Export for your trainer
edgepacks export tool-routing --format unsloth --output ./data/
```

## डेटासेट लॉन्च करें

| पैकेज | टास्क | यह क्या प्रशिक्षित करता है |
|------|------|---------------|
| `tool-routing` | वर्गीकरण | एनएल अनुरोध → सही टूल + तर्क |
| `structured-extraction` | निकालना | अव्यवस्थित टेक्स्ट → संरचित JSON |
| `error-triage` | वर्गीकरण | त्रुटि लॉग → कारण + गंभीरता + अगला कदम |

## आर्किटेक्चर

तीन परतें:

1. **स्कीमा** — एक डेटासेट पैकेज क्या है, इसके लिए औपचारिक विनिर्देश
2. **फाउंड्री** — वह मशीनरी जो डेटासेट बनाती है, मान्य करती है और विभाजित करती है
3. **डिलीवरी** — कमांड-लाइन इंटरफेस (CLI) + JSONL, HuggingFace, Unsloth, torchtune में निर्यात

## प्रत्येक पैकेज में शामिल हैं:

- टास्क परिभाषा + मानक स्कीमा
- प्रशिक्षण/सत्यापन/परीक्षण डेटासेट
- सकारात्मक और कठिन-नकारात्मक उदाहरण
- पीढ़ी की विधि (ओलामा के माध्यम से सिंथेटिक)
- सत्यापनकर्ता जो खराब या कम-गुणवत्ता वाले डेटा को अस्वीकार करता है
- मूल्यांकन सेट जो फाइन-ट्यूनिंग के बाद वास्तविक कौशल का परीक्षण करता है
- ऐसे प्रारूपों में निर्यात जो सीधे सामान्य टूल में उपयोग किए जा सकते हैं

## सुरक्षा और विश्वसनीयता

**डेटा:** केवल स्थानीय `.json` / `.jsonl` फाइलें, जो उपयोगकर्ता द्वारा निर्दिष्ट आउटपुट निर्देशिकाओं में होती हैं। प्रारंभिक उदाहरण पैकेज में शामिल हैं। उत्पन्न उदाहरण `./output/` या आपके द्वारा निर्दिष्ट पथ में लिखे जाते हैं।

**नेटवर्क:** सिंथेटिक पीढ़ी के लिए केवल स्थानीय ओलामा (`localhost:11434`) के लिए HTTP। कोई क्लाउड एपीआई नहीं, कोई टेलीमेट्री नहीं, कोई विश्लेषण नहीं। एक बार जब ओलामा उपलब्ध हो जाता है, तो यह पूरी तरह से ऑफलाइन काम करता है।

**डेटा नहीं:** कोई क्रेडेंशियल फाइलें नहीं, कोई सिस्टम फाइलें नहीं, कोई पर्यावरण चर नहीं। यह आपके द्वारा निर्दिष्ट आउटपुट निर्देशिका के बाहर डेटा नहीं पढ़ता या लिखता है।

कोई भी **टेलीमेट्री** एकत्र या भेजा नहीं जाता है।

## प्लेटफ़ॉर्म

- Python 3.11+
- Linux, macOS, Windows पर काम करता है
- `generate`, `mutate` और `build` कमांड के लिए केवल ओलामा की आवश्यकता है

## लाइसेंस

MIT

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा निर्मित।
