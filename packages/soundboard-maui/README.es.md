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

**Cliente de escritorio multiplataforma .NET MAUI para el motor de voz Sound Board.**

---

## ¿Por qué Soundboard MAUI?

- **Diseño centrado en el SDK:** `Soundboard.Client` es una biblioteca independiente de .NET 8+ con cero dependencias de interfaz de usuario. Úselo en aplicaciones de consola, WPF, ASP.NET, MAUI o cualquier cosa que se dirija a .NET.
- **Transmisión en tiempo real:** El audio llega por fragmentos a través de WebSocket mediante `IProgress<AudioChunk>`. No es necesario esperar a que finalice toda la síntesis.
- **Independiente del motor:** El SDK utiliza un [contrato de API](docs/api-contract.md) documentado. Cambie de motor sin modificar su código.
- **Multiplataforma:** Disponible para `net8.0`, `net9.0` y `net10.0`, lo que le permite usarlo en cualquier proyecto .NET moderno.
- **Registro estructurado:** Soporte integrado para `ILogger` para el diagnóstico sin necesidad de incluir un marco de registro.
- **Clientes de ejemplo incluidos:** Una aplicación de escritorio MAUI y una herramienta de línea de comandos muestran patrones de integración reales que puede copiar.

---

## Paquetes NuGet

| Paquete | Descripción | Versión |
|---|---|---|
| **[Soundboard.Client](https://www.nuget.org/packages/Soundboard.Client)** | SDK de acceso directo: cliente de TTS con transmisión para cualquier motor de voz compatible con Soundboard. C# puro, cero dependencias de interfaz de usuario. | 1.2.0 |
| **[Soundboard.Maui.Audio](https://www.nuget.org/packages/Soundboard.Maui.Audio)** | Adaptador de reproducción de transmisión PCM16 basado en NAudio para Windows. Proporciona `IAudioPlayer` con almacenamiento en búfer, inicio/parada/limpieza seguros para subprocesos y seguimiento del estado de reproducción. | 1.0.0 |

---

## Comienzo rápido

### Instale el SDK

```bash
dotnet add package Soundboard.Client
```

### Hable en cinco líneas

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

No tiene dependencia de MAUI. Funciona en aplicaciones de consola, WPF, ASP.NET o cualquier cosa que se dirija a .NET 8+.

### Configuración

El cliente lee `SOUNDBOARD_BASE_URL` del entorno, con un valor predeterminado de `http://localhost:8765`. Anule este valor en el código:

```csharp
var client = new SoundboardClient(new SoundboardClientOptions
{
    BaseUrl = "http://my-engine:9000",
    HttpTimeout = TimeSpan.FromSeconds(15),
    WebSocketConnectTimeout = TimeSpan.FromSeconds(10),
    WebSocketReceiveTimeout = TimeSpan.FromSeconds(60)
});
```

### Interfaz del SDK

| Método | Descripción |
|---|---|
| `GetHealthAsync()` | Comprobación de estado del motor: devuelve información de la versión y el estado de disponibilidad. |
| `GetPresetsAsync()` | Lista los identificadores de preajustes disponibles (por ejemplo, `narrador`, `conversacional`). |
| `GetVoicesAsync()` | Lista los identificadores de voces disponibles. |
| `SpeakAsync(request, progress)` | Transmite el habla sintetizada; informa `AudioChunk` a través de `IProgress<T>`. |
| `StopAsync()` | Envía un comando de parada al motor. |

Todos los métodos aceptan `CancellationToken`. El cliente implementa `IAsyncDisposable`.

---

## Arquitectura

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

**Plano de control** (HTTP): estado, preajustes, voces, parada.
**Plano de datos** (WebSocket): bidireccional: los comandos de habla se envían hacia arriba, los fragmentos de audio PCM16 se transmiten hacia abajo.

El SDK gestiona automáticamente el ciclo de vida de la conexión, el formato JSON, la decodificación base64, el cierre elegante de WebSocket y las comprobaciones de compatibilidad de la versión de la API.

---

## Instalación desde el código fuente

### Requisitos previos

- SDK de [.NET 10.0](https://dotnet.microsoft.com/) con carga de trabajo de MAUI (para la aplicación de escritorio)
- SDK de .NET 8.0 (suficiente para el SDK y la CLI por sí solo)
- Windows 10/11 (para la aplicación MAUI y la reproducción de NAudio)
- Un motor de voz [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard) en ejecución.

### Clonar y ejecutar

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

## Estructura del proyecto

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

## Ejemplos

| Ejemplo | Lo que muestra |
|---|---|
| [Quickstart](examples/Quickstart/) | Conectar, hablar, guardar WAV: configuración cero. |
| [Agent Tool](examples/AgentTool/) | SDK como una herramienta invocable en una canalización de un agente de IA. |

---

## Documentación

- [Cómo empezar con el SDK](docs/getting-started-sdk.md)
- [Modelo de transmisión](docs/streaming-model.md)
- [Modelo de errores](docs/error-model.md)
- [Referencia de la API](docs/api.md)
- [Contrato de la API](docs/api-contract.md)
- [Compatibilidad y seguridad](docs/compatibility.md)
- [Configuración del motor](docs/engine-setup.md)
- [Guía de actualización y reversión](docs/upgrade-playbook.md)
- [Publicación del SDK](docs/publishing.md)
- [Validación de la instalación inicial](docs/fresh-install.md)
- [Guía de evaluación](docs/evaluation-guide.md)
- [Registro de cambios](CHANGELOG.md)
- [Cómo contribuir](CONTRIBUTING.md)

---

## Preguntas frecuentes

**¿Qué es el SDK?**
`Soundboard.Client` es una biblioteca .NET 8+ independiente que gestiona toda la comunicación con el motor, incluyendo las comprobaciones de estado, el descubrimiento y la transmisión de voz a través de WebSocket. Puede utilizarla en cualquier proyecto .NET.

**¿Qué es la aplicación MAUI?**
Es un cliente de ejemplo que demuestra el uso del SDK con una interfaz de usuario de escritorio. No es el producto en sí, sino una forma de mostrar cómo se puede utilizar el SDK.

**¿Está listo para producción?**
La API del SDK (v1.0) es estable. La aplicación MAUI es una demostración. Consulte las [limitaciones conocidas](docs/known-limitations.md).

**¿Puedo crear mi propia interfaz de usuario?**
Sí. Ese es el objetivo. El SDK no tiene dependencias de interfaz de usuario. Implemente `IAudioPlayer` para su plataforma y estará listo.

**¿Dónde se encuentra el motor?**
En un repositorio separado: [voice-soundboard](https://github.com/mcp-tool-shop-org/voice-soundboard). Este repositorio no contiene código del motor.

---

## Licencia

Este proyecto está licenciado bajo la [Licencia MIT](LICENSE).

---

## Enlaces

- [Repositorio del motor](https://github.com/mcp-tool-shop-org/voice-soundboard)
- [MCP Tool Shop](https://mcptoolshop.com)
- [Soundboard.Client en NuGet](https://www.nuget.org/packages/Soundboard.Client)
- [Soundboard.Maui.Audio en NuGet](https://www.nuget.org/packages/Soundboard.Maui.Audio)
- [Limitaciones conocidas](docs/known-limitations.md)
