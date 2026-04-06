<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-examples/readme.png" alt="MCP Examples" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml/badge.svg" alt="Validate Examples"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-examples/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

[MCP टूल शॉप](https://github.com/mcp-tool-shop) के लिए उदाहरण कार्यक्षेत्र।

## MCP टूल शॉप कैसे काम करता है

- **रजिस्ट्री** ([mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry)) → कौन से उपकरण उपलब्ध हैं
- **सीएलआई (CLI)** ([mcpt](https://github.com/mcp-tool-shop-org/mcpt)) → आप उनका उपयोग कैसे करते हैं
- **उदाहरण** → आप मॉडल को कैसे सीखते हैं (यह रिपॉजिटरी)
- **टैग** (v0.1.0, v0.2.0) → स्थिरता, पुनरुत्पादकता
- **मेन (main)** → केवल विकास के लिए; बिना सूचना के बदल सकता है; बिल्ड विफल हो सकते हैं
- **उपकरण डिफ़ॉल्ट रूप से न्यूनतम विशेषाधिकारों के साथ काम करते हैं** → कोई नेटवर्क नहीं, कोई लेखन नहीं, कोई दुष्प्रभाव नहीं
- **क्षमता हमेशा स्पष्ट और वैकल्पिक होती है** → आप यह तय करते हैं कि इसे कब सक्षम करना है

## उदाहरण

| उदाहरण | विवरण |
| --------- | ------------- |
| [hello-tools](./hello-tools/) | 2 मिनट में आपका पहला MCP कार्यक्षेत्र |
| [hello-filesystem](./hello-filesystem/) | अपरिवर्तनीय दुष्प्रभावों को सुरक्षित रूप से संभाला जाता है |

## शुरुआत कैसे करें

```bash
cd hello-tools
python -m tools.echo.main "Hello, MCP!"
```

## संबंधित

- [mcpt](https://github.com/mcp-tool-shop-org/mcpt) - उपकरणों को खोजने और चलाने के लिए सीएलआई
- [mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry) - उपकरण मेटाडेटा रजिस्ट्री
