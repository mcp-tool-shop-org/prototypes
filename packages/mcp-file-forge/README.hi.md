<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-file-forge/readme.png" alt="MCP File Forge" width="400"></p>

<p align="center">
  Secure file operations and project scaffolding for AI agents.
  <br />
  Part of <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/file-forge"><img alt="npm version" src="https://img.shields.io/npm/v/@mcptoolshop/file-forge"></a>
  <a href="https://github.com/mcp-tool-shop-org/mcp-file-forge/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-file-forge/"><img alt="Landing Page" src="https://img.shields.io/badge/Landing_Page-live-blue"></a>
</p>

---

## एक नज़र में।

MCP फाइल फोर्ज एक [मॉडल कॉन्टेक्स्ट प्रोटोकॉल](https://modelcontextprotocol.io) (MCP) सर्वर है जो एआई एजेंटों को स्थानीय फाइल सिस्टम तक सुरक्षित और नियंत्रित पहुंच प्रदान करता है। इसमें पांच श्रेणियों में **17 उपकरण** शामिल हैं:

| श्रेणी। | उपकरण। | विवरण। |
| ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | "The company is committed to providing high-quality products and services."

अनुवाद:

"कंपनी उच्च गुणवत्ता वाले उत्पाद और सेवाएं प्रदान करने के लिए प्रतिबद्ध है।" | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने के लिए तैयार हूं। |
| **Reading** | `read_file`, `read_directory`, `read_multiple` | फ़ाइलों और फ़ोल्डरों की सूची पढ़ें। |
| **Writing** | `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` | बनाएं, संशोधित करें, कॉपी करें, स्थानांतरित करें और हटाएं। |
| **Search** | `glob_search`, `grep_search`, `find_by_content` | नाम के पैटर्न या सामग्री के आधार पर फ़ाइलें खोजें। |
| **Metadata** | `file_stat`, `file_exists`, `get_disk_usage`, `compare_files` | आकार, समय-मुहर (टाइमस्टैम्प), और अस्तित्व की जांच करें। |
| **Scaffolding** | `scaffold_project`, `list_templates` | टेम्प्लेट का उपयोग करके ऐसे प्रोजेक्ट बनाएं जिनमें चर (variables) को बदला जा सके। |

मुख्य विशेषताएं:

- **सुरक्षित वातावरण (सैंडबॉक्स):** संचालन केवल उन डाइरेक्टरी तक सीमित हैं जिन्हें स्पष्ट रूप से अनुमति दी गई है।
- **केवल-पढ़ने की मोड:** सभी लिखने वाले उपकरणों को निष्क्रिय करने के लिए एक पर्यावरण चर को बदलें।
- **सिंबोलिंक-सुरक्षित:** सिंबोलिंक को डिफ़ॉल्ट रूप से अक्षम किया गया है ताकि सैंडबॉक्स से बाहर निकलने से रोका जा सके।
- **विंडोज-प्राथमिकता:** विंडोज के पथों और मानकों के लिए डिज़ाइन किया गया, लेकिन यह हर जगह काम करता है।
- **टेम्प्लेट इंजन:** `{{var}}` / `${var}` के माध्यम से मानों को प्रतिस्थापित करने की सुविधा, साथ ही पथ स्तर पर `__var__` का उपयोग करके नाम बदलने की सुविधा।

---

## स्थापना।

```bash
npm install -g @mcptoolshop/file-forge
```

या फिर आप इसे सीधे `npx` के माध्यम से चला सकते हैं:

```bash
npx @mcptoolshop/file-forge
```

---

## क्लाउड डेस्कटॉप का कॉन्फ़िगरेशन।

अपने `claude_desktop_config.json` फ़ाइल में निम्नलिखित चीज़ें जोड़ें:

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/file-forge"],
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects,C:/Users/you/Documents"
      }
    }
  }
}
```

यदि आपने इसे वैश्विक स्तर पर स्थापित किया है, तो आप सीधे उस बाइनरी फ़ाइल की ओर इंगित कर सकते हैं:

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "mcp-file-forge",
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects"
      }
    }
  }
}
```

---

## उपकरण संदर्भ।

### पढ़ना।

| उपकरण। | विवरण। | मुख्य मापदंड। |
| "The company is committed to providing high-quality products and services."

अनुवाद:

"कंपनी उच्च गुणवत्ता वाले उत्पाद और सेवाएं प्रदान करने के लिए प्रतिबद्ध है।" | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने के लिए तैयार हूं। | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| `read_file` | फ़ाइल की सामग्री पढ़ें। | `path`, `encoding?`, `start_line?`, `end_line?`, `max_size_kb?` |
| `read_directory` | निर्देशिका प्रविष्टियों की सूची प्रदर्शित करें। | `path`, `recursive?`, `max_depth?`, `include_hidden?`, `pattern?` |
| `read_multiple` | एक साथ कई फ़ाइलों को पढ़ें। | `paths`, `encoding?`, `fail_on_error?` |

