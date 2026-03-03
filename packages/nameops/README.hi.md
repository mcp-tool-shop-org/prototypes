<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nameops/readme.png" alt="NameOps" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml"><img src="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nameops/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

[clearance-opinion-engine](https://github.com/mcp-tool-shop-org/clearance-opinion-engine) के लिए नाम सत्यापन ऑर्केस्ट्रेटर।

यह एक मानक नाम सूची को बैच सत्यापन प्रक्रियाओं, प्रकाशित कलाकृतियों और मानव-पठनीय पुल अनुरोध सारांशों में बदल देता है।

## यह कैसे काम करता है

1. `data/names.txt` में उन नामों की मानक सूची होती है जिनकी जांच की जानी है।
2. `data/profile.json` में COE CLI के डिफ़ॉल्ट फ़्लैग (चैनल, जोखिम, समवर्तीता, आदि) होते हैं।
3. `src/run.mjs` निम्नलिखित कार्यों का समन्वय करता है: COE बैच, प्रकाशन, सत्यापन।
4. `src/build-pr-body.mjs` एक मार्कडाउन पुल अनुरोध बॉडी उत्पन्न करता है जिसमें स्तरों के सारांश, टकराव कार्ड और लागत आँकड़े शामिल होते हैं।
5. मार्केटिंग रिपॉजिटरी का अनुसूचित वर्कफ़्लो इस लॉजिक को कॉल करता है और संसाधित कलाकृतियों के साथ पुल अनुरोध खोलता है।

## उपयोग

```bash
# Install the clearance engine
npm install -g @mcptoolshop/clearance-opinion-engine

# Run the pipeline
node src/run.mjs --out artifacts --profile data/profile.json --names data/names.txt

# Build a PR body from the output
node src/build-pr-body.mjs artifacts
```

## कॉन्फ़िगरेशन

### `data/names.txt`

प्रत्येक पंक्ति में एक नाम होना चाहिए। `#` से शुरू होने वाली पंक्तियाँ टिप्पणियाँ हैं। अधिकतम 500 नाम।

### `data/profile.json`

| Field | COE फ़्लैग | डिफ़ॉल्ट |
| ------- | ---------- | --------- |
| `channels` | `--channels` | `all` |
| `org` | `--org` | `mcp-tool-shop-org` |
| `dockerNamespace` | `--dockerNamespace` | `mcptoolshop` |
| `hfOwner` | `--hfOwner` | `mcptoolshop` |
| `risk` | `--risk` | `conservative` |
| `radar` | `--radar` | `true` |
| `concurrency` | `--concurrency` | `3` |
| `maxAgeHours` | `--max-age-hours` | `168` (7 दिन) |
| `variantBudget` | `--variantBudget` | `12` |
| `fuzzyQueryMode` | `--fuzzyQueryMode` | `registries` |
| `cacheDir` | `--cache-dir` | `.coe-cache` |
| `maxRuntimeMinutes` | वर्कफ़्लो टाइमआउट | `15` |

## आउटपुट

```
artifacts/
  metadata.json           # Run metadata (date, duration, counts)
  pr-body.md              # Markdown PR body
  batch/                  # Raw COE batch output
  published/              # Published artifacts (for marketing site)
    runs.json             # Index of all runs
    <slug>/
      report.html
      summary.json
      clearance-index.json
      run.json
```

## आर्किटेक्चर

NameOps एक ऑर्केस्ट्रेटर है, कोई सेवा नहीं। यह किसी भी डेटा मॉडल का स्वामी नहीं है और COE CLI के अलावा इसकी कोई रनटाइम निर्भरता नहीं है। मार्केटिंग रिपॉजिटरी शेड्यूल का प्रबंधन करती है (CLAUDE.md के नियमों के अनुसार); nameops लॉजिक का प्रबंधन करता है।

## परीक्षण

```bash
npm test
```

## लाइसेंस

MIT
