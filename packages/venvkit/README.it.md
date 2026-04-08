<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/venvkit/readme.png" alt="venvkit" width="400">
</p>

# venvkit

> Parte di [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/venvkit/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/venvkit/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/venvkit"><img src="https://img.shields.io/npm/v/@mcptoolshop/venvkit?style=flat-square&color=cb3837" alt="npm version"></a>
</p>

**Kit di strumenti diagnostici per ambienti virtuali Python per i flussi di lavoro di machine learning su Windows.**

Scansiona il sistema alla ricerca di ambienti Python, diagnostica problemi di salute (SSL, DLL, incompatibilità ABI, perdite di percorsi), tiene traccia della cronologia di esecuzione delle attività, rileva attività instabili e genera una mappa dell'ecosistema.

## Guida rapida

```bash
git clone https://github.com/mcp-tool-shop-org/venvkit && cd venvkit
npm install && npm run build
node dist/map_cli.js --root C:\projects --httpsProbe
# Open .venvkit/venv-map.html in your browser
```

## Funzionalità

- **doctorLite** - Controllo rapido dello stato di salute per qualsiasi interprete Python
- Verifica SSL/TLS
- Errori di caricamento delle DLL (comuni con PyTorch/CUDA)
- Incompatibilità ABI (ARM vs x86)
- Controlli di sanità di pip
- Rilevamento di perdite di user-site e PYTHONPATH

- **scanEnvPaths** - Scopri tutti gli ambienti Python presenti nel tuo sistema
- Trova venv, ambienti conda, versioni pyenv, interpreti di base
- Profondità e filtri configurabili

- **mapRender** - Visualizza il tuo ecosistema Python
- Output JSON per l'uso programmatico
- Diagrammi Mermaid per la documentazione
- Raggruppamento degli interpreti di base con analisi del raggio di impatto
- Visualizzazione del routing delle attività

- **runLog** - Tieni traccia della cronologia di esecuzione delle attività
- Formato JSONL solo per l'aggiunta
- Registra quale ambiente ha eseguito quale attività
- Cattura successo/fallimento con classificazione degli errori

- **taskCluster** - Aggrega le esecuzioni delle attività per firma
- Rilevamento di attività instabili (pass/fail inconsistenti)
- Rilevamento di instabilità dipendente dall'ambiente
- Identificazione dei punti critici di errore
- Analisi della contaminazione (cause radice condivise)

## Installazione

```bash
npm install
npm run build
```

## Utilizzo della CLI

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

### Opzioni della CLI

| Flag | Descrizione |
|------|-------------|
| `--root, -r` | Directory da scansionare (è possibile specificarne più di una) |
| `--out` | Directory di output (predefinito: `.venvkit`) |
| `--maxDepth` | Profondità massima della directory da scansionare (predefinito: 5) |
| `--strict` | Abilita i controlli in modalità rigorosa |
| `--httpsProbe` | Testa la connettività HTTPS |
| `--minScore` | Filtra gli ambienti con un punteggio di salute inferiore a questo valore |
| `--concurrency` | Controlli paralleli (predefinito: numero di core della CPU) |
| `--runlog` | Percorso del file di log delle esecuzioni delle attività (JSONL) |
| `--no-tasks` | Salta la visualizzazione delle attività |

### Output

| File | Descrizione |
|------|-------------|
| `venv-map.json` | Dati completi del grafico (nodi, archi, riepilogo) |
| `venv-map.mmd` | Codice sorgente del diagramma Mermaid |
| `venv-map.html` | Visualizzatore interattivo |
| `reports.json` | Report dettagliati di doctorLite |
| `insights.json` | Raccomandazioni attuabili |

## Utilizzo programmatico

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

## Schema del file di log

Tieni traccia delle esecuzioni delle attività aggiungendo eventi a un file JSONL:

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

## Raggruppamento delle attività

Quando si hanno molte esecuzioni di attività, venvkit le raggruppa per firma:

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

## Schema del grafico

L'output di `mapRender` segue uno schema JSON stabile:

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

### Tipi di nodo

| Tipo | Descrizione |
|------|-------------|
| `base` | Interprete Python di base (es. `C:\Python311`) |
| `venv` | Ambiente virtuale |
| `task` | Firma dell'attività (esecuzioni raggruppate) |

### Tipi di arco

| Tipo | Descrizione |
|------|-------------|
| `USES_BASE` | Relazione venv → interprete di base |
| `ROUTES_TASK_TO` | Routing attività → ambiente |
| `FAILED_RUN` | Errore attività → ambiente (tratteggiato in Mermaid) |

## Codici di errore

| Codice | Gravità | Descrizione |
|------|----------|-------------|
| `SSL_BROKEN` | bad | Il modulo SSL non riesce a essere importato |
| `CERT_STORE_FAIL` | warn | La verifica del certificato HTTPS non riesce |
| `DLL_LOAD_FAIL` | bad | Caricamento della DLL dell'estensione nativa non riesce |
| `ABI_MISMATCH` | bad | Incompatibilità binaria (ARM/x86) |
| `PIP_MISSING` | warn | pip non disponibile |
| `PIP_CHECK_FAIL` | warn | Conflitti di dipendenze rilevati |
| `USER_SITE_LEAK` | warn | user-site-packages abilitato nell'ambiente virtuale |
| `PYTHONPATH_INJECTED` | warn | Variabile d'ambiente PYTHONPATH impostata |
| `ARCH_MISMATCH` | bad | Python a 32 bit quando è richiesto a 64 bit |
| `PYVENV_CFG_INVALID` | warn | pyvenv.cfg danneggiato o mancante |

## Sviluppo

```bash
npm install
npm run typecheck  # Type check
npm run test       # Run tests
npm run build      # Build to dist/
```

## Sicurezza e ambito dei dati

- **Scansolo in lettura:** I file eseguibili Python e il file pyvenv.cfg vengono letti, ma mai modificati.
- **Sottoprocessi:** avvia `python` con argomenti controllati, senza l'esecuzione tramite shell.
- **Rete:** l'opzione `--httpsProbe` (facoltativa) verifica i certificati SSL, ma non vengono effettuate altre richieste in uscita.
- **Nessun dato di telemetria** viene raccolto o trasmesso; consultare il file [SECURITY.md](SECURITY.md) per la politica completa.

## Licenza

MIT

---

Creato da [MCP Tool Shop](https://mcp-tool-shop.github.io/)
