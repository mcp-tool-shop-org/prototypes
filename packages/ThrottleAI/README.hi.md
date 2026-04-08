<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/ThrottleAI/main/logo.jpg" alt="ThrottleAI" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ThrottleAI/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ThrottleAI/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/throttleai"><img src="https://img.shields.io/npm/v/throttleai" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/ThrottleAI/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <em>A token-based lease governor for AI calls — small enough to embed anywhere, strict enough to prevent stampedes.</em>
</p>

**ThrottleAI एक ऐसा उपकरण है जो किसी भी निर्भरता के बिना, समवर्तीता, दर और टोकन उपयोग को नियंत्रित करता है, और इसमें fetch, OpenAI, टूल्स, Express और Hono के लिए अनुकूलन मौजूद हैं।**

---

## 60 सेकंड में शुरुआत करें

```bash
pnpm add throttleai
```

```ts
import { createGovernor, withLease, presets } from "throttleai";

const gov = createGovernor(presets.balanced());

const result = await withLease(
  gov,
  { actorId: "user-1", action: "chat" },
  async () => await callMyModel(),
);

if (result.granted) {
  console.log(result.result);
} else {
  console.log("Throttled:", result.decision.recommendation);
}
```

बस इतना ही। यह उपकरण समवर्तीता, दर सीमा और निष्पक्षता को लागू करता है। यदि आप रिलीज़ करना भूल जाते हैं, तो लीज़ स्वचालित रूप से समाप्त हो जाते हैं।

## क्यों?

एआई एप्लिकेशन दर सीमाओं से बाधित होते हैं, बजट से अधिक हो जाते हैं, और भीड़भाड़ पैदा करते हैं। ThrottleAI आपके कोड और मॉडल कॉल के बीच स्थित होता है, और निम्नलिखित को लागू करता है:

- **समवर्तीता:** भारित स्लॉट और इंटरैक्टिव रिजर्व के साथ, एक साथ किए जा सकने वाले अनुरोधों की संख्या को सीमित करें।
- **दर:** प्रति मिनट अनुरोध और टोकन की संख्या को सीमित करें, जिसमें समय के साथ बदलावों को ध्यान में रखा जाता है।
- **निष्पक्षता:** यह सुनिश्चित करें कि कोई भी उपयोगकर्ता या प्रक्रिया संसाधनों का एकाधिकार न करे।
- **लीज़:** उपयोग करने से पहले लीज़ प्राप्त करें, उपयोग के बाद रिलीज़ करें, और समय सीमा समाप्त होने पर स्वचालित रूप से समाप्त हो जाएं।
- **निगरानी:** डिबगिंग के लिए `snapshot()`, `onEvent`, और `formatEvent()` का उपयोग करें।

इसमें किसी भी बाहरी निर्भरता की आवश्यकता नहीं है। Node.js 18+ पर चलता है। इसे आसानी से कोड में शामिल किया जा सकता है।

## अपनी पसंद का लिमिटर चुनें

| लिमिटर | यह क्या सीमित करता है | कब उपयोग करें |
| --------- | ------------- | ------------- |
| **Concurrency** | एक साथ चल रहे अनुरोध | हमेशा - यह सबसे महत्वपूर्ण सेटिंग है। |
| **Rate** | प्रति मिनट अनुरोध | जब बाहरी एपीआई में दर सीमा निर्धारित हो। |
| **Token rate** | प्रति मिनट टोकन | जब आपके पास प्रति मिनट टोकन उपयोग का बजट हो। |
| **Fairness** | प्रत्येक उपयोगकर्ता/प्रक्रिया के लिए संसाधनों का हिस्सा | ऐसे एप्लिकेशन जहां एक उपयोगकर्ता को संसाधनों पर एकाधिकार नहीं रखना चाहिए। |
| **Adaptive** | स्वचालित रूप से समायोजित की गई समवर्तीता सीमा | जब बाहरी सिस्टम की प्रतिक्रिया समय अप्रत्याशित हो। |

सबसे पहले समवर्तीता को समायोजित करें। केवल आवश्यकता होने पर ही दर सीमा जोड़ें। परिदृश्य-आधारित मार्गदर्शन के लिए [ट्यूनिंग चीटशीट](docs/tuning-cheatsheet.md) देखें।

