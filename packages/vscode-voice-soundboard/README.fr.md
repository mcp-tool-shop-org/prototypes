<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

Extension de synthèse vocale avec 48 voix, des préréglages et un dialogue multi-locuteurs, alimentée par [MCP Voice Soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard).

## Fonctionnalités

- **Panneau latéral** avec les onglets "Parler", "Voix" et "Dialogue"
- **48 voix** dans 9 langues (anglais, japonais, mandarin, espagnol, français, hindi, italien, portugais)
- **5 préréglages** : Assistant, Narrateur, Annonceur, Conte, Murmure
- **Dialogue multi-locuteurs** : écrivez des scripts, attribuez des voix, lancez la lecture de tous
- **Sélection vocale** : sélectionnez du code ou du texte et appuyez sur `Ctrl+Shift+S`
- Lecture audio multiplateforme (Windows, macOS, Linux)

## Premiers pas

1. Installez l'extension
2. Le serveur MCP Voice Soundboard démarre automatiquement
3. Cliquez sur l'icône du microphone dans la barre d'activité
4. Tapez du texte et cliquez sur **Parler**

## Commandes

| Commande | Raccourci | Description |
|---------|----------|-------------|
| Tableau de voix : Parler le texte... | — | Entrez le texte à prononcer |
| Tableau de voix : Parler la sélection | `Ctrl+Shift+S` | Prononcez le texte sélectionné dans l'éditeur |
| Tableau de voix : Arrêter la lecture | — | Arrête la lecture en cours |
| Tableau de voix : Changer de voix | — | Sélecteur de voix rapide |
| Tableau de voix : Afficher/masquer le panneau | — | Affiche/masque le panneau latéral |
| Tableau de voix : Exporter le dialogue au format WebVTT | — | Exportez le script de dialogue au format de fichier de sous-titres `.vtt` |

## Exportation du dialogue

Écrivez un script multi-locuteurs dans l'onglet "Dialogue", attribuez des voix, puis cliquez sur **Exporter VTT**. L'extension synthétise chaque ligne, calcule les horodatages cumulatifs à partir des durées audio et enregistre un fichier de sous-titres [WebVTT](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API).

Le fichier `.vtt` exporté utilise des balises de voix (`<v Speaker>`) et peut être utilisé avec des lecteurs vidéo, des éditeurs de sous-titres ou des outils d'accessibilité.

## Paramètres

| Paramètre | Valeur par défaut | Description |
|---------|---------|-------------|
| `voiceSoundboard.defaultVoice` | `bm_george` | ID de voix par défaut |
| `voiceSoundboard.speed` | `1.0` | Vitesse de la parole (0,5–2,0) |
| `voiceSoundboard.backend` | `python` | Backend TTS (python/http/mock) |
| `voiceSoundboard.autoStart` | `true` | Démarrer automatiquement le serveur à l'activation |
| `voiceSoundboard.format` | `wav` | Format de sortie audio |

## Sécurité et portée des données

- **Backend local (par défaut) :** Python/Kokoro TTS s'exécute entièrement sur votre machine, sans communication réseau.
- **Backend cloud (facultatif) :** envoie le texte à une API TTS configurée par l'utilisateur (OpenAI/ElevenLabs) — nécessite une clé API explicite.
- **Lecture audio :** utilise `spawn` avec un tableau d'arguments, et non une invite de commande — voir [SECURITY.md](SECURITY.md) pour plus de détails.
- **Aucune télémétrie** n'est collectée ou envoyée.

## Licence

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
