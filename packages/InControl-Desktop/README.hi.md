<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/InControl-Desktop/readme.png" alt="InControl Desktop" width="400"></p>

<h1 align="center">InControl Desktop</h1>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/InControl-Desktop/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/InControl-Desktop/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="https://www.nuget.org/packages/InControl.Core"><img src="https://img.shields.io/nuget/v/InControl.Core?style=flat-square&label=InControl.Core" alt="InControl.Core NuGet"></a>
  <a href="https://www.nuget.org/packages/InControl.Inference"><img src="https://img.shields.io/nuget/v/InControl.Inference?style=flat-square&label=InControl.Inference" alt="InControl.Inference NuGet"></a>
  <img src="https://img.shields.io/badge/.NET-9-purple?style=flat-square&logo=dotnet" alt=".NET 9">
  <img src="https://img.shields.io/badge/WinUI-3-blue?style=flat-square" alt="WinUI 3">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/InControl-Desktop?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/InControl-Desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

**विंडोज के लिए स्थानीय एआई चैट असिस्टेंट**

यह एक गोपनीयता-केंद्रित, जीपीयू-त्वरित चैट एप्लिकेशन है जो बड़े भाषा मॉडल को पूरी तरह से आपके मशीन पर चलाता है। क्लाउड की आवश्यकता नहीं है।

## इनकंट्रोल क्यों?

- **डिफ़ॉल्ट रूप से निजी:** आपकी बातचीत कभी भी आपके कंप्यूटर से बाहर नहीं जाती।
- **आरटीएक्स-अनुकूलित:** एनवीडिया जीपीयू के लिए CUDA त्वरण के साथ बनाया गया।
- **मूल विंडोज अनुभव:** फ्लुएंट डिज़ाइन के साथ WinUI 3।
- **एकाधिक बैकएंड:** ओलामा, llama.cpp, या अपना खुद का बैकएंड।
- **मार्कडाउन रेंडरिंग:** रिच टेक्स्ट, कोड ब्लॉक और सिंटैक्स हाइलाइटिंग।

## NuGet पैकेज

कोर लाइब्रेरी स्टैंडअलोन NuGet पैकेज के रूप में उपलब्ध हैं, जिनका उपयोग आप अपने स्वयं के स्थानीय एआई एकीकरण बनाने के लिए कर सकते हैं:

