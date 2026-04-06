<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Attestia-Desktop/readme.png" alt="Attestia Desktop" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/Attestia-Desktop/actions/workflows/publish.yml"><img src="https://github.com/mcp-tool-shop-org/Attestia-Desktop/actions/workflows/publish.yml/badge.svg" alt="CI"></a>
  <a href="https://www.nuget.org/packages/Attestia.Core"><img src="https://img.shields.io/nuget/v/Attestia.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/Attestia-Desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**विंडोज के लिए वित्तीय इरादे का सत्यापन -- ब्लॉकचेन प्रमाणीकरण और सामंजस्य के लिए एक WinUI 3 डेस्कटॉप ऐप और .NET SDK।**

---

## अटेस्टिया क्यों?

अधिकांश ब्लॉकचेन उपकरण लेनदेन को **घटना के बाद** ऑडिट करते हैं। अटेस्टिया इस मॉडल को बदल देता है: इरादे को श्रृंखला पर आने से **पहले** सत्यापित करें।

- **संरचित वित्तीय इरादे** -- कच्चे डेटा के बजाय संरचित रिकॉर्ड के साथ लेनदेन घोषित करें, स्वीकृत करें, निष्पादित करें और सत्यापित करें।
- **क्रिप्टोग्राफिक प्रमाण** -- मर्केल-ट्री समावेश प्रमाण और प्रमाणीकरण पैकेज छेड़छाड़-रोधी ऑडिट ट्रेल्स प्रदान करते हैं।
- **निर्धारक सामंजस्य** -- तीन-तरफ़ा मिलान (इरादे बनाम लेज़र बनाम श्रृंखला) विसंगतियों को पकड़ता है इससे पहले कि वे बढ़ें।
- **अनुपालन मैपिंग** -- प्रमाणीकरण नियंत्रणों को नियामक ढांचे से मिलाएं और स्कोर किए गए अनुपालन रिपोर्ट उत्पन्न करें।
- **इवेंट सोर्सिंग** -- प्रत्येक स्थिति परिवर्तन एक अपरिवर्तनीय, हैश-चेन डोमेन इवेंट है जिसमें पूर्ण कारण ट्रैकिंग होती है।
- **डेस्कटॉप-प्रथम यूएक्स** -- एक देशी WinUI 3 ऐप आपको विंडोज से बाहर निकले बिना एक वास्तविक समय डैशबोर्ड, इरादे प्रबंधन, प्रमाण एक्सप्लोरर और सामंजस्य दृश्य प्रदान करता है।

---

## NuGet पैकेज

| पैकेज | लक्ष्य | विवरण |
|---------|--------|-------------|
| **Attestia.Core** | `net9.0` | डोमेन मॉडल, एनम और साझा प्रकार -- `इरादा`, `मर्केलप्रूफ`, `सामंजस्यरिपोर्ट`, `पैसे`, `अनुपालनफ्रेमवर्क`, `डोमेनइवेंट`, और बहुत कुछ। |
| **Attestia.Client** | `net9.0` | इरादे, प्रमाण, सामंजस्य, अनुपालन, इवेंट, सत्यापन और निर्यात के लिए टाइप किए गए सब-क्लाइंट के साथ HTTP क्लाइंट SDK। अंतर्निहित पुनः प्रयास तर्क, लिफाफा अनरैपिंग और `CancellationToken` समर्थन। |
| **Attestia.Sidecar** | `net9.0` | Node.js प्रक्रिया प्रबंधक -- अटेस्टिया बैकएंड को शुरू करता है, उपलब्ध पोर्ट का पता लगाता है, `/health` को पोल करता है, क्रैश होने पर स्वचालित रूप से पुनः आरंभ होता है, और प्रक्रिया ट्री को समाप्त होने पर बंद कर देता है। |

ये सभी तीन पैकेज `net9.0` को लक्षित करते हैं और डेस्कटॉप ऐप से स्वतंत्र रूप से काम करते हैं। इनका उपयोग कंसोल ऐप्स, ASP.NET सेवाओं या किसी भी स्थान पर करें जहां .NET 9+ चलता है।

---

## शुरुआत कैसे करें

### एक इरादे को घोषित और सत्यापित करें।

