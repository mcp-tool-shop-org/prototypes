<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/ai-ui/main/assets/logo-ai-ui.png" alt="AI-UI" width="600" />
</p>

**Diagnostica automatizzata del design per applicazioni SPA.** AI-UI analizza la tua applicazione in esecuzione, legge la tua documentazione e ti indica esattamente quali funzionalità documentate non hanno un punto di accesso nell'interfaccia utente e quali elementi dell'interfaccia utente non sono documentati affatto.

Non fa congetture. Crea un grafo di attivazione a partire dalle interazioni reali con il browser, associa le funzionalità agli attivatori in modo deterministico e genera una mappa di design con giudizi attuabili: "da rendere visibile", "da declassare", "da mantenere", "da unire". Quindi, verifica la correzione.

## Cosa fa

```
README says "ambient soundscapes"  →  atlas extracts the feature
Probe clicks every button           →  "Audio Settings" trigger found
Diff matches feature to trigger     →  coverage: 64%
Design-map says: must-surface 0     →  all documented features are discoverable
```

AI-UI colma il divario tra le promesse della documentazione e la realtà dell'interfaccia utente.

## Installazione

```bash
git clone https://github.com/mcp-tool-shop-org/ai-ui.git
cd ai-ui
npm install
```

Richiede Node.js 20+ e un server di sviluppo in esecuzione per i comandi probe/runtime-effects.

## Guida rapida

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

L'output viene salvato in `ai-ui-output/`. Il report delle differenze ti indica cosa è stato trovato, cosa manca e cosa non è documentato.

## Comandi

| Comando | Cosa fa |
|---------|-------------|
| `atlas` | Analizza la documentazione (README, CHANGELOG, ecc.) per creare un catalogo delle funzionalità. |
| `probe` | Analizza l'interfaccia utente in esecuzione, registra ogni attivatore interattivo. |
| `surfaces` | Estrae gli elementi dell'interfaccia utente da una cattura WebSketch. |
| `diff` | Confronta le funzionalità del catalogo con gli attivatori rilevati. |
| `graph` | Crea un grafo di attivazione a partire dai dati rilevati, dagli elementi dell'interfaccia utente e dalle differenze. |
| `design-map` | Genera un inventario degli elementi dell'interfaccia utente, una mappa delle funzionalità, i flussi di lavoro e una proposta di architettura dell'informazione. |
| `compose` | Genera un piano di implementazione a partire dalle differenze e dal grafo. |
| `verify` | Valuta gli artefatti del processo di sviluppo (build) e fornisce un giudizio di "superato/non superato" per l'integrazione continua (CI). |
| `baseline` | Salva e confronta le baseline di verifica. |
| `pr-comment` | Genera un commento in formato Markdown pronto per una pull request (PR) a partire dagli artefatti. |
| `runtime-effects` | Simula clic sugli attivatori in un browser reale e registra gli effetti collaterali osservati. |
| `runtime-coverage` | Matrice di copertura per ogni attivatore (rilevato/visualizzato/osservato). |
| `replay-pack` | Raggruppa tutti gli artefatti in un pacchetto riproducibile. |
| `replay-diff` | Confronta due pacchetti riproducibili e mostra cosa è cambiato e perché. |
| `ai-suggest` | Associare le caratteristiche dei documenti alle interfacce utente utilizzando Ollama (Brain). |
| `ai-eyes` | Identificare visivamente le interfacce con solo icone o con poco testo utilizzando LLaVA (Eyes). |
| `ai-hands` | Generare patch pronte per la pubblicazione (pull request) per risolvere le incongruenze utilizzando qwen2.5-coder (Hands). |
| `stage0` | Esegue il catalogo, la rilevazione e il confronto in sequenza. |
| `init-memory` | Crea file di memoria vuoti per il tracciamento delle decisioni. |

## Configurazione

Crea un file `ai-ui.config.json` nella directory principale del tuo progetto:

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

Tutti i campi sono opzionali; vengono applicati valori predefiniti sensati. Consulta `cli/src/config.mjs` per lo schema completo.

### Regole degli obiettivi

Per le applicazioni SPA in cui gli URL non cambiano, le regole basate sui percorsi sono inutili. Le regole degli obiettivi consentono di definire il successo in base agli effetti osservabili:

| Tipo. | Corrispondenze | Esempio |
|------|---------|---------|
| `storageWrite` | Scritture in localStorage/sessionStorage. | `{ "keyRegex": "^user\\.prefs\\." }` |
| `fetch` | Richieste HTTP per metodo/URL/codice di stato. | `{ "method": ["POST"], "urlRegex": "/api/save" }` |
| `domEffect` | Modifiche al DOM (apertura di una finestra modale, notifiche, ecc.). | `{ "textRegex": "saved" }` |
| `composite` | Combinazione di più tipi. | storage + dom per "impostazioni salvate". |

Le regole richiedono prove in fase di esecuzione (`ai-ui runtime-effects` + `ai-ui graph --with-runtime`) per generare risultati. Senza prove, gli obiettivi rimangono non valutati, evitando falsi positivi.

## Output della mappa di design

Il comando `design-map` genera quattro artefatti:

- **Inventario degli elementi dell'interfaccia utente:** tutti gli elementi interattivi raggruppati per posizione (navigazione principale, impostazioni, barra degli strumenti, inline).
- **Mappa delle funzionalità:** ogni funzionalità documentata con un punteggio di rilevabilità, i punti di accesso e l'azione consigliata.
- **Flussi di lavoro:** catene di navigazione inferite con rilevamento dei cicli e tracciamento degli obiettivi.
- **Proposta di architettura dell'informazione:** navigazione principale, navigazione secondaria, elementi da rendere visibili, elementi documentati ma non visualizzati, percorsi di conversione.

