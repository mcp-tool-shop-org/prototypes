<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/zip-meta-map/readme.png" width="400" />
</p>

<p align="center">
  Turn a ZIP or folder into a guided, LLM-friendly metadata bundle.<br>
  <strong>Map + Route + Guardrails</strong> — inside the archive itself.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://pypi.org/project/zip-meta-map/"><img src="https://img.shields.io/pypi/v/zip-meta-map" alt="PyPI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/zip-meta-map" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/zip-meta-map/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## यह क्या करता है।

"ज़िप-मेटा-मैप" एक निश्चित मेटाडेटा परत बनाता है जो कृत्रिम बुद्धिमत्ता (एआई) एजेंटों के लिए तीन सवालों के जवाब देता है:

- **इसमें क्या है?** — भूमिका-आधारित फ़ाइल सूची, जिसमें विश्वास स्तर भी दर्शाया गया है।
- **सबसे पहले क्या महत्वपूर्ण है?** — "शुरू करें" नामक सूची, जो क्रमबद्ध है और जिसमें कुछ अंश शामिल हैं।
- **मैं संदर्भ में खोए बिना कैसे नेविगेट कर सकता हूँ?** — नेविगेशन योजनाएं, जिनमें डेटा उपयोग की सीमा निर्धारित है।

## त्वरित प्रदर्शन।

```bash
$ zip-meta-map build my-project/ -o output/ --summary

Wrote META_ZIP_FRONT.md and META_ZIP_INDEX.json to output/
  Profile:  python_cli
  Files:    47
  Modules:  8
  Flagged:  2 file(s) with risk flags
```

```bash
$ zip-meta-map explain my-project/

Profile:  python_cli
Files:    47

Top files to read first:
  README.md                     [doc]        conf=0.95  README is primary documentation
  src/app/main.py               [entrypoint] conf=0.95  matches profile entrypoint pattern
  pyproject.toml                [config]     conf=0.95  Python project configuration

Overview plan:
  Quick orientation — what is this tool and how is it structured?
  1. READ README.md for project purpose and usage
  2. READ pyproject.toml for dependencies and entry points
  3. READ entrypoint file to understand CLI structure
  Budget: ~32 KB
```

एक संपूर्ण उदाहरण देखने के लिए, [गोल्डन डेमो आउटपुट](examples/tiny_python_cli/) को देखें।

## स्थापित करें।

```bash
pip install zip-meta-map
```

