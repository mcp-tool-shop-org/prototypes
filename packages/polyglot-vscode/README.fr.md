<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="media/icon.png" width="400" alt="Polyglot">
</p>

<p><strong>Translate text, files, and READMEs directly in VS Code — powered by your local GPU. 55 languages, zero cloud dependency.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions"><img src="https://github.com/mcp-tool-shop-org/polyglot-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.polyglot-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.polyglot-vscode" alt="VS Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/polyglot-vscode"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/polyglot-vscode" alt="Coverage"></a>
  <a href="https://github.com/mcp-tool-shop-org/polyglot-vscode/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/polyglot-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

## Ce que fait Polyglot

Polyglot exécute [TranslateGemma 12B](https://ai.google.dev/gemma/docs/core/translategemma) via [Ollama](https://ollama.com) sur votre GPU local. Pas de clés API, pas de services cloud, aucune donnée ne quitte votre machine.

- **Traduire la sélection** : Sélectionnez du texte, appuyez sur `Ctrl+Alt+T`, choisissez une langue. C'est tout.
- **Traduire un fichier** : Traduisez un fichier entier dans un nouveau fichier `file.ja.ext` en parallèle avec le fichier original.
- **Traduire README** : Traduisez en masse votre fichier README.md dans 7 langues, en conservant les blocs de code, les tableaux et les badges.
- **Panneau latéral** : Icône de globe dans la barre d'activité avec des boutons d'action et l'état d'Ollama en direct.

## Prérequis

- [Ollama](https://ollama.com) installé et en cours d'exécution
- Un GPU avec suffisamment de VRAM pour le modèle (12 Go pour `translategemma:12b`, 2 Go pour `translategemma:2b`)
- Le modèle est téléchargé automatiquement lors de la première utilisation.

## Premiers pas

1. Installez l'extension
2. Cliquez sur l'icône du globe dans la barre d'activité (barre latérale gauche)
3. Cliquez sur **Vérifier l'état** — Polyglot démarrera Ollama et téléchargera le modèle si nécessaire.
4. Sélectionnez du texte et appuyez sur `Ctrl+Alt+T` (ou `Cmd+Alt+T` sur Mac).

## Commandes

| Commande | Raccourci | Description |
|---------|----------|-------------|
| **Polyglot : Traduire la sélection** | `Ctrl+Alt+T` | Traduit le texte sélectionné directement. |
| **Polyglot: Translate File** | — | Traduit le fichier actuel vers un nouveau fichier. |
| **Polyglot : Traduire README** | — | Traduit en masse le fichier README.md dans plusieurs langues. |
| **Polyglot: Check Status** | — | Vérifie la connexion à Ollama et la disponibilité du modèle. |
| **Polyglot: Help** | — | Accès rapide aux paramètres, au guide et aux liens. |

## Points d'accès

- **Panneau latéral** : Icône du globe dans la barre d'activité avec des boutons d'action stylisés.
- **Barre de titre de l'éditeur** : L'icône du globe apparaît lorsque du texte est sélectionné.
- **Menu contextuel clic droit** : "Traduire la sélection" dans le menu contextuel de l'éditeur.
- **Palette de commandes** : `Ctrl+Shift+P` → tapez "Polyglot".
- **Raccourci clavier** : `Ctrl+Alt+T` avec du texte sélectionné.

## Paramètres

| Paramètre | Valeur par défaut | Description |
|---------|---------|-------------|
| `polyglot.ollamaUrl` | `http://localhost:11434` | URL du serveur Ollama |
| `polyglot.model` | `translategemma:12b` | Modèle de traduction (essayez `2b` pour moins de VRAM) |
| `polyglot.defaultSourceLanguage` | `en` | Langue source pour les traductions |
| `polyglot.defaultLanguages` | 7 langues | Langues cibles pour la traduction de README |

## Langues prises en charge

Arabe, Bengali, Bulgare, Catalan, Chinois (simplifié et traditionnel), Croate, Tchèque, Danois, Néerlandais, Anglais, Estonien, Finnois, Français, Allemand, Grec, Gujarati, Hébreu, Hindi, Hongrois, Indonésien, Italien, Japonais, Kannada, Coréen, Letton, Lituanien, Macédonien, Malais, Malayalam, Marathi, Norvégien, Persan, Polonais, Portugais, Roumain, Russe, Serbe, Slovaque, Slovène, Espagnol, Swahili, Suédois, Tamoul, Telugu, Thaï, Turc, Ukrainien, Ourdou, Vietnamien et Gallois.

## Fonctionnement

Polyglot utilise [@mcptoolshop/polyglot-mcp](https://www.npmjs.com/package/@mcptoolshop/polyglot-mcp), un moteur de traduction local qui :

1. Démarre automatiquement Ollama s'il n'est pas en cours d'exécution.
2. Télécharge automatiquement le modèle TranslateGemma lors de la première utilisation.
3. Divise les longs textes en paragraphes/phrases.
4. Applique un glossaire logiciel pour les termes techniques précis.
5. Corrige les problèmes courants du modèle (alternatives dupliquées, points de fin).

Pour la traduction de README, il utilise une segmentation intelligente : les blocs de code, les badges HTML et les URL sont préservés intacts, tandis que les titres, les paragraphes et le contenu des tableaux sont traduits.

## Sécurité et portée des données

**Données concernées :** texte dans l'éditeur actif (lecture seule pour la sélection, écriture pour le remplacement), fichiers dans l'espace de travail pour les fonctions "Traduire le fichier" / "Traduire le README" (crée de nouveaux fichiers à côté des originaux). **Données non concernées :** aucun fichier en dehors de l'espace de travail, aucune information d'identification du système d'exploitation, aucune donnée du navigateur. **Réseau :** se connecte uniquement à Ollama local (`localhost:11434` par défaut) — **pas de communication vers le cloud**. **Aucune donnée de télémétrie** n'est collectée ou envoyée.

## Licence

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
