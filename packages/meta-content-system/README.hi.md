<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/meta-content-system/readme.png" alt="Meta Content System" width="400"></p>

<h1 align="center">Meta Content System</h1>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/meta-content-system/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/meta-content-system/build.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <img src="https://img.shields.io/badge/.NET-8-purple?style=flat-square&logo=dotnet" alt=".NET 8">
  <a href="https://www.nuget.org/packages/DevOpTyper.Content"><img src="https://img.shields.io/nuget/v/DevOpTyper.Content?style=flat-square&logo=nuget&label=NuGet" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/meta-content-system?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/meta-content-system/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

**टाइपिंग-अभ्यास ऐप्स के लिए साझा सामग्री प्रणाली -- पाठ, प्रगति और अनुकूल कठिनाई स्तर।**

मेटा कंटेंट सिस्टम, [देव-ऑप-टाइपर](https://github.com/mcp-tool-shop-org/dev-op-typer) (विंडोज) और [लिनक्स-देव-टाइपर](https://github.com/mcp-tool-shop-org/linux-dev-typer) (क्रॉस-प्लेटफ़ॉर्म) के पीछे की पोर्टेबल कंटेंट पाइपलाइन है। यह सोर्स कोड फ़ाइलों को लेता है, उन्हें एक निश्चित तरीके से सामान्य करता है, कठिनाई के मापदंडों की गणना करता है, और एक अनुक्रमित लाइब्रेरी बनाता है जिसका उपयोग दोनों एप्लिकेशन प्लेटफ़ॉर्म की परवाह किए बिना समान रूप से करते हैं।

## मेटा कंटेंट सिस्टम क्यों?

- **एक पाइपलाइन, हर प्लेटफ़ॉर्म** -- समान इनपुट फ़ाइलें विंडोज, लिनक्स और macOS पर समान `library.index.json` उत्पन्न करती हैं। कोई प्लेटफ़ॉर्म विचलन नहीं।
- **शून्य बाहरी निर्भरताएँ** -- पूरी तरह से BCL पर निर्मित शुद्ध .NET 8 लाइब्रेरी। कुछ भी स्थापित करने की आवश्यकता नहीं है, कुछ भी संघर्ष नहीं करेगा।
- **इंटरफ़ेस-आधारित आर्किटेक्चर** -- प्रत्येक पाइपलाइन चरण (`IContentSource`, `IExtractor`, `IMetricCalculator`, `IContentLibrary`) परीक्षण और विस्तार के लिए एक अमूर्तता के पीछे है।
- **नियतात्मक भाषा पहचान** -- फ़ाइल एक्सटेंशन और सामग्री अनुमानों से नियम-आधारित पहचान। डिफ़ॉल्ट रूप से 20+ भाषाओं का समर्थन करता है।
- **SHA-256 सामग्री डुप्लिकेट हटाने** -- सामग्री-आधारित आईडी आयात के दौरान डुप्लिकेट को रोकते हैं। एक ही फ़ाइल को दो बार आयात करें, आपको केवल एक प्रविष्टि मिलेगी।
- **कठिनाई-जागरूक मेट्रिक्स** -- प्रतीक घनत्व, इंडेंटेशन गहराई, पंक्ति गणना और वर्ण वितरण, उपभोग करने वाले ऐप्स में अनुकूल कठिनाई को सक्षम करते हैं।
- **स्मार्ट निष्कर्षण** -- बड़ी फ़ाइलों को सही आकार के अभ्यास ब्लॉकों में विभाजित किया जाता है; छोटी फ़ाइलों को बरकरार रखा जाता है। कॉन्फ़िगर करने योग्य सीमाएँ।

## NuGet पैकेज

| पैकेज | विवरण |
| --------- | ------------- |
| [`DevOpTyper.Content`](https://www.nuget.org/packages/DevOpTyper.Content) | सामग्री का इनपुट, सामान्यीकरण, भाषा पहचान, मेट्रिक्स गणना और अनुक्रमण पीढ़ी। शून्य बाहरी निर्भरताएँ। |

```bash
dotnet add package DevOpTyper.Content
```

## शुरुआत कैसे करें

### एक लाइब्रेरी के रूप में

```csharp
using DevOpTyper.Content.Abstractions;
using DevOpTyper.Content.Models;
using DevOpTyper.Content.Services;

// 1. Create the pipeline components
IExtractor extractor = new DefaultExtractor();
IMetricCalculator metrics = new MetricCalculator();
var builder = new LibraryIndexBuilder(extractor, metrics);

// 2. Build an index from a content source
IContentSource source = new MyFolderSource("./samples");
LibraryIndex index = await builder.BuildAsync(source);

// 3. Query the library
var library = new InMemoryContentLibrary(index.Items);
var pythonSnippets = library.Query(new ContentQuery
{
    Language = "python",
    MinLines = 5,
    MaxSymbolDensity = 0.4f
});

// 4. Persist the index
var store = new JsonLibraryIndexStore();
store.Save("library.index.json", index);
```

### CLI का उपयोग करके

```bash
dotnet run --project src/DevOpTyper.Content.Cli -- build --source ./my-code --out library.index.json

dotnet run --project src/DevOpTyper.Content.Cli -- paste --lang csharp --title "Hello World" --text "Console.WriteLine(\"Hello\");"
```

## आर्किटेक्चर

```
IContentSource                    Enumerates raw files
       |
       v
LanguageDetector                  Extension map + content heuristics
       |
       v
IExtractor                        Split large files into practice blocks
       |
       v
Normalizer                        Line endings -> LF, trailing newline
       |
       v
ContentId                         SHA-256(language + normalized code)
       |                          First 16 bytes -> 32-char hex ID
       v
IMetricCalculator                 Lines, characters, symbol density,
       |                          max indent depth
       v
LibraryIndexBuilder               Deduplicates, sorts, emits index
       |
       v
ILibraryIndexStore                Serialize/deserialize library.index.json
       |
       v
IContentLibrary                   Query by language, source, line count,
                                  symbol density range
```

### समर्थित भाषाएँ

भाषा डिटेक्टर एक्सटेंशन मैपिंग और सामग्री अनुमानों के माध्यम से 20+ भाषाओं को कवर करता है:

पायथन, C#, जावा, जावास्क्रिप्ट, टाइपस्क्रिप्ट, SQL, बैश, रस्ट, गो, कोटलिन, C, C++, JSON, YAML, मार्कडाउन -- और एक्सटेंशन मैप के माध्यम से और भी बहुत कुछ। अज्ञात फ़ाइलें डिफ़ॉल्ट रूप से `text` में बदल जाती हैं।

### गणना किए गए मेट्रिक्स

| मेट्रिक | Type | विवरण |
| -------- | ------ | ------------- |
| `Lines` | `int` | कुल पंक्ति गणना |
| `Characters` | `int` | खाली स्थान सहित कुल वर्ण गणना |
| `SymbolDensity` | `float` | गैर-खाली वर्णों के अनुपात (0.0--1.0) |
| `MaxIndentDepth` | `int` | सबसे गहरा इंडेंटेशन स्तर (4-स्पेस टैब) |

ये मेट्रिक्स अनुकूल कठिनाई को सक्षम करते हैं: उच्च प्रतीक घनत्व और गहरे नेस्टिंग वाला एक अंश, सपाट गद्य की तुलना में टाइप करने में अधिक कठिन होता है।

## आवश्यकताएँ

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) या बाद का संस्करण

अन्य किसी भी टूल या निर्भरता की आवश्यकता नहीं है।

## स्रोत से निर्माण

```bash
git clone https://github.com/mcp-tool-shop-org/meta-content-system.git
cd meta-content-system
dotnet restore
dotnet build -c Release
dotnet test -c Release
```

## परियोजना संरचना

```
meta-content-system/
├── src/
│   ├── DevOpTyper.Content/            # Core library (NuGet package)
│   │   ├── Abstractions/              # IContentLibrary, IContentSource,
│   │   │                              #   IExtractor, IMetricCalculator, ILibraryIndexStore
│   │   ├── Models/                    # CodeItem, CodeMetrics, LibraryIndex
│   │   └── Services/                  # LanguageDetector, Normalizer, ContentId,
│   │                                  #   MetricCalculator, LibraryIndexBuilder,
│   │                                  #   InMemoryContentLibrary, JsonLibraryIndexStore
│   └── DevOpTyper.Content.Cli/        # CLI tool for batch indexing
├── tests/
│   └── DevOpTyper.Content.Tests/      # xUnit tests (normalization, metrics, detection,
│                                      #   extraction, indexing, golden parity, store)
├── docs/                              # Design documents (extraction, detection, metrics)
├── spec/                              # JSON schemas (codeitem, libraryindex)
├── DevOpTyper.Content.sln
├── logo.png
└── LICENSE
```

## डिजाइन लक्ष्य

| Goal | How |
| ------ |-----|
| **Platform-stable output** | LF सामान्यीकरण, नियतात्मक क्रम, सामग्री-आधारित आईडी |
| **शून्य बाहरी निर्भरताएँ** | शुद्ध .NET 8 BCL -- कोई तृतीय-पक्ष NuGet पैकेज नहीं |
| **Interface-driven** | प्रत्येक पाइपलाइन चरण एक अमूर्तता के पीछे है |
| **Testable** | गोल्डन-पैरिटी जांच के साथ xUnit परीक्षण सूट |
| **Extensible** | कस्टम इनपुट के लिए `IContentSource` और कस्टम विभाजन के लिए `IExtractor` लागू करें। |

## उपभोग करने वाले ऐप्स

| App | प्लेटफ़ॉर्म | रिपॉजिटरी |
|-----| ---------- | ------------ |
| Dev-Op-Typer | विंडोज (WinUI 3) | [mcp-tool-shop-org/dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) |
| linux-dev-typer | क्रॉस-प्लेटफ़ॉर्म (.NET) | [mcp-tool-shop-org/linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) |

## लाइसेंस

[एमआईटी](LICENSE)

---

<p align="center">
  Built by <a href="https://mcptoolshop.com">MCP Tool Shop</a>
</p>
