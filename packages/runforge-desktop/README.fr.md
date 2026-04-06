<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/runforge-desktop/readme.png" alt="RunForge Desktop" width="400"></p>

<h1 align="center">RunForge Desktop</h1>

<p align="center">
  <a href="https://www.nuget.org/packages/RunForgeDesktop.Core"><img src="https://img.shields.io/nuget/v/RunForgeDesktop.Core?label=RunForgeDesktop.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://github.com/mcp-tool-shop-org/runforge-desktop/releases"><img src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?logo=windows" alt="Platform"></a>
  <a href="https://mcp-tool-shop-org.github.io/runforge-desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**RunForge Desktop** est une application de bureau native pour Windows, conçue pour créer, surveiller et inspecter les exécutions d'apprentissage automatique (ML).

Elle offre une interface visuelle pour les expériences d'apprentissage automatique : création d'exécutions, suivi de la progression de l'apprentissage en temps réel avec des graphiques, et consultation des exécutions terminées avec une inspection complète des artefacts.

> **Source principale (artefacts, schémas, garanties) :**
> https://github.com/mcp-tool-shop-org/runforge-vscode

---

## Pourquoi ?

La plupart des outils de suivi d'expériences d'apprentissage automatique sont des plateformes SaaS basées sur le cloud, qui nécessitent des comptes, envoient des données télémétriques et ajoutent de la complexité. RunForge Desktop adopte une approche différente : **tout fonctionne localement sur votre machine**.

Avec RunForge Desktop, vous pouvez :

- **Créer** des exécutions d'apprentissage avec des configurations prédéfinies.
- **Surveiller** l'apprentissage en temps réel avec des graphiques et des journaux.
- **Consulter** les exécutions terminées et leurs résultats.
- **Examiner** les métriques, les journaux et les artefacts.
- **Gérer** les exécutions (annuler, afficher les résultats, copier les commandes).

Toutes les exécutions d'apprentissage s'exécutent localement sur votre machine en utilisant Python. Pas de cloud. Pas de télémétrie. Pas de comptes.

---

## Paquets NuGet

