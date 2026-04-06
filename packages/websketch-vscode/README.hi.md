<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <strong>English</strong> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.ja.md">日本語</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.zh.md">中文</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.es.md">Español</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.fr.md">Français</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.hi.md">हिन्दी</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.it.md">Italiano</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-vscode/readme.png" alt="WebSketch" width="400"></p>

<p align="center"><strong>Turn any web page into a structured tree that LLMs can actually understand.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.websketch-vscode.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode"><img src="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> &middot;
  <a href="#the-solution">The Solution</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-reads">How It Reads</a> &middot;
  <a href="#use-cases">Use Cases</a> &middot;
  <a href="#ecosystem">Ecosystem</a>
</p>

---

## समस्या

आप चाहते हैं कि एक LLM (बड़े भाषा मॉडल) किसी वेब पेज के बारे में तर्क करे - इसका लेआउट, नेविगेशन, इंटरैक्टिव तत्व, सामग्री का पदानुक्रम। आपके वर्तमान विकल्पों में से कोई भी पूरी तरह से उपयुक्त नहीं है:

| दृष्टिकोण | टोकन | आप क्या खो देते हैं |
|----------|--------|---------------|
| **Screenshot** | 1,000+ (दृष्टि) | छोटे टेक्स्ट को नहीं पढ़ पाता, लेआउट का अनुमान लगाता है, इंटरैक्टिविटी के बारे में कोई जानकारी नहीं। |
| **Raw HTML** | 50,000-500,000 | `div` के ढेर, इनलाइन शैलियाँ, स्क्रिप्ट, SVG शोर में उलझ जाता है। |
| **Readability extract** | 2,000-10,000 | सभी संरचना को हटा देता है - कोई नेविगेशन नहीं, कोई बटन नहीं, कोई फॉर्म नहीं। |
| **DOM dump** | 10,000-100,000 | हर जगह क्लास नाम, डेटा एट्रीब्यूट, फ्रेमवर्क आर्टिफैक्ट। |

मुख्य मुद्दा: **इनमें से कोई भी UI (यूजर इंटरफेस) की भाषा नहीं समझता है।** LLM को `<div class="sc-bdnxRM jJFqsI">` की आवश्यकता नहीं है - उन्हें `NAV`, `BUTTON`, `CARD`, `LIST` की आवश्यकता है।

## समाधान

WebSketch 23 UI प्रिमिटिव का उपयोग करके पेज को एक **सिमेंटिक ट्री** में बदल देता है। VS Code में एक क्लिक, किसी भी LLM में पेस्ट करें:

```
PAGE
├─ HEADER {sticky}
│  ├─ *LINK "Home"
│  ├─ *LINK "Products"
│  ├─ *LINK "Pricing"
│  └─ *INPUT <search> "Search..."
├─ SECTION <main>
│  ├─ TEXT <h1> "Welcome to Acme"
│  ├─ TEXT "Build faster with our platform..."
│  └─ *BUTTON "Get Started"
├─ LIST (3 items)
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "Real-time sync across devices"
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "99.9% uptime guarantee"
│  └─ CARD
│     ├─ IMAGE "Feature icon"
│     └─ TEXT "Enterprise-grade security"
└─ FOOTER
   ├─ NAV
   │  ├─ *LINK "Terms"
   │  ├─ *LINK "Privacy"
   │  └─ *LINK "Contact"
   └─ TEXT "© 2026 Acme Inc."
```

**200-800 टोकन।** 50,000 नहीं। कोई पिक्सेल ग्रिड नहीं। एक साफ ट्री जिसे कोई भी टेक्स्ट मॉडल समझ सकता है।

### तुलनात्मक विश्लेषण

