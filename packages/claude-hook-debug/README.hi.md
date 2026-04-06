<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/">
    <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-hook-debug/readme.png" width="400" alt="claude-hook-debug" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-hook-debug/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-hook-debug/branch/main/graph/badge.svg" alt="Coverage" /></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-hook-debug"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-hook-debug" alt="npm" /></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-hook-debug/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-hook-debug/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

क्लाउड कोड हुक संबंधी समस्याओं के लिए नैदानिक कमांड-लाइन इंटरफेस (CLI)। यह अक्षम प्लगइन्स से उत्पन्न होने वाले "घोस्ट" हुक, स्कोप संघर्ष, गलत तरीके से कॉन्फ़िगर की गई सेटिंग्स और क्लाउड कोड में मौजूद ज्ञात बगों का पता लगाता है।

## इंस्टॉलेशन

```bash
npm install -g @mcptoolshop/claude-hook-debug
```

या सीधे चलाएं:

```bash
npx @mcptoolshop/claude-hook-debug
```

## उपयोग

```bash
# Scan current workspace
claude-hook-debug

# Scan a specific project
claude-hook-debug /path/to/project

# JSON output (for piping/scripting)
claude-hook-debug --json
```

यदि कोई त्रुटि पाई जाती है तो एग्जिट कोड 1 होगा, अन्यथा 0।

## यह क्या पता लगाता है

| ID | गंभीरता | विवरण |
|----|----------|-------------|
| `GHOST_HOOK_PREVIEW` | त्रुटि | "क्लाउड-प्रीव्यू" प्लगइन अक्षम है, लेकिन "स्टॉप" हुक अभी भी सक्रिय है ([#19893](https://github.com/anthropics/claude-code/issues/19893))। |
| `GHOST_HOOK_GENERIC` | चेतावनी | कोई भी अक्षम प्लगइन जो अभी भी सक्रिय हुक रख सकता है। |
| `LOCAL_ONLY_PLUGINS` | त्रुटि | स्थानीय सेटिंग्स में `enabledPlugins` मौजूद है, लेकिन यह चुपचाप ओवरराइड हो जाता है ([#25086](https://github.com/anthropics/claude-code/issues/25086))। |
| `SCOPE_CONFLICT` | चेतावनी | एक स्कोप में प्लगइन सक्षम है, लेकिन दूसरे में अक्षम है। |
| `STOP_CONTINUE_LOOP` | त्रुटि | "स्टॉप" हुक `continue:true` आउटपुट करता है, जिससे अनंत लूप हो सकता है ([#1288](https://github.com/anthropics/claude-code/issues/1288))। |
| `DISABLE_ALL_HOOKS_ACTIVE` | चेतावनी/त्रुटि | `disableAllHooks: true` सभी हुक को निष्क्रिय कर देता है (यदि प्रबंधित सेटिंग्स मौजूद हैं तो यह त्रुटि में बदल जाता है)। |
| `BROKEN_SETTINGS_JSON` | त्रुटि | अमान्य JSON होने पर सभी सेटिंग्स चुपचाप अक्षम हो जाती हैं। |
| `LARGE_SETTINGS_FILE` | चेतावनी | सेटिंग्स फ़ाइल का आकार >100KB (इससे स्टार्टअप धीमा हो सकता है)। |
| `PLUGIN_HOOKS_INVISIBLE` | जानकारी | कोई उपयोगकर्ता हुक नहीं है, लेकिन प्लगइन सक्षम हैं - प्लगइन हुक निरीक्षण के लिए अदृश्य हैं। |

## सेटिंग्स स्कोप

यह टूल क्लाउड कोड के लोड क्रम में सभी चार सेटिंग्स स्कोप को पढ़ता है:

| स्कोप | पथ | प्राथमिकता |
|-------|------|------------|
| प्रबंधित | `~/.claude/managed-settings.json` | उच्चतम |
| उपयोगकर्ता | `~/.claude/settings.json` | |
| परियोजना | `.claude/settings.json` | |
| स्थानीय | `.claude/settings.local.json` | सबसे कम (अंतिम लेखन प्रभावी होता है) |

## लाइब्रेरी उपयोग

```typescript
import { debug } from '@mcptoolshop/claude-hook-debug';

const report = debug({ projectRoot: '/path/to/project' });

console.log(report.diagnostics);
// [{ id: 'GHOST_HOOK_PREVIEW', severity: 'error', title: '...', ... }]

console.log(report.plugins);
// [{ pluginId: 'claude-preview@...', mergedEnabled: false, scopes: [...] }]
```

## सुरक्षा और खतरे का मॉडल

**यह किस पर काम करता है:** क्लाउड कोड सेटिंग्स फ़ाइलें (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, `~/.claude/managed-settings.json`)। सभी रीड केवल-पढ़ने के लिए हैं - यह टूल किसी भी फ़ाइल को संशोधित नहीं करता है।

**यह क्या नहीं करता है:** कोई API कुंजी, टोकन, पर्यावरण चर मान या क्रेडेंशियल नहीं पढ़े या लॉग किए जाते हैं। सेटिंग्स में `env` ब्लॉक पूरी तरह से अनदेखा किया जाता है। क्लाउड कोड सेटिंग्स पथ के बाहर की किसी भी फ़ाइल तक नहीं पहुंचा जाता है।

**आवश्यक अनुमतियाँ:** `~/.claude/` और परियोजना के `.claude/` निर्देशिका तक फ़ाइल सिस्टम पढ़ने की अनुमति। किसी भी उन्नत अनुमति, नेटवर्क एक्सेस या शेल निष्पादन की आवश्यकता नहीं है।

**कोई टेलीमेट्री नहीं।** कोई विश्लेषण नहीं। कोई "फोन-होम" नहीं। किसी भी प्रकार का डेटा संग्रह नहीं। शून्य उत्पादन निर्भरताएँ।

---

[MCP Tool Shop](https://mcp-tool-shop.github.io/) द्वारा बनाया गया।
