<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/linux-dev-typer/readme.png" alt="Linux Dev Typer logo" width="400"></p>

# linux-dev-typer

> Parte di [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/linux-dev-typer/actions/workflows/build.yml/badge.svg" alt="CI"></a>
  <a href="https://www.nuget.org/packages/LinuxDevTyper.Core"><img src="https://img.shields.io/nuget/v/LinuxDevTyper.Core" alt="NuGet"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/linux-dev-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Esercitazione di digitazione di codice per sviluppatori: Avalonia UI, difficoltà adattiva, monitoraggio delle tendenze, rilevamento della fatica.**

> Disponibile anche come applicazione nativa per Windows: [dev-op-typer](https://github.com/mcp-tool-shop-org/dev-op-typer) (WinUI 3, Microsoft Store)

---

## Perché Linux Dev Typer?

- **Esercitati con codice reale, non con testi.** Ogni frammento è un esempio reale di Python, Rust, JavaScript, C# o Java, non la classica frase "the quick brown fox".
- **Difficoltà adattiva.** Un sistema di valutazione ispirato a Elo si adatta al tuo livello di competenza per ogni linguaggio, con protezione contro le oscillazioni e rilevamento della zona di comfort.
- **Consapevolezza delle debolezze.** Le mappe di calore degli errori per carattere e le coppie di confusione guidano la selezione dei frammenti, permettendoti di esercitarti su ciò che ti risulta più difficile.
- **Consapevolezza della fatica.** Il motore rileva un calo delle prestazioni e suggerisce delle pause prima che si sviluppino cattive abitudini.
- **Multipiattaforma.** Basato su Avalonia UI, funziona su Linux, macOS e Windows a partire da un'unica base di codice.
- **Completamente offline.** Nessuna telemetria, nessun account, nessuna chiamata di rete. I tuoi dati di digitazione rimangono sulla tua macchina.
- **Estendibile.** Il motore principale è fornito come pacchetto NuGet autonomo con zero dipendenze dall'interfaccia utente.

---

## Pacchetti NuGet

| Pacchetto | Descrizione |
| --------- | ------------- |
| [`LinuxDevTyper.Core`](https://www.nuget.org/packages/LinuxDevTyper.Core) | Motore di esercitazione di digitazione portatile con valutazione Elo, difficoltà adattiva, mappe di calore delle debolezze, rilevamento della fatica, pianificazione delle sessioni e micro-esercizi. Zero dipendenze dall'interfaccia utente. |

Il motore principale è una libreria autonoma senza dipendenze da Avalonia o dalla piattaforma. Implementa `IStorage`, `IAudioService` e `IAssetProvider` per la tua piattaforma e avrai un trainer di digitazione completo.

---

## Funzionalità

### Motore di Digitazione Principale
- Feedback per carattere: corretto (verde acqua), errori (rosso con sottolineatura), non digitato (attenuato)
- Statistiche in tempo reale: WPM (parole al minuto), accuratezza, numero di errori, XP (punti esperienza)
- Sistema di valutazione per linguaggio ispirato a Elo
- Progressione di livello con XP e aumento della difficoltà
- Schede di completamento con spiegazioni dei frammenti
- Configurable: dimensione del carattere, regole per gli spazi bianchi, normalizzazione della fine delle righe

### Apprendimento Adattivo
- Tracciamento degli errori per carattere con classificazione dei simboli (10 categorie)
- Profilazione delle debolezze tra le sessioni con selezione adattiva dei frammenti
- Monitoraggio delle tendenze: tendenze in evoluzione di WPM e accuratezza per linguaggio
- Difficoltà adattiva con rilevamento della zona di comfort e protezione contro le oscillazioni
- Informazioni post-sessione: record personali, traguardi, segnali di tendenza
- Rilevamento della fatica con suggerimenti per le pause
- Modalità hardcore: correggi ogni errore prima di procedere

### Intento e Riflessione
- Selettore di intento per la pratica: tagga le sessioni come Riscaldamento, Esercizio, Esplorazione o Sfida
- Note della sessione e browser delle sessioni con ricerca/filtro
- Rilevamento del ritorno con saluti contestuali e invecchiamento automatico della difficoltà
- Sovrascrivi i suggerimenti del sistema: ignora i blocchi di oscillazione, i tipi di informazioni e gli avvisi di fatica
- Compressione mensile della cronologia per le sessioni superiori a 200
- Suggerimenti di orientamento: suggerimenti delicati prima della sessione basati sul contenuto
- Rilevamento di plateau con incoraggiamento
- Controlli di personalizzazione: blocca l'apprendimento, ripristina le preferenze

### Sistema di Contenuti
- Pacchetti di frammenti utente: inserisci file JSON in `~/.config/linux-dev-typer/packs/`
- Profili di pratica: set di parametri denominati che regolano il comportamento del motore
- Importa/esporta bundle `.ldtpack` per la condivisione dei contenuti
- Incolla codice, importa file, importa cartella con rilevamento automatico del linguaggio
- ID basati sull'indirizzo del contenuto (deduplicazione SHA-256)
- Pipeline canonica unificata: tutto il contenuto viene importato come CodeItem con difficoltà basata su metriche (D1–D7)

### Insegnamento e Comunità
- Strutture di apprendimento: contesto di apprendimento progressivo con livelli opzionali più approfonditi.
- Variazioni: implementazioni alternative presentate come elementi equivalenti.
- Note della comunità: suggerimenti e prospettive opzionali in file `.ldtpack`.
- Difficoltà stimata dalla comunità: indicatore visualizzato per la difficoltà determinata dagli utenti.
- Progettato per essere anonimo: i contenuti importati non sono distinguibili da quelli locali.
- Tutte le funzionalità di insegnamento e della comunità sono opzionali e visualizzate.

### Pratica strutturata
- 168 esempi di calibrazione in 5 lingue (copertura da D1 a D7).
- Pianificatore di sessioni: mix di Obiettivo (50%) / Revisione (30%) / Sfida (20%).
- Rilevamento delle debolezze con finestra a decadimento temporale.
- Trasparenza nella selezione: "Perché questo esempio" spiega ogni scelta.
- Mappa di calore degli errori per carattere, con coppie di errori comuni.
- Traiettorie delle debolezze: istantanee giornaliere per monitorare i progressi.

### Pratica guidata
- Modalità guidata: interruttore opzionale che consente ai segnali di debolezza di influenzare la selezione.
- Bias di debolezza: bias a livello di categoria limitato (+0 a +3, non modifica mai il livello di difficoltà).
- Micro-esercizi: sessioni di pratica mirate con 5 elementi, focalizzate sulla debolezza principale.
- Policy dei segnali: architettura con flag delle funzionalità, con interruttore principale e sottocomandi per ogni funzionalità.
- Gestione dello spazio di archiviazione: la mappa di calore è limitata a 200 caratteri, le coppie di errori a 20, le istantanee a 90.
- Predefinito: DISATTIVATO. Tutti i comportamenti precedenti vengono mantenuti a meno che non venga esplicitamente attivato.

### Audio
- 5 temi di suono per la tastiera (8 varianti ciascuno).
- 4 categorie di suoni ambientali (15 tracce in totale).
- Controlli del volume per canale e opzione di silenziamento.

### Accessibilità
- Interfaccia utente basata sulla tastiera, con indicatori di focus visibili.
- Modalità a basso impatto sensoriale (riduce i volumi audio).
- Tema scuro ad alto contrasto.

---

## Guida all'avvio

**Requisiti:** [.NET SDK 8.x](https://dotnet.microsoft.com/download/dotnet/8.0)

```bash
git clone https://github.com/mcp-tool-shop-org/linux-dev-typer.git
cd linux-dev-typer
dotnet restore
dotnet build -c Release
dotnet run --project src/LinuxDevTyper.App/LinuxDevTyper.App.csproj
```

---

## Esecuzione dei test

```bash
dotnet test
```

817 test che coprono tutti i moduli principali del motore.

---

## Struttura del progetto

| Path | Scopo |
| ------ | --------- |
| `src/LinuxDevTyper.Core` | Motore portatile: digitazione, valutazione, tendenze, difficoltà, profili, comunità, didattica, calibrazione, pianificazione, debolezze, mappa di calore, modalità guidata. |
| `src/LinuxDevTyper.Core.Tests` | Test xUnit (817 test) |
| `src/LinuxDevTyper.App` | Shell desktop Avalonia: interfaccia utente, servizi di piattaforma, importazione/esportazione. |
| `assets/snippets` | Pacchetti di esempi JSON integrati. |
| `assets/sounds` | File WAV (suoni ambientali + effetti sonori della tastiera). |
| `lib/meta-content-system` | Libreria di contenuti condivisi. |
| `docs/` | Documentazione dell'architettura, schemi, piani di sviluppo, guide per l'estensione. |

---

## Persistenza

File di stato: `~/.config/linux-dev-typer/state.json` (schema v12)

Per ripristinare: `rm -rf ~/.config/linux-dev-typer`

---

## Aggiunta del proprio codice

Ci sono tre modi per esercitarsi con il proprio codice:

### Opzione 1: Incolla il codice (il metodo più semplice)

1. Apri la barra laterale (clicca sull'icona dell'ingranaggio).
2. Trova la sezione **Incolla il codice**.
3. Incolla qualsiasi frammento di codice nella casella di testo.
4. Clicca su **Aggiungi**: la lingua viene rilevata automaticamente.
5. Il tuo codice apparirà immediatamente nella sequenza di esempi.

### Opzione 2: Importa un file o una cartella

1. Apri la barra laterale → trova **Importa**.
2. Clicca su **Importa file** per aggiungere un singolo file sorgente, oppure su **Importa cartella** per analizzare un intero progetto.
3. L'applicazione rileva automaticamente la lingua in base alle estensioni dei file (`.py`, `.rs`, `.js`, `.cs`, `.java`, `.sh`).
4. Il codice importato viene de-duplicato tramite hash del contenuto: lo stesso codice non viene mai aggiunto due volte.

### Opzione 3: Crea un pacchetto di esempi (JSON)

Per set curati di esempi di pratica:

1. Crea un file JSON nella cartella dei pacchetti:
```
~/.config/linux-dev-typer/packs/
```

2. Assegnare un nome al file basato sul linguaggio (ad esempio, `python.json`):
```json
{
"language": "python",
"snippets": [
{
"id": "my_list_comp",
"title": "Comprensione di liste",
"difficulty": 3,
"topics": ["liste", "comprensione"],
"code": "squares = [x**2 for x in range(10)]\n"
},
{
"id": "my_dict_comp",
"title": "Comprensione di dizionari",
"difficulty": 4,
"topics": ["dizionari", "comprensione"],
"code": "counts = {word: len(word) for word in words}\n"
}
]
}
```

3. Riavviare l'applicazione: i tuoi frammenti di codice verranno uniti a quelli integrati e potranno essere abilitati/disabilitati dalla barra laterale.

**Suggerimenti:**
- `id` deve essere univoco per tutti i pacchetti.
- `difficulty` varia da 1 (facile) a 7 (difficile).
- `code` deve terminare con `\n`.
- I pacchetti dell'utente possono essere attivati/disattivati senza eliminare il file.

### Condivisione dei contenuti

Esportare i propri frammenti di codice come un pacchetto portatile `.ldtpack`:

1. Aprire la barra laterale → cliccare su **Esporta**.
2. Condividere il file `.ldtpack` con altri.
3. Loro lo importeranno tramite la barra laterale → **Importa**.

Solo i contenuti creati dall'utente vengono trasferiti: non vengono mai salvate cronologie o impostazioni.

---

## Privacy

linux-dev-typer funziona completamente offline. Nessun dato viene raccolto, trasmesso o condiviso.

## Licenza

[MIT](LICENSE)
