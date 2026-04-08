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

**Identificare le funzionalità sottoutilizzate prima che diventino un debito tecnico.**

Feature-Reacher analizza gli artefatti del tuo prodotto (note di rilascio, documentazione, FAQ) e genera un "**Audit del Rischio di Adozione**": un elenco classificato e supportato da evidenze delle funzionalità che gli utenti potrebbero non scoprire mai.

---

## Cos'è questo strumento

Uno strumento di diagnostica che:
- Importa la documentazione del prodotto e le note di rilascio.
- Estrae i riferimenti alle funzionalità con le relative evidenze.
- Assegna un punteggio alle funzionalità in base alla loro novità, visibilità e densità di documentazione.
- Genera diagnosi sui rischi di adozione che possono essere utilizzate per migliorare il prodotto.

## Cosa questo strumento NON è

- Una piattaforma di analisi (non importa dati di utilizzo).
- Un sistema di feature flag.
- Una dashboard collegata al tuo codice sorgente.
- Un'intelligenza artificiale che indovina cosa vogliono gli utenti.

Questo è un'**intelligenza esplicabile**: ogni diagnosi è accompagnata da evidenze citate e da una logica chiara.

---

## Cosa offre la Fase 1

- **Caricamento degli artefatti**: Incolla il testo o carica file .txt/.md.
- **Estrazione delle funzionalità**: Intestazioni, elenchi puntati, frasi ripetute.
- **Euristiche di punteggio**: Decadimento della novità, segnali di visibilità, densità della documentazione.
- **Motore di diagnosi**: 6 tipi di diagnosi con segnali di attivazione ed evidenze.
- **Audit classificato**: Funzionalità ordinate in base al rischio di adozione.
- **Raccomandazioni di azione**: Azioni copiabili per ogni diagnosi.
- **Esportazione**: Report in testo semplice e HTML stampabile.

## Cosa aggiunge la Fase 2 (Ripetibilità e Conservazione)

- **Cronologia degli audit**: Tutti gli audit salvati in IndexedDB con possibilità di visualizzazione, ridenominazione ed eliminazione.
- **Interruttore di salvataggio automatico**: Esegui gli audit una volta e salvali automaticamente (o manualmente).
- **Set di artefatti**: Raccolte denominate per flussi di lavoro di audit ripetibili.
- **Confronto degli audit**: Differenza affiancata che mostra i rischi nuovi/risolti e le modifiche alle diagnosi.
- **Tendenze delle funzionalità**: Visualizzazione a linee (sparkline) dell'andamento del rischio nel tempo.
- **Narrativa esecutiva**: Riepilogo basato su modelli per la condivisione con i partner (nessuna intelligenza artificiale).
- **Suite di test**: Jest + ts-jest con test di controllo.

## Cosa aggiunge la Fase 3 (Pronto per il Marketplace)

- **Pagina di presentazione pubblica**: `/landing` con proposte di valore e call to action.
- **Modalità demo**: `/demo` carica automaticamente dati di esempio per un'esperienza immediata.
- **Pagine legali**: Informativa sulla privacy, termini di servizio, contatti di supporto.
- **Pannello di gestione dei dati**: Trasparenza sull'archiviazione locale con opzione di cancellazione.
- **Tour di onboarding**: Tour guidato in 4 passaggi per i nuovi utenti.
- **Pagina sulla metodologia**: `/methodology` spiega il sistema di punteggio (nessuna enfasi sull'intelligenza artificiale).
- **Gestione degli errori**: Interfaccia utente resistente agli arresti con possibilità di esportazione delle informazioni diagnostiche.
- **Strumenti di accessibilità**: Navigazione da tastiera, helper ARIA, supporto per lettori di schermo.
- **Risorse per il marketplace**: Testo per la scheda, documentazione PDF, checklist di invio.

## Cosa questo strumento NON fa intenzionalmente

- Si connette a piattaforme di analisi.
- Si integra con GitHub, Jira o altri strumenti.
- Utilizza modelli di machine learning per la rilevazione delle funzionalità.
- Fornisce monitoraggio in tempo reale.
- Richiede autenticazione o account.
- Utilizza l'intelligenza artificiale per la generazione di testi (solo modelli deterministici).

Questo è intenzionale. La Fase 3 dimostra la prontezza per il marketplace prima di aggiungere integrazioni.

---

## Come iniziare

```bash
npm install
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

### Test rapido

1. Incolla alcune note di rilascio o documentazione.
2. Clicca su "Esegui audit".
3. Esamina l'elenco delle funzionalità classificato.
4. Espandi le funzionalità per vedere le evidenze e le raccomandazioni.
5. Esporta il report.

### Flussi di lavoro della Fase 2

**Flusso di ripetibilità:**
1. Esegui l'audit → salvato automaticamente nella cronologia.
2. Vai a `/history` per visualizzare gli audit salvati.
3. Salva la raccolta di artefatti per esecuzioni ripetute.
4. Confronta due audit a `/compare`.
5. Visualizza le tendenze a `/trends`.

**Flusso di condivisione con i partner:**
1. Esegui l'audit → clicca su "Esporta" → "Riepilogo esecutivo".
2. Oppure confronta due audit → "Esporta report di confronto".

---

## Struttura del progetto

```
/src/app       # Next.js app router pages
/src/domain    # Core feature model and business logic
/src/analysis  # Diagnostics, heuristics, scoring, diff, trend
/src/storage   # IndexedDB persistence layer
/src/ui        # Reusable UI components
/tests         # Jest test suite
/docs          # Project documentation
```

### File Principali

- `src/domain/feature.ts` - Modello "Feature" (caratteristica) standard
- `src/domain/diagnosis.ts` - Tipi di diagnosi e gravità
- `src/analysis/extractor.ts` - Euristiche per l'estrazione delle caratteristiche
- `src/analysis/scoring.ts` - Calcolo del punteggio di "recente/visibilità"
- `src/analysis/diagnose.ts` - Motore di diagnosi
- `src/analysis/ranking.ts` - Classifica del rischio e generazione di audit
- `src/analysis/actions.ts` - Raccomandazioni di azioni
- `src/analysis/export.ts` - Generazione di report e narrazione esecutiva
- `src/analysis/diff.ts` - Motore di confronto degli audit
- `src/analysis/trend.ts` - Analisi delle tendenze delle caratteristiche
- `src/storage/types.ts` - Tipi di persistenza
- `src/storage/indexeddb.ts` - Implementazione di IndexedDB

---

## Architettura

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

### Principi di progettazione

1. **Nessuna "magia"**: Ogni diagnosi è spiegabile con prove documentate.
2. **Euristiche prima di tutto**: Nessun utilizzo di machine learning finché le euristiche non si dimostrano insufficienti.
3. **Determinismo**: Lo stesso input produce sempre lo stesso output.
4. **Trasparenza**: Gli utenti possono risalire a qualsiasi conclusione fino alla sua origine.

---

## Licenza

MIT

---

## Tag di rilascio

```bash
git checkout phase-1-foundation    # Phase 1: Core diagnostic engine
git checkout phase-2-repeatability # Phase 2: Persistence, compare, trends
git checkout phase-3-marketplace   # Phase 3: Marketplace-ready packaging
git checkout phase-3.5-teams-tab   # Phase 3.5: Teams tab integration
```

## Esecuzione dei test

```bash
npm test
```

I test verificano i limiti: i punteggi di rischio sono compresi tra 0 e 1, gli ID degli audit sono formattati correttamente, gestione elegante dei casi limite.