| मापदंड | WebSketch | कच्चा HTML | स्क्रीनशॉट |
|--------|-----------|----------|------------|
| **Tokens** | 200-800 | 50,000+ | 1,000+ (दृष्टि) |
| **Structure** | पूरी सिमेंटिक ट्री | नेस्टेड `div` का अराजकता | पिक्सेल ग्रिड |
| **Text content** | उद्धृत, लेबल किया गया | मार्कअप में दफन | OCR (ऑप्टिकल कैरेक्टर रिकॉग्निशन) पर निर्भर |
| **Interactive elements** | `*` से चिह्नित | एट्रीब्यूट में छिपा हुआ | अदृश्य |
| **Heading hierarchy** | `<h1>` से `<h6>` | क्लास नामों में खो गया | आकार से अनुमानित |
| **Landmarks** | `<main>`, `<nav>`, `<search>` | DOM (डॉक्यूमेंट ऑब्जेक्ट मॉडल) विशेषज्ञता की आवश्यकता होती है | उपलब्ध नहीं |
| **Works with** | कोई भी टेक्स्ट LLM | कोई उपयोगी जानकारी नहीं | केवल विजन मॉडल |

## शुरुआत कैसे करें

1. [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode) से इंस्टॉल करें या निम्न कमांड चलाएं:
```
ext install mcp-tool-shop.websketch-vscode
```
2. कमांड पैलेट खोलें (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. **WebSketch: Capture URL** चलाएं
4. एक URL पेस्ट करें और एंटर दबाएं
5. **Copy for LLM** पर क्लिक करें और इसे अपने प्रॉम्प्ट में पेस्ट करें

LLM टैब डिफ़ॉल्ट दृश्य है। एक क्लिक से ट्री आपके क्लिपबोर्ड में कॉपी हो जाता है, जो किसी भी मॉडल के लिए तैयार है।

## यह कैसे काम करता है

ट्री की प्रत्येक पंक्ति जानकारी से भरपूर और मशीन-पठनीय होती है:

```
├─ *BUTTON <search> {sticky} "Find products"
│    │       │         │         │
│    │       │         │         └─ Actual visible text
│    │       │         └─ Flags (sticky, scrollable)
│    │       └─ Semantic hint (search, main, h1, aside...)
│    └─ Interactive (clickable/typeable)
│
└─ Tree structure shows parent-child nesting
```

### व्याकरण

| प्रतीक | अर्थ | उदाहरण |
|--------|---------|---------|
| `*` उपसर्ग | उपयोगकर्ता इसके साथ इंटरैक्ट कर सकता है | `*LINK`, `*BUTTON`, `*INPUT` |
| `<semantic>` | HTML5/ARIA अर्थ संरक्षित है | `<h1>`, `<main>`, `<search>`, `<aside>` |
| `{flags}` | लेआउट व्यवहार | `{sticky}`, `{scrollable}` |
| `"label"` | दृश्यमान टेक्स्ट सामग्री | `"Sign up free"`, `"Search..."` |
| `(N items)` | सूची आइटम की संख्या | `LIST (12 items)` |
| इंडेंटेशन | पैरेंट-चाइल्ड पदानुक्रम | `HEADER > NAV > LIST > LINK` |

### 23 भूमिकाएँ

| श्रेणी | भूमिकाएँ |
|----------|-------|
| **Layout** | `PAGE`, `HEADER`, `FOOTER`, `SECTION`, `NAV` |
| **Content** | `TEXT`, `IMAGE`, `ICON`, `CARD`, `LIST`, `TABLE` |
| **Interactive** | `BUTTON`, `LINK`, `INPUT`, `CHECKBOX`, `RADIO`, `FORM` |
| **Overlays** | `MODAL`, `TOAST`, `DROPDOWN` |
| **Navigation** | `PAGINATION` |
| **Fallback** | `UNKNOWN` |

ये 23 भूमिकाएँ एक निश्चित शब्दावली हैं - जो हर वेबसाइट पर समान होती हैं। LLM इन्हें एक बार सीखते हैं और किसी भी पेज के बारे में तर्क कर सकते हैं।

## क्या कैप्चर किया जाता है

WebSketch केवल DOM (डॉक्यूमेंट ऑब्जेक्ट मॉडल) को ही नहीं डालता है। यह हर दृश्यमान तत्व पर एक **5-स्तरीय क्लासिफायर** चलाता है:

| स्तर | स्रोत | उदाहरण |
|------|--------|---------|
| 1. **ARIA भूमिका** | `role="navigation"` | &rarr; `NAV` |
| 2. **HTML टैग** | `<button>`, `<h1>` | &rarr; `BUTTON`, `TEXT <h1>` |
| 3. **क्लास अनुमान** | `.card`, `.modal`, `.toast` | &rarr; `CARD`, `MODAL`, `TOAST` |
| 4. **संरचनात्मक विश्लेषण** | 3+ समान-भूमिका वाले सिबलिंग | &rarr; `LIST` |
| 5. **बैकअप** | केवल टेक्स्ट वाले तत्व | → `टेक्स्ट`, `सेक्शन`, `अज्ञात` |

फिर, यह सफाई करता है:

- **पारदर्शी तालिका पारगमन:** `TR`/`TD`/`TH`/`LI` तत्वों को छोड़ दिया जाता है, और उनके बच्चों को मुख्य स्तर पर ले जाया जाता है।
- **शून्य-सामग्री छंटनी:** खाली, गैर-इंटरैक्टिव और अदृश्य नोड्स को हटा दिया जाता है।
- **रैपर संकुचन:** अर्थहीन, एकल-बच्चे वाले `SECTION` रैपरों को हटाया जाता है।
- **श्रृंखलाबद्ध छंटनी:** बिना किसी सामग्री वाले खाली रैपर श्रृंखलाओं को पूरी तरह से हटा दिया जाता है।
- **लेबल निष्कर्षण:** लिंक, बटन, शीर्षकों, छवियों और इनपुट फ़ील्डों से दिखाई देने वाले टेक्स्ट को निकाला जाता है।

परिणाम: एक ऐसा वृक्ष (ट्री) जो साफ-सुथरा है और जिसमें पृष्ठ को समझने के लिए आवश्यक न्यूनतम नोड्स (अंश) मौजूद हैं।

## उपयोग के उदाहरण।

### प्रॉम्प्ट इंजीनियरों के लिए।

"इस पृष्ठ के लेआउट का वर्णन करें" — यहां ट्री (पेड़नुमा संरचना) को पेस्ट करें। एलएलएम (बड़े भाषा मॉडल) सटीक संरचना, शीर्षकों और नेविगेशन को समझता है, बिना एचटीएमएल कोड में उलझे। यह चैटजीपीटी, क्लाउड, जेमिनी, लामा जैसे किसी भी टेक्स्ट मॉडल के साथ काम करता है।

"यह पृष्ठ उपयोगकर्ता को क्या करने की अनुमति देता है?" — प्रत्येक इंटरैक्टिव तत्व को `*` चिह्न से दर्शाया गया है। लिंक, बटन, इनपुट फ़ील्ड, चेकबॉक्स — सभी को उनके प्रदर्शित पाठ के साथ लेबल किया गया है। यह एलएलएम (LLM) प्रत्येक संभावित उपयोगकर्ता क्रिया को सूचीबद्ध कर सकता है।

"इन दो पृष्ठों की तुलना करें" — दो पेड़ एक-दूसरे के बगल में। एलएलएम (LLM) संरचना में अंतर बता सकता है, छूटी हुई चीज़ों की पहचान कर सकता है, नेविगेशन पैटर्न की तुलना कर सकता है—और यह सब कुछ ही सौ टोकन में।

### डेवलपर्स के लिए

"इस यूआई (UI) के लिए एक परीक्षण योजना तैयार करें।" — ट्री मैप सीधे परीक्षण लक्ष्यों से जुड़ा हुआ है। `*BUTTON "सबमिट"`, `*INPUT <ईमेल> "ईमेल दर्ज करें"`, `*LINK "शर्तें"` — प्रत्येक एक परीक्षण योग्य इंटरैक्शन है, जिसके साथ उसका दृश्यमान लेबल जुड़ा हुआ है।

"ऐसा कुछ बनाएं जो इस तरह दिखे।" — सिमेंटिक ट्री (अर्थ संबंधी वृक्ष) एक घटक पदानुक्रम के समान है। `HEADER > NAV > LIST > LINK` का सीधा संबंध रिएक्ट/व्यू/स्वेल्ट घटकों से है। एलएलएम (LLM) एक संगत लेआउट तैयार कर सकता है।

"इस पृष्ठ की पहुंच क्षमता की जांच करें" - इसमें कुछ महत्वपूर्ण तत्व गायब हैं, कुछ इनपुट लेबल नहीं किए गए हैं, और शीर्षकों की संरचना में असंगति है - ये सभी चीजें ट्री व्यू में दिखाई दे रही हैं। `<main>`, `<nav>`, `<search>` जैसे सिमेंटिक संकेत यह दर्शाते हैं कि कौन सी ARIA भूमिकाएं मौजूद हैं (या अनुपस्थित हैं)।

### कृत्रिम बुद्धिमत्ता (एआई) एजेंटों के लिए।

**MCP एकीकरण:** अपने एआई एजेंट को किसी भी वेब पेज को कैप्चर करने और उसके बारे में तर्क करने की क्षमता देने के लिए [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) का उपयोग करें, ताकि यह इसे अपने टूल श्रृंखला का हिस्सा बना सके।

**स्वचालित निगरानी:** [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) का उपयोग करके, आप वेबसाइट के पेजों को एक निश्चित समय-सारणी पर कैप्चर कर सकते हैं, उनके संरचना में अंतर (डिफ) निकाल सकते हैं, और संरचनात्मक परिवर्तनों का पता लगा सकते हैं।

## चार दृष्टिकोण।

| ठीक है। | यह क्या दिखाता है। | सबसे उपयुक्त/बेहतरीन उन लोगों के लिए। |
|-----|---------------|----------|
| **LLM** (default) | लेबल्स, अर्थ और चिह्नों के साथ संरचित अर्थ संबंधी वृक्ष। | एलएलएम (LLM) प्रॉम्प्ट में टेक्स्ट को कॉपी-पेस्ट करना। |
| **ASCII** | त्रि-आयामी लेआउट के साथ बॉक्स-आकार की वायरफ्रेम। | दृश्य लेआउट की समझ। |
| **Tree** | रंग-कोडित भूमिका चिह्नों के साथ, एक संकुचित होने योग्य नोड ट्री (शाखा-प्रणाली)। | डीबगिंग कैप्चर। |
| **JSON** | `WebSketchCapture` का पूरा इन्फ्रास्ट्रक्चर (आईआर), जिसमें सिंटैक्स हाइलाइटिंग शामिल है। | प्रोग्रामेटिक उपयोग और प्रक्रियाएं। |

## कमांड्स (आदेश)

| आदेश। | विवरण। |
|---------|-------------|
| `WebSketch: Capture URL` | यूआरएल (URL) के लिए संकेत प्राप्त करें, उसे कैप्चर करें और प्रदर्शित करें। |
| `WebSketch: Capture URL from Clipboard` | अपने क्लिपबोर्ड पर मौजूद किसी भी यूआरएल को कैप्चर करें। |
| `WebSketch: Copy LLM Tree to Clipboard` | ट्री (ट्री डेटा स्ट्रक्चर) की कॉपी करें और उसे सीधे चैटजीपीटी, क्लाउड आदि में पेस्ट कर दें। |
| `WebSketch: Export LLM Tree` | इसे `.md` फ़ाइल के रूप में सहेजें, जिसका उपयोग आप त्वरित प्रतिक्रियाओं (प्रॉम्प्ट) के संग्रह या दस्तावेज़ों के लिए कर सकते हैं। |
| `WebSketch: Export Capture as JSON` | पूर्ण इन्फ्रारेड (आईआर) डेटा कैप्चर, जिसमें बाउंडिंग बॉक्स, हैश और मेटाडेटा शामिल हैं। |
| `WebSketch: Export ASCII Wireframe` | बॉक्स-ड्राइंग लेआउट दृश्य। |

## सेटिंग्स

| सेटिंग (Setting) | डिफ़ॉल्ट। | विवरण। |
|---------|---------|-------------|
| `websketch.chromePath` | स्वचालित रूप से पहचानें। | क्रोम या एज प्रोग्राम फ़ाइल का पथ। |
| `websketch.viewportWidth` | `1280` | व्यूपोर्ट की चौड़ाई (पिक्सेल में)। |
| `websketch.viewportHeight` | `800` | व्यूपोर्ट की ऊंचाई, पिक्सेल में। |
| `websketch.timeout` | `30000` | नेविगेशन टाइमआउट (मिलीसेकंड में) |
| `websketch.waitAfterLoad` | `1000` | जेएस रेंडरिंग के लिए अतिरिक्त प्रतीक्षा समय (मिलीसेकंड में)। |

## इकोसिस्टम

वेबस्केच उपकरणों का एक समूह है जो एक साझा व्याकरण पर आधारित है:

| पैकेज | यह क्या करता है |
|---------|-------------|
| [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) | मुख्य आईआर (IR) - व्याकरण, सत्यापन, रेंडरिंग, अंतर, फिंगरप्रिंटिंग |
| **websketch-vscode** | वीएस कोड एक्सटेंशन - अपने एडिटर से पृष्ठों को कैप्चर करें (यह रिपॉजिटरी) |
| [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) | कमांड-लाइन कैप्चर और रेंडरिंग |
| [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) | क्रोम एक्सटेंशन जो ब्राउज़र में कैप्चर करने की सुविधा देता है |
| [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) | एलएलएम एजेंट एकीकरण के लिए एमसीपी सर्वर |

सभी उपकरण समान `WebSketchCapture` आईआर (IR) उत्पन्न करते हैं, इसलिए पाइपलाइनों के बीच आउटपुट आपस में बदल सकते हैं।

## आवश्यकताएं

- वीएस कोड 1.85 या उच्चतर
- आपके सिस्टम पर क्रोम या एज स्थापित होना चाहिए

कोई भी ब्राउज़र शामिल नहीं है। 200 एमबी का कोई डाउनलोड नहीं। वेबस्केच `puppeteer-core` का उपयोग करता है और आपके द्वारा पहले से उपयोग किए जा रहे ब्राउज़र का उपयोग करता है।

## सुरक्षा और डेटा दायरा

**डेटा जिस पर कार्रवाई की जाती है:** उपयोगकर्ता द्वारा दर्ज किए गए यूआरएल (जो `puppeteer-core` का उपयोग करके स्थानीय क्रोम/एज में हेडलेस मोड में नेविगेट किए जाते हैं), कैप्चर किए गए पृष्ठ की सामग्री को आईआर ट्री में परिवर्तित किया जाता है, एक्सपोर्ट कार्यक्षेत्र फ़ाइलों या क्लिपबोर्ड में लिखे जाते हैं। **डेटा जिस पर कोई कार्रवाई नहीं की जाती है:** कार्यक्षेत्र के बाहर की कोई भी फ़ाइल, कोई भी ऑपरेटिंग सिस्टम क्रेडेंशियल, कोई भी ब्राउज़र लॉगिन सत्र (कोई प्रोफाइल नहीं होने के साथ हेडलेस मोड)। **नेटवर्क:** केवल उपयोगकर्ता द्वारा निर्दिष्ट यूआरएल पर ही नेविगेट किया जाता है - कोई अन्य आउटगोइंग अनुरोध नहीं। कोई भी **टेलीमेट्री** एकत्र या भेजा नहीं जाता है।

## लाइसेंस

एमआईटी लाइसेंस - विवरण के लिए [लाइसेंस](LICENSE) देखें।

---

<a href="https://mcp-tool-shop.github.io/">एमसीपी टूल शॉप</a> द्वारा बनाया गया।
