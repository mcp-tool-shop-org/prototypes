<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ConsensusOS/readme.png" width="400" alt="ConsensusOS">
</p>

# कंसेंससओएस (ConsensusOS)

यह [MCP टूल शॉप](https://mcptoolshop.com) का एक हिस्सा है।

मॉड्यूलर और स्वतंत्र नियंत्रण प्रणाली, जो बहु-श्रृंखला (मल्टी-चेन) सहमति शासन के लिए उपयुक्त है।

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ConsensusOS/actions"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/ConsensusOS/npm.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/ConsensusOS?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/ConsensusOS/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/consensus-os"><img src="https://img.shields.io/npm/v/@mcptoolshop/consensus-os?style=flat-square&color=cb3837" alt="npm version"></a>
  <img src="https://img.shields.io/badge/dependencies-0-blue?style=flat-square" alt="Dependencies: 0">
</p>

---

## "कंसेंससओएस" क्यों?

मल्टी-चेन इंफ्रास्ट्रक्चर का प्रबंधन करने का मतलब है उन नोड्स पर भरोसा करना जिन पर आपका पूरा नियंत्रण नहीं है, ऐसे रिलीज़ जारी करना जो बिल्कुल भी भिन्न नहीं होने चाहिए, और उन नेटवर्क में कॉन्फ़िगरेशन परिवर्तनों का प्रबंधन करना जो कभी नहीं सोते। अधिकांश टीमें इसे अस्थायी स्क्रिप्टों के माध्यम से जोड़ती हैं और सर्वश्रेष्ठ परिणाम की उम्मीद करती हैं।

ConsensusOS उस उम्मीद को एक **प्लगइन-आधारित नियंत्रण प्रणाली** से बदल देता है, जिसमें प्रत्येक मॉड्यूल एक साझा इवेंट बस के माध्यम से संवाद करता है, प्रत्येक अवस्था परिवर्तन "फेल-क्लोज्ड" सिद्धांतों द्वारा नियंत्रित होता है, और पूरे सिस्टम का इतिहास पूरी तरह से पुन: प्रस्तुत करने योग्य होता है।

- **शून्य उत्पादन निर्भरता:** आपकी आपूर्ति श्रृंखला में ऐसा कुछ भी नहीं है जिसे आपने स्वयं नहीं लिखा हो।
- **स्थिर प्लगइन एपीआई संस्करण 1:** एक स्थिर अनुबंध जो आपके एकीकरणों को बाधित नहीं करेगा।
- **सुरक्षात्मक विशेषताएं:** अमान्य परिवर्तन हमेशा अस्वीकृत किए जाते हैं, कभी भी आंशिक रूप से लागू नहीं होते।
- **निश्चित पुन: उत्पादन:** किसी भी सिस्टम स्थिति को घटना इतिहास से पुन: उत्पन्न किया जा सकता है।
- **संसाधन-सीमित निष्पादन:** सीपीयू, मेमोरी और समय की सीमाएं टोकन के माध्यम से लागू की जाती हैं।
- **मल्टी-चेन एडेप्टर:** XRPL, एथेरियम और कोसमॉस, ये सभी डिफ़ॉल्ट रूप से उपलब्ध हैं।

---

## स्थापित करें।

```bash
npm install @mcptoolshop/consensus-os
```

इसके लिए **Node.js 18 या उससे ऊपर के संस्करण** की आवश्यकता है। इसमें कोई भी रनटाइम निर्भरता नहीं है।

---

## शुरुआत कैसे करें।

### प्रोग्रामेटिक उपयोग।

```ts
import {
  CoreLoader,
  createHealthSentinel,
  createReleaseVerifier,
  createConfigGuardian,
  createXrplAdapter,
} from "@mcptoolshop/consensus-os";

// Create the loader (orchestrates plugin lifecycle)
const loader = new CoreLoader({
  configs: {
    "health-sentinel": { intervalMs: 10_000 },
  },
});

// Register plugins
loader.register(createHealthSentinel());
loader.register(createReleaseVerifier());
loader.register(createConfigGuardian());
loader.register(createXrplAdapter());

// Boot resolves dependencies, inits, and starts all plugins
await loader.boot();

// Subscribe to events
loader.events.subscribe("health.*", (event) => {
  console.log(`[${event.topic}] from ${event.source}:`, event.data);
});

// Check invariants before a state transition
const verdict = await loader.invariants.check({ action: "deploy" });
console.log("Transition allowed:", verdict.allowed);

// Graceful shutdown (reverse boot order)
await loader.shutdown();
```

### एक अनुकूलित प्लगइन बनाएं।

```ts
import { BasePlugin, ManifestBuilder } from "@mcptoolshop/consensus-os/plugin";

class MyMonitor extends BasePlugin {
  readonly manifest = ManifestBuilder.create("my-monitor")
    .name("My Monitor")
    .version("1.0.0")
    .capability("sentinel")
    .build();

  protected async onStart() {
    this.on("health.check.completed", (event) => {
      this.log.info("Health check result", event.data as Record<string, unknown>);
    });
    this.emit("my-monitor.ready", { status: "online" });
  }
}
```

### सीएलआई (CLI)

```bash
npx consensusos doctor     # Run health checks
npx consensusos verify     # Verify release artifact integrity
npx consensusos config     # Config validation / diff / migration
npx consensusos status     # System status overview
npx consensusos plugins    # List loaded plugins
npx consensusos adapters   # List and query chain adapters
```

---

## आर्किटेक्चर।

```
┌─────────────────────────────────────────────────┐
│                   CLI (entry)                   │
├─────────────────────────────────────────────────┤
│              Plugin SDK / Attestation           │
├──────────┬──────────┬──────────┬────────────────┤
│  Health  │ Verifier │  Config  │    Sandbox     │
│ Sentinel │ (Release)│ Guardian │ (Replay/Amend) │
├──────────┴──────────┴──────────┼────────────────┤
│           Governor Layer       │   Adapters     │
│  (Token · Policy · Queue)     │ (XRPL/ETH/ATOM)│
├────────────────────────────────┴────────────────┤
│                 Core Layer                      │
│    EventBus · InvariantEngine · Loader · Logger │
├─────────────────────────────────────────────────┤
│              Plugin API v1 (frozen)             │
└─────────────────────────────────────────────────┘
```

पूरा विवरण देखने के लिए [ARCHITECTURE.md](ARCHITECTURE.md) फ़ाइल देखें।

---

## एपी इंटरफ़ेस।

### मुख्य भाग।

| निर्यात। | विवरण। |
| ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने की पूरी कोशिश करूंगा। |
| `CoreLoader` | प्लगइन जीवनचक्र नियंत्रक - पंजीकरण, प्रारंभ, और बंद करना। |
| `CoreEventBus` | एक व्यवस्थित, टाइप-सुरक्षित इवेंट बस जो पुन: चलाने योग्य है और जिसमें वाइल्डकार्ड सदस्यताएं (wildcard subscriptions) उपलब्ध हैं। |
| `CoreInvariantEngine` | "फेल-सेफ" (fail-safe) विशेषता वाला इंजन, जिसमें केवल डेटा जोड़ने की सुविधा हो और कोई डेटा हटाया या बदला न जा सके। |
| `createLogger(scope)` | एक मॉड्यूल के लिए विशिष्ट लॉगिंग प्रणाली। |

### मॉड्यूल।

| कारखाना। | उद्देश्य। |
| ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| `createHealthSentinel()` | नोड की स्वास्थ्य निगरानी, "हार्टबीट" के माध्यम से। |
| `createReleaseVerifier()` | सॉफ्टवेयर रिलीज़ के हैश का सत्यापन। |
| `createConfigGuardian()` | कॉन्फ़िगरेशन स्कीमा का सत्यापन और माइग्रेशन। |
| `createSandboxPlugin()` | अकेले काम करने वाला, पुनः चलाने योग्य और संशोधन करने योग्य प्रणाली। |
| `createGovernorPlugin()` | टोकन-आधारित निष्पादन, नीति प्रवर्तन, निर्माण कतार। |

### एडाप्टर।

| कारखाना। | Chain | स्थिति। |
| ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | "The quick brown fox jumps over the lazy dog."

"यह फुर्तीला भूरा लोमड़ी आलसी कुत्ते के ऊपर से कूदता है।" | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| `createXrplAdapter()` | XRPL | कार्यान्वित किया गया। |
| `createEthereumAdapter()` | इथेरियम। | कार्यान्वित किया गया। |
| `createCosmosAdapter()` | ब्रह्मांड। | कार्यान्वित किया गया। |

### प्लगइन सॉफ्टवेयर डेवलपमेंट किट (एसडीके)

| निर्यात। | विवरण। |
| ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने के लिए तैयार हूं। |
| `BasePlugin` | एक सार (abstract) आधार वर्ग जिसमें जीवनचक्र के लिए डिफ़ॉल्ट सेटिंग्स और उपयोगी विधियाँ शामिल हैं। |
| `ManifestBuilder` | टाइप-सुरक्षित प्लगइन मैनिफेस्ट फ़ाइलों के लिए एक सरल और प्रभावी निर्माण उपकरण। |
| `validatePlugin()` | पूर्व-पंजीकरण सत्यापन: त्रुटियां और चेतावनियां। |
| `AttestationPipeline` | रिलीज़ का प्रमाण पत्र जारी करना और इसकी उत्पत्ति का पता लगाना। |

### सबपाथ एक्सपोर्ट्स

```ts
import { ... } from "@mcptoolshop/consensus-os";          // Full API
import { ... } from "@mcptoolshop/consensus-os/plugin";   // Plugin SDK + types
import { ... } from "@mcptoolshop/consensus-os/cli";      // CLI dispatch
```

---

## परीक्षण।

```bash
npm test         # Full suite (295 tests)
npx vitest       # Watch mode
```

परीक्षण श्रेणियां:
- **आर्किटेक्चर** (16 परीक्षण) — संरचनात्मक स्थिरता का अनुपालन
- **सुरक्षा** (27 परीक्षण) — दुरुपयोग से बचाव और निश्चितता
- **तनाव** (22 परीक्षण) — चरम स्थितियां और प्रदर्शन क्षमता
- **यूनिट** (230 परीक्षण) — घटक-स्तर का कवरेज

---

## दस्तावेज़ीकरण।

| दस्तावेज़। | उद्देश्य। |
| ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| [QUICKSTART.md](QUICKSTART.md) | सिर्फ 3 मिनट में दौड़ना शुरू करें। |
| [ARCHITECTURE.md](ARCHITECTURE.md) | फ्रोज़न v1.0 का आर्किटेक्चर विनिर्देश। |
| [PLUGIN_GUIDE.md](PLUGIN_GUIDE.md) | प्लगइन कैसे लिखें। |
| [ADAPTER_GUIDE.md](ADAPTER_GUIDE.md) | चेन एडाप्टर कैसे बनाया जाए। |
| [SANDBOX_GUIDE.md](SANDBOX_GUIDE.md) | सैंडबॉक्स, रीप्ले और संशोधन की प्रक्रिया का विवरण |
| [GOVERNOR_GUIDE.md](GOVERNOR_GUIDE.md) | टोकन निष्पादन, नीतियां, बिल्ड कतार |
| [SECURITY.md](SECURITY.md) | सुरक्षा नीति और भेद्यता रिपोर्टिंग |
| [THREAT_MODEL.md](THREAT_MODEL.md) | एसटीआरआईडी (STRIDE) खतरे का विश्लेषण |
| [CONTRIBUTING.md](CONTRIBUTING.md) | विकास प्रक्रिया और पुल रिक्वेस्ट (PR) चेकलिस्ट |
| [BUILD.md](BUILD.md) | पुनरुत्पादित करने योग्य बिल्ड और सत्यापन |

---

## सहायता

- **प्रश्न / सहायता:** [चर्चाएँ](https://github.com/mcp-tool-shop-org/ConsensusOS/discussions)
- **बग रिपोर्ट:** [समस्याएँ](https://github.com/mcp-tool-shop-org/ConsensusOS/issues)

---

## लाइसेंस

[एमआईटी (MIT)](LICENSE)
