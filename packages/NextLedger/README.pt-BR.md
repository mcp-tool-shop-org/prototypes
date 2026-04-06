<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# NextLedger

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/NextLedger/readme.png" alt="NextLedger" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/NextLedger/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/NextLedger/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/NextLedger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Orçamento por "envelopes" para Windows — atribua um propósito a cada real.**

Um aplicativo pessoal de finanças para Windows que utiliza a metodologia de orçamento por "envelopes". Seus dados permanecem no seu dispositivo, sem necessidade de conexão com a nuvem. Foi desenvolvido como um **"ledger" do futuro** — um sistema confiável de informações financeiras, com a participação ativa do usuário em cada etapa.

## Download

📦 **[Última versão](https://github.com/mcp-tool-shop-org/NextLedger/releases/latest)**

Baixe o arquivo ZIP, extraia e execute `NextLedger.App.exe`. Não é necessário instalar.

## O que é o orçamento por "envelopes"?

O orçamento por "envelopes" é um método simples e comprovado, onde você aloca sua renda em "envelopes" virtuais para diferentes categorias de gastos. Você só pode gastar o que está em cada "envelope", tornando o excesso de gastos impossível.

## Recursos

- **Funciona offline**: Seus dados permanecem no seu computador. Não é necessária conexão com a nuvem.
- **Orçamento por "envelopes"**: Atribua um propósito a cada valor.
- **Múltiplas contas**: Acompanhe contas correntes, poupança, cartões de crédito e dinheiro em espécie.
- **Rastreamento de transações**: Categorize e pesquise seus gastos.
- **Importação de CSV**: Importe extratos bancários facilmente.
- **Conciliação**: Compare seus registros com os extratos bancários.
- **Nativo do Windows**: Desenvolvido com WinUI 3 para uma experiência moderna no Windows.

## Capturas de tela

*Em breve*

## Documentação

- [Histórico de alterações](CHANGELOG.md)
- [Códigos de erro do sistema](ENGINE_ERROR_CODES.md)
- [Processo de lançamento](docs/RELEASE_PROCESS.md)
- [Visão do "ledger" do futuro](docs/FUTURE_LEDGER_VISION.md)
- [Lista de verificação para execução do "ledger"](docs/LEDGER_EXECUTION_CHECKLIST.md)

## Tecnologia

- **Interface do usuário (UI)**: WinUI 3 / Windows App SDK
- **Linguagem**: C# / .NET 9
- **Banco de dados**: SQLite (local)
- **Arquitetura**: Arquitetura limpa com MVVM

## Status do projeto

✅ **v1.0.0** - Pronto para lançamento

Funcionalidades principais concluídas:
- Gerenciamento de orçamento com alocações mensais
- Rastreamento de transações com suporte para divisão de valores
- Importação de CSV de extratos bancários
- Conciliação de contas
- Análise de gastos por "envelope"
- Ajuda e orientações dentro do aplicativo

Consulte [DESIGN.md](DESIGN.md) para obter detalhes sobre a arquitetura.

## Roteiro

O NextLedger está evoluindo para um **"ledger" do futuro** — veja [Visão do "ledger" do futuro](docs/FUTURE_LEDGER_VISION.md) para obter detalhes sobre a arquitetura completa.

| Layer | Status | Descrição |
| ------- | -------- | ------------- |
| Observação | ✅ Completo | Saldos, transações e contas locais |
| Interpretação | ✅ Completo | Orçamento por "envelopes", análise de gastos |
| Declaração de Intenção | 🔜 Planejado | Metas de orçamento, regras de alocação |
| Aplicação de Restrições | 🔜 Planejado | Limites de orçamento, proteção contra gastos excessivos |
| Execução Aprovada pelo Usuário | 🔮 Futuro | Integração com Web3 (não custódial) |

## Desenvolvimento

### Pré-requisitos

- Windows 10 (1809+) ou Windows 11
- Visual Studio (2022 17.8+ ou mais recente) com:
- Carga de trabalho de desenvolvimento para desktop .NET
- Modelos do Windows App SDK em C#
- Windows SDK / MSIX (ferramentas de compilação Appx/PRI)
- SDK .NET 9

**Observação sobre as compilações via linha de comando (WinUI):** O projeto WinUI (`NextLedger.App`) executa etapas de compilação do Windows App SDK que requerem as assemblies de tarefas MSBuild Appx/MSIX + PRI. Se você vir um erro como `MSB4062` referenciando a falta de `Microsoft.Build.AppxPackage.dll` ou `Microsoft.Build.Packaging.Pri.Tasks.dll`, instale os componentes do Windows SDK / MSIX através do instalador do Visual Studio (ou compile o aplicativo dentro do Visual Studio).

### Compilação

```bash
dotnet restore
dotnet build
```

### Como executar o aplicativo

**Visual Studio (recomendado)**

1. Abra `NextLedger.sln` no Visual Studio 2022.
2. Defina `NextLedger.App` como o projeto de inicialização.
3. Execute com **F5**.

**Linha de comando (compilação + execução)**

```bash
dotnet build .\src\NextLedger.App\NextLedger.App.csproj -c Debug
```

Se isso falhar com `MSB4062`, consulte a observação em **Pré-requisitos**.

Em seguida, execute o arquivo executável gerado a partir da pasta de saída da compilação, localizada em:

- `.\src\NextLedger.App\bin\Debug\net9.0-windows10.0.19041.0\`

**Localização dos dados locais**

O aplicativo cria um banco de dados SQLite local em:

- `%LOCALAPPDATA%\NextLedger\NextLedger.db`

### Executando testes

```bash
dotnet test
```

## Licença

Licença MIT - veja o arquivo LICENSE para detalhes.

## Autor

Criado por [mcp-tool-shop](https://github.com/mcp-tool-shop-org)
