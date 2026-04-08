<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<div align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/civility-kernel/readme.png" alt="civility-kernel logo" width="360" />
</div>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/civility-kernel/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/civility-kernel"><img src="https://img.shields.io/npm/v/%40mcptoolshop%2Fcivility-kernel" alt="npm version"></a>
</p>

एक नीति परत जो एजेंट के व्यवहार को केवल दक्षता को अधिकतम करने के बजाय, "पसंद-आधारित" बनाती है।

आपका एजेंट संभावित योजनाओं का निर्माण करता है। कर्नेल यह तय करता है कि आगे क्या होगा:

**बनाना → फ़िल्टर (कठोर बाधाएं) → स्कोर (भार) → चुनें या पूछें**

कठोर बाधाएं अपरिवर्तनीय हैं। नरम प्राथमिकताएं ट्रेडऑफ़ को निर्देशित करती हैं। अनिश्चितता "मनुष्य से पूछें" की स्थिति पैदा कर सकती है।

---

## इंस्टॉल करें

```bash
npm i @mcptoolshop/civility-kernel
```

## शुरुआत कैसे करें

```typescript
import { createKernel, PolicyBuilder } from '@mcptoolshop/civility-kernel';

const policy = new PolicyBuilder()
  .setWeight('efficiency', 0.6)
  .setWeight('low_risk', 0.4)
  .addConstraint('no_irreversible_changes')
  .setUncertaintyThreshold(0.5)
  .build();

const kernel = createKernel({ policy });
const trace = kernel.decide('default', [plan1, plan2]);
// trace.outcome: 'EXECUTE' | 'ASK_USER' | 'NO_VALID_PLAN'
```

कर्नेल बाधाओं, स्कोरर और निर्णय इंजन को एक ही कॉल में जोड़ता है। I/O-बाउंड बाधा जांच के लिए `decideAsync()` का उपयोग करें।

## मानव नियंत्रण लूप

आप हमेशा देख सकते हैं कि आपकी नीति क्या करती है।
एजेंट को किसी भी बदलाव को लागू करने से पहले दिखाना होगा।
आप पिछली स्थिति में वापस जा सकते हैं।
कुछ भी चुपचाप अपडेट नहीं होता है।

नीति अनुबंध का पूर्वावलोकन करें:
```bash
npm run policy:explain
```

एक अपडेट प्रस्तावित करें (अंतर दिखाता है, अनुमोदन के लिए संकेत देता है):
```bash
npm run policy:propose
```

वर्तमान नीति फ़ाइल को मानकीकृत करें (केवल प्रारूप सामान्यीकरण):
```bash
npm run policy:canonicalize
```

### स्वचालित रोलबैक सुरक्षा

जब आप कोई बदलाव लागू करते हैं, तो `policy-check` पहले पुरानी नीति का बैकअप ले सकता है:

```bash
npx tsx scripts/policy-check.ts policies/default.json --propose policies/proposed.json --write-prev policies/previous.json
```

## नीति फ़ाइलें

अनुशंसित सम्मेलन:

- `policies/default.json` — सक्रिय नीति
- `policies/previous.json` — स्वचालित रोलबैक लक्ष्य
- `policies/profiles/*.json` — नामित प्रोफाइल (कार्य / कम-घर्षण / सुरक्षित-मोड)

## CLI विकल्प (policy-check)

- `--explain` — एक मानव-पठनीय नीति सारांश प्रिंट करें
- `--propose <file>` — lint + मानकीकृत अंतर दिखाएं + अनुमोदन के लिए संकेत दें
- `--apply` — नीति फ़ाइल को मानकीकृत रूप में फिर से लिखें
- `--write-prev <file>` — पुरानी मानकीकृत नीति को ओवरराइट करने से पहले उसका बैकअप लें
- `--diff short|full` — छोटा "मुख्य" बदलाव दिखाता है; पूर्ण सब कुछ दिखाता है
- `--prev <file>` — नियतात्मक CI अंतर मोड

## सार्वजनिक एपीआई

**कर्नेल (अनुशंसित प्रारंभिक बिंदु):**

- `createKernel({ policy, constraints?, scorers?, onDecision? })` — पूर्व-स्थापित फ़ेसड जिसमें निर्णय, lint, व्याख्या, अंतर और सीखने की सुविधा है
- `PolicyBuilder` — मान्य नीतियों के निर्माण के लिए धारावाहिक API

**नीति संचालन:**

- `lintPolicy(policy, { registry, scorers })` — त्रुटियों और चेतावनियों के लिए एक नीति को मान्य करें
- `canonicalizePolicy(policy, registry)` — एक नीति को मानकीकृत रूप में सामान्य करें
- `diffPolicy(a, b, registry?)` — दो नीतियों के बीच संरचित अंतर
- `explainPolicy(policy, registry, opts?)` — मानव-पठनीय नीति सारांश

**संग्रहण:**

- `loadPolicy(json)` — अज्ञात इनपुट से Zod-सत्यापित नीति लोड करना
- `dumpPolicy(policy)` — नियतात्मक JSON क्रमबद्धता (क्रमबद्ध कुंजियाँ)
- `PreferencePolicySchema` — रनटाइम सत्यापन के लिए निर्यात किया गया Zod स्कीमा