```csharp
using Attestia.Client;

var config = new AttestiaClientConfig { BaseUrl = "http://localhost:3100" };
var http   = new AttestiaHttpClient(httpClient, config, logger);
var client = new AttestiaClient(http);

// Declare a financial intent
var intent = await client.Intents.DeclareAsync(new DeclareIntentRequest
{
    Id          = Guid.NewGuid().ToString(),
    Kind        = "transfer",
    Description = "Send 1,000 USDC to treasury",
    Params      = new() { ["amount"] = "1000", ["currency"] = "USDC" },
});

// Approve, execute on-chain, then verify
await client.Intents.ApproveAsync(intent.Id);
await client.Intents.ExecuteAsync(intent.Id, chainId: "eip155:1", txHash: "0xabc...");
await client.Intents.VerifyAsync(intent.Id, matched: true);
```

### इरादे को लेज़र और श्रृंखला के साथ मिलाएं।

```csharp
var report = await client.Reconciliation.ReconcileAsync(new ReconcileRequest
{
    Intents       = intents,
    LedgerEntries = ledgerEntries,
    ChainEvents   = chainEvents,
});

Console.WriteLine(report.Summary.AllReconciled
    ? "All matched"
    : $"{report.Summary.MismatchCount} mismatches found");
```

### Node.js साइडकार का प्रबंधन करें।

```csharp
using Attestia.Sidecar;

// SidecarConfig is bound from appsettings.json via IOptions<SidecarConfig>
await using var sidecar = new NodeSidecar(options, locator, logger);
await sidecar.StartAsync();

// Sidecar auto-discovers a free port, polls /health every 5 s,
// auto-restarts on crash, and kills the process tree on dispose.
Console.WriteLine($"Backend ready at {sidecar.BaseUrl}");
```

### एक मर्केल समावेश प्रमाण को सत्यापित करें।

```csharp
var package = await client.Proofs.GetAttestationAsync(attestationId);
var result  = await client.Proofs.VerifyProofAsync(package);

Console.WriteLine(result.Valid
    ? $"Proof valid -- root {result.MerkleRoot}"
    : "Proof verification failed");
```

---

## आर्किटेक्चर

```text
+---------------------------------------------------------+
|  Attestia.App  (WinUI 3)                               |
|  Dashboard - Intents - Proofs - Reconciliation          |
|  Compliance - Events - Settings                         |
+---------------------------------------------------------+
|  Attestia.ViewModels  (CommunityToolkit.Mvvm)           |
+----------------------------+----------------------------+
|  Attestia.Client           |  Attestia.Sidecar          |
|  HTTP SDK                  |  Node.js process manager   |
|  Typed sub-clients         |  Health checks, auto-restart|
|  Retry + envelope          |  Port discovery, teardown  |
+----------------------------+----------------------------+
|  Attestia.Core                                          |
|  Domain models - Enums - Shared types                   |
+---------------------------------------------------------+
         |                          |
         v                          v
   Attestia Node.js            Blockchain
   backend (sidecar)           (EVM, etc.)
```

डेस्कटॉप ऐप सभी परतों को जोड़ता है, लेकिन प्रत्येक लाइब्रेरी अपने आप में मौजूद है। `Attestia.Client` किसी भी .NET 9+ प्रोजेक्ट में काम करता है -- कंसोल ऐप्स, ASP.NET APIs, पृष्ठभूमि सेवाएं या परीक्षण उपकरण।

**साइडकार** Node.js बैकएंड को एक चाइल्ड प्रक्रिया के रूप में प्रबंधित करता है। यह एक मुफ्त पोर्ट ढूंढता है, `PORT` और `NODE_ENV=production` सेट करता है, `/health` को पोल करता है, और यदि प्रक्रिया मर जाती है तो स्वचालित रूप से पुनः आरंभ होता है। `DisposeAsync` पर, यह पूरी प्रक्रिया ट्री को साफ-सुथरा तरीके से बंद कर देता है।

---

## आवश्यकताएं

| आवश्यकता | संस्करण | टिप्पणियाँ |
|-------------|---------|-------|
| .NET SDK | 9.0+ | `global.json` 9.0 पर पिन किया गया है `latestFeature` रोल-फॉरवर्ड के साथ। |
| Node.js | 20+ | अटेस्टिया बैकएंड साइडकार के लिए आवश्यक। |
| विंडोज | 10 1809+ | WinUI 3 न्यूनतम; Windows 11 अनुशंसित। |
| विजुअल स्टूडियो | 2022 17.10+ | **विंडोज ऐप SDK** वर्कलोड के साथ (डेस्कटॉप ऐप के लिए)। |

