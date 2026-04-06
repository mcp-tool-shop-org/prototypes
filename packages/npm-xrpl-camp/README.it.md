<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/xrpl-camp/readme.png" width="400" alt="xrpl-camp" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/xrpl-camp"><img src="https://img.shields.io/npm/v/@mcptoolshop/xrpl-camp" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-xrpl-camp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/xrpl-camp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Impara a usare il ledger XRP in una sola sessione: portafoglio, pagamenti, verifica e certificato in 10 minuti.

**Non è richiesto Python.** Questo pacchetto scarica un eseguibile precompilato e lo esegue localmente.

## Installazione ed esecuzione

```bash
npx @mcptoolshop/xrpl-camp start
```

Ed è tutto. Nessun Python, nessun pip, nessun ambiente virtuale.

## Cosa succede

1. La prima esecuzione scarica un eseguibile specifico per la piattaforma (circa 20 MB) da [GitHub Releases](https://github.com/mcp-tool-shop-org/xrpl-camp/releases).
2. Verifica il checksum SHA256.
3. Memorizza in cache localmente (`~/.cache/mcptoolshop/xrpl-camp/`).
4. Viene eseguito con il passaggio completo degli argomenti.

Le esecuzioni successive vengono avviate istantaneamente dalla cache.

## Comandi

```bash
npx @mcptoolshop/xrpl-camp start      # begin the training
npx @mcptoolshop/xrpl-camp status     # check progress
npx @mcptoolshop/xrpl-camp --help     # see all commands
```

## Piattaforme supportate

- Linux x64
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Windows x64

## Sicurezza

Tutti gli eseguibili vengono verificati rispetto ai checksum SHA256 prima dell'esecuzione. Nessuna telemetria. Nessun accesso alla rete oltre al download iniziale da GitHub.

Basato su [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternativa: installazione tramite Python

Se preferisci Python:

```bash
pipx install xrpl-camp
xrpl-camp start
```

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
