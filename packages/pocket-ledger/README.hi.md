<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/pocket-ledger/readme.png" width="400" alt="Pocket Ledger">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/pocket-ledger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

विंडोज के लिए एक स्थानीय-आधारित व्यक्तिगत वित्त और बजट ट्रैकिंग ऐप। यह साफ, सरल और गोपनीयता पर केंद्रित है।

## दर्शन

- **स्थानीय-आधारित**: आपका वित्तीय डेटा आपके डिवाइस पर ही रहता है। क्लाउड सिंक की आवश्यकता नहीं है।
- **डिजाइन द्वारा गोपनीयता**: कोई भी डेटा संग्रह नहीं, और किसी भी बाहरी कनेक्शन की आवश्यकता नहीं, जब तक कि आप स्वयं ऐसा न चुनें।
- **एनवेलप बजटिंग**: एक सिद्ध पद्धति जो हर रुपये को एक उद्देश्य देती है।
- **लक्ष्य-उन्मुख**: आप किस चीज़ के लिए बचत कर रहे हैं, इस पर ध्यान केंद्रित करें, न कि केवल आप कितना खर्च कर रहे हैं।

## विशेषताएं (योजनाबद्ध)

- [ ] लेनदेन ट्रैकिंग, जिसमें श्रेणियां शामिल हैं
- [ ] एनवेलप-आधारित बजट प्रणाली
- [ ] दृश्य प्रगति के साथ बचत लक्ष्य
- [ ] आवर्ती लेनदेन प्रबंधन
- [ ] दृश्य खर्च विश्लेषण और रिपोर्ट
- [ ] एकाधिक खातों का समर्थन
- [ ] सीएसवी आयात/निर्यात
- [ ] डार्क/लाइट थीम समर्थन

## तकनीकी ढांचा

- **.NET 8**: आधुनिक, उच्च प्रदर्शन वाला रनटाइम
- **WinUI 3 / Windows App SDK**: विंडोज 11 का मूल अनुभव
- **SQLite**: स्थानीय, पोर्टेबल डेटाबेस
- **आर्किटेक्चर**: रखरखाव योग्य, परीक्षण योग्य परतें

## परियोजना संरचना

```
src/
├── PocketLedger.Domain/        # Core entities and business rules
├── PocketLedger.Application/   # Use cases and application logic
├── PocketLedger.Infrastructure/# Data persistence, external services
└── PocketLedger.Desktop/       # WinUI 3 presentation layer
tests/
├── PocketLedger.Domain.Tests/
├── PocketLedger.Application.Tests/
└── PocketLedger.Infrastructure.Tests/
```

## विकास

### आवश्यकताएं

- विंडोज 10/11
- विजुअल स्टूडियो 2022 (17.8+) या VS कोड जिसमें C# डेवलपमेंट किट हो
- .NET 8 SDK
- विंडोज ऐप SDK

### बिल्डिंग

```bash
dotnet build
```

### परीक्षण चलाना

```bash
dotnet test
```

## लाइसेंस

एमआईटी लाइसेंस - विवरण के लिए [LICENSE](LICENSE) देखें।

## योगदान

योगदान का स्वागत है! कृपया पीआर सबमिट करने से पहले हमारे योगदान दिशानिर्देश पढ़ें।

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा निर्मित।
