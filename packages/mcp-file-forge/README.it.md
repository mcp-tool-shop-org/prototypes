<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-file-forge/readme.png" alt="MCP File Forge" width="400"></p>

<p align="center">
  Secure file operations and project scaffolding for AI agents.
  <br />
  Part of <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/file-forge"><img alt="npm version" src="https://img.shields.io/npm/v/@mcptoolshop/file-forge"></a>
  <a href="https://github.com/mcp-tool-shop-org/mcp-file-forge/blob/main/LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-blue"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-file-forge/"><img alt="Landing Page" src="https://img.shields.io/badge/Landing_Page-live-blue"></a>
</p>

---

## At a Glance

MCP File Forge è un server [Model Context Protocol](https://modelcontextprotocol.io) (MCP) che fornisce agli agenti AI un accesso controllato e sicuro al file system locale. Include **17 strumenti** suddivisi in cinque categorie:

| Categoria | Strumenti | Descrizione |
| ---------- | ------- | ------------- |
| **Reading** | `read_file`, `read_directory`, `read_multiple` | Lettura di file e elenchi di directory |
| **Writing** | `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` | Creazione, modifica, copia, spostamento ed eliminazione |
| **Search** | `glob_search`, `grep_search`, `find_by_content` | Ricerca di file per nome o contenuto |
| **Metadata** | `file_stat`, `file_exists`, `get_disk_usage`, `compare_files` | Visualizzazione di dimensioni, timestamp e esistenza |
| **Scaffolding** | `scaffold_project`, `list_templates` | Creazione di progetti da modelli con sostituzione di variabili |

Proprietà principali:

- **Ambiente isolato (sandboxed)**: le operazioni sono limitate alle directory esplicitamente consentite.
- **Modalità sola lettura**: impostare una variabile d'ambiente per disabilitare tutti gli strumenti di scrittura.
- **Sicuro con i link simbolici**: il tracciamento dei link simbolici è disabilitato per impostazione predefinita per evitare uscite dall'ambiente isolato.
- **Progettato per Windows**: ottimizzato per i percorsi e le convenzioni di Windows, ma funziona ovunque.
- **Motore di template**: sostituzione di variabili con `{{var}}` / `${var}` e rinomina a livello di percorso con `__var__`.

---

## Installazione

```bash
npm install -g @mcptoolshop/file-forge
```

Oppure eseguirlo direttamente con npx:

```bash
npx @mcptoolshop/file-forge
```

---

## Configurazione di Claude Desktop

Aggiungere quanto segue al file `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/file-forge"],
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects,C:/Users/you/Documents"
      }
    }
  }
}
```

Se l'hai installato globalmente, puoi puntare direttamente all'eseguibile:

```json
{
  "mcpServers": {
    "file-forge": {
      "command": "mcp-file-forge",
      "env": {
        "MCP_FILE_FORGE_ALLOWED_PATHS": "C:/Projects"
      }
    }
  }
}
```

---

## Riferimento agli strumenti

### Lettura

| Strumento | Descrizione | Parametri principali |
| ------ | ------------- | ---------------- |
| `read_file` | Lettura del contenuto di un file | `path`, `encoding?`, `start_line?`, `end_line?`, `max_size_kb?` |
| `read_directory` | Elenco delle voci di una directory | `path`, `recursive?`, `max_depth?`, `include_hidden?`, `pattern?` |
| `read_multiple` | Lettura batch di più file | `paths`, `encoding?`, `fail_on_error?` |

### Scrittura

| Strumento | Descrizione | Parametri principali |
| ------ | ------------- | ---------------- |
| `write_file` | Scrittura o sovrascrittura di un file | `path`, `content`, `encoding?`, `create_dirs?`, `overwrite?`, `backup?` |
| `create_directory` | Creazione di una directory | `path`, `recursive?` |
| `copy_file` | Copia di un file o di una directory | `source`, `destination`, `overwrite?`, `recursive?` |
| `move_file` | Spostamento o ridenominazione | `source`, `destination`, `overwrite?` |
| `delete_file` | Eliminazione di un file o di una directory | `path`, `recursive?`, `force?` |

### Ricerca

| Strumento | Descrizione | Parametri principali |
| ------ | ------------- | ---------------- |
| `glob_search` | Ricerca di file tramite pattern glob | `pattern`, `base_path?`, `max_results?`, `include_dirs?` |
| `grep_search` | Ricerca del contenuto di un file con espressioni regolari | `pattern`, `path?`, `glob?`, `case_sensitive?`, `max_results?`, `context_lines?` |
| `find_by_content` | Ricerca di testo letterale (senza espressioni regolari) | `text`, `path?`, `file_pattern?`, `max_results?` |

### Metadati

| Strumento | Descrizione | Parametri principali |
| ------ | ------------- | ---------------- |
| `file_stat` | Statistiche di file/directory | `path` |
| `file_exists` | Controllo dell'esistenza e del tipo | `path`, `type?` (`file` / `directory` / `any`) |
| `get_disk_usage` | Suddivisione delle dimensioni di una directory | `path`, `max_depth?` |
| `compare_files` | Confronto di due percorsi | `path1`, `path2` |

### Creazione di modelli

| Strumento | Descrizione | Parametri principali |
| ------ | ------------- | ---------------- |
| `scaffold_project` | Creazione di un progetto da un modello | `template`, `destination`, `variables?`, `overwrite?` |
| `list_templates` | Elenco dei modelli disponibili | `category?` |

La documentazione completa dei parametri, degli esempi e dei codici di errore si trova nel file [HANDBOOK.md](HANDBOOK.md).

---

## Variabili d'ambiente

| Variabile | Descrizione | Valore predefinito |
| ---------- | ------------- | --------- |
| `MCP_FILE_FORGE_ALLOWED_PATHS` | Elenco separato da virgole delle directory radice consentite | `.` (directory corrente) |
| `MCP_FILE_FORGE_DENIED_PATHS` | Elenco separato da virgole dei pattern di percorso negati | `**/node_modules/**`, `**/.git/**` |
| `MCP_FILE_FORGE_READ_ONLY` | Disabilita tutte le operazioni di scrittura | `false` |
| `MCP_FILE_FORGE_MAX_FILE_SIZE` | Dimensione massima del file in byte | `104857600` (100 MB) |
| `MCP_FILE_FORGE_MAX_DEPTH` | Profondità massima di ricorsione | `20` |
| `MCP_FILE_FORGE_FOLLOW_SYMLINKS` | Permetti di seguire i link simbolici al di fuori dell'ambiente isolato | `false` |
| `MCP_FILE_FORGE_TEMPLATE_PATHS` | Directory dei modelli, separate da virgola | `./templates` |
| `MCP_FILE_FORGE_LOG_LEVEL` | Livello di dettaglio dei log (`error`, `warn`, `info`, `debug`) | `info` |
| `MCP_FILE_FORGE_LOG_FILE` | Percorso di un file di log (oltre a stderr) | _nessuno_ |

---

## File di configurazione

Crea il file `mcp-file-forge.json` (o `.mcp-file-forge.json`) nella directory di lavoro o in una directory superiore:

```json
{
  "sandbox": {
    "allowed_paths": ["C:/Projects", "C:/Users/you/Documents"],
    "denied_paths": ["**/secrets/**", "**/.env"],
    "follow_symlinks": false,
    "max_file_size": 52428800,
    "max_depth": 20
  },
  "templates": {
    "paths": ["./templates", "~/.mcp-file-forge/templates"]
  },
  "logging": {
    "level": "info",
    "file": "./logs/mcp-file-forge.log"
  },
  "read_only": false
}
```

Priorità della configurazione (la più alta ha la precedenza):

1. Variabili d'ambiente
2. File di configurazione
3. Impostazioni predefinite

---

## Sicurezza

MCP File Forge implementa diversi livelli di protezione per impedire agli agenti AI di accedere a risorse al di fuori dell'area di lavoro designata:

- **Sandboxing dei percorsi:** ogni percorso viene risolto in un percorso assoluto e controllato rispetto all'elenco `allowed_paths` prima che avvenga qualsiasi operazione di I/O.
- **Percorsi non consentiti:** modelli glob che vengono bloccati anche all'interno delle directory consentite (ad esempio, `**/secrets/**`).
- **Protezione dei link simbolici:** i link simbolici non vengono seguiti per impostazione predefinita; se un link simbolico punta a una risorsa al di fuori dell'ambiente isolato, l'operazione viene negata.
- **Rilevamento di attraversamento di percorsi:** le sequenze `..` che potrebbero consentire di uscire dall'ambiente isolato vengono rifiutate.
- **Limiti di dimensione:** i file più grandi di `max_file_size` vengono rifiutati per evitare l'esaurimento della memoria.
- **Limiti di profondità:** le operazioni ricorsive sono limitate a `max_depth` livelli.
- **Modalità sola lettura:** imposta `MCP_FILE_FORGE_READ_ONLY=true` per disabilitare `write_file`, `create_directory`, `copy_file`, `move_file`, `delete_file` e `scaffold_project`.
- **Rifiuto di byte null:** i percorsi contenenti `\0` vengono rifiutati.
- **Protezione per percorsi lunghi su Windows:** i percorsi che superano i 32.767 caratteri vengono rifiutati.

---

## Documentazione

| Documento | Descrizione |
| ---------- | ------------- |
| [HANDBOOK.md](HANDBOOK.md) | Approfondimento: modello di sicurezza, riferimento degli strumenti, modelli, architettura, FAQ |
| [CHANGELOG.md](CHANGELOG.md) | Cronologia delle versioni (in formato Keep a Changelog) |
| [docs/PLANNING.md](docs/PLANNING.md) | Note interne di pianificazione e ricerca |

---

## Sviluppo

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

---

## Licenza

[MIT](LICENSE)

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
