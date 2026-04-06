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

**Presupuesto por sobres para Windows: dale a cada dólar una función.**

Una aplicación de finanzas personales para Windows que utiliza la metodología de presupuesto por sobres. Tus datos permanecen en tu dispositivo, no se requiere conexión a la nube. Está diseñada como un **libro de contabilidad del futuro**: un sistema de verdad financiera con una intervención humana explícita en cada etapa.

## Descargar

📦 **[Última versión](https://github.com/mcp-tool-shop-org/NextLedger/releases/latest)**

Descarga el archivo ZIP, extráelo y ejecuta `NextLedger.App.exe`. No se requiere instalación.

## ¿Qué es el presupuesto por sobres?

El presupuesto por sobres es un método simple y probado en el que asignas tus ingresos a "sobres" virtuales para diferentes categorías de gastos. Solo puedes gastar lo que hay en cada sobre, lo que hace que sea imposible gastar de más.

## Características

- **Funciona sin conexión**: Tus datos permanecen en tu dispositivo. No se requiere conexión a la nube.
- **Presupuesto por sobres**: Asigna cada dólar a un propósito.
- **Múltiples cuentas**: Realiza un seguimiento de cuentas corrientes, de ahorro, tarjetas de crédito y efectivo.
- **Seguimiento de transacciones**: Categoriza y busca tus gastos.
- **Importación de CSV**: Importa fácilmente los extractos bancarios.
- **Conciliación**: Compara tus registros con los extractos bancarios.
- **Nativa de Windows**: Desarrollada con WinUI 3 para una experiencia moderna en Windows.

## Capturas de pantalla

*Próximamente*

## Documentación

- [Registro de cambios](CHANGELOG.md)
- [Códigos de error del motor](ENGINE_ERROR_CODES.md)
- [Proceso de lanzamiento](docs/RELEASE_PROCESS.md)
- [Visión del libro de contabilidad del futuro](docs/FUTURE_LEDGER_VISION.md)
- [Lista de verificación de ejecución del libro de contabilidad](docs/LEDGER_EXECUTION_CHECKLIST.md)

## Tecnología

- **Interfaz de usuario**: WinUI 3 / Windows App SDK
- **Lenguaje**: C# / .NET 9
- **Base de datos**: SQLite (local)
- **Arquitectura**: Arquitectura limpia con MVVM

## Estado del proyecto

✅ **v1.0.0** - Lista para su lanzamiento

Funcionalidad principal completa:
- Gestión de presupuestos con asignaciones mensuales
- Seguimiento de transacciones con soporte para divisiones
- Importación de CSV desde extractos bancarios
- Conciliación de cuentas
- Análisis de gastos por sobre
- Ayuda y orientación dentro de la aplicación

Consulta [DESIGN.md](DESIGN.md) para obtener información detallada sobre la arquitectura.

## Hoja de ruta

NextLedger está evolucionando hacia un **libro de contabilidad del futuro**: consulta [Visión del libro de contabilidad del futuro](docs/FUTURE_LEDGER_VISION.md) para obtener información completa sobre la arquitectura.

| Layer | Estado | Descripción |
| ------- | -------- | ------------- |
| Observación | ✅ Completo | Saldos, transacciones y cuentas locales |
| Interpretación | ✅ Completo | Presupuesto por sobres, análisis de gastos |
| Declaración de intenciones | 🔜 Planificado | Objetivos de presupuesto, reglas de asignación |
| Cumplimiento de restricciones | 🔜 Planificado | Límites de presupuesto, protección contra gastos excesivos |
| Ejecución aprobada por el usuario | 🔮 Futuro | Integración con Web3 (no custodial) |

## Desarrollo

### Requisitos previos

- Windows 10 (1809+) o Windows 11
- Visual Studio (2022 17.8+ o posterior) con:
- Carga de trabajo de desarrollo de escritorio de .NET
- Plantillas de Windows App SDK en C#
- Windows SDK / MSIX (herramientas de compilación de Appx/PRI)
- SDK de .NET 9

**Nota sobre las compilaciones desde la línea de comandos (WinUI):** El proyecto WinUI (`NextLedger.App`) ejecuta pasos de compilación del Windows App SDK que requieren las ensamblados de tareas de MSBuild de Appx/MSIX + PRI. Si observa un error como `MSB4062` que hace referencia a la falta de `Microsoft.Build.AppxPackage.dll` o `Microsoft.Build.Packaging.Pri.Tasks.dll`, instale los componentes de Windows SDK / MSIX a través del instalador de Visual Studio (o compile la aplicación desde dentro de Visual Studio).

### Compilación

```bash
dotnet restore
dotnet build
```

### Cómo ejecutar la aplicación

**Visual Studio (recomendado)**

1. Abra `NextLedger.sln` en Visual Studio 2022.
2. Configure `NextLedger.App` como el proyecto de inicio.
3. Ejecute con **F5**.

**Línea de comandos (compilación + ejecución)**

```bash
dotnet build .\src\NextLedger.App\NextLedger.App.csproj -c Debug
```

Si esto falla con `MSB4062`, consulte la nota en **Requisitos previos**.

Luego, ejecute el archivo ejecutable generado desde la carpeta de salida de la compilación, ubicada en:

- `.\src\NextLedger.App\bin\Debug\net9.0-windows10.0.19041.0\`

**Ubicación de los datos locales**

La aplicación crea una base de datos SQLite local en:

- `%LOCALAPPDATA%\NextLedger\NextLedger.db`

### Ejecución de pruebas

```bash
dotnet test
```

## Licencia

Licencia MIT: consulte el archivo LICENSE para obtener más detalles.

## Autor

Creado por [mcp-tool-shop](https://github.com/mcp-tool-shop-org)
