<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/prov-engine-js/readme.png" alt="prov-engine-js" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/prov-engine-js/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/prov-engine-js/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/prov-engine-js"><img src="https://img.shields.io/npm/v/@mcptoolshop/prov-engine-js" alt="npm"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/prov-engine-js/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**एक न्यूनतम, शून्य-निर्भर Node.js प्रोवेनेंस इंजन जो prov-spec मानक को लागू करता है।**

---

## एक नज़र में

- **शून्य निर्भरताएँ:** केवल Node.js के अंतर्निहित मॉड्यूल (`node:fs`, `node:crypto`, `node:process`) का उपयोग करता है।
- **सिंगल-फाइल इंजन:** पूरा कार्यान्वयन `prov-engine.js` में मौजूद है।
- **CLI + प्रोग्रामेटिक:** कमांड लाइन से चलाएं या इसे अपने कोड में इम्पोर्ट करें।
- **prov-spec L1 के अनुरूप:** सभी लेवल 1 (इंटीग्रिटी) टेस्ट वेक्टर पास करता है।
- **JCS-उपसमुच्चय का मानकीकरण:** prov-spec के अनुभाग 6 के अनुसार नियतात्मक JSON सीरियलाइज़ेशन।

---

## इंस्टॉल करें

```bash
# Add to your project
pnpm add @mcptoolshop/prov-engine-js

# Or run directly without installing
npx @mcptoolshop/prov-engine-js describe
```

आप रिपॉजिटरी को क्लोन भी कर सकते हैं और इंजन को सीधे चला सकते हैं:

```bash
git clone https://github.com/mcp-tool-shop-org/prov-engine-js.git
cd prov-engine-js
node prov-engine.js describe
```

---

## CLI कमांड

इंजन पांच कमांड प्रदान करता है। सभी आउटपुट JSON फॉर्मेट में stdout पर लिखे जाते हैं।

### `describe` -- क्षमता मैनिफेस्ट प्रिंट करें।

```bash
npx @mcptoolshop/prov-engine-js describe
```

```json
{
  "schema": "prov-capabilities@v0.1",
  "engine": {
    "name": "prov-engine-js",
    "version": "0.1.0",
    "vendor": "prov-spec",
    "repo": "https://github.com/mcp-tool-shop-org/prov-engine-js",
    "license": "MIT"
  },
  "implements": [
    "adapter.wrap.envelope_v0_1",
    "integrity.digest.sha256"
  ],
  "conformance_level": "fully-conformant"
}
```

### `digest <input.json>` -- मानकीकृत रूप और SHA-256 डाइजेस्ट की गणना करें।

```bash
echo '{"b":2,"a":1}' > input.json
npx @mcptoolshop/prov-engine-js digest input.json
```

```json
{
  "canonical_form": "{\"a\":1,\"b\":2}",
  "digest": {
    "alg": "sha256",
    "value": "abd8d7fa4bab05cdd8da39bee28237e3b2c9cb08ccfc73e0af3e5a6f17eaee5a"
  }
}
```

### `wrap <payload.json>` -- पेलोड को MCP एनवेलप में लपेटें।

```bash
echo '{"tool":"example","result":"ok"}' > payload.json
npx @mcptoolshop/prov-engine-js wrap payload.json
```

```json
{
  "schema_version": "mcp.envelope.v0.1",
  "result": {
    "tool": "example",
    "result": "ok"
  }
}
```

यदि इनपुट पहले से ही एक एनवेलप है (`schema_version` `mcp.envelope.v0.1` के बराबर है), तो यह बिना किसी बदलाव के पास हो जाता है (कोई दोहरा लपेटन नहीं)।

### `verify-digest <artifact.json>` -- एक डाइजेस्ट दावे को सत्यापित करें।

इनपुट फ़ाइल में एक `content` फ़ील्ड और एक `digest` फ़ील्ड होना चाहिए जिसमें `alg` और `value` शामिल हों:

```bash
cat > artifact.json << 'EOF'
{
  "content": {"a": 1, "b": 2},
  "digest": {
    "alg": "sha256",
    "value": "abd8d7fa4bab05cdd8da39bee28237e3b2c9cb08ccfc73e0af3e5a6f17eaee5a"
  }
}
EOF
npx @mcptoolshop/prov-engine-js verify-digest artifact.json
# Exit code 0 = valid, exit code 1 = mismatch
echo $?  # 0
```

### `check-vector <vector-dir>` -- एक prov-spec टेस्ट वेक्टर चलाएं।

```bash
npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/integrity.digest.sha256
# PASS: integrity.digest.sha256 vector

npx @mcptoolshop/prov-engine-js check-vector ../prov-spec/spec/vectors/adapter.wrap.envelope_v0_1
# PASS: adapter.wrap.envelope_v0_1 vector
```

वेक्टर निर्देशिका में `input.json` और `expected.json` होना चाहिए। इंजन अपेक्षित आउटपुट के आकार से वेक्टर के प्रकार का स्वचालित रूप से पता लगाता है।