### लेखन।

| उपकरण। | विवरण। | मुख्य पैरामीटर। |
| "The company is committed to providing high-quality products and services."

अनुवाद:

"कंपनी उच्च गुणवत्ता वाले उत्पाद और सेवाएं प्रदान करने के लिए प्रतिबद्ध है।" | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| `write_file` | एक फ़ाइल को लिखें या उसमें मौजूद सामग्री को बदलें। | `path`, `content`, `encoding?`, `create_dirs?`, `overwrite?`, `backup?` |
| `create_directory` | एक फ़ोल्डर बनाएँ। | `path`, `recursive?` |
| `copy_file` | एक फ़ाइल या फ़ोल्डर की प्रतिलिपि बनाएँ। | `source`, `destination`, `overwrite?`, `recursive?` |
| `move_file` | स्थानांतरित करें या नाम बदलें। | `source`, `destination`, `overwrite?` |
| `delete_file` | एक फ़ाइल या फ़ोल्डर को हटाएं। | `path`, `recursive?`, `force?` |

### खोजें।

| उपकरण। | विवरण। | मुख्य पैरामीटर। |
| "The company is committed to providing high-quality products and services."

अनुवाद:

"कंपनी उच्च गुणवत्ता वाले उत्पाद और सेवाएं प्रदान करने के लिए प्रतिबद्ध है।" | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने के लिए तैयार हूं। | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| `glob_search` | ग्लोब पैटर्न का उपयोग करके फ़ाइलें खोजें। | `pattern`, `base_path?`, `max_results?`, `include_dirs?` |
| `grep_search` | रेगुलर एक्सप्रेशन का उपयोग करके फ़ाइल की सामग्री खोजें। | `pattern`, `path?`, `glob?`, `case_sensitive?`, `max_results?`, `context_lines?` |
| `find_by_content` | शाब्दिक पाठ खोज (कोई रेगुलर एक्सप्रेशन नहीं)। | `text`, `path?`, `file_pattern?`, `max_results?` |

### मेटाडेटा।

| उपकरण। | विवरण। | मुख्य पैरामीटर। |
| "The company is committed to providing high-quality products and services."

अनुवाद:

"कंपनी उच्च गुणवत्ता वाले उत्पाद और सेवाएं प्रदान करने के लिए प्रतिबद्ध है।" | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| `file_stat` | फ़ाइल/फ़ोल्डर के आंकड़े। | `path` |
| `file_exists` | जांचें कि क्या वह मौजूद है और उसका प्रकार क्या है। | `पथ`, `प्रकार?` (`फ़ाइल` / `डायरेक्टरी` / `कोई भी`) |
| `get_disk_usage` | फ़ोल्डर के आकार का विवरण। | `path`, `max_depth?` |
| `compare_files` | दो रास्तों की तुलना करें। | `path1`, `path2` |

### ढांचा।

| उपकरण। | विवरण। | मुख्य पैरामीटर। |
| "The company is committed to providing high-quality products and services."

अनुवाद:

"कंपनी उच्च गुणवत्ता वाले उत्पाद और सेवाएं प्रदान करने के लिए प्रतिबद्ध है।" | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने के लिए तैयार हूं। | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| `scaffold_project` | टेम्प्लेट से प्रोजेक्ट बनाएं। | `template`, `destination`, `variables?`, `overwrite?` |
| `list_templates` | उपलब्ध टेम्प्लेट की सूची दिखाएं। | `category?` |

पूर्ण पैरामीटर विवरण, उदाहरण और त्रुटि कोड [HANDBOOK.md](HANDBOOK.md) फ़ाइल में उपलब्ध हैं।

---

## पर्यावरण चर (या पर्यावरण संबंधी चर)।

