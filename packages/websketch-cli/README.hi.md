<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.ja.md">日本語</a> ·
  <a href="README.zh.md">中文</a> ·
  <a href="README.es.md">Español</a> ·
  <a href="README.fr.md">Français</a> ·
  <a href="README.hi.md">हिन्दी</a> ·
  <a href="README.it.md">Italiano</a> ·
  <a href="README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-cli/readme.png" alt="WebSketch CLI" width="400"></p>

<p align="center"><strong>CLI for WebSketch IR — render, diff, and fingerprint web UI captures so LLMs and CI pipelines can reason about what users see.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-cli/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/websketch"><img src="https://img.shields.io/npm/v/@mcptoolshop/websketch.svg" alt="npm version"></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT">
  <a href="https://mcp-tool-shop-org.github.io/websketch-cli/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

## संक्षेप में।

- **एएससीआईई रेंडरिंग:** किसी भी वेबस्केच कैप्चर को एक बॉक्स-ड्राइंग लेआउट में बदलें जो किसी टर्मिनल या एलएलएम संदर्भ विंडो में फिट हो सके।
- **संरचनात्मक फिंगरप्रिंटिंग:** किसी पृष्ठ के लेआउट का हैश बनाएं ताकि आप पिक्सेल की तुलना किए बिना परिवर्तनों का पता लगा सकें।
- **सिमेंटिक अंतर:** दो कैप्चर की तुलना करें और एक रैंक किए गए परिवर्तन रिपोर्ट प्राप्त करें (जोड़े गए, स्थानांतरित किए गए, आकार बदले गए, पाठ में परिवर्तन)।
- **बंडल पैकेजिंग:** कैप्चर (और वैकल्पिक अंतर) को एक ही साझा करने योग्य `.ws.json` फ़ाइल में संयोजित करें।
- **पाइपलाइन-प्रथम:** प्रत्येक कमांड `--json` आउटपुट और सीआई स्क्रिप्टिंग के लिए नियतात्मक एग्जिट कोड का समर्थन करता है।
- **एलएलएम-अनुकूलित मोड:** `--llm` फ़्लैग मेटाडेटा से भरपूर आउटपुट उत्पन्न करता है जो एजेंटों के उपयोग के लिए डिज़ाइन किया गया है।

## स्थापित करें।

```bash
pnpm add -g @mcptoolshop/websketch
```

या फिर, इसे बिना स्थापित किए चलाएं:

```bash
npx @mcptoolshop/websketch render capture.json
```

## कमांड्स (आदेश)

### सत्यापित करना।

जांच करें कि क्या कैप्चर फ़ाइल वेबस्केच आईआर स्कीमा के अनुरूप है।

```bash
websketch validate capture.json
```

### रेंडर-एएससीआई (render-ascii) - यह एक ऐसा उपकरण या प्रक्रिया हो सकती है जो एएससीआई (ASCII) वर्णों का उपयोग करके किसी छवि या डेटा को प्रदर्शित करता है।

एक छवि को एएससीआईआई कला में बदलें (जो एलएलएम द्वारा पढ़ी जा सके)।

```bash
# Default 80x24 grid
websketch render-ascii capture.json

# LLM-optimized format with metadata and legend
websketch render-ascii --llm capture.json

# Custom dimensions
websketch render-ascii --width 120 --height 40 capture.json

# Minimal structure-only view
websketch render-ascii --structure capture.json
```

Certainly, I understand. Please provide the English text you would like me to translate into Hindi. I will do my best to provide an accurate and culturally sensitive translation.

```
+---------------------------------------------------------------------------+
|[NAV:primary_nav]                                                          |
+---------------------------------------------------------------------------+
|                    +----------------------------------------+             |
|                    |[FRM:login]                             |             |
|                    |  [INP:email]                           |             |
|                    |  [INP:password]                        |             |
|                    |  [BTN:primary_cta]                     |             |
|                    +----------------------------------------+             |
+---------------------------------------------------------------------------+
```

### उंगलियों के निशान।

तुलना के लिए, संरचनात्मक विशेषताओं का एक 'फिंगरप्रिंट' तैयार करें।

```bash
# Full fingerprint (includes text)
websketch fingerprint capture.json
# Output: e33442b6

# Layout-only fingerprint (ignores text changes)
websketch fingerprint --layout-only capture.json
```

### अंतर।

दो अलग-अलग रिकॉर्डिंग की तुलना करें और उनमें हुए परिवर्तनों की रिपोर्ट तैयार करें।

```bash
# Human-readable diff report
websketch diff before.json after.json

# JSON output
websketch diff --json before.json after.json

# Layout-only (ignore text changes)
websketch diff --layout-only before.json after.json

# Custom match threshold
websketch diff --threshold 0.7 before.json after.json
```

### बंडल।

एक या एक से अधिक कैप्चर को एक साझा करने योग्य `.ws.json` फ़ाइल में समूहित करें। जब बिल्कुल दो कैप्चर प्रदान किए जाते हैं, तो यह बंडल स्वचालित रूप से एक अंतर सारांश (diff summary) शामिल करता है।

```bash
websketch bundle capture.json -o bundle.ws.json
websketch bundle before.json after.json -o bundle.ws.json
```

## पाइपलाइन मोड।

किसी भी कमांड के आगे `--json` जोड़ें ताकि मशीन द्वारा आसानी से पढ़ी जा सकने वाली आउटपुट प्राप्त हो सके:

```bash
websketch --json validate capture.json
websketch --json render capture.json
websketch --json fingerprint capture.json
websketch --json diff before.json after.json
```

**सफलता:** `{ "ok": true, ... }`

**त्रुटि:** `{ "ok": false, "error": { "code": "WS_...", "message": "..." } }`

JSON मोड में भी एग्जिट कोड लागू होते हैं - स्क्रिप्ट में `$?` या `set -e` का उपयोग करें।

## निकास कोड।

| Code | अर्थ। |
| "Please provide the English text you would like me to translate into Hindi." | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| 0 | सफलता। |
| 1 | सत्यापन/डेटा त्रुटि (खराब JSON, अमान्य डेटा, अज्ञात कमांड)। |
| 2 | फ़ाइल सिस्टम में त्रुटि (फ़ाइल नहीं मिली, अनुमति अस्वीकृत, इनपुट/आउटपुट त्रुटि)। |

## रिकॉर्डिंग का प्रारूप।

यह कमांड-लाइन इंटरफेस (सीएलआई) वेबस्केच आईआर कैप्चर फ़ाइलों (JSON) के साथ काम करता है। कैप्चर बनाने के लिए, निम्नलिखित का उपयोग करें:

- [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) -- क्रोम एक्सटेंशन जो एक क्लिक पर वेब पेज को कैप्चर करने की सुविधा देता है।
- [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) -- प्रोग्रामेटिक रूप से कैप्चर बनाने की सुविधा।

## दस्तावेज़।

| दस्तावेज़। | विवरण। |
| ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने के लिए तैयार हूं। |
| [HANDBOOK.md](HANDBOOK.md) | गहन जानकारी: आर्किटेक्चर, कमांड, पाइपलाइन पैटर्न, और एकीकरण। |
| [CONTRIBUTING.md](CONTRIBUTING.md) | योगदान कैसे करें, विकास परिवेश (डेवलपमेंट सेटअप), पुल रिक्वेस्ट दिशानिर्देश। |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | सामुदायिक नियम। |
| [CHANGELOG.md](CHANGELOG.md) | रिलीज़ का इतिहास। |

## लाइसेंस।

एमआईटी।