---

## प्रोग्रामेटिक उपयोग

इंजन एक ES मॉड्यूल है। आप इसके आंतरिक कार्यों को इम्पोर्ट करके अपने कोड में उपयोग कर सकते हैं:

```js
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// -- Canonicalization (inline, since not exported yet) --
function canonicalize(value) {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Non-finite numbers not allowed");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalize(value[k])).join(",") + "}";
  }
  throw new Error(`Non-JSON value type: ${typeof value}`);
}

// Compute a digest
const payload = { tool: "demo", version: 1 };
const canonical = canonicalize(payload);
const hash = createHash("sha256").update(canonical, "utf8").digest("hex");

console.log("Canonical:", canonical);
console.log("SHA-256:  ", hash);

// Wrap in an MCP envelope
const envelope = {
  schema_version: "mcp.envelope.v0.1",
  result: payload,
};
console.log("Envelope: ", JSON.stringify(envelope, null, 2));
```

> **सुझाव:** भविष्य में, `canonicalize`, `computeDigest`, और `wrapEnvelope` को नामित एक्सपोर्ट के रूप में निर्यात किया जाएगा ताकि आप सीधे `import { canonicalize } from "@mcptoolshop/prov-engine-js"` का उपयोग कर सकें।

---

## विधियाँ

| विधि | विवरण |
| -------- | ------------- |
| `integrity.digest.sha256` | prov-spec के अनुभाग 6 के अनुसार JSON को मानकीकृत करें, फिर UTF-8 बाइट्स पर SHA-256 की गणना करें। `{ alg: "sha256", value: "<hex>" }` लौटाता है। |
| `adapter.wrap.envelope_v0_1` | किसी भी JSON पेलोड को `{ schema_version: "mcp.envelope.v0.1", result: <payload> }` में लपेटें। पहले से लपेटे गए एनवेलप बिना किसी बदलाव के पास हो जाते हैं। |

---

## मानकीकरण कैसे काम करता है

prov-spec में नियतात्मक JSON सीरियलाइज़ेशन की आवश्यकता होती है ताकि एक ही लॉजिकल ऑब्जेक्ट हमेशा एक ही बाइट सीक्वेंस (और इसलिए, एक ही डाइजेस्ट) उत्पन्न करे। यह इंजन prov-spec के अनुभाग 6 के अनुसार JCS-उपसमुच्चय मानकीकरण को लागू करता है:

1. **क्रमबद्ध कुंजियाँ:** ऑब्जेक्ट कुंजियों को यूनिकोड कोड पॉइंट क्रम द्वारा लेक्सिकोग्राफिक रूप से क्रमबद्ध किया जाता है।
2. **कोई व्हाइटस्पेस नहीं:** टोकन के बीच कोई स्पेस या नई लाइनें नहीं। विभाजक केवल `,` और `:` हैं।
3. **संख्या मानकीकरण:** कोई अग्रणी शून्य नहीं, दशमलव बिंदु के बाद कोई अनुगामी शून्य नहीं, कोई सकारात्मक चिह्न नहीं, `-0` `0` बन जाता है।
4. **न्यूनतम स्ट्रिंग एस्केपिंग:** केवल आवश्यक एस्केप सीक्वेंस ही उत्सर्जित होते हैं।
5. **UTF-8 एन्कोडिंग:** मानकीकृत स्ट्रिंग को हैशिंग से पहले UTF-8 के रूप में एन्कोड किया जाता है।

उदाहरण: `{"b": 2, "a": 1}` का मानकीकरण `{"a":1,"b":2}` में होता है।

---

## अनुरूपता

यह इंजन prov-spec मानक के **लेवल 1 (इंटीग्रिटी)** के लिए **पूरी तरह से अनुरूप** स्थिति घोषित करता है।

- सभी `integrity.digest.sha256` टेस्ट वेक्टर पास करता है।
- सभी `adapter.wrap.envelope_v0_1` टेस्ट वेक्टर पास करता है।
- कोई ज्ञात विचलन नहीं।

पूर्ण क्षमता मैनिफेस्ट के लिए `prov-capabilities.json` देखें।

---

## दस्तावेज़

| दस्तावेज़ | विवरण |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | गहन मार्गदर्शिका: प्रोवेनेंस अवधारणाएँ, prov-spec यांत्रिकी, एकीकरण पैटर्न, आर्किटेक्चर, अक्सर पूछे जाने वाले प्रश्न। |
| [CONTRIBUTING.md](CONTRIBUTING.md) | योगदान कैसे करें, विकास प्रक्रिया, डिज़ाइन सिद्धांत |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | समुदाय के नियम |
| [CHANGELOG.md](CHANGELOG.md) | रिलीज़ का इतिहास (चेंजलॉग प्रारूप में) |

---

## लाइसेंस

[एमआईटी](LICENSE)