> **ध्यान दें:** तीन NuGet पैकेज (`Attestia.Core`, `Attestia.Client`, `Attestia.Sidecar`) सादे `net9.0` को लक्षित करते हैं और विंडोज की आवश्यकता नहीं होती है। केवल `Attestia.App` `net9.0-windows10.0.22621.0` को लक्षित करता है।

---

## स्रोत से स्थापना

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/Attestia-Desktop.git
cd Attestia-Desktop

# Restore and build (libraries)
dotnet restore
dotnet build

# Run tests
dotnet test

# Run the desktop app (requires x64 + Windows App SDK workload)
dotnet run --project src/Attestia.App -c Debug
```

### MSIX पैकेज का निर्माण (रिलीज)

```bash
dotnet build src/Attestia.App/Attestia.App.csproj -c Release -p:Platform=x64
```

आउटपुट `AppPackages/` में आता है।

### Node.js का बंडलिंग

अटेस्टिया Node.js सर्वर को `assets/node/` में रखें:

```text
assets/
  node/
    node.exe            <-- Node.js runtime
    server/
      dist/
        main.js         <-- Attestia backend entry point
```

बिल्ड स्वचालित रूप से इन फ़ाइलों को आउटपुट निर्देशिका में कॉपी करता है। यदि `assets/node/node.exe` मौजूद नहीं है, तो साइडकार `PATH` पर `node` पर वापस आ जाता है।

---

## परियोजना संरचना

```text
Attestia-Desktop/
|-- src/
|   |-- Attestia.Core/           # Domain models and shared types (NuGet)
|   |   +-- Models/
|   |       |-- Intent.cs        # IntentStatus, Intent, IntentDeclaration, IntentApproval
|   |       |-- Proof.cs         # MerkleProof, MerkleProofStep, AttestationProofPackage
|   |       |-- Reconciliation.cs# ReconciliationReport, MatchStatus, AttestationRecord
|   |       |-- Financial.cs     # Money, AccountRef, LedgerEntry
|   |       |-- Compliance.cs    # ComplianceFramework, ControlMapping, ComplianceReport
|   |       |-- Chain.cs         # ChainRef, BlockRef, TokenRef, OnChainEvent
|   |       |-- Event.cs         # DomainEvent, StoredEvent, EventMetadata
|   |       |-- Verification.cs  # VerificationResult, ReplayResult, ConsensusResult
|   |       +-- Api.cs           # AttestiaResponse<T>, PaginatedList<T>, AttestiaException
|   |
|   |-- Attestia.Client/         # HTTP client SDK (NuGet)
|   |   |-- AttestiaClient.cs    # Facade composing all sub-clients
|   |   |-- AttestiaHttpClient.cs# HTTP transport with retry, envelope unwrapping
|   |   |-- IntentsClient.cs     # Declare, approve, reject, execute, verify
|   |   |-- ProofsClient.cs      # Merkle root, attestation packages, proof verification
|   |   |-- ReconciliationClient.cs # Reconcile, attest, list attestations
|   |   |-- ComplianceClient.cs  # Frameworks, compliance reports
|   |   |-- EventsClient.cs     # Event streams, pagination
|   |   |-- VerifyClient.cs     # State hash, replay verification
|   |   |-- ExportClient.cs     # NDJSON events export, state export
|   |   +-- PublicClient.cs     # Public verification endpoints, consensus
|   |
|   |-- Attestia.Sidecar/        # Node.js process manager (NuGet)
|   |   |-- NodeSidecar.cs       # Lifecycle: start, health check, auto-restart, stop
|   |   |-- SidecarConfig.cs     # Port, timeouts, auto-restart toggle
|   |   +-- NodeBundleLocator.cs # Finds node.exe and server entry point
|   |
|   |-- Attestia.ViewModels/     # MVVM presentation layer
|   |   |-- DashboardViewModel.cs
|   |   |-- IntentsViewModel.cs
|   |   |-- ReconciliationViewModel.cs
|   |   +-- ...
|   |
|   +-- Attestia.App/            # WinUI 3 desktop application
|       |-- Pages/               # Dashboard, Intents, Proofs, Reconciliation, ...
|       |-- Themes/              # AttestiaTheme.xaml
|       +-- Startup.cs           # DI composition root
|
|-- assets/node/                  # Bundled Node.js runtime (gitkeep)
|-- scripts/
|   |-- build-governed.ps1        # Governed build script
|   +-- bundle-node.ps1           # Node.js bundling script
|-- .github/workflows/
|   +-- publish.yml               # NuGet publish on release
|-- Attestia.Desktop.sln
|-- Directory.Build.props         # Shared MSBuild properties
|-- Directory.Packages.props      # Central package management
|-- global.json                   # .NET SDK version pin
|-- CHANGELOG.md
|-- llms.txt                      # AI agent context
+-- LICENSE                       # MIT
```

---

## कॉन्फ़िगरेशन

डेस्कटॉप एप्लिकेशन `appsettings.json` फ़ाइल से साइडकार और क्लाइंट सेटिंग्स पढ़ता है:

```json
{
  "Attestia": {
    "Port": 0,
    "NodePath": null,
    "ServerEntryPoint": null,
    "ApiKey": null
  }
}
```

| कुंजी | डिफ़ॉल्ट मान | विवरण |
|-----|---------|-------------|
| `Port` | `0` (स्वचालित) | साइडकार के लिए निश्चित पोर्ट, या एक खाली पोर्ट को स्वचालित रूप से खोजने के लिए `0`। |
| `NodePath` | `null` | `node.exe` का स्पष्ट पथ; यदि उपलब्ध नहीं है, तो बंडल किए गए संस्करण का उपयोग किया जाता है, फिर `PATH`। |
| `ServerEntryPoint` | `null` | `main.js` का स्पष्ट पथ; यदि उपलब्ध नहीं है, तो बंडल किए गए स्थान का उपयोग किया जाता है। |
| `ApiKey` | `null` | वैकल्पिक एपीआई कुंजी `X-Api-Key` हेडर के रूप में भेजी जाती है। |

---

## सुरक्षा और डेटा दायरा

एटिस्टिया डेस्कटॉप एक **स्थानीय डेस्कटॉप एप्लिकेशन** के रूप में काम करता है, जिसमें एक स्थानीय Node.js साइडकार बैकएंड होता है।

- **पहुंचे जाने वाले डेटा:** यह स्थानीय Node.js साइडकार के माध्यम से इरादे की घोषणाओं, मर्केल प्रमाणों, सुलह रिपोर्टों और अनुपालन डेटा को पढ़ता और लिखता है। यह कॉन्फ़िगरेशन को `appsettings.json` में संग्रहीत करता है। NuGet SDK पैकेज केवल कॉन्फ़िगर किए गए बैकएंड URL पर HTTP कॉल करते हैं।
- **पहुंचे जाने वाले डेटा नहीं:** कोई टेलीमेट्री नहीं। कोई क्लाउड विश्लेषण नहीं। कोई उपयोगकर्ता डेटा संग्रह नहीं। कोई क्रेडेंशियल भंडारण नहीं। कोई सीधा ब्लॉकचेन लेखन नहीं।
- **आवश्यक अनुमतियाँ:** स्थानीय साइडकार (localhost) तक नेटवर्क एक्सेस। बंडल किए गए Node.js रनटाइम और कॉन्फ़िगरेशन के लिए फ़ाइल सिस्टम एक्सेस। डेस्कटॉप यूआई के लिए विंडोज ऐप SDK रनटाइम।

भेद्यता रिपोर्टिंग के लिए [SECURITY.md](SECURITY.md) देखें।

---

## स्कोरकार्ड

| श्रेणी | स्कोर |
|----------|-------|
| सुरक्षा | 10/10 |
| त्रुटि प्रबंधन | 10/10 |
| ऑपरेटर दस्तावेज़ | 10/10 |
| शिपिंग स्वच्छता | 10/10 |
| पहचान | 10/10 |
| **Overall** | **50/50** |

---

## योगदान

1. रिपॉजिटरी को फोर्क करें।
2. एक फीचर ब्रांच बनाएं (`git checkout -b feat/my-feature`)।
3. अपने परिवर्तनों को कमिट करें।
4. `main` के खिलाफ एक पुल अनुरोध खोलें।

कृपया सुनिश्चित करें कि समाधान सफलतापूर्वक बनाया गया है और सभी परीक्षण पास हो गए हैं, इससे पहले कि आप इसे सबमिट करें।

---

## सहायता

- **प्रश्न / सहायता:** [चर्चाएँ](https://github.com/mcp-tool-shop-org/Attestia-Desktop/discussions)
- **बग रिपोर्ट:** [समस्याएँ](https://github.com/mcp-tool-shop-org/Attestia-Desktop/issues)

---

## लाइसेंस

[MIT](LICENSE) -- कॉपीराइट (c) 2026 माइकी फ्रिलोट

---

MCP टूल शॉप द्वारा निर्मित: <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>

