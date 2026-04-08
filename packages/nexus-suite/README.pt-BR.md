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

**Infraestrutura de governança, autenticação e roteamento para ecossistemas de ferramentas MCP.**

---

## Visão Geral

- **Autenticação:** Assine e verifique os resultados das ferramentas com `nexus-attest`.
- **Governança:** Defina e aplique políticas com `nexus-control`.
- **Roteamento:** Direcione solicitações por meio de adaptadores modulares com `nexus-router`.
- **Modular:** Seis pacotes independentes, utilize o que você precisa.
- **Nativo do Python:** Fluxo de trabalho padrão `pip install -e .`, `pytest` para testes.

---

## Projetos

| Pacote | Descrição |
| --------- | ------------- |
| `nexus-attest` | Assinatura e verificação de autenticação. |
| `nexus-control` | Plano de controle para políticas de governança. |
| `nexus-router` | Roteamento e direcionamento de solicitações. |
| `nexus-router-adapter-stdout` | Adaptador de roteador para transporte via stdout. |
| `nexus-router-adapter-http` | Adaptador de roteador para transporte via HTTP. |
| `nexus-router-adapter-template` | Modelo para criar adaptadores personalizados. |

---

## Início Rápido

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

## Arquitetura

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

## Licença

[MIT](LICENSE)
