<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/zip-meta-map/readme.png" width="400" />
</p>

<p align="center">
  Turn a ZIP or folder into a guided, LLM-friendly metadata bundle.<br>
  <strong>Map + Route + Guardrails</strong> — inside the archive itself.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://pypi.org/project/zip-meta-map/"><img src="https://img.shields.io/pypi/v/zip-meta-map" alt="PyPI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/zip-meta-map" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/zip-meta-map/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## Cosa fa

zip-meta-map genera un livello di metadati deterministico che risponde a tre domande per gli agenti di intelligenza artificiale:

- **Cosa c'è qui dentro?** — inventario di file classificati per ruolo con punteggi di affidabilità.
- **Cosa è più importante?** — elenco "inizia qui" ordinato con estratti.
- **Come posso navigare senza perdermi nel contesto?** — piani di navigazione con limiti di utilizzo dei dati.

## Dimostrazione rapida

```bash
$ zip-meta-map build my-project/ -o output/ --summary

Wrote META_ZIP_FRONT.md and META_ZIP_INDEX.json to output/
  Profile:  python_cli
  Files:    47
  Modules:  8
  Flagged:  2 file(s) with risk flags
```

```bash
$ zip-meta-map explain my-project/

Profile:  python_cli
Files:    47

Top files to read first:
  README.md                     [doc]        conf=0.95  README is primary documentation
  src/app/main.py               [entrypoint] conf=0.95  matches profile entrypoint pattern
  pyproject.toml                [config]     conf=0.95  Python project configuration

Overview plan:
  Quick orientation — what is this tool and how is it structured?
  1. READ README.md for project purpose and usage
  2. READ pyproject.toml for dependencies and entry points
  3. READ entrypoint file to understand CLI structure
  Budget: ~32 KB
```

Consultare l'[output della demo di esempio](examples/tiny_python_cli/) per un esempio completo.

## Installazione

```bash
pip install zip-meta-map
```

