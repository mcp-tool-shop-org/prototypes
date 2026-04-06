<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center"><img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/InControl-Desktop/readme.png" alt="InControl Desktop" width="400"></p>

<h1 align="center">InControl Desktop</h1>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/InControl-Desktop/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/mcp-tool-shop-org/InControl-Desktop/ci.yml?branch=main&style=flat-square&label=CI" alt="CI"></a>
  <a href="https://www.nuget.org/packages/InControl.Core"><img src="https://img.shields.io/nuget/v/InControl.Core?style=flat-square&label=InControl.Core" alt="InControl.Core NuGet"></a>
  <a href="https://www.nuget.org/packages/InControl.Inference"><img src="https://img.shields.io/nuget/v/InControl.Inference?style=flat-square&label=InControl.Inference" alt="InControl.Inference NuGet"></a>
  <img src="https://img.shields.io/badge/.NET-9-purple?style=flat-square&logo=dotnet" alt=".NET 9">
  <img src="https://img.shields.io/badge/WinUI-3-blue?style=flat-square" alt="WinUI 3">
  <a href="LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/InControl-Desktop?style=flat-square" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/InControl-Desktop/"><img src="https://img.shields.io/badge/Landing_Page-live-blue?style=flat-square" alt="Landing Page"></a>
</p>

**Assistente de Chat Local com IA para Windows**

Um aplicativo de chat com foco na privacidade e otimizado para GPU, que executa modelos de linguagem grandes inteiramente na sua máquina. Não requer conexão com a nuvem.

## Por que InControl?

- **Privacidade em primeiro lugar:** Suas conversas nunca saem do seu computador.
- **Otimizado para RTX:** Projetado para GPUs NVIDIA com aceleração CUDA.
- **Experiência nativa do Windows:** WinUI 3 com design Fluent.
- **Múltiplos backends:** Ollama, llama.cpp, ou utilize o seu próprio.
- **Renderização Markdown:** Texto formatado, blocos de código e destaque de sintaxe.

## Pacotes NuGet

As bibliotecas principais estão disponíveis como pacotes NuGet independentes para criar suas próprias integrações locais de IA:

