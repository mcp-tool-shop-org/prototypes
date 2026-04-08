<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-sfx/readme.jpg" width="400" alt="Claude-SFX">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-sfx"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-sfx" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx/branch/main/graph/badge.svg" alt="codecov"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-sfx/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Feedback audio procedurale per [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Ogni chiamata a uno strumento, modifica di un file, ricerca, push Git e invio di un agente produce un suono distinto, sintetizzato a partire da formule matematiche, non da file audio.

## Guida rapida

```bash
npm install -g @mcptoolshop/claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

Ecco tutto. Claude Code ora riprodurrà dei suoni mentre lavora.

## Perché il feedback audio?

Quando un agente AI legge, scrive, cerca e distribuisce al posto tuo, si perde la visibilità. Vi trovate a fissare un testo che scorre. Il feedback audio ripristina la consapevolezza:

- **Accessibilità** — ascoltate i cambiamenti di stato, gli errori e i completamenti senza dover guardare il terminale.
- **Fluidità** — sapete se un test è superato o se un aggiornamento è stato completato senza dover cambiare contesto.
- **Presenza** — l'agente sembra un collaboratore, non una scatola nera.

## I 7 verbi

Ogni azione di Claude Code corrisponde a uno dei 7 verbi principali. I modificatori (stato, ambito, direzione) alterano il suono senza comprometterne la coerenza.

| Verbo | Trigger | Suono |
|---|---|---|
| **intake** | `Read`, `WebFetch`, `WebSearch` | Onda sinusoidale in aumento — qualcosa sta arrivando |
| **transform** | `Edit` | Impulso con texture FM — rimodellamento |
| **commit** | `Write`, `NotebookEdit`, `git commit` | Tono di timbro deciso — completato |
| **navigate** | `Grep`, `Glob` | Ping sonar — scansione |
| **execute** | `Bash`, `npm test`, `tsc` | Esplosione di rumore + tono — azione meccanica |
| **move** | `mv`, `cp`, avvio di un sub-agente | Fruscio di vento — spostamento dell'aria |
| **sync** | `git push`, `git pull` | Fruscio drammatico + ancoraggio tonale |

### Modificatori

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

### Rilevamento intelligente di Bash

Il gestore degli eventi analizza i comandi Bash per scegliere il suono corretto:

| Comando Bash | Verbo | Stato |
|---|---|---|
| `git push` | sync (in aumento) | in base al codice di uscita |
| `git pull` | sync (in diminuzione) | in base al codice di uscita |
| `npm test`, `pytest` | esecuzione | in base al codice di uscita |
| `tsc`, `npm run build` | esecuzione | in base al codice di uscita |
| `mv`, `cp` | spostamento | — |
| `rm` | spostamento | avviso |
| tutto il resto | esecuzione | in base al codice di uscita |

## Profili

Palette di suoni che modificano l'intero comportamento con un'unica opzione.

| Profilo | Comportamento |
|---|---|
| **minimal** (default) | Toni a onda sinusoidale — sottili, professionali, adatti all'uso quotidiano |
| **retro** | Cinguettii a onda quadra a 8 bit — divertenti ma controllati |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### Profili personalizzati

Copiate `profiles/minimal.json`, modificate i parametri di sintesi e caricate il file:

```bash
claude-sfx play navigate --profile ./my-profile.json
```

Ogni numero nel file JSON corrisponde direttamente al motore di sintesi: forma d'onda, frequenza, durata, inviluppo (ADSR), profondità FM, larghezza di banda, guadagno.

## Anti-fastidio

Ciò che distingue un prodotto da un giocattolo.

| Funzionalità | Comportamento |
|---|---|
| **Debounce** | Lo stesso verbo entro 200 ms → un solo suono |
| **Rate limit** | Massimo 8 suoni in una finestra di 10 secondi |
| **Quiet hours** | Tutti i suoni disattivati durante le ore configurate |
| **Mute** | Attivazione/disattivazione istantanea, persiste al riavvio della sessione |
| **Volume** | Controllo del guadagno da 0 a 100 |
| **Per-verb disable** | Disattivate i verbi specifici che non desiderate |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## Ambiente (operazioni a lunga esecuzione)

Per i comandi che richiedono molto tempo (compilazioni, distribuzioni, suite di test di grandi dimensioni):

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## Suoni della sessione

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## Tutti i comandi

```
Setup:
  init                            Install hooks into .claude/settings.json
  uninstall                       Remove hooks

Playback:
  play <verb> [options]           Play a sound (goes through guard)
  demo [--profile <name>]         Play all 7 verbs
  preview [profile]               Audition all sounds in a profile
  session-start / session-end     Chimes
  ambient-start / ambient-resolve / ambient-stop

Config:
  mute / unmute                   Toggle all sounds
  volume [0-100]                  Get or set volume
  config                          Print current config
  config set <key> <value>        Set a value
  config reset                    Reset to defaults
  config repo <profile|clear>     Per-directory profile override
  disable / enable <verb>         Toggle specific verbs
  export [dir] [--profile]        Export all sounds as .wav files
```

## Come funziona

Nessun file audio. Ogni suono è sintetizzato in fase di esecuzione a partire da formule matematiche:

- **Oscillatori** — seno, quadrato, a dente di sega, triangolo, rumore bianco
- **Inviluppi ADSR** — attacco, decadimento, sustain, rilascio
- **Sintesi FM** — modulazione di frequenza per la texture
- **Filtro a variabile di stato** — rumore filtrato in banda per i fruscii
- **Sweep di frequenza** — interpolazione lineare per il movimento
- **Limitatore di volume** — compressione soft-knee, limite massimo

L'intero pacchetto è composto da circa 2.800 righe di TypeScript con zero dipendenze per la produzione. I suoni vengono generati come buffer PCM, codificati in WAV in memoria e riprodotti tramite il lettore audio nativo del sistema operativo (PowerShell su Windows, afplay su macOS, aplay su Linux).

## Sicurezza e privacy

**Dati a cui si accede:** `~/.claude-sfx/config.json` (preferenze), `.claude/settings.json` (registrazione degli hook). I buffer audio vengono generati in memoria e non vengono mai scritti su disco, a meno che non si esegua il comando `export`.

**Dati a cui NON si accede:** codice sorgente, cronologia di Git, rete, credenziali, variabili d'ambiente. Non vengono raccolti né trasmessi dati di telemetria. Nessun file audio viene scaricato; ogni suono viene sintetizzato localmente a partire da equazioni matematiche.

**Autorizzazioni:** lettura/scrittura del file system per la configurazione e gli hook, invocazione del lettore audio del sistema operativo. Consultare il file [SECURITY.md](SECURITY.md) per la politica completa.

## Requisiti

- Node.js 18 o superiore
- Claude Code
- Uscita audio del sistema (altoparlanti o cuffie)

## Licenza

[MIT](LICENSE)

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
