<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/terminal-tutor/readme.png" width="400" alt="Terminal Tutor" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/terminal-tutor/actions"><img src="https://github.com/mcp-tool-shop-org/terminal-tutor/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/terminal-tutor/"><img src="https://img.shields.io/badge/Landing_Page-live-brightgreen" alt="Landing Page" /></a>
</p>

Impara le competenze relative alla riga di comando eseguendo operazioni direttamente nella riga di comando, dove il lavoro viene effettivamente svolto.

Terminal Tutor è un sistema di tutoraggio contestuale. Crea un ambiente di pratica sicuro, ti propone un compito reale, osserva ciò che digiti e ti spiega cosa è successo e perché. Non ci sono ambienti di test isolati, quiz o video: solo un tutor virtuale direttamente nella tua shell.

## Guida Rapida

```bash
npx @mcptoolshop/terminal-tutor doctor    # Check what's ready
npx @mcptoolshop/terminal-tutor tracks    # See skill tracks
npx @mcptoolshop/terminal-tutor next      # Get your first lesson
npx @mcptoolshop/terminal-tutor start files-and-navigation
```

## Come Funziona

1. **Scegli una lezione.** Ogni lezione ha un obiettivo concreto: non "imparare grep", ma "trovare tutti i TODO sparsi in questo codice sorgente".

2. **Il tutor crea un ambiente di pratica.** File reali, directory reali, repository Git reali. Lavori su una copia di sicurezza, non sui tuoi progetti reali.

3. **Esegui comandi reali.** Non simulati, non in un ambiente isolato. Comandi `grep`, `git`, `sed`, `pip` reali: tutto ciò di cui la lezione ha bisogno.

4. **Il tutor valuta il risultato.** Sono apparsi i file corretti? L'output contiene i dati previsti? Verifica cosa è successo, non quale comando specifico hai digitato.

5. **Se ti blocchi, ti aiuta.** I suggerimenti iniziano con un piccolo incoraggiamento ("prova a cercare in modo ricorsivo") e diventano gradualmente più specifici ("prova `grep -r 'TODO' src/`"). Se commetti un errore comune, identifica l'errore specifico.

6. **I tuoi progressi vengono salvati.** Puoi tornare in un secondo momento e riprendere da dove avevi lasciato.

## Percorsi di Apprendimento

| Percorso | Lezioni | Ambiente di Esecuzione | Cosa Imparerai |
|-------|---------|---------|-------------------|
| **Shell Fundamentals** | 3 | shell | ls, cat, grep, find, sed, awk, diff, pipes |
| **Shell Triage** | 1 | shell | ps, processi in background, analisi dei log |
| **Git Survival** | 1 | shell | init, commit, branch, switch |
| **Python Debugging** | 2 | venv | pytest, traceback, pip, importazioni, dipendenze |
| **Service Debugging** | 1 | docker | log, processi, configurazione, endpoint |

## Ambienti di Esecuzione

Terminal Tutor utilizza tre ambienti di esecuzione, ognuno scelto per una ragione specifica:

- **shell** — La tua shell di sistema. Per la navigazione dei file, l'elaborazione del testo e Git. Avvio immediato.
- **venv** — Un ambiente virtuale Python reale. Per pip, pytest e il debug delle importazioni. Crea un ambiente virtuale reale con pacchetti reali.
- **docker** — Un container. Per la risoluzione dei problemi dei servizi, l'ispezione dei processi e qualsiasi cosa che richieda un isolamento completo. La rete è disabilitata per impostazione predefinita.

Esegui `terminal-tutor doctor` per vedere quali ambienti di esecuzione sono disponibili sul tuo sistema.

## Riferimento CLI

```
terminal-tutor list                    Show available lessons
terminal-tutor start <lesson-id>       Start or resume a lesson
terminal-tutor tracks                  Show skill tracks and progress
terminal-tutor track <track-id>        Show detailed track progress
terminal-tutor next                    Suggest next lesson
terminal-tutor mastery <lesson-id>     Show fluency signal for completed lesson
terminal-tutor progress                Show all lesson progress
terminal-tutor doctor                  Check system readiness
terminal-tutor runtimes                Show runtime availability
terminal-tutor reset <lesson-id>       Reset a lesson
terminal-tutor help                    Show help
```

## Per gli Utenti di Claude Code

Terminal Tutor è progettato per funzionare con Claude Code come livello di interazione conversazionale. Claude può:
- Avviare lezioni e presentare i passaggi in modo naturale
- Eseguire comandi e valutare i risultati tramite il motore del tutor
- Spiegare gli errori nel contesto, andando oltre i suggerimenti forniti
- Adattarsi a domande o approcci inaspettati

L'interfaccia a riga di comando (CLI) produce output strutturati in formato JSON, facilitando a Claude l'analisi dello stato della lezione, la valutazione dei risultati e la guida dell'utente.

## Sicurezza

Terminal Tutor opera **solo localmente** senza telemetria, chiamate di rete o gestione delle credenziali.

- **Dati accessibili:** Directory di lavoro temporanee (directory temporanea del sistema operativo), progressi della lezione (`~/.terminal-tutor/progress.json`)
- **Dati NON accessibili:** I tuoi progetti, la tua directory home, le configurazioni di sistema, i dati del browser, le credenziali
- **Nessuna telemetria** viene raccolta o inviata
- **Isolamento dell'ambiente di lavoro:** I file di pratica vengono creati in directory temporanee isolate. Il flag di sicurezza `workspace_only` impedisce ai comandi di uscire dall'area di pratica. Le lezioni Docker vengono eseguite con la rete disabilitata per impostazione predefinita.
- **Permessi:** Solo lettura/scrittura nella directory temporanea del sistema operativo e in `~/.terminal-tutor/`. Non sono richiesti né richiesti privilegi elevati.

Consulta [SECURITY.md](SECURITY.md) per la policy di segnalazione delle vulnerabilità.

## Creazione di Lezioni

Consultare il file [AUTHORING.md](AUTHORING.md) per le linee guida sulla creazione dei contenuti didattici. Regole fondamentali:

- Un file YAML per ogni lezione.
- Controlli basati sui risultati (verificare cosa è successo, non quale comando è stato eseguito).
- Suggerimenti progressivi che guidano dall'indicazione alla soluzione.
- Utilizzare l'ambiente di runtime più leggero che soddisfi le esigenze della lezione.
- Ogni lezione deve avere una "flavor" – uno scenario umano che fornisce il contesto.

## Licenza

MIT

---

Creato da [MCP Tool Shop](https://mcp-tool-shop.github.io/)
