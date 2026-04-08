<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ledger-suite/readme.png" width="400" alt="Ledger Suite">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ledger-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Repositório unificado para sistemas de registro de rastreabilidade criptográfica.

## Projetos

| Projeto | Descrição | Testes |
| --------- | ------------- | ------- |
| `src/ClaimLedger/` | Rastreabilidade e verificação de alegações científicas. | 371 |
| `src/CreatorLedger/` | Provas de autenticidade do criador. | 219 |
| `src/CreatorLedger/Shared.Crypto/` | Funções criptográficas Ed25519 compartilhadas. | - |

## Início rápido

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/ledger-suite.git
cd ledger-suite

# Build all
dotnet build ledger-suite.sln

# Test all
dotnet test ledger-suite.sln

# Run ClaimLedger CLI
dotnet run --project src/ClaimLedger/ClaimLedger.Cli -- --help

# Run CreatorLedger CLI
dotnet run --project src/CreatorLedger/CreatorLedger.Cli -- --help
```

## Estrutura

```
ledger-suite/
├── ledger-suite.sln          # Root solution
├── src/
│   ├── ClaimLedger/          # Scientific claims
│   │   ├── ClaimLedger.Domain/
│   │   ├── ClaimLedger.Application/
│   │   ├── ClaimLedger.Infrastructure/
│   │   ├── ClaimLedger.Cli/
│   │   └── ClaimLedger.Tests/
│   └── CreatorLedger/        # Creator proofs
│       ├── CreatorLedger.Domain/
│       ├── CreatorLedger.Application/
│       ├── CreatorLedger.Infrastructure/
│       ├── CreatorLedger.Cli/
│       ├── CreatorLedger.Tests/
│       └── Shared.Crypto/    # Shared crypto
```

## Características do ClaimLedger:

- **Afirmação de alegações** com assinaturas Ed25519.
- **Citações** que vinculam as alegações a provas criptográficas.
- **Atestados** (revisão por pares, reprodução, aprovação institucional).
- **Revogações** com assinaturas de testemunhas.
- **Carimbos de tempo RFC 3161** para não repúdio.
- **ClaimPacks** para pacotes prontos para distribuição.
- **Registro local** para resolução de citações offline.
- **Comando de publicação** para distribuição com um clique.

## Características do CreatorLedger:

- **Provas de autenticidade do criador** para ativos digitais.
- **Verificação de hash de conteúdo**.
- **Cadeias de atestados multipartes**.
- **Pacotes de provas** para verificação portátil.

## Licença

MIT

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
