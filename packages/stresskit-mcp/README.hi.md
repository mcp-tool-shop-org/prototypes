<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/stresskit-mcp/readme.png" width="400" alt="StressKit-MCP">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/stresskit-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

MCP (मॉडल कॉन्टेक्स्ट प्रोटोकॉल) सर्वरों के लिए स्वास्थ्य और सुरक्षा परीक्षण टूलकिट। यह तनाव परीक्षण, सुरक्षा सत्यापन और प्रदर्शन विश्लेषण के माध्यम से MCP सर्वर की तत्परता के लिए विश्वसनीय प्रमाण प्रदान करता है।

## विशेषताएं

- **लोड परीक्षण:** उच्च मात्रा में टूल कॉल का अनुकरण करके बाधाओं की पहचान करना।
- **सुरक्षा स्कैनिंग:** इनपुट सैनिटाइजेशन, प्रमाणीकरण प्रवाह और त्रुटि प्रबंधन का सत्यापन।
- **प्रदर्शन विश्लेषण:** विलंबता, थ्रूपुट और संसाधन उपयोग को मापना।
- **अनुपालन जांच:** MCP प्रोटोकॉल के अनुपालन की पुष्टि करना।
- **प्रमाण पीढ़ी:** सत्यापित परीक्षण रिपोर्ट तैयार करना, जिसमें स्रोत जानकारी शामिल हो।

## शुरुआत कैसे करें

```bash
# Install
pip install stresskit-mcp

# Run basic health check
stresskit check http://localhost:3000

# Run full stress test suite
stresskit stress http://localhost:3000 --profile default

# Generate security report
stresskit security http://localhost:3000 --output report.json
```

## कॉन्फ़िगरेशन

स्ट्रेसकिट, कॉन्फ़िगर करने योग्य परीक्षण परिदृश्यों के लिए प्रोफाइल का उपयोग करता है:

```json
{
  "profile": "production",
  "duration": 300,
  "concurrency": 50,
  "tools": ["*"],
  "checks": {
    "latency_p99_ms": 500,
    "error_rate_max": 0.01,
    "memory_mb_max": 512
  }
}
```

## परियोजना संरचना

```
stresskit-mcp/
├── engines/        # Test execution engines
├── profiles/       # Pre-built test profiles
├── schemas/        # JSON schemas for configuration
├── tests/          # Unit and integration tests
└── stresskit.targets.json  # Default target configuration
```

## संबंधित परियोजनाएं

- [tool-scan](https://github.com/mcp-tool-shop-org/tool-scan) — MCP टूल के लिए सुरक्षा स्कैनर।
- [mcp-stress-test](https://github.com/mcp-tool-shop-org/mcp-stress-test) — स्कैनर सत्यापन के लिए रेड टीम टूलकिट।

## लाइसेंस

MIT लाइसेंस — विवरण के लिए [LICENSE](LICENSE) देखें।

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा निर्मित।
