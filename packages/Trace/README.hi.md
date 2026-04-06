<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Trace/readme.png" alt="Trace" width="400"></p>

<p align="center"><strong>Deterministic cursor discipline game — precision, control, and composure under chaos.</strong></p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://dotnet.microsoft.com/"><img src="https://img.shields.io/badge/.NET-10-purple.svg" alt=".NET 10"></a>
  <a href="https://mcp-tool-shop-org.github.io/Trace/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

यह एप्लिकेशन .NET 10 MAUI (विंडोज-आधारित) पर बनाया गया है, जिसमें एक पूरी तरह से नियतात्मक, निश्चित-समय अंतराल वाला सिमुलेशन, पांच-अवस्था वाला गति अवस्था मशीन और एक पैरामीट्रिक दृश्य पहचान है, जो पूरी तरह से सिमुलेशन की स्थिति से संचालित होती है।

ट्रेस एक लक्ष्य प्रशिक्षण उपकरण नहीं है। ट्रेस एक आर्केड गेम नहीं है। महारत शांत दिखती है।

---

## आर्किटेक्चर

चार-मॉड्यूल वाला मॉनोलिथ। कोई चक्र नहीं, लाइब्रेरी में कोई प्लेटफ़ॉर्म रिसाव नहीं।

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity, motion states
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, replay system
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host, renderer
```

पूर्ण निर्भरता ग्राफ और संवैधानिक नियमों के लिए [`docs/modular.manifesto.md`](docs/modular.manifesto.md) देखें।

---

## गति अवस्था मशीन

प्रत्येक फ्रेम में, ट्रेस में पांच गति अवस्थाओं में से ठीक एक अवस्था होती है:

| अवस्था | पहचान | दृश्य |
|-------|----------|--------|
| **Alignment** | तटस्थ, स्थिर, शांत | बेसिक सियान रंग, न्यूनतम चमक |
| **Commitment** | निर्णायक त्वरण | थोड़ा आगे की ओर झुकाव, गर्म किनारा |
| **Resistance** | काउंटरफोर्स झुकाव | एम्बर रंग में बदलाव, बढ़ी हुई चमक |
| **Correction** | सूक्ष्म समायोजन | किनारे की चमक, उच्च परिशुद्धता |
| **Recovery** | संक्षिप्त प्रतिक्रिया | डीसैचुरेशन फीका (150ms) |

संक्रमण एक संकलन-समय संक्रमण तालिका द्वारा लागू किए जाते हैं। निषिद्ध संक्रमण शून्य लौटाते हैं।

```
Main loop:     Alignment → Commitment → Resistance → Correction → Alignment
Recovery loop: Alignment → Recovery → Alignment
```

पूर्ण FSM (एंट्री/एग्जिट शर्तों के साथ) के लिए [`docs/motion-state-machine.md`](docs/motion-state-machine.md) देखें।

---

## चैओस आर्किटाइप्स (5 खलनायक)

| आर्किटाइप | क्रिया | काउंटर-कौशल | व्यवहार |
|-----------|------|---------------|----------|
| **Red Orbs** | बाधा | अपेक्षा | क्षेत्र के भीतर विचलन, सीमाओं पर उछाल |
| **Crushers** | बाधा | प्रतिबद्धता | निश्चित चक्र: निष्क्रिय → संकेत → सक्रिय |
| **Drift Fields** | अस्थिर करना | पकड़ स्थिरता | लगातार दिशात्मक बल |
| **Flickers** | भ्रमित करना | फ़िल्टरिंग | फ्लैश → आफ्टरइमेज → अदृश्य |
| **Locks** | प्रतिबंधित करना | अनुकूलन क्षमता | अक्ष/गति प्रतिबंध संकेत के साथ |

चैओस कभी भी ट्रेस पर प्रतिक्रिया नहीं करता है। चैओस नियतात्मक, उदासीन और यांत्रिक है।

[`docs/chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) और [`docs/interaction-rendering-canon.md`](docs/interaction-rendering-canon.md) देखें।

---

## रेंडरिंग

ट्रेस की रेंडरिंग पूरी तरह से स्थिति पर निर्भर है। कोई एनिमेशन टाइमलाइन नहीं, कोई स्प्राइट शीट नहीं।

```
VisualState = RenderProfile[MotionState]
```

रंग-दर-अवस्था सब कुछ नियंत्रित करता है: भरण, किनारा, चमक की तीव्रता, दिशात्मक पूर्वाग्रह, डीसैचुरेशन। रेंडरर ट्रेस की पहचान को शून्य एनीमेशन संपत्तियों के साथ व्यक्त करता है।

