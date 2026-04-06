<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/soundboard-plugin/main/assets/logo-dark.jpg" alt="Soundboard Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin"><img src="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="https://pypi.org/project/voice-soundboard-plugin/"><img src="https://img.shields.io/pypi/v/voice-soundboard-plugin" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  A <a href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/plugins">Claude Code plugin</a> that speaks code walkthroughs, announces build results,<br>
  and adds context-aware text-to-speech to your development workflow.
</p>

---

## Highlights

- **12 voci selezionate** con routing basato sulle emozioni (gioia, rabbia, tristezza, paura, sorpresa, urgenza, calma, neutro)
- **Dialogo multi-speaker** con assegnazione automatica, indicazioni di scena e modificatori di velocità
- **Suddivisione intelligente** del testo, che divide i testi lunghi ai confini delle frasi, con supporto per le interruzioni
- **SSML-lite** per un controllo preciso (pause, enfasi, intonazione, velocità)
- **Tag SFX** per generare suoni WAV inline in puro Python (`<ding>`, `<chime>`)
- **Sistema di monologo interiore** con limitazione della velocità e rimozione automatica delle informazioni sensibili
- **Protezione della riproduzione** tramite un processo in singolo thread, watchdog di 30 secondi e politiche di coda (interruzione / accodamento / rifiuto)
- **Priorità alla sicurezza**: sandbox per i percorsi, controllo della concorrenza, errori strutturati e validazione dei file WAV

## Comandi rapidi (Slash Commands)

| Comando | Cosa fa |
|---------|-------------|
| `/soundboard:speak` | Sintesi vocale generale con rilevamento delle emozioni e supporto SSML |
| `/soundboard:narrate` | Narrazione del codice con ritmo adattivo |
| `/soundboard:notify` | Notifiche vocali per i flussi di lavoro (eventi di build, test e deployment) |
| `/soundboard:voices` | Elenca le voci e i preset disponibili |
| `/soundboard:voice-status` | Stato del motore, informazioni sul backend e limiti imposti |

Inoltre, l'intera interfaccia dello strumento MCP: `voice.dialogue`, `voice.inner_monologue`, `voice.interrupt`, `voice.stream`, `voice.playback_diagnose`, `voice.ambient_enable`, `voice.ambient_mute`.

## Guida introduttiva

### Prerequisiti

- [voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) >= 2.5.0 (il motore di sintesi)
- Python >= 3.10
- Windows (sistema operativo principale; utilizza `winsound` per la riproduzione)

### Installazione

```bash
# 1. Install the voice engine
cd voice-soundboard
pip install -e ".[kokoro]"

# 2. Install the plugin
cd soundboard-plugin
pip install -e .

# 3. Register with Claude Code
claude plugin add /path/to/soundboard-plugin
```

### Prova

```
/soundboard:speak Hello! I'm your coding assistant.
/soundboard:narrate src/server.py
/soundboard:notify Build succeeded with 0 warnings
```

## Architettura

```
Claude Code
    | stdio (JSON-RPC)
    v
stdio_bridge.py ──── security/guardrails.py
    |                     concurrency gate
    |                     rate limiter
    |                     structured errors
    v
speech pipeline
    ├── chunking.py        smart sentence splitting
    ├── ssml_lite.py       safe SSML subset parser
    ├── emotion/           8 emotions + voice routing
    ├── dialogue/          multi-speaker parser + casting
    ├── sfx_parser.py      <ding>/<chime> WAV generation
    ├── orchestrator.py    multi-chunk synthesis loop
    └── concat.py          WAV concatenation
    v
voice-soundboard engine
    ├── Kokoro (local, default)
    ├── Piper / OpenAI / Azure / ElevenLabs
    v
playback/worker.py ──── single-thread queue
    ├── 30s watchdog timer
    ├── interrupt / enqueue / drop policies
    └── retention.py (auto-cleanup)
    v
PCM audio -> speakers
```

## Sicurezza

Questo plugin viene eseguito **interamente sulla tua macchina**. Non ci sono chiamate di rete, telemetria o API cloud (a meno che tu non configuri un backend vocale remoto).

| Proprietà | Implementazione |
|----------|---------------|
| Limiti di input | Massimo 10.000 caratteri, velocità limitata, limiti di chunk/linea |
| Elenco delle voci consentite | 12 voci pre-approvate, le voci sconosciute vengono rifiutate |
| Sandbox per i percorsi | I file WAV di output sono confinati nella directory `{tempdir}/voice-soundboard/` |
| Concorrenza | Sintesi singola alla volta (controllo tramite semaforo) |
| Gestione degli errori | Errori strutturati in formato JSON con ID di traccia, nessuna traccia dello stack inviata al client |
| Rimozione delle informazioni sensibili | Percorsi, token, indirizzi IP, dati in formato base64 e coppie chiave=valore vengono rimossi dai log |
| Validazione dei file WAV | Controllo della presenza del magic number RIFF/WAVE e della dimensione minima per ogni file di output |

