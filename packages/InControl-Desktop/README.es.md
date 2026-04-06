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

**Asistente de chat local con IA para Windows**

Una aplicación de chat centrada en la privacidad y acelerada por GPU que ejecuta modelos de lenguaje grandes completamente en su máquina. No se requiere conexión a la nube.

## ¿Por qué InControl?

- **Privacidad por defecto:** Sus conversaciones nunca abandonan su computadora.
- **Optimizado para RTX:** Diseñado para GPU NVIDIA con aceleración CUDA.
- **Experiencia nativa de Windows:** WinUI 3 con diseño Fluent.
- **Múltiples backends:** Ollama, llama.cpp, o use el suyo propio.
- **Renderizado de Markdown:** Texto enriquecido, bloques de código y resaltado de sintaxis.

## Paquetes NuGet

Las bibliotecas principales están disponibles como paquetes NuGet independientes para crear sus propias integraciones locales de IA:

| Paquete | Versión | Descripción |
| --------- | --------- | ------------- |
| [InControl.Core](https://www.nuget.org/packages/InControl.Core) | [![NuGet](https://img.shields.io/nuget/v/InControl.Core?style=flat-square)](https://www.nuget.org/packages/InControl.Core) | Modelos de dominio, tipos de conversación y abstracciones compartidas para aplicaciones de chat con IA local. |
| [InControl.Inference](https://www.nuget.org/packages/InControl.Inference) | [![NuGet](https://img.shields.io/nuget/v/InControl.Inference?style=flat-square)](https://www.nuget.org/packages/InControl.Inference) | Capa de abstracción de backend de LLM con chat en streaming, gestión de modelos y comprobaciones de estado. Incluye la implementación de Ollama. |

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

## Hardware compatible

| Componente | Mínimo | Recomendado |
| ----------- | --------- | ------------- |
| GPU | RTX 3060 (8GB) | RTX 4080/5080 (16GB) |
| RAM | 16GB | 32GB |
| OS | Windows 10 1809+ | Windows 11 |
| .NET | 9.0 | 9.0 |

## Instalación

### Desde la versión (recomendado)

1. Descargue el paquete MSIX más reciente desde [Releases](https://github.com/mcp-tool-shop-org/InControl-Desktop/releases)
2. Haga doble clic para instalar.
3. Inicie desde el menú Inicio.

### Desde el código fuente

```bash
# Clone and build
git clone https://github.com/mcp-tool-shop-org/InControl-Desktop.git
cd InControl-Desktop
dotnet restore
dotnet build

# Run (requires Ollama running locally)
dotnet run --project src/InControl.App
```

## Requisitos previos

InControl requiere un backend de LLM local. Recomendamos [Ollama](https://ollama.ai/):

```bash
# Install Ollama from https://ollama.ai/download

# Pull a model
ollama pull llama3.2

# Start the server (runs on http://localhost:11434)
ollama serve
```

## Compilación

### Verifique el entorno de compilación

```powershell
# Run verification script
./scripts/verify.ps1
```

### Compilación de desarrollo

```bash
dotnet build
```

### Compilación de versión

```powershell
# Creates release artifacts in artifacts/
./scripts/release.ps1
```

### Ejecute pruebas

```bash
dotnet test
```

## Arquitectura

InControl sigue una arquitectura limpia y en capas:

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

Consulte [ARCHITECTURE.md](./docs/ARCHITECTURE.md) para obtener documentación detallada del diseño.

## Almacenamiento de datos

Todos los datos se almacenan localmente:

| Data | Ubicación |
| ------ | ---------- |
| Sesiones | `%LOCALAPPDATA%\InControl\sessions\` |
| Logs | `%LOCALAPPDATA%\InControl\logs\` |
| Cache | `%LOCALAPPDATA%\InControl\cache\` |
| Exportaciones | `%USERPROFILE%\Documents\InControl\exports\` |

Consulte [PRIVACY.md](./docs/PRIVACY.md) para obtener documentación completa sobre el manejo de datos.

## Resolución de problemas

Los problemas y soluciones comunes están documentados en [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md).

### Soluciones rápidas

**La aplicación no se inicia:**
- Verifique que el entorno de ejecución .NET 9.0 esté instalado.
- Ejecute `dotnet --list-runtimes` para verificar.

**No hay modelos disponibles:**
- Asegúrese de que Ollama se esté ejecutando: `ollama serve`
- Descargue un modelo: `ollama pull llama3.2`

**No se detecta la GPU:**
- Actualice los controladores de NVIDIA a la última versión.
- Verifique la instalación del kit de herramientas CUDA.

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1.  Haga un fork del repositorio.
2.  Cree una rama de características.
3.  Escriba pruebas para nuevas funcionalidades.
4.  Envíe una solicitud de extracción.

## Informar de problemas

1.  Verifique [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) primero.
2.  Utilice la función "Copiar diagnósticos" en la aplicación.
3.  Abra un problema con la información de diagnóstico adjunta.

## Pila tecnológica

| Layer | Tecnología |
| ------- | ------------ |
| Framework de la interfaz de usuario | WinUI 3 (Windows App SDK 1.6) |
| Arquitectura | MVVM con CommunityToolkit.Mvvm |
| Integración de LLM | OllamaSharp, Microsoft.Extensions.AI |
| Contenedor de dependencias | Microsoft.Extensions.DependencyInjection |
| Configuración | Microsoft.Extensions.Configuration |
| Registro (Logging) | Microsoft.Extensions.Logging + Serilog |

## Versión

Versión actual: **0.4.0-alpha**

Consulte [CHANGELOG.md](./CHANGELOG.md) para ver el historial de versiones.

## Soporte

- **Preguntas / ayuda:** [Discusiones](https://github.com/mcp-tool-shop-org/InControl-Desktop/discussions)
- **Informes de errores:** [Problemas](https://github.com/mcp-tool-shop-org/InControl-Desktop/issues)
- **Seguridad:** [SECURITY.md](SECURITY.md)

## Licencia

[MIT](LICENSE) -- consulte [LICENSE](LICENSE) para el texto completo.

---

*Desarrollado para Windows. Impulsado por inteligencia artificial local.*