Oppure con [pipx](https://pipx.pypa.io/):

```bash
pipx install zip-meta-map
```

Dal codice sorgente:

```bash
git clone https://github.com/mcp-tool-shop-org/zip-meta-map
cd zip-meta-map
pip install -e ".[dev]"
```

## GitHub Action

Utilizzare zip-meta-map in CI con l'azione composita:

```yaml
- name: Generate metadata map
  uses: mcp-tool-shop-org/zip-meta-map@v0
  with:
    path: .
```

Questo installa lo strumento, genera i metadati e scrive un riepilogo. Gli output includono `index-path`, `front-path`, `profile`, `file-count` e `warnings-count`. Impostare `pr-comment: 'true'` per pubblicare il riepilogo come commento alla pull request.

Consultare [examples/github-action/](examples/github-action/) per un flusso di lavoro completo.

## Cosa genera

| File | Scopo |
| ------ | --------- |
| `META_ZIP_FRONT.md` | Pagina di orientamento leggibile |
| `META_ZIP_INDEX.json` | Indice leggibile dalle macchine (ruoli, affidabilità, piani, frammenti, estratti, indicatori di rischio) |
| `META_ZIP_REPORT.md` | Report dettagliato e consultabile (con `--report md`) |

## Riferimento della CLI

```bash
# Build metadata for a folder or ZIP
zip-meta-map build path/to/repo -o output/
zip-meta-map build archive.zip -o output/

# Build with step summary and report
zip-meta-map build . -o output/ --summary --report md

# Output formats for piping
zip-meta-map build . --format json          # JSON to stdout
zip-meta-map build . --format ndjson        # one JSON line per file
zip-meta-map build . --manifest-only        # skip FRONT.md

# Explain what the tool detected
zip-meta-map explain path/to/repo
zip-meta-map explain path/to/repo --json

# Compare two indices (CI-friendly)
zip-meta-map diff old.json new.json             # human-readable
zip-meta-map diff old.json new.json --json       # JSON output
zip-meta-map diff old.json new.json --exit-code  # exit 1 if changes

# Validate an existing index
zip-meta-map validate META_ZIP_INDEX.json

# Policy overrides
zip-meta-map build . --policy META_ZIP_POLICY.json -o output/
```

## Profili

Rilevati automaticamente in base alla struttura del repository. Profili predefiniti attuali:

| Profilo | Rilevato da | Piani |
| --------- | ------------ | ------- |
| `python_cli` | `pyproject.toml`, `setup.py` | panoramica, debug, aggiunta_funzionalità, revisione_sicurezza, analisi_approfondita |
| `node_ts_tool` | `package.json`, `tsconfig.json` | panoramica, debug, aggiunta_funzionalità, revisione_sicurezza, analisi_approfondita |
| `monorepo` | `pnpm-workspace.yaml`, `lerna.json` | panoramica, debug, aggiunta_funzionalità, revisione_sicurezza, analisi_approfondita |

Consultare [docs/PROFILES.md](docs/PROFILES.md).

## Ruoli e affidabilità

Ogni voce di file include un **ruolo** (vocabolario limitato), un'**affidabilità** (da 0.0 a 1.0) e una **motivazione**.

| Livello | Intervallo | Significato |
| ------ | ------- | --------- |
| Alto | >= 0.9 | Forte segnale strutturale (corrispondenza del nome del file, punto di ingresso del profilo) |
| Buono | >= 0.7 | Corrispondenza di pattern (convenzione delle directory, estensione + posizione) |
| Discreto | >= 0.5 | Solo estensione o debole segnale posizionale |
| Basso | < 0.5 | Assegnato come "sconosciuto"; la motivazione spiega l'ambiguità |

## Divulgazione progressiva (v0.2)

- **Mappe di frammenti** per file > 32 KB — ID stabili, intervalli di riga, intestazioni
- **Riepiloghi dei moduli** — distribuzione dei ruoli a livello di directory e file chiave
- **Estratti** — prime righe dei file di alto valore
- **Indicatori di rischio** — exec_shell, secrets_like, network_io, path_traversal, binary_masquerade, binary_executable
- **Capacità** — `capabilities[]` indica quali funzionalità opzionali sono disponibili

## Stabilità

- La versione delle specifiche segue regole simili a semver: gli aggiornamenti minori aggiungono campi, gli aggiornamenti maggiori interrompono i client.
- `capabilities[]` è il meccanismo ufficiale per la negoziazione delle funzionalità.
- I client più vecchi che ignorano i campi sconosciuti continueranno a funzionare con gli aggiornamenti minori.
- Consultare [docs/SPEC.md](docs/SPEC.md) per il contratto completo.

## Struttura del repository

```
src/zip_meta_map/
  cli.py        # argparse CLI (build, explain, diff, validate)
  builder.py    # scan -> index -> validate -> write
  diff.py       # index comparison (diff command)
  report.py     # GitHub step summary + detailed report
  scanner.py    # directory + ZIP scanning with SHA-256
  roles.py      # role assignment heuristics + confidence
  profiles.py   # built-in profiles + traversal plans
  chunker.py    # deterministic text chunking
  modules.py    # folder-level module summaries
  safety.py     # risk flag detection + warning generation
  schema/       # JSON Schemas and loaders
docs/
  SPEC.md       # v0.2 contract (format semantics)
  PROFILES.md   # profile behaviors + plans
examples/
  tiny_python_cli/   # golden demo output
  github-action/     # consumer workflow example
tests/
  fixtures/     # tiny fixture repos
```

## Contributi

Questo progetto è piccolo per scelta. Se desideri contribuire:

- Mantenere le euristiche deterministiche.
- Mantenere i ruoli ben definiti, e trasferire le sfumature nei tag.
- Aggiungere test per ogni nuova euristica.
- Non modificare gli schemi senza aggiornare la documentazione e il file SPEC.md e i file di riferimento.

```bash
pytest
```

## Documentazione

- [Specifiche (v0.2)](docs/SPEC.md) — il contratto per tutti i file generati.
- [Profili](docs/PROFILES.md) — profili di progetto predefiniti.
- [Sicurezza](SECURITY.md) — segnalazione di vulnerabilità.

## Licenza

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