| Pacote | Versão | Descrição |
| --------- | --------- | ------------- |
| [InControl.Core](https://www.nuget.org/packages/InControl.Core) | [![NuGet](https://img.shields.io/nuget/v/InControl.Core?style=flat-square)](https://www.nuget.org/packages/InControl.Core) | Modelos de domínio, tipos de conversação e abstrações compartilhadas para aplicativos de chat com IA local. |
| [InControl.Inference](https://www.nuget.org/packages/InControl.Inference) | [![NuGet](https://img.shields.io/nuget/v/InControl.Inference?style=flat-square)](https://www.nuget.org/packages/InControl.Inference) | Camada de abstração do backend LLM com chat em streaming, gerenciamento de modelos e verificações de saúde. Inclui a implementação do Ollama. |

```bash
dotnet add package InControl.Core
dotnet add package InControl.Inference
```

```csharp
// Example: use InControl.Inference in your own app
var client = inferenceClientFactory.Create("ollama");
await foreach (var token in client.StreamChatAsync(messages))
{
    Console.Write(token);
}
```

## Hardware Compatível

| Componente | Mínimo | Recomendado |
| ----------- | --------- | ------------- |
| GPU | RTX 3060 (8GB) | RTX 4080/5080 (16GB) |
| RAM | 16GB | 32GB |
| OS | Windows 10 1809+ | Windows 11 |
| .NET | 9.0 | 9.0 |

## Instalação

### A partir da Versão (Recomendado)

1. Baixe o pacote MSIX mais recente em [Releases](https://github.com/mcp-tool-shop-org/InControl-Desktop/releases)
2. Clique duas vezes para instalar.
3. Inicie a partir do Menu Iniciar.

### A partir do Código Fonte

```bash
# Clone and build
git clone https://github.com/mcp-tool-shop-org/InControl-Desktop.git
cd InControl-Desktop
dotnet restore
dotnet build

# Run (requires Ollama running locally)
dotnet run --project src/InControl.App
```

## Pré-requisitos

O InControl requer um backend LLM local. Recomendamos o [Ollama](https://ollama.ai/):

```bash
# Install Ollama from https://ollama.ai/download

# Pull a model
ollama pull llama3.2

# Start the server (runs on http://localhost:11434)
ollama serve
```

## Construção

### Verificar Ambiente de Construção

```powershell
# Run verification script
./scripts/verify.ps1
```

### Construção de Desenvolvimento

```bash
dotnet build
```

### Construção de Lançamento

```powershell
# Creates release artifacts in artifacts/
./scripts/release.ps1
```

### Executar Testes

```bash
dotnet test
```

## Arquitetura

O InControl segue uma arquitetura limpa e modular:

```
+-------------------------------------------+
|         InControl.App (WinUI 3)           |  UI Layer
+-------------------------------------------+
|         InControl.ViewModels              |  Presentation
+-------------------------------------------+
|         InControl.Services                |  Business Logic
+-------------------------------------------+
|         InControl.Inference               |  LLM Backends
+-------------------------------------------+
|         InControl.Core                    |  Shared Types
+-------------------------------------------+
```

Consulte [ARCHITECTURE.md](./docs/ARCHITECTURE.md) para documentação detalhada do design.

## Armazenamento de Dados

Todos os dados são armazenados localmente:

| Data | Localização |
| ------ | ---------- |
| Sessões | `%LOCALAPPDATA%\InControl\sessions\` |
| Logs | `%LOCALAPPDATA%\InControl\logs\` |
| Cache | `%LOCALAPPDATA%\InControl\cache\` |
| Exportações | `%USERPROFILE%\Documents\InControl\exports\` |

Consulte [PRIVACY.md](./docs/PRIVACY.md) para documentação completa sobre o tratamento de dados.

## Solução de Problemas

Problemas comuns e soluções estão documentados em [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md).

### Soluções Rápidas

**O aplicativo não inicia:**
- Verifique se o .NET 9.0 Runtime está instalado.
- Execute `dotnet --list-runtimes` para verificar.

**Nenhum modelo disponível:**
- Certifique-se de que o Ollama está em execução: `ollama serve`
- Baixe um modelo: `ollama pull llama3.2`

**GPU não detectada:**
- Atualize os drivers da NVIDIA para a versão mais recente.
- Verifique a instalação do CUDA toolkit.

## Contribuições

Contribuições são bem-vindas! Por favor:

1. Faça um fork do repositório.
2. Crie um branch de funcionalidade.
3. Escreva testes para novas funcionalidades.
4. Envie um pull request.

## Relatando Problemas

1. Verifique [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) primeiro.
2. Use o recurso "Copiar Diagnósticos" no aplicativo.
3. Abra um problema com as informações de diagnóstico anexadas.

## Tecnologias Utilizadas

| Layer | Tecnologia |
| ------- | ------------ |
| Framework da Interface do Usuário | WinUI 3 (Windows App SDK 1.6) |
| Arquitetura | MVVM com CommunityToolkit.Mvvm |
| Integração LLM | OllamaSharp, Microsoft.Extensions.AI |
| Contêiner de Injeção de Dependência | Microsoft.Extensions.DependencyInjection |
| Configuração | Microsoft.Extensions.Configuration |
| Registro de Eventos (Logging) | Microsoft.Extensions.Logging + Serilog |

## Versão

Versão atual: **0.4.0-alpha**

Consulte o arquivo [CHANGELOG.md](./CHANGELOG.md) para o histórico de lançamentos.

## Suporte

- **Dúvidas / Ajuda:** [Discussões](https://github.com/mcp-tool-shop-org/InControl-Desktop/discussions)
- **Relatos de erros:** [Problemas](https://github.com/mcp-tool-shop-org/InControl-Desktop/issues)
- **Segurança:** [SECURITY.md](SECURITY.md)

## Licença

[MIT](LICENSE) -- veja [LICENSE](LICENSE) para o texto completo.

---

*Desenvolvido para Windows. Alimentado por inteligência artificial local.*
