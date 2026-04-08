<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/feature-reacher/readme.png" alt="Feature-Reacher" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/feature-reacher/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/feature-reacher/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Identifiez les fonctionnalités sous-utilisées avant qu'elles ne deviennent une dette technique.**

Feature-Reacher analyse les éléments de votre produit (notes de version, documentation, FAQ) et produit un **audit des risques d'adoption (du produit)**, une liste classée et étayée par des preuves, des fonctionnalités que les utilisateurs risquent de ne jamais découvrir.

---

## Ce qu'est cet outil :

Un outil de diagnostic qui :
- Importe la documentation du produit et les notes de version.
- Extrait les mentions de fonctionnalités avec des preuves.
- Évalue les fonctionnalités en fonction de leur nouveauté, de leur visibilité et de la densité de la documentation.
- Fournit des diagnostics précis des risques d'adoption.

## Ce que cet outil N'EST PAS :

- Une plateforme d'analyse (pas d'importation de données d'utilisation).
- Un système de gestion des fonctionnalités (feature flags).
- Un tableau de bord connecté à votre code source.
- Une intelligence artificielle qui devine ce que les utilisateurs veulent.

Il s'agit d'une **intelligence explicable** : chaque diagnostic est accompagné de preuves citées et d'une explication claire.

---

## Ce que la phase 1 offre :

- **Téléchargement des éléments :** Collez du texte ou téléchargez des fichiers .txt/.md.
- **Extraction des fonctionnalités :** Titres, listes à puces, phrases répétées.
- **Critères de notation :** Décroissance de la nouveauté, signaux de visibilité, densité de la documentation.
- **Moteur de diagnostic :** 6 types de diagnostics avec signaux de déclenchement et preuves.
- **Audit classé :** Fonctionnalités classées par ordre de risque d'adoption.
- **Recommandations d'actions :** Actions pouvant être copiées pour chaque diagnostic.
- **Exportation :** Rapports en texte brut et en HTML imprimable.

## Ce que la phase 2 ajoute (répétabilité et rétention) :

- **Historique des audits :** Tous les audits sont enregistrés dans IndexedDB, avec possibilité de parcourir, renommer et supprimer.
- **Bouton de sauvegarde automatique :** Effectuez des audits une fois et enregistrez-les automatiquement (ou manuellement).
- **Ensembles d'éléments :** Collections nommées pour les flux de travail d'audit répétitifs.
- **Comparaison des audits :** Différentiel côte à côte montrant les risques nouveaux/résolus, les modifications des diagnostics.
- **Tendances des fonctionnalités :** Visualisation graphique de l'évolution du risque au fil du temps.
- **Résumé pour les partenaires :** Résumé basé sur des modèles pour le partage avec les partenaires (sans IA).
- **Suite de tests :** Jest + ts-jest avec tests de sécurité.

## Ce que la phase 3 ajoute (prêt pour le marché) :