| चर। | विवरण। | डिफ़ॉल्ट। |
| ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। | कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। मैं उसका सटीक और उचित अनुवाद करने के लिए तैयार हूं। | ज़रूर, मैं आपकी मदद कर सकता हूँ। कृपया वह अंग्रेजी पाठ प्रदान करें जिसका आप हिंदी में अनुवाद करवाना चाहते हैं। |
| `MCP_FILE_FORGE_ALLOWED_PATHS` | अनुमत रूट डायरेक्टरी की अल्पविराम से अलग की गई सूची। | `.` (वर्तमान कार्यशील निर्देशिका) |
| `MCP_FILE_FORGE_DENIED_PATHS` | कॉमा से अलग किए गए, अस्वीकृत रास्तों के लिए सामान्य पैटर्न। | `**/node_modules/**`, `**/.git/**` |
| `MCP_FILE_FORGE_READ_ONLY` | सभी लिखने की क्रियाओं को बंद करें। | `false` |
| `MCP_FILE_FORGE_MAX_FILE_SIZE` | बाइट्स में अधिकतम फ़ाइल आकार। | `104857600` (100 एमबी) |
| `MCP_FILE_FORGE_MAX_DEPTH` | अधिकतम पुनरावर्ती गहराई | `20` |
| `MCP_FILE_FORGE_FOLLOW_SYMLINKS` | सैंडबॉक्स के बाहर सिंबोलिक लिंक का उपयोग करने की अनुमति दें | `false` |
| `MCP_FILE_FORGE_TEMPLATE_PATHS` | कॉमा से अलग किए गए टेम्पलेट निर्देशिकाएँ | `./templates` |
| `MCP_FILE_FORGE_LOG_LEVEL` | लॉग की विस्तृतता (`error`, `warn`, `info`, `debug`) | `info` |
| `MCP_FILE_FORGE_LOG_FILE` | लॉग फ़ाइल का पथ (stderr के अतिरिक्त) | _कोई नहीं_ |

---

## कॉन्फ़िगरेशन फ़ाइल

अपने कार्यशील निर्देशिका में या उसके ऊपर `mcp-file-forge.json` (या `.mcp-file-forge.json`) फ़ाइल बनाएँ:

```json
{
  "sandbox": {
    "allowed_paths": ["C:/Projects", "C:/Users/you/Documents"],
    "denied_paths": ["**/secrets/**", "**/.env"],
    "follow_symlinks": false,
    "max_file_size": 52428800,
    "max_depth": 20
  },
  "templates": {
    "paths": ["./templates", "~/.mcp-file-forge/templates"]
  },
  "logging": {
    "level": "info",
    "file": "./logs/mcp-file-forge.log"
  },
  "read_only": false
}
```

कॉन्फ़िगरेशन प्राथमिकता (सबसे उच्च प्राथमिकता वाली):

1. पर्यावरण चर
2. कॉन्फ़िगरेशन फ़ाइल
3. अंतर्निहित डिफ़ॉल्ट

---

## सुरक्षा

MCP फ़ाइल फ़ॉर्ज कई सुरक्षा स्तर लागू करता है ताकि एआई एजेंट अपने निर्दिष्ट कार्यक्षेत्र से बाहर न जा सकें:

- **पाथ सैंडबॉक्सिंग:** प्रत्येक पथ को एक पूर्ण पथ में हल किया जाता है और किसी भी इनपुट/आउटपुट ऑपरेशन से पहले `allowed_paths` सूची के विरुद्ध जांचा जाता है।
- **अवरुद्ध पथ:** ग्लोब पैटर्न जो अनुमत निर्देशिकाओं के भीतर भी अवरुद्ध होते हैं (उदाहरण के लिए, `**/secrets/**`)।
- **सिंबोलिक लिंक सुरक्षा:** डिफ़ॉल्ट रूप से सिंबोलिक लिंक का पालन नहीं किया जाता है; यदि किसी सिंबोलिक लिंक का लक्ष्य सैंडबॉक्स के बाहर है, तो ऑपरेशन अस्वीकार कर दिया जाता है।
- **पाथ ट्रैवर्सल डिटेक्शन:** `..` अनुक्रम जो सैंडबॉक्स से बाहर निकलने का प्रयास करते हैं, उन्हें अस्वीकार कर दिया जाता है।
- **आकार सीमाएँ:** `max_file_size` से बड़ी फ़ाइलों को अस्वीकार कर दिया जाता है ताकि मेमोरी समाप्त न हो।
- **गहराई सीमाएँ:** पुनरावर्ती कार्यों को `max_depth` स्तरों तक सीमित किया जाता है।
- **केवल-पढ़ने का मोड:** `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file`, और `scaffold_project` को अक्षम करने के लिए `MCP_FILE_FORGE_READ_ONLY=true` सेट करें।
- **नल-बाइट अस्वीकृति:** `\0` युक्त पथों को अस्वीकार कर दिया जाता है।
- **विंडोज लंबी-पथ सुरक्षा:** 32,767 अक्षरों से अधिक लंबे पथों को अस्वीकार कर दिया जाता है।

---

## दस्तावेज़

| दस्तावेज़ | विवरण |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | गहन जानकारी: सुरक्षा मॉडल, टूल संदर्भ, टेम्पलेट, आर्किटेक्चर, अक्सर पूछे जाने वाले प्रश्न |
| [CHANGELOG.md](CHANGELOG.md) | रिलीज़ इतिहास (चेंजलॉग प्रारूप में) |
| [docs/PLANNING.md](docs/PLANNING.md) | आंतरिक योजना और अनुसंधान नोट्स |

---

## विकास

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

---

## लाइसेंस

[MIT](LICENSE)

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा निर्मित।