| Paquet | Description |
| --------- | ------------- |
| [RunForgeDesktop.Core](https://www.nuget.org/packages/RunForgeDesktop.Core) | Modèles et services principaux pour la gestion des exécutions d'apprentissage automatique : cycle de vie, exploration d'hyperparamètres, surveillance en direct et inspection des artefacts. |

```bash
dotnet add package RunForgeDesktop.Core
```

---

## Démarrage rapide

### Installation

**Option 1 : Paquet MSIX (recommandé)**
1. Téléchargez le fichier `.msix` depuis [Releases](https://github.com/mcp-tool-shop-org/runforge-desktop/releases)
2. Double-cliquez pour installer.
3. Lancez l'application depuis le menu Démarrer.

**Option 2 : Compilation à partir du code source**
```powershell
git clone https://github.com/mcp-tool-shop-org/runforge-desktop
cd runforge-desktop
dotnet run --project src/RunForgeDesktop/RunForgeDesktop.csproj
```

Consultez [docs/INSTALL.md](docs/INSTALL.md) pour les options d'installation détaillées.

### Utilisation

1. **Lancez** RunForge Desktop.
2. **Sélectionnez l'espace de travail** : cliquez sur "Sélectionner l'espace de travail" et choisissez un dossier pour vos expériences d'apprentissage automatique.
3. **Démarrez l'apprentissage** : cliquez sur "Entraîner" pour configurer et lancer une exécution d'apprentissage.
4. **Surveillez en direct** : suivez la progression de l'apprentissage avec des graphiques de perte en temps réel et des journaux.
5. **Consultez les exécutions** : affichez toutes les exécutions avec un filtrage par statut.
6. **Examinez les détails** : cliquez sur n'importe quelle exécution pour afficher les métriques, les artefacts et les résultats.

---

## Fonctionnalités

### Création d'exécutions d'apprentissage
- Configurez les exécutions d'apprentissage avec des configurations prédéfinies (Rapide, Standard, Étendue, Personnalisée).
- Sélection du périphérique GPU/CPU avec détection automatique.
- Paramètres avancés : taille du lot, taux d'apprentissage, optimiseur, planificateur.
- Chemin d'accès facultatif à un jeu de données personnalisé.

### Exploration d'hyperparamètres (MultiRun)
- Exécutez plusieurs expériences avec différentes combinaisons d'hyperparamètres.
- Configurez les taux d'apprentissage, les tailles de lot et les optimiseurs sous forme de listes séparées par des virgules.
- Recherche automatique de grille sur toutes les combinaisons.
- Suivez la configuration la plus performante en fonction de la perte finale.

### Surveillance en direct
- Graphique de perte en temps réel avec mises à jour automatiques.
- Flux de journaux en direct du processus d'apprentissage.
- Suivi de la progression (époque, étape, temps écoulé).
- Possibilité d'annuler une exécution d'apprentissage en cours à tout moment.

### Consultation des exécutions
- Consultez les exécutions avec un ordre "le plus récent en premier".
- Filtrez par statut : En attente, En cours, Terminée, Échouée, Annulée.
- Affichez les détails et les résultats de l'exécution.

### Examen des exécutions
- **Métriques** : courbes de perte, précision, statistiques d'apprentissage.
- **Journaux** : sortie standard/erreur standard complète du processus d'apprentissage.
- **Artefacts** : ouvrez le dossier de sortie, copiez la commande d'apprentissage.

### Diagnostic
- Affichez la version de l'application, le framework et l'utilisation de la mémoire.
- Affichez le chemin d'accès à l'espace de travail et la configuration de Python.
- Copiez les informations de diagnostic dans le presse-papiers pour le support.

---

## Principes fondamentaux

### Priorité à l'utilisation locale
Toutes les exécutions d'apprentissage se font sur votre machine. Pas de cloud requis.

### Transparent
Voyez exactement ce qui se passe : journaux en direct, métriques en temps réel, contrôle total du processus.

### Simple
Un espace de travail, des paramètres prédéfinis clairs, pas de fichiers de configuration à gérer.

### Auditable
Tous les artefacts d'exécution sont enregistrés sur le disque pour inspection et reproductibilité.

---

## Fonctionnement

```
RunForge Desktop
  │
  ├── Select Workspace (any folder)
  │
  ├── Create Run (preset + device + optional dataset)
  │
  ├── Spawn Python training process
  │
  ▼
.ml/
  └── runs/
      └── 20240101-123456-myrun-abc1/
          ├── run.json       (manifest)
          ├── metrics.jsonl  (live metrics)
          ├── stdout.log     (live logs)
          └── stderr.log     (errors)
```

RunForge Desktop gère l'ensemble du cycle de vie : création, exécution, surveillance et inspection.

---

## Configuration requise

| Exigence | Value |
| ------------- | ------- |
| OS | Windows 10 (1809+) ou Windows 11 |
| Architecture | x64 |
| Runtime | .NET 10 (inclus dans MSIX) |
| Python | 3.10+ (pour l'apprentissage) |
| GPU | Optionnel (CUDA pour l'apprentissage sur GPU) |
| Espace disque | ~100 Mo |

---

## Plateforme et emballage

| Attribut | Value |
| ----------- | ------- |
| Plateforme | Windows 10/11 |
| Framework d'interface utilisateur | .NET MAUI |
| Emballage | MSIX (autonome) |
| Installation/désinstallation | Propre, isolé, réversible |

L'application suit les modèles de permissions standard de Windows pour l'accès aux fichiers.

---

## Statut du projet

| Attribut | Value |
| ----------- | ------- |
| Version actuelle | v1.0.0 |
| Scope | Apprentissage, surveillance et inspection de modèles ML |

Consultez [RELEASE_NOTES_v0.4.0.md](RELEASE_NOTES_v0.4.0.md) pour les modifications récentes.

---

## Développement

### Prérequis

- SDK .NET 10
- Windows 10/11
- Visual Studio 2022 (17.12+) avec la charge de travail MAUI, OU VS Code avec l'extension .NET MAUI

### Compilation

```powershell
# Debug build
dotnet build

# Run tests
dotnet test

# Release build
.\scripts\build-release.cmd
```

### Structure du projet

```
runforge-desktop/
├── src/
│   ├── RunForgeDesktop/          # MAUI app (UI, ViewModels)
│   └── RunForgeDesktop.Core/     # Core services, models
├── tests/
│   └── RunForgeDesktop.Core.Tests/
├── docs/
│   ├── PHASE-DESKTOP-0.1-ACCEPTANCE.md
│   └── INSTALL.md
└── scripts/
    ├── build-msix.ps1
    └── build-release.cmd
```

---

## Relation avec RunForge Core

Tous les schémas, garanties et formats d'artefacts sont définis et figés dans :

> https://github.com/mcp-tool-shop-org/runforge-vscode

Ce dépôt contient :
- Aucune logique d'apprentissage
- Aucune définition de schéma
- Aucune propriété de contrat

RunForge Desktop **utilise** ces artefacts de manière fidèle.

---

## Public cible

- Développeurs entraînant des modèles localement sur Windows
- Chercheurs qui ont besoin d'un suivi d'expériences simple et inspectable
- Toute personne qui souhaite une interface utilisateur Windows native pour l'apprentissage de modèles ML
- Équipes qui souhaitent des flux de travail ML locaux, sans cloud

---

## Licence

Licence MIT - Consultez [LICENSE](LICENSE) pour plus de détails.

---

## Tests de fiabilité

RunForge est fourni avec une suite de tests de fiabilité reproductible que vous pouvez exécuter localement pour valider la mise en file d'attente, la mise en pause/reprise, l'annulation, la récupération en cas de plantage, l'équité, la résilience aux dérives de disque et le comportement de reconnexion au bureau.

| Test | Focus |
| ---------- | ------- |
| G1 | Application stricte de la limite de parallélisme |
| G2 | Pause/reprise |
| G3 | Déterminisme de l'annulation |
| G4 | Récupération en cas de plantage |
| G5 | Planification équitable |
| G6 | Résilience aux dérives de disque |
| G7 | Reconnexion au bureau |
| G8-G10 | Prise en charge des GPU (v0.4.0+) |

Consultez : [`docs/GAUNTLETS.md`](docs/GAUNTLETS.md)

---

## Contributions

Les contributions sont les bienvenues. Veuillez respecter les principes fondamentaux :

- Gardez-le simple et axé sur le local
- Aucune dépendance cloud ni télémétrie
- Messages d'erreur clairs et exploitables

---

## Support

- **Problèmes signalés :** [GitHub Issues](https://github.com/mcp-tool-shop-org/runforge-desktop/issues)
- **Diagnostic :** Utilisez la page de diagnostic pour copier les informations système et les inclure dans vos rapports de bugs.
