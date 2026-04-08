<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/ai-ui/main/assets/logo-ai-ui.png" alt="AI-UI" width="600" />
</p>

**Diagnostic automatisé de la conception pour les SPA.** AI-UI analyse votre application en cours d'exécution, lit votre documentation et vous indique précisément quelles fonctionnalités documentées n'ont pas de point d'entrée visible dans l'interface utilisateur, et quelles parties de l'interface utilisateur ne sont pas documentées du tout.

Il ne fait pas de suppositions. Il crée un graphe de déclencheurs à partir des interactions réelles du navigateur, associe les fonctionnalités aux déclencheurs de manière déterministe et génère une carte de conception avec des verdicts exploitables : à afficher, à déprécier, à conserver, à fusionner. Ensuite, il vérifie la correction.

## Ce qu'elle fait

```
README says "ambient soundscapes"  →  atlas extracts the feature
Probe clicks every button           →  "Audio Settings" trigger found
Diff matches feature to trigger     →  coverage: 64%
Design-map says: must-surface 0     →  all documented features are discoverable
```

AI-UI comble le fossé entre les promesses de la documentation et la réalité de l'interface utilisateur.

## Installation

```bash
git clone https://github.com/mcp-tool-shop-org/ai-ui.git
cd ai-ui
npm install
```

Nécessite Node.js 20+ et un serveur de développement en cours d'exécution pour les commandes probe/runtime-effects.

## Démarrage rapide

```bash
# 1. Parse your docs into a feature catalog
ai-ui atlas

# 2. Crawl your running app
ai-ui probe

# 3. Match features to triggers
ai-ui diff

# Or run all three in sequence:
ai-ui stage0
```

La sortie se trouve dans le répertoire `ai-ui-output/`. Le rapport de différences vous indique ce qui correspond, ce qui manque et ce qui n'est pas documenté.

## Commandes

| Commande | Ce qu'elle fait |
|---------|-------------|
| `atlas` | Analyse de la documentation (README, CHANGELOG, etc.) pour créer un catalogue de fonctionnalités. |
| `probe` | Analyse de l'interface utilisateur en cours d'exécution, enregistrement de chaque déclencheur interactif. |
| `surfaces` | Extraction des éléments d'interface utilisateur à partir d'une capture WebSketch. |
| `diff` | Association des fonctionnalités de l'atlas aux déclencheurs de la sonde. |
| `graph` | Création d'un graphe de déclencheurs à partir de la sonde + des éléments d'interface utilisateur + des différences. |
| `design-map` | Génération d'un inventaire des éléments d'interface utilisateur, d'une carte des fonctionnalités, des flux de tâches et d'une proposition d'architecture de l'information. |
| `compose` | Génération d'un plan d'affichage à partir des différences et du graphe. |
| `verify` | Évaluation des artefacts du pipeline : verdict "réussi/échoué" pour l'intégration continue. |
| `baseline` | Sauvegarde/comparaison des bases de référence de vérification. |
| `pr-comment` | Génération d'un commentaire Markdown prêt pour une demande de fusion à partir des artefacts. |
| `runtime-effects` | Clique sur les déclencheurs dans un navigateur réel, capture des effets secondaires observés. |
| `runtime-coverage` | Matrice de couverture par déclencheur (sondé / affiché / observé). |
| `replay-pack` | Regroupement de tous les artefacts dans un paquet de relecture reproductible. |
| `replay-diff` | Comparaison de deux paquets de relecture : affichage des modifications et de leurs raisons. |
| `ai-suggest` | Associer les fonctionnalités documentées aux éléments de l'interface utilisateur en utilisant Ollama (Cerveau). |
| `ai-eyes` | Identifier visuellement les éléments qui ne comportent que des icônes ou qui ont peu de texte, en utilisant LLaVA (Yeux). |
| `ai-hands` | Générer des correctifs prêts à être intégrés dans les demandes de modification (pull requests) pour combler les lacunes, en utilisant qwen2.5-coder (Mains). |
| `stage0` | Exécution de l'atlas + de la sonde + des différences dans une séquence. |
| `init-memory` | Création de fichiers mémoire vides pour le suivi des décisions. |

## Configuration

