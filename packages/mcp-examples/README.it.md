<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-examples/readme.png" alt="MCP Examples" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml/badge.svg" alt="Validate Examples"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-examples/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Esempi di ambienti di lavoro per [MCP Tool Shop](https://github.com/mcp-tool-shop).

## Come MCP Tool Shop si integra

- **Registro** ([mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry)) → quali strumenti sono disponibili.
- **Interfaccia a riga di comando (CLI)** ([mcpt](https://github.com/mcp-tool-shop-org/mcpt)) → come si utilizzano.
- **Esempi** → come si impara a utilizzare il sistema (questo repository).
- **Tag** (v0.1.0, v0.2.0) → stabilità, riproducibilità.
- **main** → solo per lo sviluppo; può essere modificato senza preavviso; le build potrebbero non funzionare.
- **Gli strumenti funzionano con il principio del minimo privilegio** → nessuna connessione di rete, nessuna scrittura, nessun effetto collaterale.
- **Le funzionalità sono sempre esplicite e attivabili su richiesta** → l'utente decide quando abilitarle.

## Esempi

| Esempio. | Descrizione. |
| --------- | ------------- |
| [hello-tools](./hello-tools/) | Il tuo primo ambiente di lavoro MCP in 2 minuti. |
| [hello-filesystem](./hello-filesystem/) | Effetti collaterali irreversibili gestiti in modo sicuro. |

## Guida rapida

```bash
cd hello-tools
python -m tools.echo.main "Hello, MCP!"
```

## Correlati

- [mcpt](https://github.com/mcp-tool-shop-org/mcpt) - Interfaccia a riga di comando per la scoperta e l'esecuzione di strumenti.
- [mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry) - Registro dei metadati degli strumenti.
