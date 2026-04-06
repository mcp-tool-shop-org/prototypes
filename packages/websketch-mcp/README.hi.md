<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src=".github/websketch-logo.png" alt="WebSketch" width="400">
</p>

# websketch-mcp

**MCP सर्वर जो LLM एजेंटों के लिए [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) टूल प्रदान करता है।**

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-mcp/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/websketch-mcp"><img src="https://img.shields.io/npm/v/websketch-mcp?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

MCP सर्वर जो LLM एजेंटों के लिए [WebSketch IR](https://github.com/mcp-tool-shop-org/websketch-ir) टूल प्रदान करता है।

## शुरुआत कैसे करें

```bash
# Install
npm install -g websketch-mcp

# Add to Claude Desktop config:
# { "mcpServers": { "websketch": { "command": "websketch-mcp" } } }

# The MCP server exposes 4 tools:
# 1. websketch_validate - preflight check (always call first)
# 2. websketch_render   - ASCII wireframe
# 3. websketch_diff     - compare two captures
# 4. websketch_fingerprint - structural hash
```

websketch-ir में संपूर्ण [कार्यप्रणाली गाइड](https://github.com/mcp-tool-shop-org/websketch-ir#getting-started) देखें।

## विशेषताएं

- 🛡️ **websketch_validate**: प्रारंभिक सत्यापन (कभी भी त्रुटि नहीं देता, `{ ok: true/false }` लौटाता है)
- 🎨 **websketch_render**: WebSketch IR कैप्चर को ASCII वायरफ्रेम में बदलें
- 🔍 **websketch_diff**: UI कैप्चर के बीच अंतर की गणना करें
- 🔑 **websketch_fingerprint**: कैप्चर के लिए नियतात्मक फिंगरप्रिंट उत्पन्न करें

## स्थापना

### npm

```bash
npm install -g websketch-mcp
```

### स्रोत से

```bash
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp
npm ci
npm run build
npm link
```

## उपयोग

### क्लाउड डेस्कटॉप

अपने `claude_desktop_config.json` में जोड़ें:

```json
{
  "mcpServers": {
    "websketch": {
      "command": "websketch-mcp"
    }
  }
}
```

### प्रोग्रामेटिक रूप से

```bash
# Run as stdio server
websketch-mcp
```

या Node.js में प्रोग्रामेटिक रूप से:

```typescript
import { spawn } from 'child_process';

const server = spawn('websketch-mcp', [], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Send MCP protocol messages via stdin/stdout
```

## उपकरण

### websketch_render

एक WebSketch IR कैप्चर को ASCII वायरफ्रेम में बदलें।

**इनपुट:**
```json
{
  "capture": {
    "root": {
      "type": "Frame",
      "id": "root",
      "children": [...]
    }
  }
}
```

**आउटपुट:**
```
┌─────────────────────┐
│ Frame (root)        │
│ ├── Button (#btn1)  │
│ └── Text (#text1)   │
└─────────────────────┘
```

### websketch_diff

दो WebSketch IR कैप्चर के बीच अंतर की गणना करें।

**इनपुट:**
```json
{
  "before": { "root": {...} },
  "after": { "root": {...} }
}
```

**आउटपुट:**
```json
{
  "added": [...],
  "removed": [...],
  "modified": [...]
}
```

### websketch_fingerprint

एक कैप्चर के लिए एक नियतात्मक फिंगरप्रिंट उत्पन्न करें।

**इनपुट:**
```json
{
  "capture": { "root": {...} }
}
```

**आउटपुट:**
```
abc123def456...
```

## विकास

### आवश्यकताएं

- Node.js 18+
- npm

### सेटअप

```bash
# Clone the repository
git clone https://github.com/mcp-tool-shop-org/websketch-mcp.git
cd websketch-mcp

# Install dependencies
npm ci

# Build
npm run build

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

### स्क्रिप्ट

```bash
npm run build         # Compile TypeScript to dist/
npm run dev           # Watch mode compilation
npm run start         # Run the compiled server
npm run typecheck     # Type checking without emit
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:coverage # Generate coverage report
npm run clean         # Remove dist/ folder
```

### परियोजना संरचना

```
websketch-mcp/
├── src/
│   └── index.ts          # Main server implementation
├── tests/
│   └── smoke.test.ts     # Test files
├── scripts/
│   └── add-shebang.js    # Post-build script
├── .github/
│   ├── workflows/
│   │   ├── ci.yml        # CI pipeline (includes security scanning)
│   │   └── publish.yml   # npm publish (release + dispatch)
│   └── dependabot.yml    # Dependency updates
├── dist/                 # Compiled output (gitignored)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
├── vitest.config.ts      # Test configuration
└── .eslintrc.cjs         # ESLint configuration
```

## परीक्षण

```bash
# Run all tests
npm test

# Run tests once (for CI)
npm run test:run

# Generate coverage report
npm run test:coverage
```

परीक्षण Vitest का उपयोग करके लिखे गए हैं। उदाहरणों के लिए `tests/` निर्देशिका देखें।

## प्रकाशन

यह पैकेज पूर्व-प्रकाशन सुरक्षा जांचों के साथ कॉन्फ़िगर किया गया है:

```bash
# This will automatically:
# 1. Run type checking
# 2. Run linting
# 3. Run tests
# 4. Build the package
npm publish
```

मैनुअल प्रकाशन चरण:

```bash
# Bump version
npm version patch|minor|major

# Publish to npm
npm publish

# Push tags
git push --follow-tags
```

## समस्या निवारण

### स्थापना के बाद CLI नहीं मिला

```bash
# Ensure global bin directory is in PATH
npm config get prefix

# Or use npx
npx websketch-mcp
```

### बिल्ड विफलताएं

```bash
# Clean and rebuild
npm run clean
npm ci
npm run build
```

### यूनिक्स पर अनुमति त्रुटियां

बिल्ड स्क्रिप्ट स्वचालित रूप से `dist/index.js` को निष्पादन योग्य बनाती है। यदि आपको कोई समस्या आती है:

```bash
chmod +x dist/index.js
```

## योगदान

मार्गदर्शिका के लिए [CONTRIBUTING.md](CONTRIBUTING.md) देखें।

## लाइसेंस

MIT - विवरण के लिए [LICENSE](LICENSE) फ़ाइल देखें।

## लिंक

- **WebSketch IR**: [github.com/mcp-tool-shop-org/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir)
- **मॉडल कॉन्टेक्स्ट प्रोटोकॉल**: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- **समस्याएं**: [github.com/mcp-tool-shop-org/websketch-mcp/issues](https://github.com/mcp-tool-shop-org/websketch-mcp/issues)

## समर्थन

किसी भी प्रश्न या समस्या के लिए, कृपया GitHub पर एक मुद्दा दर्ज करें।