### Azioni consigliate

| Azione | Significato |
|--------|---------|
| `promote` | La funzionalità è documentata ma nascosta; è necessario un punto di accesso più visibile. |
| `keep` | La funzionalità è ben bilanciata: documentata e facilmente individuabile. |
| `demote` | La funzionalità è importante ma rischiosa o di basso valore: spostarla in "avanzate" o nelle "impostazioni". |
| `merge` | Nomi di funzionalità duplicati tra i percorsi: consolidare. |
| `skip` | Non è una vera funzionalità (nome simile a una frase, non supportata da dati concreti). |

## Pipeline

La sequenza completa della pipeline:

```
atlas → probe → diff → graph → design-map → ai-suggest → ai-eyes → ai-hands
                 ↓                                                      ↓
          runtime-effects → graph --with-runtime                  hands.plan.md
                                    ↓                             hands.patch.diff
                              design-map (with goals)             hands.files.json
                                    ↓                             hands.verify.md
                              replay-pack → replay-diff
```

Ogni fase legge l'output della fase precedente dalla directory `ai-ui-output/`. La pipeline è deterministica: gli stessi input producono gli stessi output.

## Comandi AI (Ollama locale)

Tre comandi utilizzano modelli Ollama locali per andare oltre l'abbinamento deterministico. Richiedono che [Ollama](https://ollama.com) sia in esecuzione localmente: nessun dato viene inviato al di fuori del vostro computer.

### ai-suggest (Brain)

Corrispondenza semantica tra le funzionalità documentate e le interfacce utente utilizzando un modello linguistico di grandi dimensioni (LLM) generico.

```bash
ai-ui ai-suggest                        # default model
ai-ui ai-suggest --model qwen2.5:14b    # specify model
ai-ui ai-suggest --eyes ai-ui-output/eyes.json  # enrich with Eyes data
```

Genera patch che indicano al motore di confronto (diff engine) quali funzionalità corrispondono a quali elementi, colmando le lacune che la corrispondenza di stringhe approssimativa non riesce a individuare.

### ai-eyes (Eyes)

Arricchimento visivo delle interfacce utilizzando un modello di visione (LLaVA). Identifica pulsanti con solo icone, controlli con poco testo e interfacce visivamente ambigue.

```bash
ai-ui ai-eyes                           # default: llava:13b
ai-ui ai-eyes --model llava:7b          # lighter model
```

Annota le interfacce con `icon_guess`, `visible_text` e `nearby_context`: un contesto che i comandi successivi (ai-suggest, ai-hands) utilizzano per un targeting preciso.

### ai-hands (Hands)

Generatore di patch pronte per la pubblicazione utilizzando un modello di codice (qwen2.5-coder). Legge l'output completo della pipeline di mappatura del design e genera modifiche di tipo "trova e sostituisci" per colmare le incongruenze.

```bash
ai-ui ai-hands                          # all tasks, default model
ai-ui ai-hands --tasks surface-settings,goal-hooks  # specific tasks
ai-ui ai-hands --repo /path/to/project  # target a different repo
ai-ui ai-hands --min-rank 0.50          # only high/medium confidence edits
```

**Tipi di attività:**
- `add-aiui-hooks`: aggiunge gli attributi `data-aiui-safe` agli elementi interattivi non distruttivi.
- `surface-settings`: migliora la visibilità delle funzionalità documentate ma difficili da trovare.
- `goal-hooks`: aggiunge gli attributi `data-aiui-goal` per il rilevamento del completamento delle attività.
- `copy-fix`: allinea le etichette dell'interfaccia utente con la terminologia della documentazione.

**Output:** `hands.plan.md` (gruppi di modifiche classificati), `hands.patch.diff` (patch ordinate per affidabilità), `hands.files.json` (manifest con metadati di classificazione), `hands.verify.md` (lista di controllo di verifica).

Ogni modifica è classificata in base all'affidabilità (forza della validazione, qualità dell'ancora, località, provenienza, sicurezza) e suddivisa in categorie di confidenza Alta/Media/Bassa. Le modifiche non vengono applicate automaticamente: l'output è sempre una proposta per la revisione umana.

## Integrazione con CI (Continuous Integration)

```bash
# Run pipeline + verify in CI
ai-ui stage0
ai-ui graph
ai-ui verify --strict --gate minimum --min-coverage 60

# Exit code 0 = pass, 1 = user error, 2 = runtime error
```

Utilizzare `--json` per un output leggibile dalle macchine. Utilizzare `baseline --write` per definire le soglie.

## Modello di rischio

AI-UI viene eseguito localmente contro il vostro server di sviluppo. Non:
- Invia dati a servizi esterni (i comandi AI utilizzano solo Ollama locale).
- Modifica il vostro codice sorgente o la configurazione (ai-hands genera proposte, ma non le applica).
- Accede a risorse al di fuori della `baseUrl` e dei file di documentazione configurati.
- Richiede l'accesso alla rete (tutta l'analisi è locale).

Il comando `runtime-effects` simula clic su pulsanti reali in un browser Playwright. Rispetta le regole di sicurezza:
- I trigger che corrispondono a modelli di blocco (delete, remove, destroy, ecc.) vengono ignorati.
- L'attributo `data-aiui-safe` può sovrascrivere le impostazioni di sicurezza per i trigger considerati sicuri.
- La modalità `--dry-run` simula il clic, senza effettuarlo.

## Test

```bash
npm test
```

877 test eseguiti utilizzando il test runner nativo di Node.js. Nessun framework di test esterno.

## Licenza

MIT — vedere [LICENSE](LICENSE).

---

Creato da [MCP Tool Shop](https://mcp-tool-shop.github.io/)
