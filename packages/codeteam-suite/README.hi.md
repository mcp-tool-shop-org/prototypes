<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/codeteam-suite/readme.png" alt="CodeTeam Suite" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/codeteam-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**CodeTeam का आधिकारिक कार्यान्वयन** — पैकेज के सत्यापन, अनुमोदन और हस्ताक्षर के लिए एक .NET-आधारित CLI (कमांड-लाइन इंटरफेस) और लाइब्रेरी।

## स्थिति

**v0.2.0 जारी** — क्रिप्टोग्राफिक ट्रस्ट लूप पूरा हुआ। इंटरऑप अनुबंध तय किया गया।

### स्थिर क्या है

निम्नलिखित स्थिर हैं और CI (निरंतर एकीकरण) द्वारा संरक्षित हैं:

| आर्टिफैक्ट | स्थान | गारंटी |
| ---------- | ---------- | ----------- |
| JSON स्कीमा | `/schemas/*.v0.1.json` | केवल योज्य परिवर्तन |
| CLI `verify --json` आउटपुट | `codeteam.cli.verify.schema.v0.1.json` | पिछली संगत |
| त्रुटि कोड | `ErrorCode.cs` | कोई हटाने या नाम परिवर्तन नहीं |
| गंभीरता मैपिंग | `severity-map.v0.1.json` | नए कोडों को मैपिंग की आवश्यकता है |

इंटरऑप स्मोक टेस्ट इन गारंटियों को लागू करते हैं। CI में कोई भी परिवर्तन विफल हो जाता है।

## NuGet पैकेज

| पैकेज | विवरण |
| --------- | ------------- |
| `CodeTeam` | पैकेज के सत्यापन, अनुमोदन और हस्ताक्षर के लिए .NET वैश्विक टूल। `dotnet tool install -g CodeTeam` के साथ स्थापित करें। |
| `CodeTeam.Core` | डोमेन मॉडल, सत्यापन तर्क, मानक JSON और बहुमत-आधारित नीति मूल्यांकन। |
| `CodeTeam.Crypto` | NSec.Cryptography के माध्यम से Ed25519 हस्ताक्षर सत्यापन और SHA-256 डाइजेस्ट गणना। |
| `CodeTeam.Packaging` | पाथ-ट्रावर्सल सुरक्षा और JSON स्कीमा सत्यापन के साथ पैकेज पढ़ना और सत्यापन। |

## अवलोकन

CodeTeam Suite वह "एक सत्य" कार्यान्वयन है जिसे सभी एडिटर एक्सटेंशन (VS Code, Visual Studio) सौंपते हैं। एक्सटेंशन CLI को लागू करते हैं और परिणामों को प्रदर्शित करते हैं; वे सत्यापन तर्क को लागू नहीं करते हैं।

## आर्किटेक्चर

```
CodeTeam.Core       → Domain models, status codes, error types
CodeTeam.Crypto     → Ed25519 signatures, SHA-256 hashing
CodeTeam.Packaging  → Package loading and verification
CodeTeam.Cli        → CLI entry point (codeteam verify/approve/sign)
```

## CLI उपयोग

```bash
# Verify a package
codeteam verify <package-path> --json

# Approve a package
codeteam approve <package-path> --key <key-id> --json

# Sign a package
codeteam sign <package-path> --key <key-id> --json
```

## एग्जिट कोड

| Code | स्थिति | अर्थ |
| ------ | -------- | --------- |
| 0 | OK_VERIFIED | वैध हस्ताक्षर के साथ पैकेज सत्यापित |
| 1 | OK_UNSIGNED | पैकेज वैध है लेकिन हस्ताक्षरित नहीं है |
| 2 | FAIL_INTEGRITY | फ़ाइल गायब है, आकार/डाइजेस्ट बेमेल है |
| 3 | FAIL_SCHEMA | स्कीमा सत्यापन विफल |
| 4 | FAIL_SIGNATURE | हस्ताक्षर सत्यापन विफल |
| 5 | FAIL_THRESHOLD | अनुमोदन सीमा पूरी नहीं हुई |
| 6 | FAIL_UNAUTHORIZED | अभिनेता अधिकृत नहीं है |

## दस्तावेज़

- [CONTRACT.md](CONTRACT.md) — आधिकारिक पैकेज शब्द
- [VERIFICATION.md](VERIFICATION.md) — मानक सत्यापन नियम
- [docs/EDITOR_INTEGRATION.md](docs/EDITOR_INTEGRATION.md) — एडिटर एक्सटेंशन अनुबंध (VS Code, Visual Studio)
- [docs/PRESS_KIT.md](docs/PRESS_KIT.md) — रिलीज़ मार्केटिंग सामग्री
- [docs/sealing.md](docs/sealing.md) — सीलिंग डिज़ाइन (सूचनात्मक)

## गोल्डन फिक्स्चर

परीक्षण फिक्स्चर अपेक्षित सत्यापन परिणामों को परिभाषित करते हैं:

| फिक्स्चर | अपेक्षित स्थिति |
| --------- | ----------------- |
| `fixtures/minimal_unsigned/` | OK_UNSIGNED |
| `fixtures/approved_threshold_met/` | OK_UNSIGNED |
| `fixtures/signed_verified/` | OK_VERIFIED |
| `fixtures/tampered_artifact/` | FAIL_INTEGRITY |
| `fixtures/invalid_manifest/` | FAIL_SCHEMA |
| `fixtures/signed_verified_real/` | OK_VERIFIED |
| `fixtures/signed_invalid_sig/` | FAIL_SIGNATURE |

## निर्माण

```bash
dotnet build
dotnet test
```

## लाइसेंस

MIT
