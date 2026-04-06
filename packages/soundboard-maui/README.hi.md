<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/soundboard-maui/readme.png" alt="Soundboard MAUI logo" width="400">
</p>

# soundboard-maui

> [MCP Tool Shop](https://mcptoolshop.com) का हिस्सा

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml/badge.svg" alt="Publish"></a>
  <img src="https://img.shields.io/badge/.NET-8%20%7C%209%20%7C%2010-512BD4" alt=".NET 8 | 9 | 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-maui/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**साउंड बोर्ड वॉयस इंजन के लिए क्रॉस-प्लेटफ़ॉर्म .NET MAUI डेस्कटॉप क्लाइंट।**

---

## साउंडबोर्ड MAUI क्यों?

- **SDK-प्रथम डिज़ाइन:** `Soundboard.Client` एक स्टैंडअलोन .NET 8+ लाइब्रेरी है जिसमें कोई UI निर्भरता नहीं है। इसका उपयोग कंसोल ऐप्स, WPF, ASP.NET, MAUI या किसी भी चीज़ में करें जो .NET को लक्षित करती है।
- **रियल-टाइम स्ट्रीमिंग:** ऑडियो `IProgress<AudioChunk>` के माध्यम से WebSocket पर टुकड़ों में आता है। पूर्ण संश्लेषण समाप्त होने का इंतजार नहीं करना पड़ता।
- **इंजन-अज्ञेय:** SDK एक प्रलेखित [API अनुबंध](docs/api-contract.md) का उपयोग करता है। अपने कोड को बदले बिना इंजन बदलें।
- **मल्टी-टारगेट:** यह `net8.0`, `net9.0` और `net10.0` के लिए उपलब्ध है, ताकि आप इसे किसी भी आधुनिक .NET प्रोजेक्ट से संदर्भित कर सकें।
- **संरचित लॉगिंग:** निदान के लिए अंतर्निहित `ILogger` समर्थन, जिससे आपको किसी लॉगिंग फ्रेमवर्क को शामिल करने की आवश्यकता नहीं होती।
- **संदर्भ क्लाइंट शामिल:** एक MAUI डेस्कटॉप ऐप और एक CLI टूल वास्तविक एकीकरण पैटर्न दिखाते हैं जिनका आप अनुकरण कर सकते हैं।

---

## NuGet पैकेज

| पैकेज | विवरण | संस्करण |
|---|---|---|
| **[Soundboard.Client](https://www.nuget.org/packages/Soundboard.Client)** | फ्रंट-डोर SDK - किसी भी साउंडबोर्ड-संगत वॉयस इंजन के लिए स्ट्रीमिंग TTS क्लाइंट। शुद्ध C#, शून्य UI निर्भरता। | 1.2.0 |
| **[Soundboard.Maui.Audio](https://www.nuget.org/packages/Soundboard.Maui.Audio)** | Windows के लिए NAudio-आधारित PCM16 स्ट्रीमिंग प्लेबैक एडाप्टर। `IAudioPlayer` प्रदान करता है जिसमें बफरिंग, थ्रेड-सेफ स्टार्ट/स्टॉप/फ्लश और प्लेबैक स्थिति ट्रैकिंग शामिल है। | 1.0.0 |

---

## शुरुआत कैसे करें

### SDK स्थापित करें

```bash
dotnet add package Soundboard.Client
```

### पांच पंक्तियों में बात करें

```csharp
using Soundboard.Client;
using Soundboard.Client.Models;

await using var client = new SoundboardClient();

// Discover what the engine offers
var presets = await client.GetPresetsAsync();
var voices  = await client.GetVoicesAsync();

// Stream speech — chunks arrive as they are synthesized
var progress = new Progress<AudioChunk>(chunk =>
{
    // Feed chunk.PcmData (PCM16, mono) to your audio output
});

await client.SpeakAsync(
    new SpeakRequest("Hello from the SDK.", presets[0], voices[0]),
    progress);
```

कोई MAUI निर्भरता नहीं। कंसोल ऐप्स, WPF, ASP.NET या .NET 8+ को लक्षित करने वाली किसी भी चीज़ में काम करता है।

### कॉन्फ़िगरेशन

क्लाइंट पर्यावरण से `SOUNDBOARD_BASE_URL` पढ़ता है, डिफ़ॉल्ट रूप से `http://localhost:8765` होता है। इसे कोड में ओवरराइड करें:

```csharp
var client = new SoundboardClient(new SoundboardClientOptions
{
    BaseUrl = "http://my-engine:9000",
    HttpTimeout = TimeSpan.FromSeconds(15),
    WebSocketConnectTimeout = TimeSpan.FromSeconds(10),
    WebSocketReceiveTimeout = TimeSpan.FromSeconds(60)
});
```

### SDK सतह

| विधि | विवरण |
|---|---|
| `GetHealthAsync()` | इंजन स्वास्थ्य जांच - संस्करण जानकारी और तत्परता स्थिति लौटाता है। |
| `GetPresetsAsync()` | उपलब्ध प्रीसेट पहचानकर्ताओं की सूची (जैसे `narrator`, `conversational`) |
| `GetVoicesAsync()` | उपलब्ध वॉयस पहचानकर्ताओं की सूची |
| `SpeakAsync(request, progress)` | संश्लेषित भाषण को स्ट्रीम करता है; `IProgress<T>` के माध्यम से `AudioChunk` रिपोर्ट करता है। |
| `StopAsync()` | इंजन को एक स्टॉप कमांड भेजता है। |

सभी विधियाँ `CancellationToken` स्वीकार करती हैं। क्लाइंट `IAsyncDisposable` को लागू करता है।

---

## आर्किटेक्चर

```
This repository
+-------------------------------------------+
|                                           |
|  Soundboard.Client (SDK)     net8.0+      |  <-- The product
|  Soundboard.Maui.Audio       net8.0       |  <-- NAudio adapter (Windows)
|  Soundboard.Maui             net10.0      |  <-- Reference client (MAUI)
|  soundboard-cli              net8.0       |  <-- Reference client (console)
|                                           |
+-------------------------------------------+
            |  HTTP (control) + WebSocket (audio)
            v
+-------------------------------------------+
|  voice-soundboard (engine repo)           |
|  Any engine implementing the API contract |
+-------------------------------------------+
```

**कंट्रोल प्लेन** (HTTP) - स्वास्थ्य, प्रीसेट, वॉयस, स्टॉप।
**डेटा प्लेन** (WebSocket) - द्विदिश: स्पीक कमांड ऊपर जाते हैं, PCM16 ऑडियो टुकड़े नीचे स्ट्रीम होते हैं।

SDK कनेक्शन लाइफसाइकिल, JSON फ़्रेमिंग, बेस64 डिकोडिंग, ग्रेसफुल WebSocket क्लोज और API संस्करण संगतता जांच को स्वचालित रूप से संभालता है।

---

## स्रोत से स्थापना

### आवश्यकताएं

- [.NET 10.0 SDK](https://dotnet.microsoft.com/) MAUI वर्कलोड के साथ (डेस्कटॉप ऐप के लिए)
- .NET 8.0 SDK (केवल SDK और CLI के लिए पर्याप्त)
- Windows 10/11 (MAUI ऐप और NAudio प्लेबैक के लिए)
- एक चल रहा [वॉयस-साउंडबोर्ड](https://github.com/mcp-tool-shop-org/voice-soundboard) इंजन

### क्लोन करें और चलाएं

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui

# Run unit + integration tests (no engine required)
dotnet test

# Run the MAUI desktop app
set SOUNDBOARD_BASE_URL=http://localhost:8765
dotnet run --project src/Soundboard.Maui

# Run the CLI client
dotnet run --project src/soundboard-cli -- health
dotnet run --project src/soundboard-cli -- presets
dotnet run --project src/soundboard-cli -- speak "Hello world" --preset narrator
```

---

## प्रोजेक्ट संरचना

```
src/
  Soundboard.Client/         SDK — pure C#, net8.0/9.0/10.0, zero UI deps
  Soundboard.Maui.Audio/     NAudio PCM16 playback adapter (Windows, net8.0)
  Soundboard.Maui/           Reference desktop client (MAUI, net10.0)
  soundboard-cli/            Reference console client (net8.0)

examples/
  Quickstart/                Connect → speak → save WAV in 30 seconds
  AgentTool/                 SDK as a callable tool in an AI agent pipeline

tests/
  Soundboard.Client.Tests/         27 unit tests (no engine required)
  Soundboard.IntegrationTests/     17 integration + contract tests

docs/
  api.md                     SDK API reference (v1.0 stability guarantees)
  api-contract.md            Engine <-> SDK wire protocol
  compatibility.md           SDK-engine compatibility matrix & trust contract
  getting-started-sdk.md     SDK integration guide
  streaming-model.md         How audio streaming works
  error-model.md             Failure modes and handling
  feature-map.md             Feature-to-layer mapping
  known-limitations.md       Current boundaries
  evaluation-guide.md        How to evaluate Soundboard
  publishing.md              NuGet publish runbook
```

---

## उदाहरण

| उदाहरण | यह क्या दिखाता है |
|---|---|
| [Quickstart](examples/Quickstart/) | कनेक्ट करें, बोलें, WAV सहेजें - शून्य कॉन्फ़िगरेशन |
| [Agent Tool](examples/AgentTool/) | SDK एक AI एजेंट पाइपलाइन में एक कॉल करने योग्य टूल के रूप में |

---

## प्रलेखन

- [एसडीके के साथ शुरुआत](docs/getting-started-sdk.md)
- [स्ट्रीमिंग मॉडल](docs/streaming-model.md)
- [त्रुटि मॉडल](docs/error-model.md)
- [एपीआई संदर्भ](docs/api.md)
- [एपीआई अनुबंध](docs/api-contract.md)
- [संगतता और विश्वसनीयता](docs/compatibility.md)
- [इंजन सेटअप](docs/engine-setup.md)
- [अपग्रेड और रोलबैक गाइड](docs/upgrade-playbook.md)
- [एसडीके का प्रकाशन](docs/publishing.md)
- [ताज़ा इंस्टॉलेशन सत्यापन](docs/fresh-install.md)
- [मूल्यांकन गाइड](docs/evaluation-guide.md)
- [परिवर्तन लॉग](CHANGELOG.md)
- [योगदान](CONTRIBUTING.md)

---

## अक्सर पूछे जाने वाले प्रश्न (FAQ)

**एसडीके क्या है?**
`Soundboard.Client` एक स्वतंत्र .NET 8+ लाइब्रेरी है जो इंजन के साथ सभी संचार को संभालती है - स्वास्थ्य जांच, खोज और वेबसॉकेट के माध्यम से भाषण का प्रसारण। इसे किसी भी .NET प्रोजेक्ट में उपयोग किया जा सकता है।

**MAUI ऐप क्या है?**
यह एक संदर्भ क्लाइंट है जो डेस्कटॉप यूआई के साथ एसडीके को प्रदर्शित करता है। यह उत्पाद नहीं है - यह एसडीके का उपयोग करने के एक तरीके को दर्शाता है।

**क्या यह उत्पादन के लिए तैयार है?**
एसडीके एपीआई (v1.0) स्थिर है। MAUI ऐप प्रदर्शन के लिए है। ज्ञात सीमाओं के बारे में [यहां](docs/known-limitations.md) देखें।

**क्या मैं अपना यूआई बना सकता हूं?**
हाँ। यही इसका उद्देश्य है। एसडीके में कोई यूआई निर्भरता नहीं है। अपने प्लेटफ़ॉर्म के लिए `IAudioPlayer` को लागू करें और आगे बढ़ें।

**इंजन कहां स्थित है?**
यह एक अलग रिपॉजिटरी में है: [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard)। इस रिपॉजिटरी में इंजन का कोई कोड नहीं है।

---

## लाइसेंस

यह परियोजना [MIT लाइसेंस](LICENSE) के तहत लाइसेंस प्राप्त है।

---

## लिंक

- [इंजन रिपॉजिटरी](https://github.com/mcp-tool-shop-org/voice-soundboard)
- [MCP टूल शॉप](https://mcptoolshop.com)
- [NuGet पर Soundboard.Client](https://www.nuget.org/packages/Soundboard.Client)
- [NuGet पर Soundboard.Maui.Audio](https://www.nuget.org/packages/Soundboard.Maui.Audio)
- [ज्ञात सीमाएं](docs/known-limitations.md)
