<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nameops/readme.png" alt="NameOps" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml"><img src="https://github.com/mcp-tool-shop-org/nameops/actions/workflows/nameops.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nameops/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

Orchestratore per la verifica dei nomi, utilizzato con il motore di analisi [clearance-opinion-engine](https://github.com/mcp-tool-shop-org/clearance-opinion-engine).

Converte un elenco di nomi standard in esecuzioni di verifica batch, artefatti pubblicati e riepiloghi PR (Pull Request) leggibili.

## Come funziona

1. Il file `data/names.txt` contiene l'elenco standard dei nomi da verificare.
2. Il file `data/profile.json` contiene i flag predefiniti della CLI (Command Line Interface) del COE (Clearance Opinion Engine), come i canali, il livello di rischio, la concorrenza, ecc.
3. Il file `src/run.mjs` gestisce: l'esecuzione batch del COE, la pubblicazione e la validazione.
4. Il file `src/build-pr-body.mjs` genera il corpo di una Pull Request in formato Markdown, con riepiloghi per livello, schede di rilevamento di conflitti e statistiche sui costi.
5. Il workflow pianificato del repository di marketing richiama questa logica e apre le Pull Request con gli artefatti inclusi.

## Utilizzo

```bash
# Install the clearance engine
npm install -g @mcptoolshop/clearance-opinion-engine

# Run the pipeline
node src/run.mjs --out artifacts --profile data/profile.json --names data/names.txt

# Build a PR body from the output
node src/build-pr-body.mjs artifacts
```

## Configurazione

### `data/names.txt`

Un nome per riga. Le righe che iniziano con `#` sono commenti. Massimo 500 nomi.

### `data/profile.json`

| Field | Flag COE | Valore predefinito |
| ------- | ---------- | --------- |
| `channels` | `--channels` | `all` |
| `org` | `--org` | `mcp-tool-shop-org` |
| `dockerNamespace` | `--dockerNamespace` | `mcptoolshop` |
| `hfOwner` | `--hfOwner` | `mcptoolshop` |
| `risk` | `--risk` | `conservative` |
| `radar` | `--radar` | `true` |
| `concurrency` | `--concurrency` | `3` |
| `maxAgeHours` | `--max-age-hours` | `168` (7 giorni) |
| `variantBudget` | `--variantBudget` | `12` |
| `fuzzyQueryMode` | `--fuzzyQueryMode` | `registries` |
| `cacheDir` | `--cache-dir` | `.coe-cache` |
| `maxRuntimeMinutes` | Timeout del workflow | `15` |

## Output

```
artifacts/
  metadata.json           # Run metadata (date, duration, counts)
  pr-body.md              # Markdown PR body
  batch/                  # Raw COE batch output
  published/              # Published artifacts (for marketing site)
    runs.json             # Index of all runs
    <slug>/
      report.html
      summary.json
      clearance-index.json
      run.json
```

## Architettura

NameOps è un orchestratore, non un servizio. Non possiede alcun modello di dati e non ha dipendenze di runtime al di là della CLI del COE. Il repository di marketing gestisce la pianificazione (secondo le regole specificate in CLAUDE.md); NameOps gestisce la logica.

## Test

```bash
npm test
```

## Licenza

MIT