Consulta il file [`SECURITY.md`](SECURITY.md) per la politica completa e il file [`docs/SECURITY_THREAT_MODEL.md`](docs/SECURITY_THREAT_MODEL.md) per il modello di minaccia STRIDE-lite.

## Voci

Con il plugin vengono fornite 12 voci selezionate:

| Voce | ID | Genere | Stile |
|-------|-----|--------|-------|
| Fenrir | `am_fenrir` | M | Potente, autorevole (predefinito) |
| Eric | `am_eric` | M | Energetico, urgente |
| Liam | `am_liam` | M | Caldo, colloquiale |
| Onyx | `am_onyx` | M | Profondo, stabile |
| Aoede | `af_aoede` | F | Chiaro, espressivo |
| Jessica | `af_jessica` | F | Professionale, neutro |
| Sky | `af_sky` | F | Vivace, amichevole |
| Alice | `bf_alice` | F | Britannica, composta |
| Emma | `bf_emma` | F | Britannica, calda |
| Isabella | `bf_isabella` | F | Britannica, raffinata |
| George | `bm_george` | M | Britannica, formale |
| Lewis | `bm_lewis` | M | Britannica, misurata |

## Configurazione

Tutta la configurazione avviene tramite variabili d'ambiente (nessun file di configurazione):

| Variabile | Valore predefinito | Descrizione |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_OUTPUT_ROOT` | `{tempdir}/voice-soundboard/` | Directory di output dei file WAV |
| `VOICE_SOUNDBOARD_RATE_COOLDOWN_MS` | `0` (disabilitato) | Tempo di raffreddamento del limite di velocità per strumento. |
| `VOICE_SOUNDBOARD_RETENTION_MINUTES` | `240` | Elimina automaticamente i file WAV più vecchi di questo. |
| `VOICE_SOUNDBOARD_AMBIENT_ENABLED` | `0` | Abilita il sistema di "monologo interiore". |

## Sviluppo

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run the test suite (323 tests)
python -m pytest tests/ -q

# Run the security battery only
python -m pytest tests/test_security.py -q

# Pre-release gate (tests + optional pip-audit)
python scripts/ship_gate.py
```

## Struttura del progetto

```
soundboard-plugin/
├── voice_soundboard_plugin/
│   ├── bridge/          MCP stdio server + health checks
│   ├── speech/          TTS pipeline (chunking, SSML, orchestrator, concat)
│   │   ├── dialogue/    Multi-speaker parser + auto-casting
│   │   └── emotion/     Emotion detection + voice routing
│   ├── playback/        Single-thread worker + retention
│   ├── ambient/         Inner monologue subsystem
│   ├── security/        Guardrails, fs sandbox, redaction, WAV validation
│   └── audio/           Audio utilities
├── tests/               323 tests (unit + integration + security battery)
├── scripts/             ship_gate.py pre-release script
├── docs/                Threat model, privacy policy, release checklist
├── assets/              Logo and branding
├── SECURITY.md          Security policy + vulnerability reporting
└── pyproject.toml       Project metadata + dependencies
```

## Sicurezza e ambito dei dati

- **Dati accessibili:** Legge l'input di testo per la sintesi vocale. Elabora la voce tramite il motore vocale locale. L'analisi SSML utilizza un parser con un sottoinsieme sicuro. Il "monologo interiore" maschera le informazioni sensibili prima dell'archiviazione.
- **Dati NON accessibili:** Nessuna connessione di rete predefinita. Nessuna telemetria, analisi o tracciamento. Nessun archivio di dati utente al di là dei file WAV temporanei. I servizi vocali remoti sono opzionali.
- **Permessi richiesti:** Accesso in lettura al motore vocale. Accesso in scrittura opzionale per la directory di output dei file WAV.

## Scheda di valutazione

| Gateway | Stato |
|------|--------|
| A. Base di sicurezza | PASS (Superato) |
| B. Gestione degli errori | PASS (Superato) |
| C. Documentazione per gli operatori | PASS (Superato) |
| D. Igiene durante la distribuzione | PASS (Superato) |
| E. Identità | PASS (Superato) |

## Licenza

[MIT](LICENSE)

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