या फिर [pipx](https://pipx.pypa.io/) का उपयोग करके:

```bash
pipx install zip-meta-map
```

स्रोत से:

```bash
git clone https://github.com/mcp-tool-shop-org/zip-meta-map
cd zip-meta-map
pip install -e ".[dev]"
```

## गिटहब एक्शन।

"ज़िप-मेटा-मैप" को सीआई (CI) में समग्र क्रिया (composite action) के साथ उपयोग करें:

```yaml
- name: Generate metadata map
  uses: mcp-tool-shop-org/zip-meta-map@v0
  with:
    path: .
```

यह टूल को स्थापित करता है, मेटाडेटा बनाता है, और एक संक्षिप्त विवरण लिखता है। इसके आउटपुट में `index-path`, `front-path`, `profile`, `file-count`, और `warnings-count` शामिल हैं। सारांश को पुल रिक्वेस्ट (PR) के रूप में पोस्ट करने के लिए `pr-comment: 'true'` सेट करें।

पूरे कार्यप्रवाह (वर्कफ़्लो) के उदाहरण के लिए, [examples/github-action/](examples/github-action/) पर जाएँ।

## यह क्या उत्पन्न करता है।

| फ़ाइल। | उद्देश्य। |
| "Please provide the English text you would like me to translate into Hindi." | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| `META_ZIP_FRONT.md` | मानव-पठनीय मार्गदर्शन पृष्ठ। |
| `META_ZIP_INDEX.json` | मशीन द्वारा पढ़ी जा सकने वाली अनुक्रमणिका (भूमिकाएँ, आत्मविश्वास, योजनाएँ, खंड, अंश, जोखिम संकेत)। |
| `META_ZIP_REPORT.md` | विस्तृत, खोज योग्य रिपोर्ट ( `--report md` विकल्प के साथ)। |

## सीएलआई संदर्भ।

```bash
# Build metadata for a folder or ZIP
zip-meta-map build path/to/repo -o output/
zip-meta-map build archive.zip -o output/

# Build with step summary and report
zip-meta-map build . -o output/ --summary --report md

# Output formats for piping
zip-meta-map build . --format json          # JSON to stdout
zip-meta-map build . --format ndjson        # one JSON line per file
zip-meta-map build . --manifest-only        # skip FRONT.md

# Explain what the tool detected
zip-meta-map explain path/to/repo
zip-meta-map explain path/to/repo --json

# Compare two indices (CI-friendly)
zip-meta-map diff old.json new.json             # human-readable
zip-meta-map diff old.json new.json --json       # JSON output
zip-meta-map diff old.json new.json --exit-code  # exit 1 if changes

# Validate an existing index
zip-meta-map validate META_ZIP_INDEX.json

# Policy overrides
zip-meta-map build . --policy META_ZIP_POLICY.json -o output/
```

## प्रोफ़ाइलें।

यह स्वचालित रूप से रिपॉजिटरी के प्रकार के आधार पर पता लगाया जाता है। वर्तमान में उपलब्ध सुविधाएं:

| प्रोफ़ाइल। | पता लगाया गया: | योजनाएँ। |
| ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने के लिए तैयार हूं। | "The quick brown fox jumps over the lazy dog."

"तेज़ भूरी लोमड़ी आलसी कुत्ते के ऊपर से कूदती है।" |
| `python_cli` | `pyproject.toml`, `setup.py` | अवलोकन, डिबगिंग, नई सुविधा जोड़ना, सुरक्षा समीक्षा, गहन विश्लेषण. |
| `node_ts_tool` | `package.json`, `tsconfig.json` | अवलोकन, डिबगिंग, नई सुविधा जोड़ना, सुरक्षा समीक्षा, गहन विश्लेषण. |
| `monorepo` | `pnpm-workspace.yaml`, `lerna.json` | अवलोकन, डिबगिंग, नई सुविधा जोड़ना, सुरक्षा समीक्षा, गहन विश्लेषण. |

कृपया [docs/PROFILES.md](docs/PROFILES.md) देखें।

## भूमिकाएँ और आत्मविश्वास।

प्रत्येक फ़ाइल प्रविष्टि में एक **भूमिका** (सीमित शब्दावली), **आत्मविश्वास** (0.0–1.0), और **कारण** शामिल होता है।

| बैंड। | दायरा। | अर्थ। |
| "Please provide the English text you would like me to translate into Hindi." | "The quick brown fox jumps over the lazy dog."

"तेज़ भूरी लोमड़ी आलसी कुत्ते के ऊपर से कूदती है।" | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| ऊँचा। | 0.9 या उससे अधिक। | मजबूत संरचनात्मक संकेत (फ़ाइल नाम का मिलान, प्रोफाइल एंट्रीपॉइंट)। |
| अच्छा। | 0.7 या उससे अधिक। | पैटर्न मिलान (डायरेक्टरी का नामकरण, फ़ाइल एक्सटेंशन और स्थान)। |
| उज्ज्वल/निष्पक्ष/मेला. | 0.5 या उससे अधिक। | केवल विस्तार (एक्सटेंशन) या कमजोर स्थिति संकेत। |
| कम. | 0.5 से कम। | असाइन किया गया: "अज्ञात"; कारण अस्पष्टता की व्याख्या करता है। |

## क्रमिक जानकारी का प्रकटीकरण (संस्करण 0.2)

- **फाइल खंड मानचित्र (Chunk maps):** 32 KB से बड़ी फाइलों के लिए, स्थिर आईडी, पंक्ति सीमाएं और शीर्षकों की जानकारी।
- **मॉड्यूल सारांश:** डायरेक्टरी स्तर पर भूमिकाओं का वितरण और महत्वपूर्ण फाइलें।
- **अंश (Excerpts):** महत्वपूर्ण फाइलों की पहली कुछ पंक्तियाँ।
- **जोखिम संकेत (Risk flags):** `exec_shell`, `secrets_like`, `network_io`, `path_traversal`, `binary_masquerade`, `binary_executable` जैसे संभावित खतरों की पहचान।
- **क्षमताएं (Capabilities):** `capabilities[]` यह दर्शाता है कि कौन सी वैकल्पिक विशेषताएं उपलब्ध हैं।

## स्थिरता।

- विशिष्ट संस्करण (spec version) सेमवर् (semver) जैसे नियमों का पालन करता है: मामूली बदलावों से नए फ़ील्ड जुड़ते हैं, जबकि प्रमुख बदलावों से उपभोक्ताओं में समस्याएं आ सकती हैं।
- `capabilities[]` आधिकारिक तौर पर सुविधाओं के बारे में जानकारी देने का तरीका है।
- पुराने संस्करण जो अज्ञात फ़ील्ड को अनदेखा करते हैं, वे मामूली बदलावों के बावजूद ठीक से काम करते रहेंगे।
- पूर्ण विवरण के लिए, [docs/SPEC.md](docs/SPEC.md) देखें।

## रिपो संरचना।

```
src/zip_meta_map/
  cli.py        # argparse CLI (build, explain, diff, validate)
  builder.py    # scan -> index -> validate -> write
  diff.py       # index comparison (diff command)
  report.py     # GitHub step summary + detailed report
  scanner.py    # directory + ZIP scanning with SHA-256
  roles.py      # role assignment heuristics + confidence
  profiles.py   # built-in profiles + traversal plans
  chunker.py    # deterministic text chunking
  modules.py    # folder-level module summaries
  safety.py     # risk flag detection + warning generation
  schema/       # JSON Schemas and loaders
docs/
  SPEC.md       # v0.2 contract (format semantics)
  PROFILES.md   # profile behaviors + plans
examples/
  tiny_python_cli/   # golden demo output
  github-action/     # consumer workflow example
tests/
  fixtures/     # tiny fixture repos
```

## योगदान करना।

यह परियोजना जानबूझकर छोटी रखी गई है। यदि आप योगदान करते हैं:

- अनुमानित विधियों को निश्चित रखें।
- भूमिकाओं को सीमित रखें, बारीकियों को टैग में शामिल करें।
- किसी भी नई अनुमानित विधि के लिए परीक्षण जोड़ें।
- स्कीमा को कमजोर न करें, जब तक कि आप दस्तावेज़/SPEC.md और गोल्डन्स को अपडेट न कर लें।

```bash
pytest
```

## दस्तावेज़

- [विशिष्टता (v0.2)](docs/SPEC.md) — सभी उत्पन्न फ़ाइलों के लिए अनुबंध।
- [प्रोफाइलें](docs/PROFILES.md) — अंतर्निहित परियोजना प्रकार की प्रोफाइल।
- [सुरक्षा](SECURITY.md) — भेद्यता रिपोर्टिंग।

## लाइसेंस

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