## पूर्व-निर्धारित सेटिंग्स

```ts
import { presets } from "throttleai";

// Single user, CLI tools — 1 call at a time, 10 req/min
createGovernor(presets.quiet());

// SaaS backend — 5 concurrent (2 interactive reserve), 60 req/min, fairness
createGovernor(presets.balanced());

// Batch processing — 20 concurrent, 300 req/min, fairness + adaptive tuning
createGovernor(presets.aggressive());

// Override any field
createGovernor({ ...presets.balanced(), leaseTtlMs: 30_000 });
```

## सामान्य उपयोग के मामले

### सर्वर एंडपॉइंट: 429 त्रुटि बनाम कतार

```ts
// Option A: immediate deny with 429
const result = await withLease(gov, request, fn);
// result.granted === false → respond with 429

// Option B: wait with bounded retries
const result = await withLease(gov, request, fn, {
  strategy: "wait-then-deny",
  maxAttempts: 3,
  maxWaitMs: 5_000,
});
```

### यूआई इंटरैक्शन बनाम पृष्ठभूमि कार्य

```ts
// User-facing chat gets priority
gov.acquire({ actorId: "user", action: "chat", priority: "interactive" });

// Background embedding can wait
gov.acquire({ actorId: "pipeline", action: "embed", priority: "background" });
```

`interactiveReserve: 2` के साथ, जब केवल 2 स्लॉट बचे होते हैं, तो पृष्ठभूमि कार्य अवरुद्ध हो जाते हैं, ताकि वे इंटरैक्टिव अनुरोधों के लिए उपलब्ध रहें।

### स्ट्रीमिंग अनुरोध

```ts
const decision = gov.acquire({ actorId: "user", action: "stream" });
if (!decision.granted) return;

try {
  const stream = await openai.chat.completions.create({ stream: true, ... });
  for await (const chunk of stream) {
    // process chunk
  }
  gov.release(decision.leaseId, { outcome: "success" });
} catch (err) {
  gov.release(decision.leaseId, { outcome: "error" });
  throw err;
}
```

एक बार प्राप्त करें, एक बार रिलीज़ करें - लीज़ पूरी स्ट्रीम की अवधि के लिए सक्रिय रहता है।

### निगरानी: यह क्यों अनुरोधों को सीमित कर रहा है, यह देखें

```ts
import { createGovernor, formatEvent, formatSnapshot } from "throttleai";

const gov = createGovernor({
  ...presets.balanced(),
  onEvent: (e) => console.log(formatEvent(e)),
  // [deny] actor=user-1 action=chat reason=concurrency retryAfterMs=500 — All 5 slots in use...
});

// Point-in-time view
console.log(formatSnapshot(gov.snapshot()));
// concurrency=3/5 rate=12/60 leases=3
```

## कॉन्फ़िगरेशन

```ts
createGovernor({
  // Concurrency (optional)
  concurrency: {
    maxInFlight: 5,          // max simultaneous weight
    interactiveReserve: 1,   // slots reserved for interactive priority
  },

  // Rate limiting (optional)
  rate: {
    requestsPerMinute: 60,   // request-rate cap
    tokensPerMinute: 100_000, // token-rate cap
    windowMs: 60_000,         // rolling window (default 60s)
  },

  // Advanced (optional)
  fairness: true,             // prevent actor monopolization
  adaptive: true,             // auto-tune concurrency from deny rate + latency
  strict: true,               // throw on double release / unknown ID (dev mode)

  // Lease settings
  leaseTtlMs: 60_000,         // auto-expire (default 60s)
  reaperIntervalMs: 5_000,    // sweep interval (default 5s)

  // Observability
  onEvent: (e) => { /* acquire, deny, release, expire, warn */ },
});
```

## एपीआई

### `createGovernor(config): Governor`

एक फ़ैक्टरी फ़ंक्शन। यह `Governor` ऑब्जेक्ट लौटाता है।

### `governor.acquire(request): AcquireDecision`

एक लीज़ का अनुरोध करें। यह निम्नलिखित जानकारी लौटाता है:

