<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nexus-suite/readme.png" alt="Nexus Suite" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nexus-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Infrastruttura di governance, attestazione e routing per gli ecosistemi di strumenti MCP.**

---

## Panoramica

- **Attestazione:** firmare e verificare i risultati degli strumenti con `nexus-attest`.
- **Governance:** definire e applicare politiche con `nexus-control`.
- **Routing:** instradare le richieste tramite adattatori modulari con `nexus-router`.
- **Componibile:** sei pacchetti indipendenti, utilizzare solo ciò di cui si ha bisogno.
- **Nativo per Python:** flusso di lavoro standard `pip install -e .`, `pytest` per i test.

---

## Progetti

| Pacchetto | Descrizione |
| --------- | ------------- |
| `nexus-attest` | Firma e verifica dell'attestazione. |
| `nexus-control` | Strato di controllo per le politiche di governance. |
| `nexus-router` | Instradamento e dispatch delle richieste. |
| `nexus-router-adapter-stdout` | Adattatore del router per il trasporto tramite stdout. |
| `nexus-router-adapter-http` | Adattatore del router per il trasporto HTTP. |
| `nexus-router-adapter-template` | Modello per la creazione di adattatori personalizzati. |

---

## Guida rapida

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/nexus-suite.git
cd nexus-suite

# Install a component
cd src/nexus-router
pip install -e .

# Run tests
pytest
```

---

## Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                     nexus-control                            │
│              (governance policies, config)                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-router                             │
│              (request dispatch + routing)                    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   stdout    │      │    http     │      │  (custom)   │
│   adapter   │      │   adapter   │      │   adapter   │
└─────────────┘      └─────────────┘      └─────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-attest                             │
│              (signature verification)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Licenza

[MIT](LICENSE)
