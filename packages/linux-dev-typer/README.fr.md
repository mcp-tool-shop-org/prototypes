<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/linux-dev-typer/readme.png" alt="Linux Dev Typer logo" width="400"></p>

# linux-dev-typer

> Fait partie de [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml/badge.svg" alt="CI"></a>
  <a href="https://www.nuget.org/packages/LinuxDevTyper.Core"><img src="https://img.shields.io/nuget/v/LinuxDevTyper.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/linux-dev-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Entraînement à la saisie de code pour les développeurs — Interface utilisateur Avalonia, difficulté adaptative, suivi des tendances, détection de la fatigue.**

> Disponible également sous forme d'application Windows native : [dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) (WinUI 3, Microsoft Store)

---

## Pourquoi Linux Dev Typer ?

- **Entraînez-vous avec du code réel, pas de simples textes.** Chaque extrait est un motif réel provenant de Python, Rust, JavaScript, C# ou Java, et non de la phrase "Le rapide renard brun".
- **Difficulté adaptative.** Un système de notation inspiré d'Elo s'adapte à votre niveau de compétence pour chaque langage, avec une protection contre les fluctuations et une détection de la zone de confort.
- **Conscient des faiblesses.** Des cartes thermiques des erreurs par caractère et des paires de confusion guident la sélection des extraits afin que vous pratiquiez ce qui vous pose réellement problème.
- **Conscient de la fatigue.** Le moteur détecte une baisse de performance et suggère des pauses avant que de mauvaises habitudes ne s'installent.
- **Multiplateforme.** Construit sur Avalonia UI, il fonctionne sur Linux, macOS et Windows à partir d'une seule base de code.
- **Totalement hors ligne.** Pas de télémétrie, pas de comptes, pas d'appels réseau. Vos données de saisie restent sur votre machine.
- **Extensible.** Le moteur principal est fourni sous forme de package NuGet autonome avec zéro dépendance d'interface utilisateur.

---

## Packages NuGet

| Package | Description |
| --------- | ------------- |
| [`LinuxDevTyper.Core`](https://www.nuget.org/packages/LinuxDevTyper.Core) | Moteur d'entraînement à la saisie portable avec notation Elo, difficulté adaptative, cartes thermiques des faiblesses, détection de la fatigue, planification des sessions et micro-exercices. Zéro dépendance d'interface utilisateur. |

Le moteur principal est une bibliothèque autonome sans dépendances Avalonia ni plateforme. Implémentez `IStorage`, `IAudioService` et `IAssetProvider` pour votre plateforme et vous aurez un entraîneur de saisie complet.

---

## Fonctionnalités

### Moteur de saisie principal
- Feedback par caractère : correct (vert clair), erreurs (rouge + souligné), non saisi (atténué)
- Statistiques en direct : mots par minute (WPM), précision, nombre d'erreurs, XP
- Système de notation par langage inspiré d'Elo
- Progression de niveau avec XP et augmentation de la difficulté
- Cartes de complétion avec explications des extraits
- Configurable : taille de la police, règles des espaces, normalisation des fins de ligne

### Apprentissage adaptatif
- Suivi des erreurs par caractère avec classification des symboles (10 catégories)
- Profilage des faiblesses entre les sessions avec sélection adaptative des extraits
- Suivi des tendances : tendances en évolution des mots par minute et de la précision par langage
- Difficulté adaptative avec détection de la zone de confort et protection contre les fluctuations
- Informations post-session : meilleurs scores personnels, étapes importantes, signaux de tendance
- Détection de la fatigue avec suggestions de pauses
- Mode hardcore : corrigez chaque erreur avant de passer à l'étape suivante

### Réflexion et intention
- Sélecteur d'intention de pratique : étiquetez les sessions comme Échauffement, Exercice, Exploration ou Défi
- Notes de session et navigateur de sessions avec recherche/filtre
- Détection de la reprise de session avec salutations contextuelles et vieillissement automatique de la difficulté
- Ignorer les suggestions du système : annuler les blocages de fluctuation, les types d'informations et les alertes de fatigue
- Compression mensuelle de l'historique pour les sessions dépassant 200
- Indices d'orientation : suggestions douces avant chaque session basées sur le contenu
- Détection des plateaux avec encouragement
- Contrôles de personnalisation : gel de l'apprentissage, réinitialisation des préférences

### Système de contenu
- Packs d'extraits utilisateur : déposez des fichiers JSON dans `~/.config/linux-dev-typer/packs/`
- Profils de pratique : ensembles de paramètres nommés qui ajustent le comportement du moteur
- Importation/exportation de bundles `.ldtpack` pour le partage de contenu
- Coller du code, importer un fichier, importer un dossier avec détection automatique du langage
- Identifiants basés sur le contenu (déduplication SHA-256)
- Pipeline canonique unifié : tout le contenu est importé en tant qu'objet CodeItem avec une difficulté basée sur des métriques (D1–D7)

### Enseignement et communauté
- Context d'apprentissage progressif avec des niveaux de complexité optionnels.
- Variantes : implémentations alternatives présentées comme des options équivalentes.
- Notes de la communauté : conseils et perspectives optionnels dans les fichiers `.ldtpack`.
- Indicateur de difficulté (uniquement pour affichage) basé sur les contributions de la communauté.
- Conçu pour être anonyme : le contenu importé est indiscernable du contenu local.
- Toutes les fonctionnalités d'apprentissage et de communauté sont optionnelles et ne sont que pour affichage.

### Pratique structurée
- 168 extraits de code pour l'étalonnage, couvrant 5 langues (D1 à D7).
- Planificateur de session : mélange cible (50 %) / révision (30 %) / perfectionnement (20 %).
- Détection des lacunes avec une fenêtre de temps décroissante.
- Transparence de la sélection : "Pourquoi cet extrait ?" explique chaque choix.
- Carte thermique des erreurs par caractère, avec paires de confusion.
- Suivi de l'évolution des lacunes : captures d'écran quotidiennes pour suivre les progrès.

### Pratique guidée
- Mode guidé : option permettant aux signaux de lacunes d'influencer la sélection.
- Biais de lacune : biais limité par catégorie (+0 à +3, ne modifie jamais la difficulté).
- Micro-exercices : sessions de pratique ciblées sur les lacunes principales (5 éléments).
- Politique de signalisation : architecture basée sur des indicateurs avec un interrupteur principal et des sous-indicateurs par fonctionnalité.
- Gestion de l'espace de stockage : la carte thermique est limitée à 200 caractères, les paires de confusion à 20, les captures d'écran à 90.
- Par défaut, désactivé : tout le comportement précédent est conservé, sauf si l'option est explicitement activée.

### Audio
- 5 thèmes de sons de clavier (8 variations chacun).
- 4 catégories de paysages sonores ambiants (15 pistes au total).
- Contrôles de volume par canal et mise en sourdine.

### Accessibilité
- Interface utilisateur axée sur le clavier, avec contours de focus visibles.
- Mode à faible stimulation sensorielle (réduit les volumes audio).
- Thème sombre à contraste élevé.

---

## Démarrage rapide

**Prérequis :** [.NET SDK 8.x](https://dotnet.microsoft.com/download/dotnet/8.0)

```bash
git clone https://github.com/mcp-tool-shop-org/linux-dev-typer.git
cd linux-dev-typer
dotnet restore
dotnet build -c Release
dotnet run --project src/LinuxDevTyper.App/LinuxDevTyper.App.csproj
```

---

## Exécuter les tests

```bash
dotnet test
```

817 tests couvrant tous les modules principaux du moteur.

---

## Structure du projet

| Path | Objectif |
| ------ | --------- |
| `src/LinuxDevTyper.Core` | Moteur portable : saisie, notation, tendances, difficulté, profils, communauté, pédagogie, étalonnage, planificateur, lacunes, carte thermique, mode guidé. |
| `src/LinuxDevTyper.Core.Tests` | Tests xUnit (817 tests) |
| `src/LinuxDevTyper.App` | Interface utilisateur de bureau Avalonia : UI, services de plateforme, importation/exportation. |
| `assets/snippets` | Packs d'extraits JSON intégrés. |
| `assets/sounds` | Fichiers WAV (ambiance + effets sonores de clavier). |
| `lib/meta-content-system` | Bibliothèque de contenu partagé. |
| `docs/` | Documentation de l'architecture et du schéma, plans de phase, guides d'extension. |

---

## Persistance

Fichier d'état : `~/.config/linux-dev-typer/state.json` (schéma v12)

Pour réinitialiser : `rm -rf ~/.config/linux-dev-typer`

---

## Ajouter son propre code

Il existe trois façons de pratiquer avec son propre code :

### Option 1 : Coller du code (la plus simple)

1. Ouvrir la barre latérale (cliquer sur l'icône d'engrenage).
2. Trouver la section **Coller du code**.
3. Coller un extrait de code dans la zone de texte.
4. Cliquer sur **Ajouter** – le langage est détecté automatiquement.
5. Votre code apparaît immédiatement dans la rotation des extraits.

### Option 2 : Importer un fichier ou un dossier

1. Ouvrir la barre latérale → trouver **Importer**.
2. Cliquer sur **Importer un fichier** pour ajouter un seul fichier source, ou sur **Importer un dossier** pour analyser un projet entier.
3. L'application détecte automatiquement le langage à partir des extensions de fichier (`.py`, `.rs`, `.js`, `.cs`, `.java`, `.sh`).
4. Le code importé est dédupliqué par hachage de contenu – le même code n'est jamais ajouté deux fois.

### Option 3 : Créer un pack d'extraits (JSON)

Pour créer des ensembles d'extraits de code pour la pratique :

1. Créer un fichier JSON dans le dossier des packs :
```
~/.config/linux-dev-typer/packs/
```

2. Nommez-le en fonction du langage (par exemple, `python.json`) :
```json
{
"language": "python",
"snippets": [
{
"id": "my_list_comp",
"title": "Compréhension de liste",
"difficulty": 3,
"topics": ["listes", "compréhension"],
"code": "squares = [x**2 for x in range(10)]\n"
},
{
"id": "my_dict_comp",
"title": "Compréhension de dictionnaire",
"difficulty": 4,
"topics": ["dictionnaires", "compréhension"],
"code": "counts = {word: len(word) for word in words}\n"
}
]
}
```

3. Redémarrez l'application. Vos extraits seront fusionnés avec ceux intégrés et pourront être activés/désactivés depuis la barre latérale.

**Conseils :**
- L'identifiant (`id`) doit être unique pour tous les ensembles.
- La difficulté (`difficulty`) varie de 1 (facile) à 7 (difficile).
- Le code (`code`) doit se terminer par `\n`.
- Les ensembles d'utilisateurs peuvent être activés/désactivés sans supprimer le fichier.

### Partage de contenu

Exportez vos extraits personnalisés sous forme de fichier `.ldtpack` portable :

1. Ouvrez la barre latérale → cliquez sur **Exporter**.
2. Partagez le fichier `.ldtpack` avec d'autres.
3. Ils l'importent via la barre latérale → **Importer**.

Seul le contenu créé par l'utilisateur est transmis. L'historique et les paramètres ne sont jamais enregistrés.

---

## Confidentialité

linux-dev-typer fonctionne entièrement hors ligne. Aucune donnée n'est collectée, transmise ou partagée.

## Licence

[MIT](LICENSE)