Créez un fichier `ai-ui.config.json` à la racine de votre projet :

```json
{
  "docs": { "globs": ["README.md", "CHANGELOG.md", "docs/*.md"] },
  "probe": {
    "baseUrl": "http://localhost:5173",
    "routes": ["/", "/settings", "/dashboard"]
  },
  "featureAliases": {
    "dark-mode-support": ["Theme", "Dark mode"]
  },
  "goalRules": [
    { "id": "settings_open", "label": "Open Settings", "kind": "domEffect", "dom": { "textRegex": "Settings" }, "score": 2 }
  ]
}
```

Tous les champs sont facultatifs ; des valeurs par défaut raisonnables sont appliquées. Consultez `cli/src/config.mjs` pour le schéma complet.

### Règles de but

Pour les SPA où les URL ne changent pas, les objectifs basés sur les routes sont inutiles. Les règles de but vous permettent de définir le succès en termes d'effets observables :

| Type | Correspondances | Exemple |
|------|---------|---------|
| `storageWrite` | Écritures dans localStorage/sessionStorage | `{ "keyRegex": "^user\\.prefs\\." }` |
| `fetch` | Requêtes HTTP par méthode/URL/statut | `{ "method": ["POST"], "urlRegex": "/api/save" }` |
| `domEffect` | Mutations du DOM (ouverture de modal, notification, etc.) | `{ "textRegex": "saved" }` |
| `composite` | Combinaison de plusieurs types | stockage + DOM pour "paramètres enregistrés" |

Les règles nécessitent des preuves d'exécution (`ai-ui runtime-effects` + `ai-ui graph --with-runtime`) pour produire des correspondances de but. Sans preuve, les objectifs restent non évalués, ce qui évite les faux positifs.

## Sortie de la carte de conception

La commande `design-map` génère quatre artefacts :

- **Inventaire des éléments d'interface utilisateur** : chaque élément interactif regroupé par emplacement (navigation principale, paramètres, barre d'outils, intégré).
- **Carte des fonctionnalités** : chaque fonctionnalité documentée avec un score de découvrabilité, des points d'entrée et une action recommandée.
- **Flux de tâches** : chaînes de navigation inférées avec détection des boucles et suivi des objectifs.
- **Proposition d'architecture de l'information** : navigation principale, navigation secondaire, éléments à afficher, éléments documentés mais non affichés, chemins de conversion.

### Actions recommandées

| Action | Signification |
|--------|---------|
| `promote` | La fonctionnalité est documentée mais difficile à trouver ; elle nécessite un point d'entrée plus visible. |
| `keep` | La fonctionnalité est bien équilibrée : elle est documentée et facile à découvrir. |
| `demote` | La fonctionnalité est importante mais présente des risques ou a une faible valeur : déplacer vers les paramètres avancés. |
| `merge` | Noms de fonctionnalités dupliqués entre les différentes sections : consolider. |
| `skip` | Ce n'est pas une véritable fonctionnalité (nom qui ressemble à une phrase, concept abstrait). |

## Pipeline

La séquence complète du pipeline :

```
atlas → probe → diff → graph → design-map → ai-suggest → ai-eyes → ai-hands
                 ↓                                                      ↓
          runtime-effects → graph --with-runtime                  hands.plan.md
                                    ↓                             hands.patch.diff
                              design-map (with goals)             hands.files.json
                                    ↓                             hands.verify.md
                              replay-pack → replay-diff
```

Chaque étape lit la sortie de l'étape précédente à partir du répertoire `ai-ui-output/`. Le pipeline est déterministe : les mêmes entrées produisent les mêmes sorties.

## Commandes d'IA (Ollama local)