```ts
// Granted
{ granted: true, leaseId: string, expiresAt: number }

// Denied
{ granted: false, reason, retryAfterMs, recommendation, limitsHint? }
```

अस्वीकृति के कारण: `"concurrency"`, `"rate"`, `"budget"`, या `"policy"`

### `governor.release(leaseId, report?): void`

एक लीज़ को रिलीज़ करें। इसे हमेशा कॉल करें - भले ही कोई त्रुटि हो।

### `withLease(governor, request, fn, options?)`

एक लीज़ के तहत `fn` फ़ंक्शन को निष्पादित करें, जिसमें स्वचालित रूप से लीज़ रिलीज़ हो जाती है।

```ts
withLease(gov, request, fn, {
  strategy: "deny",           // default — fail immediately
  strategy: "wait",           // retry with backoff until maxWaitMs
  strategy: "wait-then-deny", // retry up to maxAttempts
  maxWaitMs: 10_000,          // max total wait (default 10s)
  maxAttempts: 3,             // for "wait-then-deny" (default 3)
  initialBackoffMs: 250,      // starting backoff (default 250ms)
});
```

### `governor.snapshot(): GovernorSnapshot`

वर्तमान स्थिति: समवर्तीता, दर, टोकन, अंतिम अस्वीकृति।

### `formatEvent(event): string` / `formatSnapshot(snap): string`

मानव-पठनीय प्रारूपण के लिए एक-लाइन फ़ंक्शन।

### स्थिति जानने के लिए

```ts
gov.activeLeases         // active lease count
gov.concurrencyActive    // in-flight weight
gov.concurrencyAvailable // remaining capacity
gov.rateCount            // requests in current window
gov.tokenRateCount       // tokens in current window
```

### `governor.dispose(): void`

TTL रीपर को बंद करें। सिस्टम बंद होने पर इसे कॉल करें।

## अनुकूलन

ट्री-शेकेबल रैपर - केवल वही आयात करें जिसका आप उपयोग करते हैं। इसमें कोई रनटाइम निर्भरता नहीं है।

| अनुकूलक | आयात करें | स्वचालित रिपोर्टिंग |
| --------- | -------- | ------------- |
| **fetch** | `throttleai/adapters/fetch` | परिणाम (HTTP स्थिति से) + विलंबता |
| **OpenAI** | `throttleai/adapters/openai` | परिणाम + विलंबता + टोकन उपयोग |
| **Tool** | `throttleai/adapters/tools` | परिणाम + विलंबता + कस्टम भार |
| **Express** | `throttleai/adapters/express` | परिणाम ( `res.statusCode` से) + विलंबता |
| **Hono** | `throttleai/adapters/hono` | परिणाम + विलंबता |

सभी एडेप्टर अनुमति मिलने पर `{ ok: true, result, latencyMs }` और अस्वीकार होने पर `{ ok: false, decision }` लौटाते हैं।

### फ़ेच

```ts
import { wrapFetch } from "throttleai/adapters/fetch";
const throttledFetch = wrapFetch(fetch, { governor: gov });
const r = await throttledFetch("https://api.example.com/v1/chat");
if (r.ok) console.log(r.response.status);
```

### OpenAI-संगत

```ts
import { wrapChatCompletions } from "throttleai/adapters/openai";
const chat = wrapChatCompletions(openai.chat.completions.create, { governor: gov });
const r = await chat({ model: "gpt-4", messages });
if (r.ok) console.log(r.result.choices[0].message.content);
```

### टूल कॉल

```ts
import { wrapTool } from "throttleai/adapters/tools";
const embed = wrapTool(myEmbedFn, { governor: gov, toolId: "embed", costWeight: 2 });
const r = await embed("hello");
if (r.ok) console.log(r.result);
```

### एक्सप्रेस

```ts
import { throttleMiddleware } from "throttleai/adapters/express";
app.use("/ai", throttleMiddleware({ governor: gov }));
// 429 + Retry-After header + JSON body on deny
```

अनुकूलित ट्यूनिंग के साथ एक पूर्ण, चलने योग्य सर्वर के लिए [`examples/express-adaptive/`](examples/express-adaptive/) देखें।

