<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/vscode-voice-soundboard/readme.png" alt="Voice Soundboard" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.vscode-voice-soundboard"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.vscode-voice-soundboard.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/vscode-voice-soundboard"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/vscode-voice-soundboard" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/vscode-voice-soundboard/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

टेक्स्ट-टू-स्पीच एक्सटेंशन, जिसमें 48 आवाजें, प्रीसेट और मल्टी-स्पीकर डायलॉग शामिल हैं - यह [MCP वॉइस साउंडबोर्ड](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) द्वारा संचालित है।

## विशेषताएं

- **साइडबार पैनल** जिसमें "बोलें", "आवाजें" और "डायलॉग" टैब हैं।
- **48 आवाजें** 9 भाषाओं में (अंग्रेजी, जापानी, मंदारिन, स्पेनिश, फ्रेंच, हिंदी, इतालवी, पुर्तगाली)।
- **5 प्रीसेट** - असिस्टेंट, कथावाचक, उद्घोषक, कहानीकार, फुसफुसाहट।
- **मल्टी-स्पीकर डायलॉग** - स्क्रिप्ट लिखें, आवाज़ें असाइन करें, और सभी को चलाएं।
- **स्पीक सिलेक्शन** - कोड या टेक्स्ट को हाइलाइट करें और `Ctrl+Shift+S` दबाएं।
- **क्रॉस-प्लेटफ़ॉर्म** ऑडियो प्लेबैक (विंडोज, macOS, लिनक्स)।

## शुरुआत कैसे करें

1. एक्सटेंशन स्थापित करें।
2. MCP वॉइस साउंडबोर्ड सर्वर स्वचालित रूप से शुरू हो जाएगा।
3. एक्टिविटी बार में माइक्रोफोन आइकन पर क्लिक करें।
4. टेक्स्ट टाइप करें और "बोलें" पर क्लिक करें।

## कमांड

| कमांड | शॉर्टकट | विवरण |
|---------|----------|-------------|
| वॉइस साउंडबोर्ड: टेक्स्ट बोलें... | — | बोलने के लिए टेक्स्ट दर्ज करें। |
| वॉइस साउंडबोर्ड: सिलेक्शन बोलें | `Ctrl+Shift+S` | चयनित एडिटर टेक्स्ट को बोलें। |
| वॉइस साउंडबोर्ड: बोलना बंद करें | — | वर्तमान प्लेबैक को रोकें। |
| वॉइस साउंडबोर्ड: आवाज बदलें | — | आवाज चयनकर्ता। |
| वॉइस साउंडबोर्ड: पैनल टॉगल करें | — | साइडबार दिखाएं/छिपाएं। |
| वॉइस साउंडबोर्ड: डायलॉग को WebVTT के रूप में एक्सपोर्ट करें | — | डायलॉग स्क्रिप्ट को `.vtt` सबटाइटल फ़ाइल के रूप में एक्सपोर्ट करें। |

## डायलॉग एक्सपोर्ट

डायलॉग टैब में मल्टी-स्पीकर स्क्रिप्ट लिखें, आवाज़ें असाइन करें, और फिर "एक्सपोर्ट VTT" पर क्लिक करें। एक्सटेंशन प्रत्येक पंक्ति को संश्लेषित करता है, ऑडियो की अवधि से संचयी टाइमकोड की गणना करता है, और एक [WebVTT](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API) सबटाइटल फ़ाइल सहेजता है।

एक्सपोर्ट की गई `.vtt` फ़ाइल में वॉयस टैग (`<v Speaker>`) का उपयोग किया जाता है और इसे वीडियो प्लेयर, सबटाइटल एडिटर या एक्सेसिबिलिटी टूल के साथ उपयोग किया जा सकता है।

## सेटिंग्स

| सेटिंग | डिफ़ॉल्ट | विवरण |
|---------|---------|-------------|
| `voiceSoundboard.defaultVoice` | `bm_george` | डिफ़ॉल्ट वॉयस आईडी |
| `voiceSoundboard.speed` | `1.0` | स्पीच की गति (0.5–2.0) |
| `voiceSoundboard.backend` | `python` | TTS बैकएंड (पायथन/HTTP/मॉक) |
| `voiceSoundboard.autoStart` | `true` | सक्रियण पर सर्वर को ऑटो-स्टार्ट करें। |
| `voiceSoundboard.format` | `wav` | ऑडियो आउटपुट फॉर्मेट |

## सुरक्षा और डेटा दायरा

- **स्थानीय बैकएंड (डिफ़ॉल्ट):** पायथन/कोकोरो TTS पूरी तरह से आपके मशीन पर चलता है - कोई नेटवर्क आउटगोइंग नहीं।
- **क्लाउड बैकएंड (वैकल्पिक):** टेक्स्ट को उपयोगकर्ता द्वारा कॉन्फ़िगर किए गए TTS API (OpenAI/ElevenLabs) पर भेजता है - इसके लिए स्पष्ट API कुंजी की आवश्यकता होती है।
- **ऑडियो प्लेबैक:** `spawn` का उपयोग करता है जिसमें आर्ग्स एरे होता है, शेल नहीं - विवरण के लिए [SECURITY.md](SECURITY.md) देखें।
- कोई भी टेलीमेट्री एकत्र या भेजा नहीं जाता है।

## लाइसेंस

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
