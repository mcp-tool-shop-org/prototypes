<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <strong>English</strong> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.ja.md">日本語</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.zh.md">中文</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.es.md">Español</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.fr.md">Français</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.hi.md">हिन्दी</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.it.md">Italiano</a> | <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/blob/main/README.pt-BR.md">Português</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/websketch-vscode/readme.png" alt="WebSketch" width="400"></p>

<p align="center"><strong>Turn any web page into a structured tree that LLMs can actually understand.</strong></p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/websketch-vscode/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.websketch-vscode.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode"><img src="https://codecov.io/gh/mcp-tool-shop-org/websketch-vscode/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/websketch-vscode/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="#the-problem">The Problem</a> &middot;
  <a href="#the-solution">The Solution</a> &middot;
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-reads">How It Reads</a> &middot;
  <a href="#use-cases">Use Cases</a> &middot;
  <a href="#ecosystem">Ecosystem</a>
</p>

---

## Le problème

Vous souhaitez qu'un modèle de langage (LLM) analyse une page web, en tenant compte de sa mise en page, de sa navigation, de ses éléments interactifs et de sa hiérarchie de contenu. Les solutions actuelles ne répondent pas à ce besoin.

| Approche | Nombre de tokens | Ce que vous perdez |
|----------|--------|---------------|
| **Screenshot** | 1 000+ (vision) | Impossible de lire le texte de petite taille, estimation de la mise en page, aucune information sur l'interactivité. |
| **Raw HTML** | 50 000 à 500 000 | Surcharge de balises `div`, de styles en ligne, de scripts et de bruit SVG. |
| **Readability extract** | 2 000 à 10 000 | Suppression de toute structure : pas de navigation, pas de boutons, pas de formulaires. |
| **DOM dump** | 10 000 à 100 000 | Noms de classes, attributs de données et artefacts de framework omniprésents. |

Le problème fondamental : **aucune de ces méthodes ne comprend le langage de l'interface utilisateur (UI)**. Les LLM n'ont pas besoin de `<div class="sc-bdnxRM jJFqsI">` ; ils ont besoin de `NAV`, `BUTTON`, `CARD`, `LIST`.

## La solution

WebSketch capture la page dans un **arbre sémantique** en utilisant 23 primitives d'interface utilisateur. Un simple clic dans VS Code, copiez et collez dans n'importe quel LLM :

```
PAGE
├─ HEADER {sticky}
│  ├─ *LINK "Home"
│  ├─ *LINK "Products"
│  ├─ *LINK "Pricing"
│  └─ *INPUT <search> "Search..."
├─ SECTION <main>
│  ├─ TEXT <h1> "Welcome to Acme"
│  ├─ TEXT "Build faster with our platform..."
│  └─ *BUTTON "Get Started"
├─ LIST (3 items)
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "Real-time sync across devices"
│  ├─ CARD
│  │  ├─ IMAGE "Feature icon"
│  │  └─ TEXT "99.9% uptime guarantee"
│  └─ CARD
│     ├─ IMAGE "Feature icon"
│     └─ TEXT "Enterprise-grade security"
└─ FOOTER
   ├─ NAV
   │  ├─ *LINK "Terms"
   │  ├─ *LINK "Privacy"
   │  └─ *LINK "Contact"
   └─ TEXT "© 2026 Acme Inc."
```

**200 à 800 tokens**. Pas 50 000. Pas une grille de pixels. Un arbre clair que n'importe quel modèle de texte peut analyser.

### Comparaison directe

| Métrique | WebSketch | HTML brut | Capture d'écran |
|--------|-----------|----------|------------|
| **Tokens** | 200 à 800 | 50,000+ | 1 000+ (vision) |
| **Structure** | Arbre sémantique complet | Chaos de balises `div` imbriquées | Grille de pixels |
| **Text content** | Texte étiqueté et entre guillemets | Informations cachées dans le code source | Dépend de la reconnaissance optique de caractères (OCR) |
| **Interactive elements** | Marqué d'un `*` | Informations cachées dans les attributs | Invisible |
| **Heading hierarchy** | `<h1>` à `<h6>` | Perdu dans les noms de classes | Deviné en fonction de la taille |
| **Landmarks** | `<main>`, `<nav>`, `<search>` | Nécessite une expertise en DOM (Document Object Model) | Non disponible |
| **Works with** | Tout LLM basé sur du texte | Rien d'utile | Modèles de vision uniquement |

## Démarrage rapide

