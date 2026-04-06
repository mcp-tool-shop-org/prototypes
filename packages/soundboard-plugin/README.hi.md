<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/soundboard-plugin/main/assets/logo-dark.jpg" alt="Soundboard Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin"><img src="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="https://pypi.org/project/voice-soundboard-plugin/"><img src="https://img.shields.io/pypi/v/voice-soundboard-plugin" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  A <a href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/plugins">Claude Code plugin</a> that speaks code walkthroughs, announces build results,<br>
  and adds context-aware text-to-speech to your development workflow.
</p>

---

## मुख्य विशेषताएं

- **12 क्यूरेटेड आवाजें** जो भावनाओं के आधार पर अलग-अलग तरीके से काम करती हैं (खुशी, गुस्सा, उदासी, डर, आश्चर्य, तात्कालिकता, शांति, तटस्थ)।
- **मल्टी-स्पीकर संवाद** जिसमें ऑटो-कास्टिंग, मंच निर्देश और गति बदलने की सुविधा है।
- **स्मार्ट चंकिंग** जो लंबे टेक्स्ट को वाक्यों के आधार पर विभाजित करता है और इसमें रुकावट का समर्थन है।
- **SSML-लाइट** जो नियंत्रण को बेहतर बनाता है (विराम, जोर, पिच, गति)।
- **SFX टैग** जो शुद्ध पायथन WAV ध्वनियाँ उत्पन्न करते हैं (जैसे `<ding>`, `<chime>`)।
- **इनर मोनोलॉग** एक परिवेश प्रणाली जिसमें गति सीमा और स्वचालित डेटा हटाने की सुविधा है।
- **प्लेबैक सुरक्षा** सिंगल-थ्रेड वर्कर, 30 सेकंड का वॉचडॉग, और क्यू पॉलिसी (रुकावट / कतार में जोड़ना / छोड़ना)।
- **सुरक्षा को प्राथमिकता** पाथ सैंडबॉक्सिंग, समवर्ती नियंत्रण, संरचित त्रुटियां, WAV सत्यापन।

## स्लैश कमांड

| कमांड | यह क्या करता है |
|---------|-------------|
| `/soundboard:speak` | भावना का पता लगाने और SSML समर्थन के साथ सामान्य टेक्स्ट-टू-स्पीच। |
| `/soundboard:narrate` | अनुकूल गति के साथ कोड व्याख्या। |
| `/soundboard:notify` | बोलकर दिए जाने वाले कार्यप्रवाह सूचनाएं (बिल्ड, परीक्षण, डिप्लॉयमेंट इवेंट)। |
| `/soundboard:voices` | उपलब्ध आवाजों और प्रीसेट की सूची। |
| `/soundboard:voice-status` | इंजन की स्थिति, बैकएंड जानकारी, लागू सीमाएं। |

इसके अलावा, MCP टूल का पूरा इंटरफ़ेस: `voice.dialogue`, `voice.inner_monologue`, `voice.interrupt`, `voice.stream`, `voice.playback_diagnose`, `voice.ambient_enable`, `voice.ambient_mute`।

## शुरुआत कैसे करें

### आवश्यकताएं

- [voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) >= 2.5.0 (सिंथेसिस इंजन)
- Python >= 3.10
- विंडोज (मुख्य लक्ष्य; प्लेबैक के लिए `winsound` का उपयोग करता है)

### इंस्टॉल करें

```bash
# 1. Install the voice engine
cd voice-soundboard
pip install -e ".[kokoro]"

# 2. Install the plugin
cd soundboard-plugin
pip install -e .

# 3. Register with Claude Code
claude plugin add /path/to/soundboard-plugin
```

### इसे आजमाएं

```
/soundboard:speak Hello! I'm your coding assistant.
/soundboard:narrate src/server.py
/soundboard:notify Build succeeded with 0 warnings
```

## आर्किटेक्चर

```
Claude Code
    | stdio (JSON-RPC)
    v
stdio_bridge.py ──── security/guardrails.py
    |                     concurrency gate
    |                     rate limiter
    |                     structured errors
    v
speech pipeline
    ├── chunking.py        smart sentence splitting
    ├── ssml_lite.py       safe SSML subset parser
    ├── emotion/           8 emotions + voice routing
    ├── dialogue/          multi-speaker parser + casting
    ├── sfx_parser.py      <ding>/<chime> WAV generation
    ├── orchestrator.py    multi-chunk synthesis loop
    └── concat.py          WAV concatenation
    v
voice-soundboard engine
    ├── Kokoro (local, default)
    ├── Piper / OpenAI / Azure / ElevenLabs
    v
playback/worker.py ──── single-thread queue
    ├── 30s watchdog timer
    ├── interrupt / enqueue / drop policies
    └── retention.py (auto-cleanup)
    v
PCM audio -> speakers
```

## सुरक्षा

यह प्लगइन **पूरी तरह से आपके मशीन पर** चलता है। कोई नेटवर्क कॉल नहीं, कोई टेलीमेट्री नहीं, कोई क्लाउड एपीआई नहीं (जब तक कि आप एक रिमोट वॉयस बैकएंड कॉन्फ़िगर न करें)।

