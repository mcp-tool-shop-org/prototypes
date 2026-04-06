<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/pocket-ledger/readme.png" width="400" alt="Pocket Ledger">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/pocket-ledger/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Una aplicación para Windows de gestión personal de finanzas y seguimiento de presupuestos, diseñada para funcionar principalmente en el dispositivo local. Es limpia, sencilla y centrada en la privacidad.

## Filosofía

- **Prioridad local**: Sus datos financieros permanecen en su dispositivo. No se requiere sincronización en la nube.
- **Privacidad por diseño**: Cero telemetría, cero conexiones externas a menos que usted lo permita.
- **Presupuesto por sobres**: Metodología probada que asigna un propósito a cada dólar.
- **Orientada a objetivos**: Concéntrese en lo que está ahorrando, no solo en lo que está gastando.

## Características (Planificadas)

- [ ] Seguimiento de transacciones con categorías
- [ ] Sistema de presupuestación basado en sobres
- [ ] Objetivos de ahorro con progreso visual
- [ ] Gestión de transacciones recurrentes
- [ ] Información visual sobre gastos e informes
- [ ] Soporte para múltiples cuentas
- [ ] Importación/exportación en formato CSV
- [ ] Soporte para temas oscuros/claros

## Tecnologías Utilizadas

- **.NET 8** - Entorno de ejecución moderno y de alto rendimiento
- **WinUI 3 / Windows App SDK** - Experiencia nativa de Windows 11
- **SQLite** - Base de datos local y portátil
- **Arquitectura limpia** - Capas mantenibles y fáciles de probar

## Estructura del Proyecto

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

## Desarrollo

### Requisitos Previos

- Windows 10/11
- Visual Studio 2022 (17.8+) o VS Code con C# Dev Kit
- SDK de .NET 8
- Windows App SDK

### Compilación

```bash
dotnet build
```

### Ejecución de Pruebas

```bash
dotnet test
```

## Licencia

Licencia MIT - Consulte [LICENSE](LICENSE) para obtener más detalles.

## Contribuciones

¡Las contribuciones son bienvenidas! Por favor, lea nuestras pautas de contribución antes de enviar solicitudes de extracción (PR).

---

Desarrollado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
