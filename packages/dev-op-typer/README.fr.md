<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# Dev-Op-Typer

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/dev-op-typer/readme.png" alt="Dev-Op-Typer" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml/badge.svg" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/dev-op-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Une application d'entraînement à la frappe axée sur les développeurs pour Windows — chaque test est composé de code réel.**

> Disponible également pour Linux/macOS : [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) (Avalonia UI)

## Fonctionnalités

### Entraînement avec du code réel
- Tapez des extraits de code réels en **Python, JavaScript, C#, Java, SQL et Bash**.
- Suivi de la précision caractère par caractère avec mise en évidence des différences.
- Correspondance exacte des symboles : `{ } [ ] ( ) < > ; : , . " ' \`.
- Les sauts de ligne et l'indentation sont importants.

### Apprentissage adaptatif
- Sélection intelligente des extraits en fonction de votre niveau de compétence.
- Système de notation type Elo par langage.
- Planification des sessions : mélange cible (50 %) / révision (30 %) / défi (20 %).
- Carte thermique des erreurs par caractère avec identification des points faibles.
- Mode guidé : sélection axée sur les points faibles avec des exercices ciblés.
- Échelle de difficulté (D1–D7) avec détection de la zone de confort.

### Statistiques en direct
- Vitesse de frappe (WPM), précision et nombre d'erreurs en temps réel.
- Fin de session avec aperçu rétrospectif.
- Suivi des tendances : vitesse de frappe et précision par langage.
- Détection de la fatigue avec suggestions de pauses.
- Panneau des points faibles avec analyse au niveau du caractère.

### Enseignement et communauté
- Indices progressifs avec des niveaux de "Plus d'informations".
- Démonstrations : implémentations alternatives présentées comme des alternatives équivalentes.
- Signaux de la communauté : conseils et évaluations de difficulté affichés uniquement.
- Notes de guidage provenant de packs de contenu partagés.
- Panneau des niveaux de compétence pour une compréhension structurelle.

### Système de contenu
- Plus de 168 extraits de calibration dans 6 langages.
- Packs d'extraits utilisateur : ajoutez des fichiers JSON dans le dossier des packs.
- Coller du code : collez n'importe quel code à partir du presse-papiers pour l'utiliser comme contenu d'entraînement.
- Importer un fichier/un dossier : indexez les fichiers sources avec détection automatique du langage.
- Exporter/Importer des bundles `.ldtpack` pour partager du contenu.
- Identifiants basés sur le contenu (déduplication SHA-256).

### Audio
- Paysages sonores ambiants avec plusieurs thèmes.
- Sons de clavier mécanique (5 thèmes, 8 variations chacun).
- Contrôles de volume par canal (ambiance, clavier, interface utilisateur).
- Mettre en sourdine/Activer le son depuis la barre de titre.

### Accessibilité
- Navigation complète au clavier.
- Prise en charge des thèmes à contraste élevé.
- Option de réduction des animations.
- Propriétés d'accessibilité sur tous les éléments interactifs.

### Persistance
- Profil avec XP, niveaux et notations par langage.
- Paramètres et sélection de la langue enregistrés entre les sessions.
- Historique des sessions (jusqu'à 500 enregistrements) avec compression mensuelle.
- Configurations d'entraînement : ensembles de paramètres nommés pour l'optimisation du moteur.

## Installation

### Microsoft Store (recommandé)
Bientôt disponible — en attente de certification par la boutique.

### Compilation à partir du code source

**Prérequis :**
- Windows 10 version 1809+ ou Windows 11
- .NET 10.0 SDK
- Visual Studio 2022 (avec la charge de travail Windows App SDK) — ou CLI

```bash
git clone https://github.com/mcp-tool-shop-org/dev-op-typer.git
cd dev-op-typer
dotnet build DevOpTyper/DevOpTyper.csproj -c Release -p:Platform=x64
```

Exécutez l'exécutable compilé :
```
DevOpTyper\bin\x64\Release\net10.0-windows10.0.19041.0\DevOpTyper.exe
```

## Structure du projet

```
DevOpTyper/
├── Assets/
│   ├── Icons/         # App icons and Store tile assets
│   ├── Snippets/      # JSON snippet packs by language
│   └── Sounds/        # Ambient and SFX audio files
├── Controls/          # Custom controls (CodeRenderer, TypingPresenter)
├── Models/            # Data models (Profile, Snippet, AppSettings, etc.)
├── Panels/            # UI panels (Typing, Stats, Settings, Explanation, etc.)
├── Services/          # Core services (Audio, Typing, Persistence, Content)
├── Themes/            # Color and high-contrast themes
├── MainWindow.xaml    # Main application window
└── Package.appxmanifest  # MSIX packaging manifest
external/
└── meta-content-system/  # Shared content library (submodule)
```

## Raccourcis clavier

| Key | Action |
|-----| -------- |
| Tab / Maj+Tab | Navigation des contrôles |
| Enter | Démarrer un nouveau test |
| Échap | Réinitialiser le test en cours |

## Ajouter votre propre code

Il existe trois façons de pratiquer avec votre propre code :

### Option 1 : Coller du code (la plus simple)

1. Ouvrez le panneau **Paramètres** (cliquez sur ⚙ dans la barre de titre).
2. Faites défiler jusqu'à **Coller du code**.
3. Collez n'importe quel extrait de code dans la zone de texte.
4. Cliquez sur **Ajouter** — le langage est détecté automatiquement.
5. Votre code apparaît immédiatement dans la rotation des extraits.

### Option 2 : Importer un fichier ou un dossier

1. Ouvrez **Paramètres** → faites défiler jusqu'à **Importer**
2. Cliquez sur **Importer un fichier** pour ajouter un seul fichier source, ou sur **Importer un dossier** pour analyser un projet entier.
3. L'application détecte automatiquement la langue en fonction des extensions de fichier (`.py`, `.js`, `.cs`, `.java`, `.sql`, `.sh`).
4. Le code importé est dédupliqué en fonction de la somme de contrôle du contenu : le même code n'est jamais ajouté deux fois.

### Option 3 : Créer un ensemble de snippets (JSON)

Pour des ensembles de snippets d'entraînement sélectionnés :

1. Ouvrez le dossier de vos snippets utilisateur :
```
%LocalAppData%\DevOpTyper\UserSnippets\
```
(ou cliquez sur **Ouvrir le dossier des snippets** dans les paramètres)

2. Créez un fichier JSON nommé d'après le langage (par exemple, `python.json`) :
```json
{
"language": "python",
"snippets": [
{
"id": "my_list_comp",
"title": "List comprehension",
"difficulty": 3,
"topics": ["lists", "comprehension"],
"code": "squares = [x**2 for x in range(10)]\n"
},
{
"id": "my_dict_comp",
"title": "Dictionary comprehension",
"difficulty": 4,
"topics": ["dicts", "comprehension"],
"code": "counts = {word: len(word) for word in words}\n"
}
]
}
```

3. Redémarrez l'application : vos snippets apparaîtront aux côtés de ceux intégrés.

**Conseils :**
- `id` doit être unique pour tous les ensembles.
- `difficulty` varie de 1 (facile) à 7 (difficile).
- `code` doit se terminer par `\n`.
- Vous pouvez organiser les ensembles dans des sous-répertoires d'un seul niveau.

### Partage de contenu

Exportez vos snippets personnalisés sous forme de fichier `.ldtpack` portable :

1. Ouvrez **Paramètres** → cliquez sur **Exporter le fichier**.
2. Partagez le fichier `.ldtpack` avec d'autres.
3. Ils l'importent via **Paramètres** → **Importer le fichier**.

Seul le contenu créé par l'utilisateur est partagé, jamais l'historique des exercices ou les paramètres.

## Confidentialité

Dev-Op-Typer fonctionne entièrement hors ligne. Aucune donnée n'est collectée, transmise ou partagée. Consultez [PRIVACY.md](PRIVACY.md).

## Licence

[MIT](LICENSE)
