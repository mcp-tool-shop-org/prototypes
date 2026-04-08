<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/venvkit/readme.png" alt="venvkit" width="400">
</p>

# venvkit

> Fait partie de [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/venvkit/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/venvkit"><img src="https://img.shields.io/npm/v/@mcptoolshop/venvkit?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

**Outil de diagnostic pour les environnements virtuels Python, conçu pour les flux de travail de Machine Learning sous Windows.**

Analyse votre système pour détecter les environnements Python, diagnostique les problèmes (SSL, DLL, incompatibilités ABI, fuites de chemins), suit l'historique d'exécution des tâches, détecte les tâches instables et génère une carte de l'écosystème.

## Démarrage rapide en 30 secondes

```bash
git clone https://github.com/mcp-tool-shop-org/venvkit && cd venvkit
npm install && npm run build
node dist/map_cli.js --root C:\projects --httpsProbe
# Open .venvkit/venv-map.html in your browser
```

## Fonctionnalités

- **doctorLite** - Vérification rapide de l'état de santé de n'importe quel interpréteur Python
- Vérification SSL/TLS
- Échecs de chargement des DLL (courant avec PyTorch/CUDA)
- Incompatibilités ABI (ARM vs x86)
- Vérifications de l'intégrité de pip
- Détection de fuites des répertoires utilisateur et de la variable PYTHONPATH

- **scanEnvPaths** - Découvre tous les environnements Python de votre système
- Trouve les environnements venv, conda, les versions pyenv et les interpréteurs de base.
- Profondeur et filtrage configurables.

- **mapRender** - Visualise votre écosystème Python
- Sortie JSON pour une utilisation programmatique
- Diagrammes Mermaid pour la documentation
- Groupement des interpréteurs de base avec analyse du rayon d'impact
- Visualisation du routage des tâches

- **runLog** - Suit l'historique d'exécution des tâches
- Format JSONL uniquement en ajout
- Enregistre quel environnement a exécuté quelle tâche
- Enregistre les succès/échecs avec la classification des erreurs

- **taskCluster** - Regroupe les exécutions de tâches par signature
- Détection des tâches instables (échec/succès incohérents)
- Détection des instabilités dépendantes de l'environnement
- Identification des points chauds d'échec
- Analyse de la contagion (causes profondes partagées)

## Installation

```bash
npm install
npm run build
```

## Utilisation de la ligne de commande

```bash
# Scan current directory and generate ecosystem map
node dist/map_cli.js

# Scan specific directories
node dist/map_cli.js --root C:\projects --root D:\ml-experiments

# Include task run history
node dist/map_cli.js --runlog .venvkit/runs.jsonl

# Output options
node dist/map_cli.js --out ./output --minScore 50 --strict --httpsProbe
```

### Options de la ligne de commande

| Option | Description |
|------|-------------|
| `--root, -r` | Répertoire à analyser (peut spécifier plusieurs) |
| `--out` | Répertoire de sortie (par défaut : `.venvkit`) |
| `--maxDepth` | Profondeur maximale du répertoire à analyser (par défaut : 5) |
| `--strict` | Activer les vérifications strictes |
| `--httpsProbe` | Tester la connectivité HTTPS |
| `--minScore` | Filtrer les environnements en fonction de leur score de santé |
| `--concurrency` | Vérifications parallèles (par défaut : nombre de cœurs CPU) |
| `--runlog` | Chemin vers le fichier journal des exécutions de tâches (JSONL) |
| `--no-tasks` | Ignorer la visualisation des tâches |

### Sorties

| Fichier | Description |
|------|-------------|
| `venv-map.json` | Données complètes du graphe (nœuds, arêtes, résumé) |
| `venv-map.mmd` | Source du diagramme Mermaid |
| `venv-map.html` | Visualiseur interactif |
| `reports.json` | Rapports doctorLite bruts |
| `insights.json` | Recommandations exploitables |

## Utilisation programmatique

```typescript
import { doctorLite, scanEnvPaths, mapRender, readRunLog } from 'venvkit';

// Check a specific Python
const report = await doctorLite({
  pythonPath: 'C:\\project\\.venv\\Scripts\\python.exe',
  requiredModules: ['torch', 'transformers'],
  httpsProbe: true,
});

console.log(report.status); // 'good' | 'warn' | 'bad'
console.log(report.score);  // 0-100
console.log(report.findings); // Array of issues

// Scan for all Python environments
const scan = await scanEnvPaths({
  roots: ['C:\\projects'],
  maxDepth: 5,
});

// Run doctorLite on all found environments
const reports = await Promise.all(
  scan.pythonPaths.map(p => doctorLite({ pythonPath: p }))
);

// Load task execution history
const runs = await readRunLog('.venvkit/runs.jsonl');

// Generate ecosystem visualization
const { graph, mermaid, insights } = mapRender(reports, runs, {
  taskMode: 'clustered', // 'none' | 'runs' | 'clustered'
  includeHotEdgeLabels: true,
});
```

## Schéma du journal des exécutions

Suivez les exécutions de tâches en ajoutant des événements à un fichier JSONL :

```typescript
import { appendRunLog, newRunId } from 'venvkit';

await appendRunLog('.venvkit/runs.jsonl', {
  version: '1.0',
  runId: newRunId(),
  at: new Date().toISOString(),
  task: {
    name: 'train',
    command: 'python train.py --epochs 10',
    requirements: { packages: ['torch', 'transformers'] },
  },
  selected: {
    pythonPath: 'C:\\project\\.venv\\Scripts\\python.exe',
    score: 95,
    status: 'good',
  },
  outcome: {
    ok: true,
    exitCode: 0,
    durationMs: 45000,
  },
});
```

## Regroupement des tâches

Lorsque vous avez de nombreuses exécutions de tâches, venvkit les regroupe par signature :

```typescript
import { clusterRuns, isFlaky, getFailingEnvs } from 'venvkit';

const clusters = clusterRuns(runs);

for (const c of clusters) {
  console.log(`${c.sig.name}: ${c.ok}/${c.runs} (${(c.successRate * 100).toFixed(0)}%)`);

  if (isFlaky(c)) {
    console.log(`  WARNING: Flaky task!`);
    const badEnvs = getFailingEnvs(c, 3);
    console.log(`  Failing most on: ${badEnvs.map(e => e.pythonPath).join(', ')}`);
  }
}
```

## Schéma du graphe

La sortie de `mapRender` suit un schéma JSON stable :

```typescript
type GraphJSONv1 = {
  version: '1.0';
  generatedAt: string;
  host: { os: string; arch: string; hostname: string };
  summary: {
    envCount: number;
    baseCount: number;
    taskCount: number;
    healthy: number;
    warning: number;
    broken: number;
    runsPassed: number;
    runsFailed: number;
    topIssues: Array<{ code: string; count: number; hint: string }>;
  };
  nodes: GraphNode[];
  edges: GraphEdge[];
};
```

### Types de nœuds

| Type | Description |
|------|-------------|
| `base` | Interpréteur Python de base (par exemple, `C:\Python311`) |
| `venv` | Environnement virtuel |
| `task` | Signature de tâche (exécutions regroupées) |

### Types d'arêtes

| Type | Description |
|------|-------------|
| `USES_BASE` | Relation venv → base |
| `ROUTES_TASK_TO` | Routage tâche → environnement |
| `FAILED_RUN` | Échec de tâche → environnement (pointillé dans Mermaid) |

## Codes d'erreur

| Code | Gravité | Description |
|------|----------|-------------|
| `SSL_BROKEN` | bad | L'importation du module SSL échoue |
| `CERT_STORE_FAIL` | warn | La vérification du certificat HTTPS échoue |
| `DLL_LOAD_FAIL` | bad | Le chargement de l'extension DLL native échoue |
| `ABI_MISMATCH` | bad | Incompatibilité binaire (ARM/x86) |
| `PIP_MISSING` | warn | pip n'est pas disponible |
| `PIP_CHECK_FAIL` | warn | Conflits de dépendances détectés |
| `USER_SITE_LEAK` | warn | Les packages utilisateur sont activés dans l'environnement virtuel |
| `PYTHONPATH_INJECTED` | warn | La variable d'environnement PYTHONPATH est définie |
| `ARCH_MISMATCH` | bad | Python 32 bits alors que 64 bits est requis |
| `PYVENV_CFG_INVALID` | warn | pyvenv.cfg corrompu ou manquant |

## Développement

```bash
npm install
npm run typecheck  # Type check
npm run test       # Run tests
npm run build      # Build to dist/
```

## Sécurité et portée des données

- **Analyse en lecture seule :** Les exécutables Python et le fichier pyvenv.cfg sont lus, mais jamais modifiés.
- **Sous-processus :** Lance `python` avec des arguments contrôlés — aucune exécution via un shell.
- **Réseau :** L'option `--httpsProbe` (facultative) teste les certificats SSL — aucune autre requête sortante n'est effectuée.
- **Aucune télémétrie** n'est collectée ou envoyée — consultez le fichier [SECURITY.md](SECURITY.md) pour connaître la politique complète.

## Licence

MIT

---

Créé par [MCP Tool Shop](https://mcp-tool-shop.github.io/)