1. Installez depuis le [marché de VS Code](https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.websketch-vscode) ou exécutez :
```
ext install mcp-tool-shop.websketch-vscode
```
2. Ouvrez la palette de commandes (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Exécutez **WebSketch : Capture URL**
4. Collez une URL et appuyez sur Entrée
5. Cliquez sur **Copier pour LLM** et collez dans votre invite

L'onglet LLM est la vue par défaut. Un simple clic copie l'arbre dans votre presse-papiers, prêt pour n'importe quel modèle.

## Comment cela fonctionne

Chaque ligne de l'arbre contient des informations denses et est interprétable par une machine :

```
├─ *BUTTON <search> {sticky} "Find products"
│    │       │         │         │
│    │       │         │         └─ Actual visible text
│    │       │         └─ Flags (sticky, scrollable)
│    │       └─ Semantic hint (search, main, h1, aside...)
│    └─ Interactive (clickable/typeable)
│
└─ Tree structure shows parent-child nesting
```

### La grammaire

| Symbole | Signification | Exemple |
|--------|---------|---------|
| Préfixe `*` | L'utilisateur peut interagir avec cet élément. | `*LINK`, `*BUTTON`, `*INPUT` |
| `<semantic>` | Signification HTML5/ARIA préservée. | `<h1>`, `<main>`, `<search>`, `<aside>` |
| `{flags}` | Comportement de la mise en page. | `{sticky}`, `{scrollable}` |
| `"label"` | Contenu textuel visible. | `"Sign up free"`, `"Search..."` |
| `(N items)` | Nombre d'éléments de la liste. | `LIST (12 items)` |
| Indentation. | Hiérarchie parent-enfant. | `HEADER > NAV > LIST > LINK` |

### Les 23 rôles

| Catégorie | Rôles |
|----------|-------|
| **Layout** | `PAGE`, `HEADER`, `FOOTER`, `SECTION`, `NAV` |
| **Content** | `TEXT`, `IMAGE`, `ICON`, `CARD`, `LIST`, `TABLE` |
| **Interactive** | `BUTTON`, `LINK`, `INPUT`, `CHECKBOX`, `RADIO`, `FORM` |
| **Overlays** | `MODAL`, `TOAST`, `DROPDOWN` |
| **Navigation** | `PAGINATION` |
| **Fallback** | `UNKNOWN` |

Ces 23 rôles constituent un vocabulaire fixe, le même pour tous les sites web. Les LLM les apprennent une fois et peuvent analyser n'importe quelle page.

## Ce qui est capturé

WebSketch ne se contente pas de décharger le DOM. Il exécute un **classificateur en 5 niveaux** sur chaque élément visible :

| Niveau | Source | Exemple |
|------|--------|---------|
| 1. **Rôle ARIA** | `role="navigation"` | &rarr; `NAV` |
| 2. **Balise HTML** | `<button>`, `<h1>` | &rarr; `BUTTON`, `TEXT <h1>` |
| 3. **Heuristiques de classe** | `.card`, `.modal`, `.toast` | &rarr; `CARD`, `MODAL`, `TOAST` |
| 4. **Analyse structurelle** | 3+ éléments du même type | &rarr; `LIST` |
| 5. **Solution de repli** | Éléments contenant uniquement du texte. | &rarr; `TEXT`, `SECTION`, `UNKNOWN` |

Ensuite, il effectue un nettoyage :

- **Parcours transparent de la table** : les balises `TR`, `TD`, `TH` et `LI` sont ignorées, les éléments enfants sont promus à la surface.
- **Suppression des éléments sans contenu** : les nœuds vides, non interactifs et invisibles sont supprimés.
- **Suppression des wrappers inutiles** : les wrappers `SECTION` uniques et sans signification sont supprimés.
- **Élagage en cascade** : les chaînes de wrappers vides sans contenu sont entièrement éliminées.
- **Extraction des étiquettes** : le texte visible est extrait des liens, des boutons, des titres, des images et des champs de saisie.

Le résultat : un arbre propre contenant le minimum de nœuds nécessaires pour comprendre la page.

## Cas d'utilisation

### Pour les ingénieurs en intelligence artificielle

**"Décrivez la mise en page de cette page"** : collez l'arbre. Le modèle de langage voit la structure exacte, les titres et la navigation sans être submergé par le code HTML. Fonctionne avec ChatGPT, Claude, Gemini, Llama, et tout autre modèle de langage.

**"Que peut faire un utilisateur sur cette page ?"** : chaque élément interactif est marqué avec un `*`. Les liens, les boutons, les champs de saisie, les cases à cocher, etc., sont tous étiquetés avec leur texte visible. Le modèle de langage peut énumérer toutes les actions possibles de l'utilisateur.

**"Comparez ces deux pages"** : deux arbres côte à côte. Le modèle de langage peut comparer la structure, identifier les éléments manquants, comparer les schémas de navigation, le tout en quelques centaines de tokens.

### Pour les développeurs

**"Générez un plan de test pour cette interface utilisateur"** : l'arbre correspond directement aux cibles de test. `*BUTTON "Soumettre"`, `*INPUT <email> "Entrez votre adresse e-mail"`, `*LINK "Conditions d'utilisation"` : chaque élément est une interaction testable avec son étiquette visible.

**"Créez quelque chose qui ressemble à ceci"** : l'arbre sémantique se rapproche d'une hiérarchie de composants. `HEADER > NAV > LIST > LINK` correspond directement aux composants React/Vue/Svelte. Le modèle de langage peut générer une mise en page correspondante.

**"Vérifiez l'accessibilité de cette page"** : les points de repère manquants, les champs de saisie non étiquetés, les lacunes dans la hiérarchie des titres, tout cela est visible dans l'arbre. Les indications sémantiques comme `<main>`, `<nav>`, `<search>` montrent quels rôles ARIA sont présents (ou absents).

### Pour les agents d'intelligence artificielle

**Intégration MCP** : utilisez [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) pour donner à votre agent d'intelligence artificielle la capacité de capturer et d'analyser n'importe quelle page web dans le cadre de sa chaîne d'outils.

**Surveillance automatisée** : utilisez [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) pour capturer des pages selon un calendrier, comparer les arbres et détecter les modifications structurelles.

## Quatre vues

| Onglet | Ce qu'elle affiche | Idéale pour |
|-----|---------------|----------|
| **LLM** (default) | Arbre sémantique indenté avec étiquettes, sémantiques et indicateurs | Coller dans les invites des modèles de langage |
| **ASCII** | Schéma en dessin de boîtes avec mise en page spatiale | Compréhension de la mise en page visuelle |
| **Tree** | Arbre de nœuds rétractable avec badges de rôle colorés | Débogage des captures |
| **JSON** | IR `WebSketchCapture` complet avec surlignement syntaxique | Utilisation programmatique et pipelines |

## Commandes

| Commande | Description |
|---------|-------------|
| `WebSketch: Capture URL` | Invite pour l'URL, la capture et l'affichage |
| `WebSketch: Capture URL from Clipboard` | Capture l'URL qui se trouve dans votre presse-papiers |
| `WebSketch: Copy LLM Tree to Clipboard` | Copiez l'arbre et collez-le directement dans ChatGPT, Claude, etc. |
| `WebSketch: Export LLM Tree` | Enregistrez au format `.md` pour les bibliothèques d'invites ou la documentation. |
| `WebSketch: Export Capture as JSON` | Capture complète de l'IR avec boîtes englobantes, hachages et métadonnées. |
| `WebSketch: Export ASCII Wireframe` | Vue de la mise en page en dessin de boîtes. |

## Paramètres

| Paramètre | Valeur par défaut | Description |
|---------|---------|-------------|
| `websketch.chromePath` | Détection automatique | Chemin vers l'exécutable Chrome ou Edge |
| `websketch.viewportWidth` | `1280` | Largeur de la fenêtre d'affichage en pixels |
| `websketch.viewportHeight` | `800` | Hauteur de la fenêtre d'affichage en pixels |
| `websketch.timeout` | `30000` | Délai d'attente de navigation (ms) |
| `websketch.waitAfterLoad` | `1000` | Temps d'attente supplémentaire pour le rendu JavaScript (ms) |

## Écosystème

WebSketch est une famille d'outils construits sur une grammaire commune :

| Package | Ce que cela fait |
|---------|-------------|
| [@mcptoolshop/websketch-ir](https://github.com/mcp-tool-shop-org/websketch-ir) | Noyau IR : grammaire, validation, rendu, comparaison, identification. |
| **websketch-vscode** | Extension VS Code : capture de pages depuis votre éditeur (ce dépôt). |
| [websketch-cli](https://github.com/mcp-tool-shop-org/websketch-cli) | Capture et rendu en ligne de commande. |
| [websketch-extension](https://github.com/mcp-tool-shop-org/websketch-extension) | Extension Chrome pour la capture directement dans le navigateur. |
| [websketch-mcp](https://github.com/mcp-tool-shop-org/websketch-mcp) | Serveur MCP pour l'intégration avec les agents LLM. |

Tous les outils produisent le même format IR `WebSketchCapture`, ce qui permet d'interchanger les résultats entre les différents processus.

## Prérequis

- VS Code 1.85 ou version supérieure.
- Chrome ou Edge installés sur votre système.

Aucun navigateur inclus. Pas de téléchargement de 200 Mo. WebSketch utilise `puppeteer-core` avec le navigateur que vous avez déjà installé.

## Sécurité et portée des données

**Données traitées :** URL saisies par l'utilisateur (navigées via puppeteer-core en utilisant Chrome/Edge local en mode sans interface graphique), contenu de la page capturée converti en arbre IR, exports écrits dans les fichiers de l'espace de travail ou dans le presse-papiers. **Données NON traitées :** aucun fichier en dehors de l'espace de travail, aucune information d'identification du système d'exploitation, aucune session de connexion au navigateur (mode sans interface graphique sans profil). **Réseau :** navigation uniquement vers les URL spécifiées par l'utilisateur — aucune autre requête sortante. **Aucune télémétrie** n'est collectée ou envoyée.

## Licence

Licence MIT — voir [LICENSE](LICENSE) pour plus de détails.

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
