<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# Dev-Op-Typer

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/dev-op-typer/readme.png" alt="Dev-Op-Typer" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml"><img src="https://github.com/mcp-tool-shop-org/dev-op-typer/actions/workflows/build.yml/badge.svg" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/dev-op-typer/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Un'applicazione per la pratica della digitazione focalizzata sugli sviluppatori per Windows: ogni test utilizza codice reale.**

> Disponibile anche per Linux/macOS: [linux-dev-typer](https://github.com/mcp-tool-shop-org/linux-dev-typer) (Avalonia UI)

## Funzionalità

### Pratica con codice reale
- Digita frammenti di codice reali in **Python, JavaScript, C#, Java, SQL e Bash**
- Monitoraggio preciso della digitazione carattere per carattere con evidenziazione delle differenze
- Corrispondenza esatta dei simboli: `{ } [ ] ( ) < > ; : , . " ' \`
- Importanza di nuove righe e indentazione

### Apprendimento adattivo
- Selezione intelligente dei frammenti in base al tuo livello di competenza
- Sistema di valutazione simile a Elo per ogni linguaggio
- Pianificatore delle sessioni: mix Obiettivo (50%) / Revisione (30%) / Sfida (20%)
- Mappa di calore degli errori per carattere con traiettorie delle debolezze
- Modalità Guida: selezione opzionale basata sulle debolezze con esercizi mirati
- Scala di difficoltà (D1–D7) con rilevamento della zona di comfort

### Statistiche in tempo reale
- WPM (parole al minuto), precisione e numero di errori in tempo reale
- Completamento della sessione con approfondimenti retrospettivi
- Monitoraggio delle tendenze: WPM e precisione per linguaggio
- Rilevamento della fatica con suggerimenti per le pause
- Pannello delle aree deboli con analisi a livello di carattere

### Insegnamento e comunità
- Suggerimenti contestuali progressivi con livelli "Più contesto"
- Dimostrazioni: implementazioni alternative mostrate come pari
- Segnali della comunità: suggerimenti e valutazioni di difficoltà visualizzate
- Note di guida dai pacchetti di contenuti condivisi
- Pannello dei livelli di competenza per una migliore comprensione strutturale

### Sistema di contenuti
- 168+ frammenti di calibrazione in 6 lingue
- Pacchetti di frammenti utente: inserisci file JSON nella cartella dei pacchetti
- Incolla codice: incolla qualsiasi codice dalla clipboard come contenuto di pratica
- Importa file/cartella: indicizza i file sorgente con rilevamento automatico del linguaggio
- Esporta/Importa bundle `.ldtpack` per la condivisione dei contenuti
- ID basati sull'indirizzo dei contenuti (deduplicazione SHA-256)

### Audio
- Paesaggi sonori ambientali con più temi
- Suoni di tastiera meccanica (5 temi, 8 variazioni ciascuno)
- Controlli del volume per canale (ambiente, tastiera, interfaccia utente)
- Disattiva/attiva l'audio dalla barra del titolo

### Accessibilità
- Navigazione completa tramite tastiera
- Supporto per temi ad alto contrasto
- Opzione per ridurre le animazioni
- Proprietà di accessibilità su tutti gli elementi interattivi

### Persistenza
- Profilo con XP, livelli e valutazioni per linguaggio
- Impostazioni e selezione della lingua salvate tra le sessioni
- Cronologia delle sessioni (fino a 500 record) con compressione mensile
- Configurazione della pratica: set di parametri denominati per la messa a punto del motore

## Installazione

### Microsoft Store (consigliato)
In arrivo: in attesa di certificazione dallo Store.

### Compila dal codice sorgente

**Requisiti:**
- Windows 10 versione 1809+ o Windows 11
- .NET 10.0 SDK
- Visual Studio 2022 (con workload Windows App SDK) — oppure CLI

```bash
git clone https://github.com/mcp-tool-shop-org/dev-op-typer.git
cd dev-op-typer
dotnet build DevOpTyper/DevOpTyper.csproj -c Release -p:Platform=x64
```

Esegui l'eseguibile compilato:
```
DevOpTyper\bin\x64\Release\net10.0-windows10.0.19041.0\DevOpTyper.exe
```

## Struttura del progetto

```
DevOpTyper/
├── Assets/
│   ├── Icons/         # App icons and Store tile assets
│   ├── Snippets/      # JSON snippet packs by language
│   └── Sounds/        # Ambient and SFX audio files
├── Controls/          # Custom controls (CodeRenderer, TypingPresenter)
├── Models/            # Data models (Profile, Snippet, AppSettings, etc.)
├── Panels/            # UI panels (Typing, Stats, Settings, Explanation, etc.)
├── Services/          # Core services (Audio, Typing, Persistence, Content)
├── Themes/            # Color and high-contrast themes
├── MainWindow.xaml    # Main application window
└── Package.appxmanifest  # MSIX packaging manifest
external/
└── meta-content-system/  # Shared content library (submodule)
```

## Scorciatoie da tastiera

| Key | Azione |
|-----| -------- |
| Tab / Shift+Tab | Naviga tra i controlli |
| Enter | Avvia un nuovo test |
| Escape | Ripristina il test corrente |

## Aggiunta del tuo codice

Ci sono tre modi per esercitarsi con il tuo codice:

### Opzione 1: Incolla codice (il più semplice)

1. Apri il pannello **Impostazioni** (clicca sull'icona ⚙ nella barra del titolo)
2. Scorri fino a **Incolla codice**
3. Incolla qualsiasi frammento di codice nella casella di testo
4. Clicca su **Aggiungi** — il linguaggio viene rilevato automaticamente
5. Il tuo codice apparirà immediatamente nella rotazione dei frammenti

### Opzione 2: Importa un file o una cartella

1. Aprire **Impostazioni** → scorrere fino a **Importa**
2. Cliccare su **Importa file** per aggiungere un singolo file sorgente, oppure su **Importa cartella** per analizzare un intero progetto.
3. L'applicazione rileva automaticamente la lingua in base alle estensioni dei file (`.py`, `.js`, `.cs`, `.java`, `.sql`, `.sh`).
4. Il codice importato viene de-duplicato tramite l'hash del contenuto: lo stesso codice non viene mai aggiunto due volte.

### Opzione 3: Creare un pacchetto di snippet (JSON)

Per set curati di snippet di esempio:

1. Aprire la cartella degli snippet dell'utente:
```
%LocalAppData%\DevOpTyper\UserSnippets\
```
(oppure cliccare su **Apri cartella degli snippet** nelle Impostazioni)

2. Creare un file JSON con il nome del linguaggio (ad esempio, `python.json`):
```json
{
"language": "python",
"snippets": [
{
"id": "my_list_comp",
"title": "List comprehension",
"difficulty": 3,
"topics": ["lists", "comprehension"],
"code": "squares = [x**2 for x in range(10)]\n"
},
{
"id": "my_dict_comp",
"title": "Dictionary comprehension",
"difficulty": 4,
"topics": ["dicts", "comprehension"],
"code": "counts = {word: len(word) for word in words}\n"
}
]
}
```

3. Riavviare l'applicazione: i tuoi snippet appariranno insieme a quelli integrati.

**Suggerimenti:**
- `id` deve essere univoco in tutti i pacchetti.
- `difficulty` varia da 1 (facile) a 7 (difficile).
- `code` deve terminare con `\n`.
- È possibile organizzare i pacchetti in sottocartelle di un livello di profondità.

### Condivisione dei contenuti

Esportare i propri snippet come un pacchetto portatile `.ldtpack`:

1. Aprire **Impostazioni** → cliccare su **Esporta pacchetto**
2. Condividere il file `.ldtpack` con altri.
3. Loro lo importeranno tramite **Impostazioni** → **Importa pacchetto**.

Solo i contenuti creati dall'utente vengono trasferiti: non vengono trasferiti la cronologia delle attività o le impostazioni.

## Privacy

Dev-Op-Typer funziona completamente offline. Nessun dato viene raccolto, trasmesso o condiviso. Consultare [PRIVACY.md](PRIVACY.md).

## Licenza

[MIT](LICENSE)