**निर्णय इंजन:**

- `DecisionEngine` — एक नीति के विरुद्ध संभावित योजनाओं का मूल्यांकन करता है (फ़िल्टर → स्कोर → चुनें या पूछें)
- `decideAsync()` — I/O-बाउंड बाधा जांच के लिए एसिंक्रोनस संस्करण
- `compileEffectivePolicy(base, context, plans)` — संदर्भ नियमों को लागू करता है (ग्लोब पैटर्न जैसे `tool:*` का समर्थन करता है)
- `onDecision` हुक — प्रत्येक निर्णय पर लॉगिंग/मेट्रिक्स के लिए वैकल्पिक कॉलबैक

**रजिस्ट्री:**

- `ConstraintRegistry` — कठोर बाधाओं को पंजीकृत और मूल्यांकन करें (वैकल्पिक Zod पैरामीटर स्कीमा + एसिंक्रोनस समर्थन के साथ)
- `ScorerRegistry` — भार कुंजियों के लिए स्कोरिंग फ़ंक्शन पंजीकृत करें
- `registerDefaultConstraints(registry)` — अंतर्निहित बाधाओं को लोड करता है (`no_irreversible_changes`, `max_spend_without_confirm`, `require_confirm_if`)
- `registerDefaultScorers(registry)` — अंतर्निहित स्कोरर लोड करता है (`efficiency`, `low_risk`, `concise`)

**सीखने का लूप:**

- `proposePolicyUpdates(policy, events)` — उपयोगकर्ता की प्रतिक्रिया से प्राप्त जानकारी के आधार पर नीति में बदलावों का सुझाव देना।
- `applyPolicyProposal(policy, proposal)` — किसी प्रस्ताव को वापस नीति में मिलाना (यह प्रक्रिया को पूरा करता है)।
- विस्तृत प्रतिक्रिया: `CONSTRAINT_RELAXED`, `PLAN_EDITED`, `TIMEOUT`, `ABORT`

**MCP एकीकरण:**

- `planFromMcpToolCall(call, meta?)` — MCP टूल कॉल को एक योजना में बदलना।
- `feedbackFromMcpResult(result, planId)` — MCP परिणाम को एक प्रतिक्रिया घटना में बदलना।

**उपकरण:**

- `extractTags(plan)` / `annotatePlanWithTags(plan)` — योजना के चरणों की सामग्री के आधार पर स्वचालित रूप से टैग जोड़ना।
- `matchesContext(pattern, context)` — संदर्भ पैटर्न मिलान (ग्लोब-जागरूक)।

## CI (निरंतर एकीकरण)

CI (निरंतर एकीकरण) प्रक्रियाएं:
- परीक्षण (17 फ़ाइलों में 143 परीक्षण)
- निर्माण
- `policy-check --strict` का उपयोग करके जांच (उदाहरण के लिए, `policies/default.json` बनाम `policies/previous.json`)

यह सुनिश्चित करता है कि खराब नीतियां या भ्रामक परिवर्तन जारी न किए जाएं।

## विकास

```bash
npm test
npm run build
npm run example:basic
npm run policy:check
```

## सुरक्षा और डेटा का दायरा

सिविलिटी कर्नेल एक **शुद्ध लाइब्रेरी** है — इसमें कोई नेटवर्क अनुरोध नहीं है, कोई टेलीमेट्री नहीं है, और कोई दुष्प्रभाव नहीं है।

- **पहुंचे जाने वाले डेटा:** स्थानीय फ़ाइल सिस्टम से JSON नीति फ़ाइलें पढ़ी जाती हैं। नीति दस्तावेजों को मान्य, मानकीकृत और तुलना की जाती है। सभी क्रियाएं निश्चित हैं।
- **पहुंचे जाने वाले डेटा नहीं:** कोई नेटवर्क अनुरोध नहीं। कोई टेलीमेट्री नहीं। कोई क्रेडेंशियल भंडारण नहीं। कर्नेल नीति प्रतिबंधों का मूल्यांकन करता है, यह एजेंट की गतिविधियों को नहीं देखता है और न ही लॉग करता है।
- **आवश्यक अनुमतियाँ:** नीति JSON फ़ाइलों के लिए फ़ाइल सिस्टम पढ़ने की अनुमति। केवल `--apply` के माध्यम से स्पष्ट रूप से अनुरोध किए जाने पर लिखने की अनुमति।

भेद्यता रिपोर्टिंग के लिए [SECURITY.md](SECURITY.md) देखें।

---

## स्कोरकार्ड

| श्रेणी | स्कोर |
|----------|-------|
| सुरक्षा | 10/10 |
| त्रुटि प्रबंधन | 10/10 |
| ऑपरेटर दस्तावेज़ | 10/10 |
| रिलीज़ की स्वच्छता | 10/10 |
| पहचान | 10/10 |
| **Overall** | **50/50** |

---

## लाइसेंस

MIT (लाइसेंस देखें)

---

<a href="https://mcp-tool-shop.github.io/">MCP टूल शॉप</a> द्वारा निर्मित।