[`docs/renderer-integration-trace.md`](docs/renderer-integration-trace.md) और [`docs/visual-style-guide.md`](docs/visual-style-guide.md) देखें।

---

## इंजन विरासत

[DeterministicMouseTrainingEngine](https://github.com/mcp-tool-shop-org/DeterministicMouseTrainingEngine) से लिया गया। मुख्य सिस्टम:

- `IGameSimulation` — प्लगेबल गेम मोड इंटरफ़ेस (2 तरीके)
- `DeterministicLoop` — 60Hz निश्चित समय अंतराल + अल्फा इंटरपोलेशन
- `DeterministicRng` — xorshift32, सीड-रिप्रोड्यूसिबल
- `GameEvent` पाइपलाइन — टाइप किए गए इवेंट स्ट्रीम
- रीप्ले सिस्टम — MTR v1 बाइनरी प्रारूप, FNV-1a सत्यापन
- म्यूटेटर रचना — `LevelBlueprint` शुद्ध-फ़ंक्शन परिवर्तन
- वर्चुअल कोऑर्डिनेट स्पेस — 1920×1080, लेटरबॉक्स स्केलिंग

---

## परियोजना संरचना

```
src/
  MouseTrainer.Domain/          Leaf module — events, input, runs, RNG, motion states
    Events/                     GameEvent, GameEventType
    Input/                      PointerInput
    Motion/                     MotionState, MotionTrigger, MotionTransitionTable
    Runs/                       RunDescriptor, RunId, MutatorId/Spec/Param, ModeId, DifficultyTier
    Scoring/                    ScoreComponentId
    Utility/                    DeterministicRng (xorshift32), Fnv1a, Leb128

  MouseTrainer.Simulation/      Deterministic simulation engine
    Core/                       DeterministicLoop, FrameResult, IGameSimulation
    Debug/                      ISimDebugOverlay
    Levels/                     LevelBlueprint, ILevelGenerator, LevelGeneratorRegistry
    Modes/ReflexGates/          Gate, ReflexGateSimulation, ReflexGateGenerator, ReflexGateConfig
    Mutators/                   IBlueprintMutator, MutatorPipeline, MutatorRegistry, 6 mutators
    Replay/                     ReplayRecorder, ReplaySerializer, InputTrace, ReplayVerifier
    Session/                    SessionController, ScoreBreakdown, SessionModels

  MouseTrainer.Audio/           Audio cue system
    Assets/                     AssetManifest, AssetVerifier, IAssetOpener
    Core/                       AudioDirector, AudioCue, AudioCueMap, IAudioSink

  MouseTrainer.MauiHost/        MAUI composition root (Windows)
                                GameRenderer, NeonPalette, TrailBuffer, ParticleSystem,
                                MotionAnalyzer, ScreenShake

tests/
  MouseTrainer.Tests/           340 tests across 11 categories
    Architecture/               Dependency boundary enforcement
    Determinism/                Replay regression, RNG, session controller
    Levels/                     Generator extraction
    Mutators/                   Blueprint mutator correctness + composition
    Persistence/                Session store
    Replay/                     Serializer, recorder, verifier, quantization, event hashing
    Runs/                       RunDescriptor golden hashes + identity
    Scoring/                    Score breakdown
    Utility/                    Leb128 encoding
    MotionStateTests.cs         State machine transitions + forbidden paths

docs/                           19 design documents (see Design Canon below)
```

---

## डिजाइन सिद्धांत

| दस्तावेज़ | उद्देश्य |
|----------|---------|
| [`product-boundary.md`](docs/product-boundary.md) | ट्रेस क्या है, यह क्या नहीं है, यह किसके लिए है |
| [`tone-bible.md`](docs/tone-bible.md) | आवाज, यूआई, एनिमेशन और प्रतिक्रिया टोन नियम |
| [`motion-language-spec.md`](docs/motion-language-spec.md) | मूवमेंट व्याकरण, पाथ भाषा, फोर्स प्रतिक्रियाएं |
| [`motion-state-machine.md`](docs/motion-state-machine.md) | 5-अवस्था FSM, संक्रमण और निषिद्ध पथ |
| [`visual-style-guide.md`](docs/visual-style-guide.md) | ट्रेस फॉर्म, राज्य के अनुसार रंग, विश्व पहचान |
| [`renderer-integration-trace.md`](docs/renderer-integration-trace.md) | रेंडर प्रोफाइल, फोर्स वेक्टर, स्टेबिलिटी स्केलर, चमक/बायस/डीसैचुरेशन |
| [`villains-and-trace-skills.md`](docs/villains-and-trace-skills.md) | 5 आर्किटाइप, 5 कौशल, निरंतरता अनुबंध |
| [`chaos-entity-animation-bible.md`](docs/chaos-entity-animation-bible.md) | प्रत्येक आर्किटाइप के लिए गति और एनिमेशन विनिर्देश |
| [`chaos-behavior-state-machines.md`](docs/chaos-behavior-state-machines.md) | प्रत्येक आर्किटाइप के लिए एफएसएम (एनम + ट्रांज़िशन तैयार) |
| [`renderer-integration-chaos.md`](docs/renderer-integration-chaos.md) | चैओस रेंडर प्रोफाइल, प्रति-आर्किटाइप ड्रा विनिर्देश |
| [`interaction-rendering-canon.md`](docs/interaction-rendering-canon.md) | ट्रेस बनाम चैओस इंटरैक्शन अनुबंध |
| [`sound-design-bible.md`](docs/sound-design-bible.md) | ऑडियो मेटाफिजिक्स, ट्रेस/चैओस ध्वनि पहचान, महारत = मौन |
| [`procedural-audio-parameter-map.md`](docs/procedural-audio-parameter-map.md) | सिमुलेशन → ऑडियो पैरामीटर वायरिंग |
| [`audio-engine-architecture.md`](docs/audio-engine-architecture.md) | डीएसपी घटक, डेटा प्रवाह, मास्टर बस |
| [`soundscape-moodboard.md`](docs/soundscape-moodboard.md) | विश्व की ध्वनिक पहचान के लिए संवेदी मार्गदर्शिका |
| [**`soundscape-canon.md`**](docs/soundscape-canon.md) | **एकीकृत ऑडियो कैनन (सभी 4 ऑडियो दस्तावेज़ों को समेकित करता है)** |
| [`sandbox-drift-field-v1.md`](docs/sandbox-drift-field-v1.md) | पहला खलनायक प्रमाण (ड्रिफ्टडिलिवरी_बी1) |
| [`modular.manifesto.md`](docs/modular.manifesto.md) | निर्भरता ग्राफ + संवैधानिक नियम |
| [`MAUI_AssetOpener_Snippet.md`](docs/MAUI_AssetOpener_Snippet.md) | प्लेटफ़ॉर्म एसेट वायरिंग स्निपेट |

---

## बिल्ड और टेस्ट

```bash
# Build simulation library (0 warnings, TreatWarningsAsErrors)
dotnet build src/MouseTrainer.Simulation/

# Run all 340 tests
dotnet test tests/MouseTrainer.Tests/

# Run MAUI host (Windows — use Visual Studio, set startup to MauiHost)
```

---

## मुख्य डिज़ाइन सिद्धांत

- **नियतिवाद संवैधानिक है।** समान बीज → समान सिमुलेशन → समान स्कोर, हमेशा। कोई `DateTime.Now` नहीं, कोई `Random` नहीं, और हॉट पाथ में प्लेटफ़ॉर्म-निर्भर फ़्लोट नहीं।
- **रेंडरिंग राज्य का एक शुद्ध फ़ंक्शन है।** कोई एनिमेशन टाइमलाइन नहीं। मोशनस्टेट + फोर्स वेक्टर + स्टेबिलिटी स्केलर → दृश्य आउटपुट।
- **चैओस उदासीन है।** बाधाएं कभी भी खिलाड़ी पर प्रतिक्रिया नहीं करती हैं। वे सिस्टम हैं, दुश्मन नहीं।
- **महारत शांत दिखती है।** यदि उच्च-कौशल वाला गेमप्ले उन्मादपूर्ण दिखता है, तो सिस्टम झूठ बोल रहा है।
- **मॉड्यूलर मोनोलिथ।** चार असेंबली, जिसमें एक-तरफ़ा निर्भरता लागू की गई है। डोमेन पत्ती है; MauiHost एकमात्र कंपोज़िशन रूट है।
- **चेतावनी त्रुटियां हैं।** लाइब्रेरी प्रोजेक्ट `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` का उपयोग करते हैं।

---

## लाइसेंस

[MIT](LICENSE)

> [MCP Tool Shop](https://mcp-tool-shop.github.io/) द्वारा बनाया गया।
