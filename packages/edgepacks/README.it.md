<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/edgepacks/readme.png" width="400" alt="EdgePacks" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/actions"><img src="https://github.com/mcp-tool-shop-org/edgepacks/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/edgepacks/"><img src="https://img.shields.io/badge/docs-landing%20page-brightgreen" alt="Landing Page" /></a>
</p>

Una piattaforma per la creazione di set di dati per l'addestramento di modelli di piccole dimensioni, specifici per compiti particolari.

## Di cosa si tratta

Una libreria di set di dati strutturati, ben definiti e privi di problemi di licenza, progettati per l'addestramento di modelli con capacità specifiche. Ogni set di dati include regole di generazione, regole di validazione, set di valutazione e percorsi di esportazione per le configurazioni di fine-tuning più comuni.

## Cosa NON è

- Un archivio generico di set di dati
- Un wrapper per HuggingFace
- Un framework di addestramento

## Installazione

```bash
pip install edgepacks
```

## Guida rapida

```bash
# List available packs
edgepacks list

# Inspect a pack
edgepacks info tool-routing

# Build a dataset (requires Ollama running locally)
edgepacks build tool-routing --count 2000 --model qwen2.5:7b

# Export for your trainer
edgepacks export tool-routing --format unsloth --output ./data/
```

## Avvio dei set di dati

| Set di dati | Compito | Cosa addestra |
|------|------|---------------|
| `tool-routing` | Classificazione | Richiesta in linguaggio naturale → strumento corretto + argomenti |
| `structured-extraction` | Estrazione | Testo non strutturato → JSON strutturato |
| `error-triage` | Classificazione | Log degli errori → causa + gravità + prossimo passo |

## Architettura

Tre livelli:

1. **Schema:** specifica formale di cosa è un set di dati.
2. **Foundry:** sistema che crea, valida e suddivide i set di dati.
3. **Delivery:** interfaccia a riga di comando (CLI) + esportazione in formati JSONL, HuggingFace, Unsloth, torchtune.

## Ogni set di dati include:

- Definizione del compito + schema standard
- Suddivisioni in training, validazione e test
- Esempi positivi e negativi "difficili"
- Ricetta di generazione (sintetica tramite Ollama)
- Validatore che rifiuta righe malformate o con segnale debole
- Set di valutazione che testa la competenza effettiva dopo il fine-tuning
- Esportazione in formati compatibili con gli strumenti più comuni

## Sicurezza e Affidabilità

**Dati accessibili:** File `.json` / `.jsonl` locali nelle directory di output specificate dall'utente. Gli esempi iniziali sono inclusi nel pacchetto. Gli esempi generati vengono scritti in `./output/` o in un percorso da voi specificato.

**Rete:** Solo connessioni HTTP verso Ollama locale (`localhost:11434`) per la generazione sintetica. Nessuna API cloud, nessuna telemetria, nessuna analisi. Funziona completamente offline una volta che Ollama è disponibile.

**Dati NON accessibili:** Nessun file di credenziali, nessun file di sistema, nessuna variabile d'ambiente. Non legge né scrive al di fuori della directory di output specificata.

**Nessuna telemetria** viene raccolta o inviata.

## Piattaforme

- Python 3.11+
- Funziona su Linux, macOS, Windows
- Ollama richiesto solo per i comandi `generate`, `mutate` e `build`

## Licenza

MIT

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