Trois commandes utilisent des modèles Ollama locaux pour aller au-delà de la simple correspondance déterministe. Elles nécessitent que [Ollama](https://ollama.com) soit installé et en cours d'exécution localement — aucune donnée ne quitte votre machine.

### ai-suggest (Cerveau)

Correspondance sémantique entre les fonctionnalités documentées et les éléments de l'interface utilisateur, en utilisant un modèle de langage (LLM) généraliste.

```bash
ai-ui ai-suggest                        # default model
ai-ui ai-suggest --model qwen2.5:14b    # specify model
ai-ui ai-suggest --eyes ai-ui-output/eyes.json  # enrich with Eyes data
```

Génère des "alias" de correctifs qui indiquent au moteur de comparaison les fonctionnalités qui correspondent à quels éléments, comblant ainsi les lacunes que la simple correspondance de chaînes de caractères ne peut pas détecter.

### ai-eyes (Yeux)

Amélioration visuelle de l'interface utilisateur en utilisant un modèle de vision (LLaVA). Identifie les boutons qui ne comportent que des icônes, les éléments de contrôle qui ont peu de texte et les éléments visuellement ambigus.

```bash
ai-ui ai-eyes                           # default: llava:13b
ai-ui ai-eyes --model llava:7b          # lighter model
```

Ajoute des annotations aux éléments avec `icon_guess`, `visible_text` et `nearby_context` — un contexte que les commandes suivantes (ai-suggest, ai-hands) utilisent pour un ciblage précis.

### ai-hands (Mains)

Générateur de correctifs prêts à être intégrés dans les demandes de modification, en utilisant un modèle de code (qwen2.5-coder). Lit la sortie complète du pipeline de "design-map" et génère des modifications de type "trouver/remplacer" pour combler les lacunes de l'interface utilisateur.

```bash
ai-ui ai-hands                          # all tasks, default model
ai-ui ai-hands --tasks surface-settings,goal-hooks  # specific tasks
ai-ui ai-hands --repo /path/to/project  # target a different repo
ai-ui ai-hands --min-rank 0.50          # only high/medium confidence edits
```

**Types de tâches :**
- `add-aiui-hooks` — ajouter des attributs `data-aiui-safe` aux éléments interactifs non destructifs.
- `surface-settings` — améliorer la découvrabilité des fonctionnalités documentées mais difficiles d'accès.
- `goal-hooks` — ajouter des attributs `data-aiui-goal` pour la détection de l'achèvement des tâches.
- `copy-fix` — aligner les étiquettes de l'interface utilisateur avec la terminologie de la documentation.

**Sorties :** `hands.plan.md` (groupes de modifications classés), `hands.patch.diff` (morceaux de code dans l'ordre de confiance), `hands.files.json` (manifeste avec métadonnées de classement), `hands.verify.md` (liste de contrôle de vérification).

Chaque modification est classée en fonction de sa fiabilité (force de validation, qualité de l'ancre, proximité, provenance, sécurité) et est regroupée dans des catégories de confiance élevée, moyenne et faible. Les modifications ne sont jamais appliquées automatiquement — la sortie est toujours une proposition soumise à un examen humain.

## Intégration continue (CI)

```bash
# Run pipeline + verify in CI
ai-ui stage0
ai-ui graph
ai-ui verify --strict --gate minimum --min-coverage 60

# Exit code 0 = pass, 1 = user error, 2 = runtime error
```

Utilisez `--json` pour une sortie lisible par machine. Utilisez `baseline --write` pour fixer les seuils.

## Modèle de menace

AI-UI s'exécute localement sur votre serveur de développement. Il ne :
- Envoie pas de données à des services externes (les commandes d'IA utilisent uniquement Ollama local).
- Modifie pas votre code source ou votre configuration (ai-hands génère des propositions, mais ne les applique jamais).
- Accède à rien en dehors de la `baseUrl` et des fichiers de documentation configurés.
- Nécessite pas d'accès réseau (toute l'analyse est locale).

La commande `runtime-effects` simule des clics sur de vrais boutons dans un navigateur Playwright. Elle respecte les règles de sécurité :
- Les déclenchements correspondant aux motifs de blocage (supprimer, effacer, détruire, etc.) sont ignorés.
- L'attribut `data-aiui-safe` peut remplacer les règles de sécurité pour les déclenchements connus comme sûrs.
- Le mode `--dry-run` effectue une simulation de survol au lieu de cliquer.

## Tests

```bash
npm test
```

877 tests utilisant le moteur de test natif de Node.js. Aucun framework de test externe.

## Licence

MIT — voir [LICENSE](LICENSE).

---

Créé par [MCP Tool Shop](https://mcp-tool-shop.github.io/)
