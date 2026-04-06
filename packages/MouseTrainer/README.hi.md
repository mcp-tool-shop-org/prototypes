<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/MouseTrainer/readme.png" alt="MouseTrainer logo" width="400"></p>

# माउस ट्रेनर।

यह [MCP टूल शॉप](https://mcptoolshop.com) का एक हिस्सा है।

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/MouseTrainer/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/.NET-10-512BD4" alt=".NET 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/MouseTrainer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**नियंत्रित माउस निपुणता प्रशिक्षण उपकरण: सटीकता, नियंत्रण और सहजता।**

यह एप्लिकेशन .NET 10 MAUI (विंडोज को प्राथमिकता देते हुए) पर आधारित है, और इसमें एक निश्चित समय अंतराल वाला सिमुलेशन, ब्लूप्रिंट को अनुकूलित करने की क्षमता, और प्लेटफ़ॉर्म पर स्थिर रन आइडेंटिटी जैसी विशेषताएं हैं। एक ही प्रारंभिक बिंदु (सीड) का उपयोग करने पर, हर बार एक ही स्तर, एक ही स्कोर और एक ही रीप्ले प्राप्त होगा - चाहे वह कहीं भी और कभी भी हो।

---

## माउसट्रेनर क्यों?

- **बिट स्तर पर निश्चितता।** xorshift32 रैंडम नंबर जेनरेटर, FNV-1a 64-बिट हैशिंग, 60 हर्ट्ज की निश्चित समय-सीमा जिसमें एक संचायक शामिल है। `DateTime.Now` का उपयोग नहीं, `System.Random` का उपयोग नहीं, और महत्वपूर्ण कार्यों में प्लेटफॉर्म पर निर्भर फ़्लोटिंग-पॉइंट नंबरों का उपयोग नहीं।
- **संयोजन योग्य कठिनाई स्तर।** छह ब्लूप्रिंट मॉडिफायर गेम शुरू होने से पहले उत्पन्न स्तरों को बदलते हैं। इन्हें एक साथ जोड़ें, उनके मापदंडों को समायोजित करें, और यह संयोजन `RunId` हैश में स्थिर हो जाता है, जिससे पूर्ण रूप से दोहराने योग्य परिणाम प्राप्त होते हैं।
- **पुनरावृत्ति सत्यापन।** प्रत्येक सत्र में, मात्राबद्ध इनपुट डेटा रिकॉर्ड किया जाता है, जिसे एक संक्षिप्त बाइनरी प्रारूप (`.mtr`) में संग्रहीत किया जाता है। पुनरावृत्ति सत्यापन, प्रत्येक क्षण की गतिविधियों को फिर से अनुकरण करता है और मूल डेटा के साथ घटना स्ट्रीम हैश, स्कोर और कॉम्बो की तुलना करता है।
- **मॉड्यूलर एकरूपता।** चार असेंबली, जिनमें एक-दिशात्मक निर्भरता लागू की गई है। डोमेन सबसे निचले स्तर पर है और इसमें कोई निर्भरता नहीं है; MauiHost एकमात्र मुख्य घटक है। कोई चक्र नहीं है, और लाइब्रेरी में प्लेटफॉर्म से संबंधित जानकारी का कोई रिसाव नहीं है।
- **प्रोटोकॉल-स्तर की पहचान।** `RunId` एक FNV-1a 64-बिट हैश है, जो मोड, सीड, कठिनाई स्तर और मॉडिफायर विनिर्देशों पर आधारित है, जिसमें पैरामीटर मानक रूप से क्रमबद्ध हैं। एक बार बनने के बाद, यह हमेशा के लिए स्थिर रहता है।

---

## NuGet पैकेज।

| पैकेज. | विवरण। |
|---|---|
| **MouseTrainer.Domain** | एक नियतात्मक (डिटरमिनिस्टिक) एक्सोर्शिफ्ट32 रैंडम नंबर जेनरेटर, एफएनवी-1ए 64-बिट हैशिंग, एलईबी128 वेरिएबल-लेंथ इंटेजर एन्कोडिंग, गेम इवेंट सिस्टम, और रन आइडेंटिटी के लिए बुनियादी सुविधाएं। इसमें कोई बाहरी निर्भरता नहीं है। |
| **MouseTrainer.Simulation** | एक निश्चित 60 हर्ट्ज़ की गेम लूप प्रणाली, जिसमें एक एक्यूमुलेटर शामिल है, साथ ही ब्लूप्रिंट को अनुकूलित करने की क्षमता, स्तर निर्माण की प्रक्रिया, रीप्ले रिकॉर्डिंग/सत्यापन, और सत्र प्रबंधन जैसी सुविधाएं हैं। यह प्रणाली डोमेन पर निर्भर करती है। |
| **MouseTrainer.Audio** | एक घटना-आधारित ऑडियो संकेत प्रणाली जो xorshift32 के माध्यम से पूर्वनिर्धारित वॉल्यूम/पिच परिवर्तन, दर नियंत्रण, संपत्ति (एसेट) की पुष्टि, और एक बार या लूप में चलाने की सुविधा प्रदान करती है। यह प्रणाली डोमेन पर निर्भर करती है। |

---

## स्थापना।

### न्यूगेट से।

```bash
# Core primitives (RNG, hashing, run identity)
dotnet add package MouseTrainer.Domain

# Simulation engine (game loop, modes, mutators, replay)
dotnet add package MouseTrainer.Simulation

# Audio cue system (event-driven sound)
dotnet add package MouseTrainer.Audio
```

### स्रोत से।

```bash
git clone https://github.com/mcp-tool-shop-org/MouseTrainer.git
cd MouseTrainer

# Build all library projects
dotnet build src/MouseTrainer.Domain/
dotnet build src/MouseTrainer.Simulation/
dotnet build src/MouseTrainer.Audio/

# Run all tests (214 tests across 10 categories)
dotnet test tests/MouseTrainer.Tests/

# Run MAUI host (Windows -- use Visual Studio, set startup to MauiHost)
```

**ध्यान दें:** MAUI होस्ट प्रोजेक्ट के लिए, आपके कंप्यूटर पर विज़ुअल स्टूडियो स्थापित होना आवश्यक है, जिसमें .NET MAUI वर्कलोड भी शामिल होना चाहिए। MauiHost पर CLI `dotnet build` कमांड विफल हो सकता है क्योंकि इसमें MrtCore PRI जनरेशन टारगेट शामिल हैं - पूर्ण बिल्ड के लिए विज़ुअल स्टूडियो का उपयोग करें।

---

## शुरुआत कैसे करें।

```csharp
using MouseTrainer.Domain.Runs;
using MouseTrainer.Domain.Utility;
using MouseTrainer.Simulation.Core;
using MouseTrainer.Simulation.Modes.ReflexGates;
using MouseTrainer.Simulation.Mutators;
using MouseTrainer.Simulation.Levels;

// 1. Create a run descriptor (deterministic identity)
var run = RunDescriptor.Create(
    mode: new ModeId("ReflexGates"),
    seed: 42,
    difficulty: DifficultyTier.Standard);

// 2. Generate a level blueprint from the seed
var config = new ReflexGateConfig();
var generator = new ReflexGateGenerator(config);
var blueprint = generator.Generate(run.Seed);

// 3. Optionally reshape the level with composable mutators
var registry = new MutatorRegistry();
registry.Register(new MutatorId("NarrowMargin"), 1, spec => new NarrowMarginMutator(spec));
registry.Register(new MutatorId("RhythmLock"), 1, spec => new RhythmLockMutator(spec));

var pipeline = new MutatorPipeline(registry);
var specs = new[]
{
    MutatorSpec.Create(new MutatorId("NarrowMargin"), 1,
        new[] { new MutatorParam("factor", 0.7f) }),
    MutatorSpec.Create(new MutatorId("RhythmLock"), 1,
        new[] { new MutatorParam("div", 4f) }),
};
blueprint = pipeline.Apply(blueprint, specs);

// 4. Wire up the simulation and deterministic loop
var sim = new ReflexGateSimulation(config);
sim.Reset(blueprint);

var loop = new DeterministicLoop(sim, new DeterministicConfig
{
    FixedHz = 60,
    SessionSeed = run.Seed,
});

// 5. Each frame: step the loop with host time and pointer input
// var result = loop.Step(pointerInput, hostNowTicks, ticksPerSecond);
// result.Events contains GameEvent[] for audio, scoring, and UI
```

---

## खेल के तरीके।

### रिफ्लेक्सगेट।

एक साइड-स्क्रॉलिंग गेट चुनौती। ऊर्ध्वाधर दीवारों पर दोलन करने वाले रास्ते हैं - कर्सर को प्रत्येक रास्ते से गुजारें, इससे पहले कि स्क्रॉल आपको पकड़ ले। एक निश्चित प्रारंभिक बिंदु हर बार समान स्तर उत्पन्न करता है।

| संपत्ति। | Value |
|---|---|
| खेल का मैदान। | 1920 x 1080 पिक्सेल का वर्चुअल रिज़ॉल्यूशन। |
| गेटों की संख्या। | 12 (डिफ़ॉल्ट) |
| स्क्रॉल की गति। | 70 पिक्सेल प्रति सेकंड (लगभग 83 सेकंड प्रति सफाई चक्र)। |
| स्कोरिंग। | 100 अंक (मध्य) से 50 अंक (किनारा), हर 3 गेट पर संयोजन। |
| दोलन। | प्रत्येक गेट के लिए आयाम में वृद्धि (40 से 350 पिक्सेल तक) और आवृत्ति में वृद्धि (0.15 से 1.2 हर्ट्ज तक)। |
| RNG | "xorshift32" एल्गोरिदम का उपयोग किया गया है, जो प्रत्येक बार चलाने पर एक स्थिर और विश्वसनीय आउटपुट उत्पन्न करता है। यह प्लेटफ़ॉर्म की स्थिरता को ध्यान में रखकर बनाया गया है। |
| पहचान। | FNV-1a एल्गोरिदम का उपयोग करके, मोड, सीड और म्यूटेटर्स को मिलाकर 64-बिट का हैश उत्पन्न किया जाता है, जिससे हर जगह समान `रनआईडी` प्राप्त होता है। |

---

## ब्लूप्रिंट मॉडिफायर।

छ transformations (परिवर्तन) जो गेम शुरू होने से पहले उत्पन्न किए गए स्तरों को बदलते हैं। ये परिवर्तन `LevelBlueprint` पर एक निश्चित क्रम में लागू होते हैं।

| उत्परिवर्तक (उत्परिवर्तन लाने वाला) | मुख्य पैरामीटर। | प्रभाव। |
|---|---|---|
| **NarrowMargin** | "कारक" [0.1, 1.0] के बीच होना चाहिए। | स्केल्स का एपर्चर (खोल) कम करें - इससे अंतराल कम हो जाएगा। |
| **WideMargin** | `कारक` [1.0, 3.0] के बीच होना चाहिए। | "स्केल्स" का एपर्चर (छेद) ऊंचाई बढ़ाता है - यह अधिक सहिष्णु है। |
| **DifficultyCurve** | `curve` [-2.0, 2.0] के बीच में। | गेट इंडेक्स द्वारा कठिनाई का पावर-वक्र का पुनः-अंतर्वेशन। |
| **RhythmLock** | `div` {2, 3, 4, 6, 8} में। | गेट चरणों को N विभाजनों में क्वांटाइज करता है -- लयबद्ध पैटर्न। |
| **GateJitter** | `str` [0, 1] में। | sin(WallX, Phase) के माध्यम से नियतात्मक ऊर्ध्वाधर ऑफ़सेट -- स्थानिक गड़बड़ी। |
| **SegmentBias** | `seg`, `amt`, `shape` | गेट्स को खंडों में विभाजित करता है, जिसमें प्रति-खंड कठिनाई पूर्वाग्रह होता है। |

म्यूटेटर शुद्ध फ़ंक्शन हैं: `LevelBlueprint -> LevelBlueprint`. वे पाइपलाइन के माध्यम से संयोजित होते हैं (`specs.Aggregate`), `MutatorRegistry` से फैक्ट्री-रिज़ॉल्व किए जाते हैं, और उनके पैरामीटर पुनरुत्पादकता के लिए `RunId` हैश में स्थिर होते हैं।

### सेगमेंट बायस शेप्स।

- **क्रेसेंडो** (shape=0): आसान शुरुआत, कठिन अंत। `d = 2t - 1`
- **वैली** (shape=1): कठिन मध्य, आसान अंत। `d = 8t(1-t) - 1`
- **वेव** (shape=2): वैकल्पिक आसान/कठिन खंड। `d = (-1)^k`

### कठिनाई वक्र घातांक।

`curve` पैरामीटर `pow(2, curve)` के माध्यम से एक पावर घातांक से मेल खाता है। सकारात्मक मान कठिनाई को पीछे से बढ़ाते हैं (शुरुआत में आसान, अंत में कठिन)। नकारात्मक मान इसे आगे बढ़ाते हैं। शून्य पहचान है (कोई बदलाव नहीं)।

---

## रीप्ले सिस्टम।

प्रत्येक सत्र को रिकॉर्ड किया जा सकता है और एंटी-चीट और लीडरबोर्ड अखंडता के लिए सत्यापित किया जा सकता है।

| घटक। | Role |
|---|---|
| `ReplayRecorder` | लाइव प्ले के दौरान प्रति-टिक क्वांटाइज्ड इनपुट नमूनों को कैप्चर करता है। |
| `InputTrace` | कॉम्पैक्ट स्टोरेज के लिए रन-लेंथ एन्कोडेड इनपुट स्ट्रीम। |
| `ReplaySerializer` | बाइनरी `.mtr` प्रारूप: मैजिक हेडर, LEB128 वैरिएंट, FNV-1a चेकसम। |
| `ReplayVerifier` | टिक-दर-टिक पुनः-सिमुलेशन; इवेंट हैश + स्कोर + कॉम्बो मिलान को सत्यापित करता है। |
| `EventStreamHasher` | सिमुलेशन इवेंट स्ट्रीम पर रोलिंग FNV-1a हैश। |

वायर प्रारूप: `[MTRP magic][Header][RunDescriptor section][InputTrace section][Verification][Checksum]`

---

## ऑडियो सिस्टम।

नियत चयन के साथ इवेंट-संचालित ऑडियो। `AudioDirector` सिमुलेशन इवेंट को ध्वनि प्रभावों के साथ मैप करता है जिसमें सीमित भिन्नता होती है -- सभी `DeterministicRng.Mix()` के माध्यम से नियतात्मक होते हैं।

| विशेषता। | विवरण। |
|---|---|
| क्यू चयन। | प्रत्येक इवेंट प्रकार के लिए उम्मीदवार संपत्तियों में से नियतात्मक विकल्प। |
| वॉल्यूम। | `0.6 + 0.4 * intensity`, [0, 1] तक सीमित। |
| पिच जिटर। | xorshift32 के माध्यम से [0.97, 1.03], [0.9, 1.1] तक सीमित। |
| दर सीमित करना। | HitWall इवेंट 6 टिक (लगभग 100 ms at 60 Hz) में एक बार थ्रॉटल किए जाते हैं। |
| प्लेबैक मोड। | वन-शॉट (हिट्स, गेट्स, कॉम्बो) और लूप (ड्रैग, एम्बिएंट)। |
| संपत्ति सत्यापन। | `AssetVerifier` स्टार्टअप पर सभी 13 आवश्यक ऑडियो फ़ाइलों की जाँच करता है। |

---

## आर्किटेक्चर।

चार-मॉड्यूल वाला मॉड्यूलर मोनोलिथ। कोई चक्र नहीं, पुस्तकालयों में कोई प्लेटफ़ॉर्म रिसाव नहीं।

```
MouseTrainer.Domain        --> (nothing)          Shared primitives, RNG, run identity
MouseTrainer.Simulation    --> Domain             Deterministic loop, modes, mutators, levels, replay
MouseTrainer.Audio         --> Domain             Cue system, asset verification
MouseTrainer.MauiHost      --> all three          Composition root, MAUI platform host
```

### निषिद्ध संदर्भ (संवैधानिक)।

- `Audio` कभी भी `Simulation` को संदर्भित नहीं करना चाहिए।
- `Simulation` कभी भी `Audio` को संदर्भित नहीं करना चाहिए।
- `Domain` को किसी भी संबंधित मॉड्यूल को संदर्भित नहीं करना चाहिए।
- किसी भी लाइब्रेरी मॉड्यूल को `Microsoft.Maui.*` या किसी भी प्लेटफ़ॉर्म SDK को संदर्भित नहीं करना चाहिए।
- कोई भी मोड दूसरे मोड को संदर्भित नहीं कर सकता है।
- म्यूटेटर केवल `LevelBlueprint` पर काम करते हैं -- कभी भी मोड के आंतरिक भागों पर नहीं।

पूर्ण निर्भरता ग्राफ और संवैधानिक नियमों के लिए [`docs/modular.manifesto.md`](docs/modular.manifesto.md) देखें।

---

## डिज़ाइन सिद्धांत।

- **नियतिवाद अंतर्निहित है।** एक ही बीज, एक ही सिमुलेशन, और हमेशा एक ही परिणाम देता है। यहां `DateTime.Now`, `Random`, या प्लेटफॉर्म पर निर्भर फ्लोटिंग-पॉइंट नंबर का उपयोग नहीं किया जाता है।
- **निश्चित समय अंतराल वाला सिमुलेशन।** 60 हर्ट्ज की दर से, जिसमें एक संचायक-आधारित प्रणाली का उपयोग करके अंतराल को पूरा किया जाता है। रेंडरिंग, अल्फा के माध्यम से, टिक के बीच मानों का अनुमान लगाता है। सिमुलेशन का समय, टिक की संख्या (`टिक * dt`) से प्राप्त होता है, न कि वास्तविक समय से, ताकि फ्लोटिंग-पॉइंट त्रुटियों से बचा जा सके।
- **उच्च-गुणवत्ता वाली पहचान।** `MutatorId`, `ModeId`, और `RunId` स्थायी होते हैं -- एक बार बनने के बाद, वे हमेशा के लिए अपरिवर्तित रहते हैं। FNV-1a हैशिंग और मानक पैरामीटर सीरियललाइजेशन यह सुनिश्चित करते हैं कि समान इनपुट हमेशा समान पहचान उत्पन्न करें।
- **मॉड्यूलर मोनोलिथ, माइक्रो-सर्विसेज नहीं।** चार असेंबली, जिनमें एक-दिशात्मक निर्भरता लागू की गई है। डोमेन सबसे निचला स्तर है; MauiHost एकमात्र कंपोज़िशन रूट है।
- **चेतावनी त्रुटियां हैं।** लाइब्रेरी प्रोजेक्ट `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` का उपयोग करते हैं। MAUI होस्ट इसमें शामिल नहीं है (SDK द्वारा उत्पन्न चेतावनियों को छोड़कर)। सभी स्थानों पर नल-सक्षम संदर्भ प्रकार सक्षम हैं।
- **म्यूटेटर्स में शुद्धता।** ब्लूप्रिंट म्यूटेटर्स शुद्ध फ़ंक्शन हैं जिनमें कोई RNG (रैंडम नंबर जेनरेटर) एक्सेस, कोई दुष्प्रभाव और मोड-विशिष्ट प्रकारों के कोई संदर्भ नहीं होते हैं। वे केवल अपने पैरामीटर और इनपुट ब्लूप्रिंट को पढ़ते हैं।

---

## परियोजना संरचना

```
src/
  Directory.Build.props         Shared build settings (nullable, warnings-as-errors, analysis level)

  MouseTrainer.Domain/          Leaf module -- events, input, runs, RNG
    Events/                     GameEvent, GameEventType
    Input/                      PointerInput
    Runs/                       RunDescriptor, RunId, MutatorId/Spec/Param, ModeId, DifficultyTier
    Utility/                    DeterministicRng (xorshift32), Fnv1a (64-bit), Leb128 (varint)

  MouseTrainer.Simulation/      Deterministic simulation engine
    Core/                       DeterministicLoop, DeterministicConfig, FrameResult, IGameSimulation
    Debug/                      ISimDebugOverlay
    Levels/                     LevelBlueprint, ILevelGenerator, LevelGeneratorRegistry
    Modes/ReflexGates/          Gate, ReflexGateSimulation, ReflexGateGenerator, ReflexGateConfig
    Mutators/                   IBlueprintMutator, MutatorPipeline, MutatorRegistry, 6 mutators
    Replay/                     ReplayRecorder, ReplayVerifier, ReplaySerializer, InputTrace, EventStreamHasher
    Session/                    SessionController, SessionModels, ScoreBreakdown

  MouseTrainer.Audio/           Audio cue system
    Assets/                     AssetManifest (13 required files), AssetVerifier, IAssetOpener
    Core/                       AudioDirector, AudioCue, AudioCueMap, IAudioSink

  MouseTrainer.MauiHost/        MAUI composition root (Windows)
    GameRenderer.cs             MAUI canvas rendering with neon palette
    GhostPlayback.cs            Replay ghost overlay
    ParticleSystem.cs           Hit/miss particle effects
    ScreenShake.cs              Camera shake on wall hits
    TrailBuffer.cs              Cursor trail rendering
    SessionStore.cs             Local session persistence
    NeonPalette.cs              Color theme

tests/
  MouseTrainer.Tests/           214 tests across 10 categories
    Architecture/               Dependency boundary enforcement
    Determinism/                Replay regression, RNG, session controller
    Levels/                     Generator extraction
    Mutators/                   Blueprint mutator correctness + composition
    Persistence/                Session store
    Replay/                     Serializer, recorder, verifier, quantization, event stream hasher, input trace
    Runs/                       RunDescriptor golden hashes + identity
    Scoring/                    Score breakdown
    Utility/                    LEB128 encoding

tools/
  MouseTrainer.AudioGen/        Audio asset generation tooling

docs/
  modular.manifesto.md          Dependency graph + constitutional rules
  product-boundary.md           Product scope and boundary definition
  MAUI_AssetOpener_Snippet.md   Platform asset wiring snippet
```

---

## लाइसेंस

[MIT](LICENSE)
