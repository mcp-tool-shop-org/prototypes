<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" alt="receipt-factory">
</p>

<p align="center">
  Receipts are how we prove work happened — without trusting vibes.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/receipt-factory/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

एक रसीद एक हस्ताक्षरित, समय-मुद्रित, और पुनरुत्पादित रिकॉर्ड है जो **यह दर्शाता है कि क्या हुआ**:

- **क्या किया गया** — क्रियाएं, इनपुट, आउटपुट
- **यह क्यों किया गया** — उद्देश्य, नीति, संदर्भ
- **कौन/क्या ने यह किया** — अभिनेता, निष्पादक, टूल संस्करण
- **यह साबित करने का प्रमाण कि यह हुआ** — हैश, लिंक, चेकसम, लॉग
- **यह कैसे सत्यापित करें** — कमांड, पुनः चलाने के निर्देश

आप एक रसीद को 30 सेकंड में पढ़ सकते हैं और 2 मिनट में सत्यापित कर सकते हैं। सब कुछ पुनरुत्पादित किया जा सकता है। यदि ऐसा नहीं है, तो यह रसीद नहीं है।

## पैकेज

| पैकेज | विवरण |
|---------|-------------|
| [`@receipt-factory/core`](packages/core) | रसीद स्कीमा, मानकीकरण, SHA-256 हैशिंग, फ्लुएंट बिल्डर एपीआई |
| [`@receipt-factory/render`](packages/render) | मार्कडाउन + स्टैंडअलोन HTML रेंडरर |
| [`@receipt-factory/verify`](packages/verify) | स्कीमा सत्यापन, हैश अखंडता, लिंक सत्यापन, नीति प्रवर्तन |
| [`@receipt-factory/sign`](packages/sign) | Cosign-आधारित हस्ताक्षर — रसीदें, नीतियां, बंडल (अलग साइडकार) |
| [`@receipt-factory/evidence`](packages/evidence) | सबूत पैक — पोर्टेबल, सामग्री-आधारित सबूत बंडल |
| [`@receipt-factory/index`](packages/index) | रसीद इंडेक्स — स्कैन करें, खोजें, रसीद निर्देशिकाओं को फ़िल्टर करें |
| [`@receipt-factory/policy`](packages/policy) | नीति पैक — पोर्टेबल, संस्करणित लिंट कॉन्फ़िगरेशन |
| [`@receipt-factory/bundle`](packages/bundle) | रसीद बंडल — स्व-सत्यापित सत्य कैप्सूल (ज़िप) |
| [`@receipt-factory/adapter-github`](packages/adapters/github) | `gh` CLI के माध्यम से GitHub Actions डेटा प्राप्त करना |
| [`@receipt-factory/cli`](apps/factory-cli) | `rf` कमांड — रसीदें बनाएं, एकत्र करें, रेंडर करें, सत्यापित करें, हस्ताक्षर करें |

## पाइपलाइन

| पाइपलाइन | रसीद प्रकार | यह क्या साबित करता है |
|----------|-------------|----------------|
| [`ci-receipts`](pipelines/ci-receipts) | `ci_run` | एक CI बिल्ड/परीक्षण विशिष्ट इनपुट और परिणामों के साथ हुआ |
| [`release-receipts`](pipelines/release-receipts) | `release` | एक रिलीज़ विशिष्ट संपत्तियों और कमिट के साथ प्रकाशित किया गया था |
| [`registry-sync`](pipelines/registry-sync) | `registry_sync` | प्रकाशित सामग्री बनाम रिपॉजिटरी में मौजूद सामग्री — विचलन वर्गीकरण |
| [`security-audit`](pipelines/security-audit) | `audit` | क्या स्कैन किया गया था, किस टूल के साथ, कौन सी कमजोरियां पाई गईं |
| [`sbom`](pipelines/sbom) | `sbom` | सॉफ्टवेयर बिल ऑफ़ मैटेरियल्स उत्पन्न और प्रमाणित किया गया |

## शुरुआत कैसे करें

```bash
# Install the CLI
npm install -g @receipt-factory/cli

# Create a receipt from a GitHub Actions run
rf make ci --from github --run 12345678

# Render it
rf render receipts/ci/2026-03-03/12345678.json --format html

# Verify it
rf verify receipts/ci/2026-03-03/12345678.json

# Verify with strict lint + policy
rf verify receipts/ci/2026-03-03/12345678.json --strict --policy policy.json

# Bundle receipts into a portable capsule
rf bundle create receipts/ci/2026-03-03/12345678.json --follow --policy policy.json

# Sign the bundle
rf bundle sign bundles/abc123.bundle.zip --keyless
```

## विश्वास परतें

receipt-factory चार स्टैकिंग विश्वास परतें प्रदान करता है:

1. **रसीद अखंडता** — SHA-256 सामग्री-आधारित रसीदें (छेड़छाड़-रोधी)
2. **शासन अखंडता** — हस्ताक्षरित नीति फ़ाइलों के साथ नीति-आधारित लिंट नियम
3. **बंडल अखंडता** — हैश मैनिफेस्ट के साथ स्व-सत्यापित ज़िप बंडल
4. **बंडल प्राधिकरण** — बंडलों पर अलग cosign हस्ताक्षर (छेड़छाड़-रोधी)

सत्यापन क्रम: हस्ताक्षर → फ़ाइल अखंडता → सिमेंटिक अखंडता → शासन।

## यह क्या साबित करता है

- एक बिल्ड, परीक्षण, रिलीज़, ऑडिट, या SBOM पीढ़ी एक विशिष्ट समय पर हुई
- इनपुट और आउटपुट सामग्री-आधारित हैं और छेड़छाड़-रोधी हैं
- आप `rf verify` के साथ किसी भी समय रसीद को फिर से सत्यापित कर सकते हैं
- `rf graph` के साथ पूरा उत्पत्ति श्रृंखला देखी जा सकती है

## यह क्या साबित नहीं करता है

- कि अंतर्निहित कोड सही है (रसीदें प्रक्रिया को साबित करती हैं, गुणवत्ता को नहीं)
- कि CI वातावरण स्वयं समझौता नहीं किया गया था (यह एक आपूर्ति श्रृंखला समस्या है)
- कि रसीद निर्माण के बाद कलाकृतियों को संशोधित नहीं किया गया है (इसके लिए हस्ताक्षर का उपयोग करें)

## सुरक्षा

खतरे के मॉडल और रिपोर्टिंग के लिए [SECURITY.md](SECURITY.md) देखें।

**कोई टेलीमेट्री नहीं।** receipt-factory कभी भी होम नहीं करता है, उपयोग को ट्रैक नहीं करता है, या एनालिटिक्स एकत्र नहीं करता है।

## लाइसेंस

MIT

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा निर्मित