| गुण | कार्यान्वयन |
|----------|---------------|
| इनपुट सीमा | अधिकतम 10,000 अक्षर, सीमित गति, चंक/लाइन सीमाएं। |
| आवाज की अनुमति सूची | 12 पूर्व-अनुमोदित आवाजें, अज्ञात अस्वीकृत। |
| पाथ सैंडबॉक्सिंग | WAV आउटपुट `{tempdir}/voice-soundboard/` में सीमित। |
| समवर्ती | एक समय में केवल एक सिंथेसिस (सेमाफोर गेट)। |
| त्रुटि सुरक्षा | संरचित JSON त्रुटियां जिनमें ट्रेस आईडी होते हैं, क्लाइंट को कोई स्टैक ट्रेस नहीं। |
| गुप्त डेटा हटाना | लॉग से पथ, टोकन, आईपी, बेस64, key=value हटा दिए जाते हैं। |
| WAV सत्यापन | प्रत्येक आउटपुट पर RIFF/WAVE मैजिक और न्यूनतम आकार की जांच। |

पूर्ण नीति के लिए [`SECURITY.md`](SECURITY.md) और STRIDE-lite खतरे के मॉडल के लिए [`docs/SECURITY_THREAT_MODEL.md`](docs/SECURITY_THREAT_MODEL.md) देखें।

## आवाजें

प्लगइन के साथ 12 क्यूरेटेड आवाजें उपलब्ध हैं:

| आवाज | ID | लिंग | शैली |
|-------|-----|--------|-------|
| Fenrir | `am_fenrir` | M | शक्तिशाली, आधिकारिक (डिफ़ॉल्ट) |
| Eric | `am_eric` | M | ऊर्जावान, तात्कालिक |
| Liam | `am_liam` | M | गर्म, संवादात्मक |
| Onyx | `am_onyx` | M | गहरा, स्थिर |
| Aoede | `af_aoede` | F | स्पष्ट, अभिव्यंजक |
| Jessica | `af_jessica` | F | पेशेवर, तटस्थ |
| Sky | `af_sky` | F | चमकदार, दोस्ताना |
| Alice | `bf_alice` | F | ब्रिटिश, संयमित |
| Emma | `bf_emma` | F | ब्रिटिश, गर्म |
| Isabella | `bf_isabella` | F | ब्रिटिश, परिष्कृत |
| George | `bm_george` | M | ब्रिटिश, औपचारिक |
| Lewis | `bm_lewis` | M | ब्रिटिश, संयमित |

## कॉन्फ़िगरेशन

सभी कॉन्फ़िगरेशन पर्यावरण चर के माध्यम से किया जाता है (कोई कॉन्फ़िगरेशन फ़ाइलें नहीं):

| चर | डिफ़ॉल्ट | विवरण |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_OUTPUT_ROOT` | `{tempdir}/voice-soundboard/` | WAV आउटपुट निर्देशिका |
| `VOICE_SOUNDBOARD_RATE_COOLDOWN_MS` | `0` (अक्षम) | प्रत्येक उपकरण के लिए दर सीमा कूलडाउन |
| `VOICE_SOUNDBOARD_RETENTION_MINUTES` | `240` | इस अवधि से पुरानी WAV फ़ाइलों को स्वचालित रूप से हटाएं |
| `VOICE_SOUNDBOARD_AMBIENT_ENABLED` | `0` | आंतरिक मोनोलॉग सिस्टम को सक्षम करें |

## विकास

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run the test suite (323 tests)
python -m pytest tests/ -q

# Run the security battery only
python -m pytest tests/test_security.py -q

# Pre-release gate (tests + optional pip-audit)
python scripts/ship_gate.py
```

## परियोजना संरचना

```
soundboard-plugin/
├── voice_soundboard_plugin/
│   ├── bridge/          MCP stdio server + health checks
│   ├── speech/          TTS pipeline (chunking, SSML, orchestrator, concat)
│   │   ├── dialogue/    Multi-speaker parser + auto-casting
│   │   └── emotion/     Emotion detection + voice routing
│   ├── playback/        Single-thread worker + retention
│   ├── ambient/         Inner monologue subsystem
│   ├── security/        Guardrails, fs sandbox, redaction, WAV validation
│   └── audio/           Audio utilities
├── tests/               323 tests (unit + integration + security battery)
├── scripts/             ship_gate.py pre-release script
├── docs/                Threat model, privacy policy, release checklist
├── assets/              Logo and branding
├── SECURITY.md          Security policy + vulnerability reporting
└── pyproject.toml       Project metadata + dependencies
```

## सुरक्षा और डेटा दायरा

- **पहुंचे जाने वाले डेटा:** टेक्स्ट इनपुट को TTS (टेक्स्ट-टू-स्पीच) संश्लेषण के लिए पढ़ा जाता है। स्थानीय वॉयस इंजन के माध्यम से भाषण को संसाधित किया जाता है। SSML पार्सिंग के लिए एक सुरक्षित उपसमुच्चय पार्सर का उपयोग किया जाता है। आंतरिक मोनोलॉग भंडारण से पहले गोपनीय जानकारी को हटा देता है।
- **पहुंचे जाने वाले डेटा नहीं:** डिफ़ॉल्ट रूप से कोई नेटवर्क कनेक्शन नहीं। कोई टेलीमेट्री, एनालिटिक्स या ट्रैकिंग नहीं। अस्थायी WAV फ़ाइलों के अलावा कोई उपयोगकर्ता डेटा भंडारण नहीं। रिमोट वॉयस बैकएंड वैकल्पिक हैं।
- **आवश्यक अनुमतियाँ:** वॉयस इंजन तक पढ़ने की पहुंच। WAV आउटपुट निर्देशिका के लिए वैकल्पिक लिखने की पहुंच।

## स्कोरकार्ड

| गेट | स्थिति |
|------|--------|
| A. सुरक्षा आधार | पास |
| B. त्रुटि प्रबंधन | पास |
| C. ऑपरेटर दस्तावेज़ | पास |
| D. शिपिंग स्वच्छता | पास |
| E. पहचान | पास |

## लाइसेंस

[MIT](LICENSE)

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा निर्मित।
