<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-aside/readme.png" alt="mcp-aside logo" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-aside"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-aside" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-aside/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  An MCP server that gives your AI a place to jot things down mid-conversation — without derailing the task at hand.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#tools">Tools</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#license">License</a>
</p>

---

## क्यों?

एलएलएम (LLM) अक्सर चीजों को भूल जाते हैं। एक विचलन, एक अधूरी चिंता, या "हमें इस पर वापस आना चाहिए" जैसी बातें जो कभी भी दोबारा नहीं देखी जातीं। "**mcp-aside**" मॉडल को एक विशेष इनबॉक्स प्रदान करता है, जिसमें इन विचलन संबंधी बातों को रखा जा सकता है। यह इनबॉक्स रेट-लिमिटेड (rate-limited) है, डुप्लिकेट प्रविष्टियों को हटाता है, और स्वचालित रूप से पुरानी प्रविष्टियों को हटा देता है, ताकि यह इनबॉक्स स्वयं एक समस्या न बन जाए।

इसे बातचीत के बगल में रखे गए एक 'स्टिक-नोट' पैड की तरह समझें। यह मॉडल नोट्स लिखता है। आप (या मॉडल) उचित समय पर उन नोट्स को पढ़ते हैं।

## यह कैसे काम करता है।

1. मॉडल "aside.push" फ़ंक्शन को एक विचार के साथ कॉल करता है, जिस पर प्राथमिकता अंकित होती है।
2. सुरक्षा उपाय डुप्लिकेट, दर सीमा और समय सीमा की जांच करते हैं।
3. यदि यह जांच पास हो जाती है, तो यह टिप्पणी एक अस्थायी मेमोरी बॉक्स में जमा हो जाती है।
4. क्लाइंट्स को "notifications/resources/updated" के माध्यम से सूचित किया जाता है।
5. कोई भी व्यक्ति "interject://inbox" संसाधन के माध्यम से इस मेमोरी बॉक्स को पढ़ सकता है।

कोई डेटाबेस नहीं। कोई स्थायी भंडारण नहीं। यदि सर्वर बंद हो जाता है, तो इनबॉक्स गायब हो जाएगा - यह जानबूझकर किया गया है।

## शुरुआत कैसे करें।

```bash
npm install
npm run build
node build/index.js
```

सर्वर, "stdio" के माध्यम से MCP प्रोटोकॉल का उपयोग करता है। किसी भी MCP-संगत क्लाइंट को इसके साथ कनेक्ट करें:

```json
{
  "mcpServers": {
    "aside": {
      "command": "node",
      "args": ["build/index.js"]
    }
  }
}
```

## उपकरण।

| उपकरण। | यह क्या करता है। |
| Please provide the English text you would like me to translate into Hindi. I am ready to assist you. | Please provide the English text you would like me to translate into Hindi. I am ready to assist you. |
| `aside.push` | एक संदेश को इनबॉक्स में डालें। यह `text` (संदेश), `priority` (प्राथमिकता - निम्न/मध्यम/उच्च), `reason` (कारण), `tags` (टैग), `expiresAt` (समाप्ति तिथि), `source` (स्रोत) और `meta` (अतिरिक्त जानकारी) जैसे पैरामीटर स्वीकार करता है। |
| `aside.configure` | रनटाइम पर सुरक्षा उपायों को समायोजित करें - जैसे कि टीटीएल सीमाएं, दर सीमाएं, डुप्लीकेशन रोकने की अवधि, और सूचना देने के लिए निर्धारित सीमाएं। |
| `aside.clear` | इनबॉक्स को साफ़ करें। |
| `aside.status` | इनबॉक्स के आकार और वर्तमान सुरक्षा नियमों की केवल पढ़ने योग्य जानकारी। |

## संसाधन।

| यूआरआई (URI) | विवरण। |
| Please provide the English text you would like me to translate into Hindi. I am ready to assist you. | Please provide the English text you would like me to translate into Hindi. I am ready to assist you. |
| `interject://inbox` | लंबित टिप्पणियों की एक JSON सरणी, जिसमें सबसे नई टिप्पणी पहले दिखाई दे रही है। पढ़ी जा चुकी पुरानी टिप्पणियां फ़िल्टर कर दी जाती हैं। |

## सुरक्षा रेलिंग।

सब कुछ `aside.configure` के माध्यम से कॉन्फ़िगर किया जा सकता है। डिफ़ॉल्ट सेटिंग्स:

| स्थापना। | डिफ़ॉल्ट। | यह क्या नियंत्रित करता है। |
| Please provide the English text you would like me to translate into Hindi. I am ready to assist you. | Please provide the English text you would like me to translate into Hindi. I am ready to assist you. | Please provide the English text you would like me to translate into Hindi. I am ready to assist you. |
| `defaultTtlSeconds` | 600 (10 मिनट) | यदि किसी इंटरजेक्शन (इंटरप्शन) की समय सीमा स्पष्ट रूप से निर्धारित नहीं की गई है, तो वह कितने समय तक सक्रिय रहता है? |
| `maxTtlSeconds` | 3600 (1 घंटा) | टीटीएल (TTL) की एक निश्चित अधिकतम सीमा निर्धारित की गई है, भले ही कॉल करने वाला व्यक्ति अधिक समय की मांग करे। |
| `dedupeWindowSeconds` | 300 (5 मिनट) | समान प्राथमिकता + पाठ + कारण = इस विंडो के भीतर दबा दिया जाएगा। |
| `rateLimitWindowSeconds` | 60 | दर सीमा निर्धारित करने के लिए स्लाइडिंग विंडो तकनीक। |
| `rateLimitMax` | निम्न: 6, मध्यम: 3, उच्च: 1. | मैक्स, प्रत्येक प्राथमिकता और प्रत्येक विंडो के लिए, अधिकतम संख्या में आइटम प्रदर्शित करेगा। |
| `notifyAtOrAbove` | ऊँचा। | केवल उन वस्तुओं के लिए लॉग नोटिफिकेशन भेजें जिनकी प्राथमिकता इस स्तर के बराबर या इससे अधिक हो। |

## कॉन्फ़िगरेशन।

### टाइमर द्वारा सक्रियण।

एक अंतर्निहित टाइमर हर 5 मिनट में सक्रिय होता है, जो कम प्राथमिकता वाले "क्या कोई बाधा है?" जैसे जांचों को चलाता है। यह मैनुअल रूप से किए जाने वाले कार्यों के समान नियमों का पालन करता है (इसलिए, यह अन्य कार्यों की तरह ही डुप्लिकेट हो सकता है या इसकी गति सीमित की जा सकती है)। इसे अक्षम करने के लिए, `index.ts` फ़ाइल में `startTimerTrigger` को कॉल करने वाली पंक्ति को टिप्पणी करके हटा दें।

### एमसीपी इंस्पेक्टर।

स्थानीय परीक्षण के लिए:

```
Transport: STDIO
Command:   node
Args:      build/index.js
```

## टिप्पणियाँ।

- लॉग्स (logs) **stderr** पर जाते हैं - stdout का उपयोग MCP JSON-RPC के लिए आरक्षित है।
- इनबॉक्स अस्थायी होता है। रीस्टार्ट करने पर, यह खाली हो जाता है।
- टिप्पणियाँ (interjections) सबसे नए से पहले क्रम में संग्रहीत की जाती हैं। समय सीमा समाप्त होने वाली प्रविष्टियाँ हर बार पढ़ने और भेजने पर हटा दी जाती हैं।

## लाइसेंस।

[एमआईटी] (लाइसेंस)

---

यह उपकरण <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा बनाया गया है।
