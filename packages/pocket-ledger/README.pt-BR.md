<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/pocket-ledger/readme.png" width="400" alt="Pocket Ledger">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/pocket-ledger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Um aplicativo para Windows de gerenciamento financeiro pessoal e controle de orçamento, com foco na privacidade e simplicidade.

## Filosofia

- **Prioridade para dados locais**: Seus dados financeiros permanecem no seu dispositivo. Não é necessário sincronizar com a nuvem.
- **Privacidade por design**: Sem coleta de dados, sem conexões externas, a menos que você permita.
- **Orçamento por categorias (envelopes)**: Metodologia comprovada que atribui um propósito a cada valor.
- **Foco em objetivos**: Concentre-se no que você está economizando, e não apenas no que você está gastando.

## Funcionalidades (Planejadas)

- [ ] Rastreamento de transações com categorias
- [ ] Sistema de orçamento por categorias (envelopes)
- [ ] Metas de economia com acompanhamento visual do progresso
- [ ] Gerenciamento de transações recorrentes
- [ ] Análises e relatórios visuais de gastos
- [ ] Suporte para múltiplas contas
- [ ] Importação/exportação em formato CSV
- [ ] Suporte para temas claro/escuro

## Tecnologias Utilizadas

- **.NET 8** - Ambiente de execução moderno e de alto desempenho
- **WinUI 3 / Windows App SDK** - Experiência nativa no Windows 11
- **SQLite** - Banco de dados local e portátil
- **Arquitetura Limpa** - Camadas fáceis de manter e testar

## Estrutura do Projeto

```
src/
├── PocketLedger.Domain/        # Core entities and business rules
├── PocketLedger.Application/   # Use cases and application logic
├── PocketLedger.Infrastructure/# Data persistence, external services
└── PocketLedger.Desktop/       # WinUI 3 presentation layer
tests/
├── PocketLedger.Domain.Tests/
├── PocketLedger.Application.Tests/
└── PocketLedger.Infrastructure.Tests/
```

## Desenvolvimento

### Pré-requisitos

- Windows 10/11
- Visual Studio 2022 (17.8+) ou VS Code com C# Dev Kit
- SDK .NET 8
- Windows App SDK

### Compilação

```bash
dotnet build
```

### Execução de Testes

```bash
dotnet test
```

## Licença

Licença MIT - Consulte [LICENSE](LICENSE) para detalhes.

## Contribuições

Contribuições são bem-vindas! Por favor, leia nossas diretrizes de contribuição antes de enviar suas alterações.

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
