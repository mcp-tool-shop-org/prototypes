<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-sfx/readme.jpg" width="400" alt="Claude-SFX">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-sfx"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-sfx" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx/branch/main/graph/badge.svg" alt="codecov"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-sfx/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

[क्लाउड कोड](https://docs.anthropic.com/en/docs/claude-code) के लिए प्रक्रियात्मक ऑडियो प्रतिक्रिया। प्रत्येक टूल का उपयोग, फ़ाइल में बदलाव, खोज, गिट पुश, और एजेंट को भेजने पर एक अलग ध्वनि उत्पन्न होती है - यह ध्वनि ऑडियो फ़ाइलों से नहीं, बल्कि गणितीय गणनाओं के आधार पर बनाई जाती है।

## शुरुआत कैसे करें।

```bash
npm install -g @mcptoolshop/claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

बस इतना ही। अब, क्लाउड कोड काम करते समय आवाज़ें उत्पन्न करेगा।

## ऑडियो फीडबैक क्यों?

जब कोई एआई एजेंट आपकी ओर से पढ़ता है, लिखता है, खोज करता है और काम करता है, तो आप उस प्रक्रिया की जानकारी खो देते हैं। आप बस टेक्स्ट को स्क्रीन पर बहते हुए देखते रहते हैं। ऑडियो प्रतिक्रिया आपको फिर से जागरूक करती है:

- **उपलब्धता:** टर्मिनल पर ध्यान दिए बिना, सिस्टम में होने वाले परिवर्तनों, त्रुटियों और पूर्ण होने की सूचनाएं प्राप्त करें।
- **सुविधा:** यह जानने के लिए कि कोई परीक्षण सफल हुआ है या कोई बदलाव लागू हुआ है, संदर्भ बदलने की आवश्यकता नहीं होती।
- **उपस्थिति:** यह एजेंट एक सहयोगी की तरह महसूस होता है, न कि एक जटिल प्रणाली की।

## सात क्रियाएँ।

प्रत्येक क्लाउड कोड क्रिया 7 मुख्य क्रियाओं में से किसी एक से मेल खाती है। संशोधक (स्थिति, दायरा, दिशा) ध्वनि को बदलते हैं, लेकिन वाक्य की स्पष्टता को बाधित नहीं करते।

| क्रिया। | ट्रिगर। | ध्वनि। |
|---|---|---|
| **intake** | `Read`, `WebFetch`, `WebSearch` | धीरे-धीरे ऊपर की ओर बढ़ने वाली साइन तरंग - कुछ आ रहा है। |
| **transform** | `Edit` | एफएम-टेक्सचर्ड पल्स - पुन: आकार देना। |
| **commit** | `Write`, `NotebookEdit`, `git commit` | तेज़ और स्पष्ट मुहर का निशान - सील कर दिया गया। |
| **navigate** | `Grep`, `Glob` | सोनार सिग्नल - स्कैनिंग। |
| **execute** | `Bash`, `npm test`, `tsc` | ध्वनि विस्फोट + स्वर - यांत्रिक क्रिया। |
| **move** | `mv`, `cp`, सब-एजेंट स्पॉन। | हवा की तेज़ गति - वायु का विस्थापन। |
| **sync** | `git push`, `git pull` | अचानक होने वाली तेज़ आवाज़ + स्वर-आधारित उच्चारण। |

### संशोधक।

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

### स्मार्ट बैश डिटेक्शन (या, बेहतर बैश पहचान तकनीक)

"हुक हैंडलर" बैश कमांड की जांच करता है ताकि सही ध्वनि का चयन किया जा सके:

| बैश कमांड। | क्रिया। | स्थिति। |
|---|---|---|
| `git push` | सिंक्रोनाइज़ (करना) | "एग्जिट कोड से" या "एग्जिट कोड के माध्यम से" |
| `git pull` | सिंक्रोनाइज़ (डाउनलोड) करें। | "एग्जिट कोड से" या "एग्जिट कोड के माध्यम से" |
| `npm test`, `pytest` | निष्पादित करना। | "एग्जिट कोड से" या "एग्जिट कोड के माध्यम से" |
| `tsc`, `npm run build` | निष्पादित करना। | "एग्जिट कोड से" या "एग्जिट कोड के माध्यम से" |
| `mv`, `cp` | स्थानांतरित करना। | — |
| `rm` | स्थानांतरित करना। | चेतावनी देना। |
| सब कुछ और। | निष्पादित करना। | "एग्जिट कोड से" या "एग्जिट कोड के माध्यम से" |

## प्रोफ़ाइलें।

ऐसे ध्वनि विकल्प जो एक ही सेटिंग बदलकर पूरी तरह से अनुभव को बदल देते हैं।

| प्रोफ़ाइल। | चरित्र। |
|---|---|
| **minimal** (default) | साइन वेव टोन - सूक्ष्म, पेशेवर, और रोजमर्रा के उपयोग के लिए उपयुक्त। |
| **retro** | स्क्वेयर-वेव 8-बिट ध्वनियाँ - मज़ेदार, लेकिन नियंत्रित। |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### अनुकूलित प्रोफाइल।

`profiles/minimal.json` फ़ाइल की कॉपी बनाएं, संश्लेषण (सिंथेसिस) के मापदंडों को संपादित करें, और फिर उसे लोड करें:

```bash
claude-sfx play navigate --profile ./my-profile.json
```

JSON में मौजूद प्रत्येक संख्या सीधे सिंथेसाइज़र इंजन से जुड़ी होती है - इसमें वेवफॉर्म, आवृत्ति, अवधि, एनवेलप (एडीएसआर), एफएम की गहराई, बैंडविड्थ और गेन शामिल हैं।

## अवांछित व्यवधानों से बचाव

एक उत्पाद और एक खिलौने में क्या अंतर होता है?

| विशेषता। | व्यवहार। |
|---|---|
| **Debounce** | एक ही क्रिया शब्द का प्रयोग 200 मिलीसेकंड के भीतर होने पर → एक ही ध्वनि उत्पन्न होगी। |
| **Rate limit** | एक 10-सेकंड की अवधि में अधिकतम 8 ध्वनियाँ रिकॉर्ड की जा सकती हैं। |
| **Quiet hours** | निर्धारित समय के दौरान सभी ध्वनियाँ बंद कर दी जाएंगी। |
| **Mute** | तत्काल स्विच करने की सुविधा, सत्र के पुनः आरंभ होने पर भी बरकरार रहती है। |
| **Volume** | 0-100: नियंत्रण प्राप्त करें। |
| **Per-verb disable** | उन विशिष्ट क्रियाओं को बंद कर दें जिन्हें आप प्रदर्शित नहीं करना चाहते। |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## एम्बिएंट (लंबे समय तक चलने वाले ऑपरेशन)

उन कमांडों के लिए जिनमें समय लगता है (जैसे कि सॉफ्टवेयर बनाना, तैनात करना, या बड़े परीक्षणों का समूह चलाना):

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## सत्र की ध्वनियाँ।

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## सभी आदेश।

```
Setup:
  init                            Install hooks into .claude/settings.json
  uninstall                       Remove hooks

Playback:
  play <verb> [options]           Play a sound (goes through guard)
  demo [--profile <name>]         Play all 7 verbs
  preview [profile]               Audition all sounds in a profile
  session-start / session-end     Chimes
  ambient-start / ambient-resolve / ambient-stop

Config:
  mute / unmute                   Toggle all sounds
  volume [0-100]                  Get or set volume
  config                          Print current config
  config set <key> <value>        Set a value
  config reset                    Reset to defaults
  config repo <profile|clear>     Per-directory profile override
  disable / enable <verb>         Toggle specific verbs
  export [dir] [--profile]        Export all sounds as .wav files
```

## यह कैसे काम करता है।

कोई भी ऑडियो फ़ाइल मौजूद नहीं है। हर ध्वनि, गणितीय सूत्रों के आधार पर, प्रोग्राम चलने के दौरान ही उत्पन्न की जाती है।

- **ऑसिलेटर:** साइन, स्क्वायर, सॉटूथ, त्रिकोण, सफेद शोर।
- **एडीएसआर एनवलप:** अटैक, डीके, सस्टेन, रिलीज।
- **एफएम सिंथेसिस:** बनावट के लिए आवृत्ति मॉडुलन।
- **स्टेट-वेरिएबल फिल्टर:** "वूश" ध्वनि के लिए बैंडपास-फिल्टर किया गया शोर।
- **फ्रीक्वेंसी स्वीप:** गति के लिए रैखिक इंटरपोलेशन।
- **लाउडनेस लिमिटर:** सॉफ्ट-नी कंप्रेशन, हार्ड सीलिंग।

पूरा पैकेज लगभग 2,800 लाइनों का टाइपस्क्रिप्ट कोड है, जिसमें कोई भी बाहरी निर्भरता नहीं है जो उत्पादन में आवश्यक हो। ध्वनियाँ पीसीएम बफ़र के रूप में उत्पन्न होती हैं, उन्हें मेमोरी में WAV फ़ॉर्मेट में एन्कोड किया जाता है, और फिर ऑपरेटिंग सिस्टम के मूल ऑडियो प्लेयर के माध्यम से बजाया जाता है (विंडोज पर पॉवरशेल, macOS पर एफ़प्ले, और लिनक्स पर एप्ले)।

## सुरक्षा और गोपनीयता।

**जिन डेटा तक पहुंचा जाता है:** `~/.claude-sfx/config.json` (प्राथमिकताएं), `.claude/settings.json` (हुक पंजीकरण)। ऑडियो बफर मेमोरी में उत्पन्न होते हैं और केवल तभी डिस्क पर लिखे जाते हैं जब आप `export` कमांड चलाते हैं।

**जिन डेटा तक नहीं पहुंचा जाता:** स्रोत कोड, गिट इतिहास, नेटवर्क, क्रेडेंशियल, पर्यावरण चर। कोई भी टेलीमेट्री डेटा एकत्र या भेजा नहीं जाता है। कोई भी ऑडियो फ़ाइल डाउनलोड नहीं की जाती है - हर ध्वनि गणित के आधार पर स्थानीय रूप से उत्पन्न होती है।

**अनुमतियाँ:** कॉन्फ़िगरेशन और हुक के लिए फ़ाइल सिस्टम पढ़ने/लिखने की अनुमति, ऑपरेटिंग सिस्टम के ऑडियो प्लेयर को चलाने की अनुमति। पूर्ण नीति के लिए [SECURITY.md](SECURITY.md) देखें।

## आवश्यकताएं

- Node.js 18+
- क्लाउड कोड
- सिस्टम ऑडियो आउटपुट (स्पीकर या हेडफ़ोन)

## लाइसेंस

[MIT](LICENSE)

---

यह <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा बनाया गया है।
