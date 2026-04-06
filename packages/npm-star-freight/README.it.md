<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/star-freight/readme.png" alt="Star Freight -- Trade. Decide. Survive." width="400">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/star-freight"><img src="https://img.shields.io/npm/v/@mcptoolshop/star-freight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

# @mcptoolshop/star-freight

> RPG a riga di comando per commercianti spaziali -- installazione npx senza prerequisiti.

```bash
npx @mcptoolshop/star-freight
```

Oppure, installare globalmente:

```bash
npm i -g @mcptoolshop/star-freight
star-freight
```

Non sono richiesti Python, pip o strumenti di compilazione. I file binari precompilati vengono scaricati, verificati con SHA256 e memorizzati nella cache localmente.

---

## Il gioco

Eri un pilota militare. Poi sei diventato un fallimento. Ora sei un capitano con una nave malconcia, senza reputazione e in un sistema stellare che si muoveva già prima che tu arrivassi.

**Star Freight** è un RPG tattico a tema mercantile, incentrato sul trasporto di merci in un sistema stellare politicamente diviso. Cinque civiltà. Un'unica economia. Quattro verità che non ti permetteranno di vivere la stessa vita due volte.

Ti fermi in stazioni dove la cultura influenza il modo in cui negozi. Scegli percorsi dove il terreno influenza il modo in cui combatti. Assumi membri dell'equipaggio che cambiano ciò che puoi fare, a cosa puoi accedere e cosa devi. Accetti contratti che sembrano semplici finché la burocrazia non si mette di mezzo, la scarsità cambia il prezzo o il carico si rivela essere una prova.

## Perché è diverso

**L'equipaggio è legge vincolante.** Thal non è solo un bonus del +10% alle riparazioni. Thal è *il motivo* per cui puoi attraccare nelle stazioni di Keth, *il motivo* per cui la tua nave ha una capacità di riparazione di emergenza e *il motivo* per cui hai notato che il carico medico non corrispondeva alla stagione. Perdere Thal significa perdere tre sistemi di capacità contemporaneamente.

**Il combattimento è un evento della campagna.** La vittoria ti fa guadagnare crediti di recupero e "calore" con le fazioni. La ritirata costa carico abbandonato e una reputazione di codardo. La sconfitta significa carico confiscato, membri dell'equipaggio feriti e una nave che si trascina verso la stazione più vicina a un prezzo elevato.

**La cultura è logica sociale.** I Keth non hanno solo prezzi diversi. Hanno un calendario biologico stagionale che cambia il significato dei regali e quando fare una proposta è un'offesa. I Veshan ti mettono alla prova, e rifiutare è peggio che perdere.

**L'indagine emerge dalla vita.** Noti che il carico medico non corrisponde alla stagione perché lo stai trasportando. La cospirazione non si annuncia. Ci ti imbatti facendo il tuo lavoro.

## Il mondo

Cinque civiltà condividono un sistema stellare chiamato Threshold.

**Il Terran Compact** -- Governo umano burocratico. Ti hanno umiliato. Ritornare significa ottenere permessi, avere pazienza e ingoiare l'orgoglio.

**La Keth Communion** -- Collettivo di artropodi con un calendario biologico. I migliori margini di profitto nel sistema se capisci le stagioni. Il crollo della reputazione più rapido se non lo fai.

**Le Veshan Principalities** -- Case feudali di rettili ossessionate dall'onore e dal debito. Il Registro dei Debiti non è solo un dettaglio. È un'arma di pressione.

**L'Orryn Drift** -- Civiltà di broker mobili. Fanno affari con tutti, sanno tutto e fanno pagare per entrambi.

**La Sable Reach** -- Fazioni pirata, recuperatori di tecnologia ancestrale e persone che il Compact preferirebbe dimenticare. Nessuna legge. Nessuna dogana. Nessun rimborso.

## Tre tipi di capitano

**Capitano di soccorso.** Disciplina della scorta, accesso basato sulla fiducia, conseguenze pubbliche. Mantieni le persone nutrite e vieni intrappolato dalla legittimità.

**Corriere grigio.** Pressione tramite documenti, abuso dei tempi, rischio istituzionale. Fai soldi rimanendo difficile da decifrare.

**Capitano d'onore.** Confronto diretto, politica interna, volatilità della reputazione. Risolvi i problemi faccia a faccia.

Questi non sono classi. Sono ciò in cui le tue scelte ti hanno trasformato.

## Come funziona questo pacchetto

Questo pacchetto npm utilizza [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) per:

1. Scaricare il file binario precompilato di Star Freight da [GitHub Releases](https://github.com/mcp-tool-shop-org/star-freight/releases).
2. Verificare i checksum SHA256.
3. Memorizzare nella cache localmente (`~/.cache/mcptoolshop/star-freight/`).
4. Eseguire il programma con i parametri desiderati.

### Gestione della cache

```bash
star-freight --print-cache-path
star-freight --clear-cache
```

### Supporto per le piattaforme

| Piattaforma | File binario |
|----------|--------|
| Linux x64 | `star-freight-<version>-linux-x64` |
| macOS ARM64 | `star-freight-<version>-darwin-arm64` |
| Windows x64 | `star-freight-<version>-win-x64.exe` |

## Sicurezza

**Modello di minaccia:** Questo pacchetto scarica file binari precompilati da GitHub Releases tramite HTTPS e verifica i checksum SHA256 prima dell'esecuzione. Non raccoglie dati di telemetria, non memorizza credenziali, non effettua richieste di rete al di fuori di `github.com` e non scrive al di fuori della directory di cache dell'utente (`~/.cache/mcptoolshop/star-freight/`). Il file binario eseguito opera con i permessi dell'utente che lo ha avviato e salva i dati di gioco solo nella directory di lavoro corrente. Consultare il file [SECURITY.md](SECURITY.md) per la politica completa.

## Repository del codice sorgente

Il codice sorgente del gioco è disponibile su [mcp-tool-shop-org/star-freight](https://github.com/mcp-tool-shop-org/star-freight).

## Licenza

MIT

---

*Star Freight è un gioco che parla di come muoversi all'interno di sistemi di potere senza mai appartenervi completamente.*

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
