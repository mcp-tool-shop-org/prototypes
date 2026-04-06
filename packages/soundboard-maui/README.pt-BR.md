<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/soundboard-maui/readme.png" alt="Soundboard MAUI logo" width="400">
</p>

# soundboard-maui

> Parte de [MCP Tool Shop](https://mcptoolshop.com)

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-maui/actions/workflows/publish.yml/badge.svg" alt="Publish"></a>
  <img src="https://img.shields.io/badge/.NET-8%20%7C%209%20%7C%2010-512BD4" alt=".NET 8 | 9 | 10">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-maui/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Cliente de desktop multiplataforma .NET MAUI para o motor de voz Sound Board.**

---

## Por que Soundboard MAUI?

- **Design focado em SDK** — `Soundboard.Client` é uma biblioteca .NET 8+ independente, sem dependências de interface do usuário. Use-a em aplicativos de console, WPF, ASP.NET, MAUI ou qualquer coisa que seja compatível com .NET.
- **Streaming em tempo real** — O áudio chega em partes através do WebSocket via `IProgress<AudioChunk>`. Não é necessário esperar que a síntese completa seja concluída.
- **Independente do motor** — O SDK utiliza um [contrato de API](docs/api-contract.md) documentado. Troque de motores sem alterar seu código.
- **Multiplataforma** — Disponível para `net8.0`, `net9.0` e `net10.0`, permitindo que você a utilize em qualquer projeto .NET moderno.
- **Registro estruturado** — Suporte integrado a `ILogger` para diagnóstico, sem a necessidade de incluir um framework de registro.
- **Clientes de referência incluídos** — Um aplicativo de desktop MAUI e uma ferramenta de linha de comando demonstram padrões de integração reais que você pode copiar.

---

## Pacotes NuGet

| Pacote | Descrição | Versão |
|---|---|---|
| **[Soundboard.Client](https://www.nuget.org/packages/Soundboard.Client)** | SDK principal — cliente de TTS com streaming para qualquer motor de voz compatível com Soundboard. Puro C#, sem dependências de interface do usuário. | 1.2.0 |
| **[Soundboard.Maui.Audio](https://www.nuget.org/packages/Soundboard.Maui.Audio)** | Adaptador de reprodução PCM16 baseado em NAudio para Windows. Fornece `IAudioPlayer` com bufferização, início/parada/limpeza seguros para threads e rastreamento do estado de reprodução. | 1.0.0 |

---

## Como começar

### Instale o SDK

```bash
dotnet add package Soundboard.Client
```

### Fale em cinco linhas

```csharp
using Soundboard.Client;
using Soundboard.Client.Models;

await using var client = new SoundboardClient();

// Discover what the engine offers
var presets = await client.GetPresetsAsync();
var voices  = await client.GetVoicesAsync();

// Stream speech — chunks arrive as they are synthesized
var progress = new Progress<AudioChunk>(chunk =>
{
    // Feed chunk.PcmData (PCM16, mono) to your audio output
});

await client.SpeakAsync(
    new SpeakRequest("Hello from the SDK.", presets[0], voices[0]),
    progress);
```

Sem dependência do MAUI. Funciona em aplicativos de console, WPF, ASP.NET ou qualquer coisa compatível com .NET 8+.

### Configuração

O cliente lê `SOUNDBOARD_BASE_URL` do ambiente, com o valor padrão de `http://localhost:8765`. Substitua-o no código:

```csharp
var client = new SoundboardClient(new SoundboardClientOptions
{
    BaseUrl = "http://my-engine:9000",
    HttpTimeout = TimeSpan.FromSeconds(15),
    WebSocketConnectTimeout = TimeSpan.FromSeconds(10),
    WebSocketReceiveTimeout = TimeSpan.FromSeconds(60)
});
```

### Interface do SDK

| Método | Descrição |
|---|---|
| `GetHealthAsync()` | Verificação de status do motor — retorna informações de versão e status de prontidão. |
| `GetPresetsAsync()` | Lista os identificadores de predefinições disponíveis (por exemplo, `narrador`, `conversacional`). |
| `GetVoicesAsync()` | Lista os identificadores de vozes disponíveis. |
| `SpeakAsync(request, progress)` | Transmite a fala sintetizada; reporta `AudioChunk` via `IProgress<T>`. |
| `StopAsync()` | Envia um comando de parada para o motor. |

Todos os métodos aceitam `CancellationToken`. O cliente implementa `IAsyncDisposable`.

---

## Arquitetura

```
This repository
+-------------------------------------------+
|                                           |
|  Soundboard.Client (SDK)     net8.0+      |  <-- The product
|  Soundboard.Maui.Audio       net8.0       |  <-- NAudio adapter (Windows)
|  Soundboard.Maui             net10.0      |  <-- Reference client (MAUI)
|  soundboard-cli              net8.0       |  <-- Reference client (console)
|                                           |
+-------------------------------------------+
            |  HTTP (control) + WebSocket (audio)
            v
+-------------------------------------------+
|  voice-soundboard (engine repo)           |
|  Any engine implementing the API contract |
+-------------------------------------------+
```

**Plano de controle** (HTTP) — status, predefinições, vozes, parada.
**Plano de dados** (WebSocket) — bidirecional: comandos de fala são enviados para cima, fragmentos de áudio PCM16 são transmitidos para baixo.

O SDK gerencia automaticamente o ciclo de vida da conexão, a estrutura JSON, a decodificação base64, o fechamento gracioso do WebSocket e as verificações de compatibilidade de versão da API.

---

## Instalação a partir do código-fonte

### Pré-requisitos

- SDK .NET 10.0 (com workload MAUI para o aplicativo de desktop)
- SDK .NET 8.0 (suficiente para o SDK e a ferramenta de linha de comando)
- Windows 10/11 (para o aplicativo MAUI e a reprodução NAudio)
- Um motor [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) em execução.

### Clone e execute

```bash
git clone https://github.com/mcp-tool-shop-org/soundboard-maui.git
cd soundboard-maui

# Run unit + integration tests (no engine required)
dotnet test

# Run the MAUI desktop app
set SOUNDBOARD_BASE_URL=http://localhost:8765
dotnet run --project src/Soundboard.Maui

# Run the CLI client
dotnet run --project src/soundboard-cli -- health
dotnet run --project src/soundboard-cli -- presets
dotnet run --project src/soundboard-cli -- speak "Hello world" --preset narrator
```

---

## Estrutura do projeto

```
src/
  Soundboard.Client/         SDK — pure C#, net8.0/9.0/10.0, zero UI deps
  Soundboard.Maui.Audio/     NAudio PCM16 playback adapter (Windows, net8.0)
  Soundboard.Maui/           Reference desktop client (MAUI, net10.0)
  soundboard-cli/            Reference console client (net8.0)

examples/
  Quickstart/                Connect → speak → save WAV in 30 seconds
  AgentTool/                 SDK as a callable tool in an AI agent pipeline

tests/
  Soundboard.Client.Tests/         27 unit tests (no engine required)
  Soundboard.IntegrationTests/     17 integration + contract tests

docs/
  api.md                     SDK API reference (v1.0 stability guarantees)
  api-contract.md            Engine <-> SDK wire protocol
  compatibility.md           SDK-engine compatibility matrix & trust contract
  getting-started-sdk.md     SDK integration guide
  streaming-model.md         How audio streaming works
  error-model.md             Failure modes and handling
  feature-map.md             Feature-to-layer mapping
  known-limitations.md       Current boundaries
  evaluation-guide.md        How to evaluate Soundboard
  publishing.md              NuGet publish runbook
```

---

## Exemplos

| Exemplo | O que ele demonstra |
|---|---|
| [Quickstart](examples/Quickstart/) | Conectar, falar, salvar WAV — sem configuração. |
| [Agent Tool](examples/AgentTool/) | SDK como uma ferramenta chamável em um pipeline de agente de IA. |

---

## Documentação

- [Primeiros passos com o SDK](docs/getting-started-sdk.md)
- [Modelo de streaming](docs/streaming-model.md)
- [Modelo de erros](docs/error-model.md)
- [Referência da API](docs/api.md)
- [Contrato da API](docs/api-contract.md)
- [Compatibilidade e confiabilidade](docs/compatibility.md)
- [Configuração do motor](docs/engine-setup.md)
- [Guia de atualização e reversão](docs/upgrade-playbook.md)
- [Publicação do SDK](docs/publishing.md)
- [Validação da instalação](docs/fresh-install.md)
- [Guia de avaliação](docs/evaluation-guide.md)
- [Histórico de alterações](CHANGELOG.md)
- [Contribuições](CONTRIBUTING.md)

---

## Perguntas frequentes

**O que é o SDK?**
`Soundboard.Client` é uma biblioteca .NET 8+ independente que gerencia toda a comunicação com o motor, incluindo verificações de status, descoberta e streaming de áudio via WebSocket. Faça referência a ela em qualquer projeto .NET.

**O que é o aplicativo MAUI?**
É um cliente de exemplo que demonstra o SDK com uma interface de usuário para desktop. Não é o produto em si — ele mostra uma maneira de usar o SDK.

**Isso está pronto para produção?**
A API do SDK (v1.0) é estável. O aplicativo MAUI é de nível de demonstração. Consulte as [limitações conhecidas](docs/known-limitations.md).

**Posso criar minha própria interface de usuário?**
Sim. Esse é o objetivo. O SDK não possui dependências de interface de usuário. Implemente `IAudioPlayer` para sua plataforma e comece.

**Onde está localizado o motor?**
Em um repositório separado: [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard). Este repositório não contém código do motor.

---

## Licença

Este projeto é licenciado sob a [Licença MIT](LICENSE).

---

## Links

- [Repositório do motor](https://github.com/mcp-tool-shop-org/voice-soundboard)
- [MCP Tool Shop](https://mcptoolshop.com)
- [Soundboard.Client no NuGet](https://www.nuget.org/packages/Soundboard.Client)
- [Soundboard.Maui.Audio no NuGet](https://www.nuget.org/packages/Soundboard.Maui.Audio)
- [Limitações conhecidas](docs/known-limitations.md)
