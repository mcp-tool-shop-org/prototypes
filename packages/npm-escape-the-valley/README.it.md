<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/escape-the-valley/readme.png" width="400" alt="Escape the Valley">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/escape-the-valley"><img src="https://img.shields.io/npm/v/@mcptoolshop/escape-the-valley" alt="npm version"></a>
  <a href="https://pypi.org/project/escape-the-valley/"><img src="https://img.shields.io/pypi/v/escape-the-valley" alt="PyPI"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-escape-the-valley/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/escape-the-valley/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Gioco di sopravvivenza in stile Oregon Trail con narrazione tramite intelligenza artificiale e uno zaino opzionale che utilizza la blockchain XRPL.

**Non è richiesto Python.** Questo pacchetto scarica un eseguibile precompilato e lo esegue localmente.

## Installazione ed esecuzione

```bash
npx @mcptoolshop/escape-the-valley tui --seed 42
```

Questo è tutto. Nessun Python, nessun pip, nessun ambiente virtuale.

### Continuare una partita salvata

```bash
npx @mcptoolshop/escape-the-valley tui --continue
```

Si riprende esattamente da dove ci si era fermati: il gioco salva automaticamente a ogni punto di controllo.

## Cosa succede

1. La prima esecuzione scarica un eseguibile specifico per la piattaforma (circa 15 MB) da [GitHub Releases](https://github.com/mcp-tool-shop-org/escape-the-valley/releases)
2. Verifica il checksum SHA256
3. Memorizza in cache localmente (`~/.cache/mcptoolshop/escape-the-valley/`)
4. Viene eseguito con il passaggio completo degli argomenti

Le esecuzioni successive si avviano istantaneamente dalla cache.

## Il gioco

Guida un gruppo di coloni attraverso una regione selvaggia generata proceduralmente. Gestisci cibo, acqua, condizioni del carro e morale, affrontando eventi, pericoli e scelte difficili. La valle è aspra ma giusta: un giocatore abile vince circa 1 partita su 3.

Un **Game Master basato sull'intelligenza artificiale** (alimentato da Ollama) narra la tua avventura con tre voci narranti. Uno zaino opzionale che utilizza la blockchain **XRPL Testnet** tiene traccia di ogni variazione delle risorse come transazioni sulla blockchain.

### Azioni in campo

| Azione | Cosa fa |
|--------|-------------|
| **Travel** | Avvicinarsi all'uscita: ogni turno in cui non ci si muove consuma risorse inutilmente. |
| **Rest** | Ripristinare salute e morale, con una possibilità di curare condizioni. |
| **Hunt** | Cercare cibo (meglio nelle foreste e nelle pianure). |
| **Repair** | Riparare i danni al carro prima che ti lasci a piedi. |
| **Ration** | Ridurre le razioni a metà quando il cibo è scarso (a costo del morale). |
| **Abandon** | Ridurre il peso del carico per aumentare la velocità (ultima risorsa). |

### Profili del Game Master

| Profilo | Voce |
|---------|-------|
| **Chronicler** | Tono asciutto, fattuale e storico. |
| **Fireside** | Narratore caloroso e popolare. |
| **Lantern-Bearer** | Tono inquietante, atmosferico e presagito. |

## Comandi

```bash
npx @mcptoolshop/escape-the-valley tui                    # start a new game
npx @mcptoolshop/escape-the-valley tui --seed 42          # seeded world gen
npx @mcptoolshop/escape-the-valley tui --continue         # resume saved game
npx @mcptoolshop/escape-the-valley tui --gm chronicler    # choose GM voice
npx @mcptoolshop/escape-the-valley tui --callouts minimal # fewer warnings
npx @mcptoolshop/escape-the-valley ledger                 # print trail ledger
npx @mcptoolshop/escape-the-valley --help                 # see all commands
```

## Piattaforme supportate

- Linux x64
- macOS ARM64 (Apple Silicon)
- Windows x64

## Risoluzione dei problemi

```bash
npx @mcptoolshop/escape-the-valley --print-cache-path  # show cached binary location
npx @mcptoolshop/escape-the-valley --clear-cache       # force fresh re-download
```

**Bloccare una versione specifica** se l'ultima versione presenta dei problemi:

```bash
npx @mcptoolshop/escape-the-valley@1.0.0 tui --seed 42
```

## Sicurezza

Tutti gli eseguibili vengono verificati rispetto ai checksum SHA256 prima dell'esecuzione. Nessuna telemetria. Nessun accesso alla rete oltre al download iniziale da GitHub.

Basato su [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternativa: installazione tramite Python

Se preferisci Python:

```bash
pip install escape-the-valley
trail tui --seed 42
```

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