| पैकेज | संस्करण | विवरण |
| --------- | --------- | ------------- |
| [InControl.Core](https://www.nuget.org/packages/InControl.Core) | [![NuGet](https://img.shields.io/nuget/v/InControl.Core?style=flat-square)](https://www.nuget.org/packages/InControl.Core) | स्थानीय एआई चैट एप्लिकेशन के लिए डोमेन मॉडल, वार्तालाप प्रकार और साझा सार। |
| [InControl.Inference](https://www.nuget.org/packages/InControl.Inference) | [![NuGet](https://img.shields.io/nuget/v/InControl.Inference?style=flat-square)](https://www.nuget.org/packages/InControl.Inference) | स्ट्रीमिंग चैट, मॉडल प्रबंधन और स्वास्थ्य जांच के साथ एलएलएम बैकएंड एब्स्ट्रैक्शन लेयर। इसमें ओलामा कार्यान्वयन शामिल है। |

```bash
dotnet add package InControl.Core
dotnet add package InControl.Inference
```

```csharp
// Example: use InControl.Inference in your own app
var client = inferenceClientFactory.Create("ollama");
await foreach (var token in client.StreamChatAsync(messages))
{
    Console.Write(token);
}
```

## लक्षित हार्डवेयर

| घटक | न्यूनतम | अनुशंसित |
| ----------- | --------- | ------------- |
| GPU | RTX 3060 (8GB) | RTX 4080/5080 (16GB) |
| RAM | 16GB | 32GB |
| OS | विंडोज 10 1809+ | विंडोज 11 |
| .NET | 9.0 | 9.0 |

## स्थापना

### रिलीज़ से (अनुशंसित)

1. [रिलीज़](https://github.com/mcp-tool-shop-org/InControl-Desktop/releases) से नवीनतम MSIX पैकेज डाउनलोड करें।
2. इंस्टॉलेशन के लिए डबल-क्लिक करें।
3. स्टार्ट मेनू से लॉन्च करें।

### स्रोत से

```bash
# Clone and build
git clone https://github.com/mcp-tool-shop-org/InControl-Desktop.git
cd InControl-Desktop
dotnet restore
dotnet build

# Run (requires Ollama running locally)
dotnet run --project src/InControl.App
```

## आवश्यकताएं

इनकंट्रोल को एक स्थानीय एलएलएम बैकएंड की आवश्यकता होती है। हम [ओलामा](https://ollama.ai/) की अनुशंसा करते हैं:

```bash
# Install Ollama from https://ollama.ai/download

# Pull a model
ollama pull llama3.2

# Start the server (runs on http://localhost:11434)
ollama serve
```

## बिल्डिंग

### बिल्ड वातावरण सत्यापित करें

```powershell
# Run verification script
./scripts/verify.ps1
```

### डेवलपमेंट बिल्ड

```bash
dotnet build
```

### रिलीज़ बिल्ड

```powershell
# Creates release artifacts in artifacts/
./scripts/release.ps1
```

### परीक्षण चलाएं

```bash
dotnet test
```

## आर्किटेक्चर

इनकंट्रोल एक स्वच्छ, लेयर्ड आर्किटेक्चर का पालन करता है:

```
+-------------------------------------------+
|         InControl.App (WinUI 3)           |  UI Layer
+-------------------------------------------+
|         InControl.ViewModels              |  Presentation
+-------------------------------------------+
|         InControl.Services                |  Business Logic
+-------------------------------------------+
|         InControl.Inference               |  LLM Backends
+-------------------------------------------+
|         InControl.Core                    |  Shared Types
+-------------------------------------------+
```

विस्तृत डिज़ाइन दस्तावेज़ के लिए [ARCHITECTURE.md](./docs/ARCHITECTURE.md) देखें।

## डेटा संग्रहण

सभी डेटा स्थानीय रूप से संग्रहीत किया जाता है:

| Data | स्थान |
| ------ | ---------- |
| सत्र | `%LOCALAPPDATA%\InControl\sessions\` |
| Logs | `%LOCALAPPDATA%\InControl\logs\` |
| Cache | `%LOCALAPPDATA%\InControl\cache\` |
| निर्यात | `%USERPROFILE%\Documents\InControl\exports\` |

पूर्ण डेटा हैंडलिंग दस्तावेज़ के लिए [PRIVACY.md](./docs/PRIVACY.md) देखें।

## समस्या निवारण

सामान्य समस्याएं और समाधान [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) में प्रलेखित हैं।

### त्वरित समाधान

**ऐप शुरू नहीं हो रहा है:**
- जांचें कि .NET 9.0 रनटाइम स्थापित है या नहीं।
- यह सत्यापित करने के लिए `dotnet --list-runtimes` चलाएं।

**कोई मॉडल उपलब्ध नहीं है:**
- सुनिश्चित करें कि ओलामा चल रहा है: `ollama serve`
- एक मॉडल डाउनलोड करें: `ollama pull llama3.2`

**जीपीयू का पता नहीं चला:**
- नवीनतम संस्करण में एनवीडिया ड्राइवरों को अपडेट करें।
- CUDA टूलकिट इंस्टॉलेशन की जांच करें।

## योगदान

योगदान का स्वागत है! कृपया:

1. रिपॉजिटरी को फोर्क करें।
2. एक फीचर ब्रांच बनाएं।
3. नई कार्यक्षमता के लिए परीक्षण लिखें।
4. एक पुल अनुरोध सबमिट करें।

## समस्याओं की रिपोर्टिंग

1. पहले [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) की जांच करें।
2. ऐप में "डायग्नोस्टिक्स कॉपी करें" सुविधा का उपयोग करें।
3. डायग्नोस्टिक्स जानकारी के साथ एक मुद्दा खोलें।

## तकनीकी स्टैक

| Layer | प्रौद्योगिकी |
| ------- | ------------ |
| यूआई फ्रेमवर्क | WinUI 3 (विंडोज ऐप SDK 1.6) |
| आर्किटेक्चर | MVVM with CommunityToolkit.Mvvm |
| एलएलएम एकीकरण | OllamaSharp, Microsoft.Extensions.AI |
| डीआई कंटेनर | Microsoft.Extensions.DependencyInjection |
| कॉन्फ़िगरेशन | Microsoft.Extensions.Configuration |
| लॉगिंग | Microsoft.Extensions.Logging + Serilog |

## संस्करण

वर्तमान संस्करण: **0.4.0-अल्फा**

रिलीज़ इतिहास के लिए [CHANGELOG.md](./CHANGELOG.md) देखें।

## सहायता

- **प्रश्न / सहायता:** [चर्चाएँ](https://github.com/mcp-tool-shop-org/InControl-Desktop/discussions)
- **बग रिपोर्ट:** [समस्याएँ](https://github.com/mcp-tool-shop-org/InControl-Desktop/issues)
- **सुरक्षा:** [SECURITY.md](SECURITY.md)

## लाइसेंस

[एमआईटी](LICENSE) -- पूर्ण पाठ के लिए [LICENSE](LICENSE) देखें।

---

*विंडोज के लिए बनाया गया। स्थानीय एआई द्वारा संचालित।*