### होनो

```ts
import { throttle } from "throttleai/adapters/hono";
app.use("/ai/*", throttle({ governor: gov }));
// 429 JSON on deny, leaseId stored on context
```

## दस्तावेज़

| दस्तावेज़ | इसमें क्या शामिल है |
| ---------- | --------------- |
| [Tuning cheatsheet](docs/tuning-cheatsheet.md) | परिदृश्य-आधारित कॉन्फ़िगरेशन गाइड, निर्णय वृक्ष, नॉब संदर्भ |
| [Troubleshooting](docs/troubleshooting.md) | सामान्य समस्याएं: हमेशा अस्वीकृत, रुकावट, अनुकूली दोलन |
| [Release manifest](docs/release-manifest.md) | रिलीज़ प्रक्रिया और आर्टिफैक्ट विवरण |
| [Repo hygiene](docs/repo-hygiene.md) | एसेट नीति और इतिहास पुनर्लेखन लॉग |

## ट्यूनिंग त्वरित संदर्भ

| आप यह देखते हैं | इसे समायोजित करें |
|---|---|
| `reason: "concurrency"` | `maxInFlight` बढ़ाएं या कॉल अवधि कम करें |
| `reason: "rate"` | `requestsPerMinute` / `tokensPerMinute` बढ़ाएं |
| `reason: "policy"` (निष्पक्षता) | `softCapRatio` कम करें या `maxInFlight` बढ़ाएं |
| उच्च `retryAfterMs` | `leaseTtlMs` को कम करें ताकि समाप्त हो चुके लीज़ तेजी से समाप्त हो जाएं |
| पृष्ठभूमि कार्य बाधित | `maxInFlight` बढ़ाएं या `interactiveReserve` कम करें |
| इंटरैक्टिव विलंबता अधिक | `interactiveReserve` बढ़ाएं |
| अनुकूलन बहुत तेजी से घटता है | `alpha` कम करें या `targetDenyRate` बढ़ाएं |

अधिक विस्तृत मार्गदर्शन के लिए, [ट्यूनिंग चीटशीट](docs/tuning-cheatsheet.md) देखें।

## उदाहरण

चलने योग्य डेमो के लिए [`examples/`](examples/) देखें:

- **[express-adaptive/](examples/express-adaptive/)** — अनुकूलित ट्यूनिंग + लोड जनरेटर के साथ पूर्ण एक्सप्रेस सर्वर
- **[node-basic.ts](examples/node-basic.ts)** — स्नैपशॉट प्रिंटिंग के साथ बर्स्ट सिमुलेशन
- **[express-middleware.ts](examples/express-middleware.ts)** — 429 + रीट्राय-आफ्टर एंडपॉइंट
- **[cookbook-adapters.ts](examples/cookbook-adapters.ts)** — सभी पांच एडेप्टर क्रिया में
- **[cookbook-burst-snapshot.ts](examples/cookbook-burst-snapshot.ts)** — गवर्नर स्नैपशॉट के साथ बर्स्ट लोड
- **[cookbook-interactive-reserve.ts](examples/cookbook-interactive-reserve.ts)** — इंटरैक्टिव बनाम पृष्ठभूमि प्राथमिकता
- **[cookbook-express-429.ts](examples/cookbook-express-429.ts)** — 429 बनाम क्यू रीट्राय पैटर्न

```bash
npx tsx examples/node-basic.ts
```

## स्थिरता

ThrottleAI [सिमेंटिक वर्जनिंग](https://semver.org/) का पालन करता है। सार्वजनिक एपीआई — `throttleai` और `throttleai/adapters/*` से निर्यात किए गए सभी — v1.0.0 से **स्थिर** है। ब्रेकिंग बदलावों के लिए एक प्रमुख संस्करण में वृद्धि की आवश्यकता होती है।

सार्वजनिक और आंतरिक के बीच के अंतर के बारे में विवरण के लिए, [एपीआई स्थिरता](docs/api-stability.md) देखें। सुरक्षा रिपोर्टिंग के लिए, [SECURITY.md](.github/SECURITY.md) देखें।

## लाइसेंस

MIT