- **Page d'accueil publique :** `/landing` avec les avantages et les appels à l'action.
- **Mode démo :** `/demo` charge automatiquement des données d'exemple pour une expérience instantanée.
- **Pages légales :** Politique de confidentialité, conditions d'utilisation, coordonnées du service d'assistance.
- **Panneau de gestion des données :** Transparence concernant le stockage local avec option de suppression.
- **Visite guidée :** Visite guidée en 4 étapes pour les nouveaux utilisateurs.
- **Page de méthodologie :** `/methodology` explique les critères de notation (sans jargon d'IA).
- **Gestion des erreurs :** Interface utilisateur résistante aux plantages avec exportation des diagnostics.
- **Outils d'accessibilité :** Navigation au clavier, assistants ARIA, prise en charge des lecteurs d'écran.
- **Ressources pour le marché :** Texte pour la fiche produit, documents PDF, liste de contrôle de soumission.

## Ce que cet outil ne fait PAS intentionnellement :

- Se connecter à des plateformes d'analyse.
- S'intégrer à GitHub, Jira ou d'autres outils.
- Utiliser des modèles d'apprentissage automatique pour la détection des fonctionnalités.
- Fournir une surveillance en temps réel.
- Nécessiter une authentification ou des comptes.
- Utiliser l'IA pour la génération de texte (seuls des modèles déterministes sont utilisés).

C'est par conception. La phase 3 prouve la préparation au marché avant d'ajouter des intégrations.

---

## Comment commencer :

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

### Test rapide :

1. Collez des notes de version ou de la documentation.
2. Cliquez sur "Exécuter l'audit".
3. Examinez la liste des fonctionnalités classées.
4. Développez les fonctionnalités pour voir les preuves et les recommandations.
5. Exportez le rapport.

### Flux de travail de la phase 2 :

**Flux de répétabilité :**
1. Exécutez un audit → enregistré automatiquement dans l'historique.
2. Allez à `/history` pour parcourir les audits enregistrés.
3. Enregistrez un ensemble d'éléments pour les exécutions répétées.
4. Comparez deux audits à `/compare`.
5. Visualisez les tendances à `/trends`.

**Flux de partage avec les partenaires :**
1. Exécutez un audit → cliquez sur "Exporter" → "Résumé exécutif".
2. Ou comparez deux audits → "Exporter le rapport de comparaison".

---

## Structure du projet

```
/src/app       # Next.js app router pages
/src/domain    # Core feature model and business logic
/src/analysis  # Diagnostics, heuristics, scoring, diff, trend
/src/storage   # IndexedDB persistence layer
/src/ui        # Reusable UI components
/tests         # Jest test suite
/docs          # Project documentation
```

### Fichiers clés

- `src/domain/feature.ts` - Modèle de fonctionnalité standard.
- `src/domain/diagnosis.ts` - Types de diagnostic et gravité.
- `src/analysis/extractor.ts` - Heuristiques d'extraction de fonctionnalités.
- `src/analysis/scoring.ts` - Notation de la récence et de la visibilité.
- `src/analysis/diagnose.ts` - Moteur de diagnostic.
- `src/analysis/ranking.ts` - Classement des risques et génération de rapports d'audit.
- `src/analysis/actions.ts` - Recommandations d'actions.
- `src/analysis/export.ts` - Génération de rapports et narration pour la direction.
- `src/analysis/diff.ts` - Moteur de comparaison d'audits.
- `src/analysis/trend.ts` - Analyse des tendances des fonctionnalités.
- `src/storage/types.ts` - Types de persistance.
- `src/storage/indexeddb.ts` - Implémentation d'IndexedDB.

---

## Architecture

```
Artifact Upload → Text Normalization → Feature Extraction
                                              ↓
                                       Evidence Linking
                                              ↓
                                    Heuristic Scoring
                                              ↓
                                    Diagnosis Generation
                                              ↓
                                      Risk Ranking
                                              ↓
                                    Audit Report + Actions
```

### Principes de conception

1. **Pas de "magie"**: Chaque diagnostic est explicable avec des preuves citées.
2. **Heuristiques en premier**: Pas d'apprentissage automatique tant que les heuristiques ne s'avèrent pas insuffisantes.
3. **Déterministe**: La même entrée produit toujours la même sortie.
4. **Transparent**: Les utilisateurs peuvent retracer toute conclusion jusqu'à sa source.

---

## Licence

MIT

---

## Étiquettes de version

```bash
git checkout phase-1-foundation    # Phase 1: Core diagnostic engine
git checkout phase-2-repeatability # Phase 2: Persistence, compare, trends
git checkout phase-3-marketplace   # Phase 3: Marketplace-ready packaging
git checkout phase-3.5-teams-tab   # Phase 3.5: Teams tab integration
```

## Exécution des tests

```bash
npm test
```

Les tests vérifient les limites : les scores de risque sont compris entre 0 et 1, les identifiants d'audit sont formatés correctement, et les cas limites sont gérés de manière élégante.
