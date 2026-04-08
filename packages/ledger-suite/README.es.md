<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/ledger-suite/readme.png" width="400" alt="Ledger Suite">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/ledger-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/ledger-suite/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/ledger-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Repositorio unificado para sistemas de registro de trazabilidad criptográfica.

## Proyectos

| Proyecto | Descripción | Pruebas |
| --------- | ------------- | ------- |
| `src/ClaimLedger/` | Trazabilidad y verificación de afirmaciones científicas. | 371 |
| `src/CreatorLedger/` | Pruebas de autenticidad del creador. | 219 |
| `src/CreatorLedger/Shared.Crypto/` | Funciones criptográficas compartidas Ed25519. | - |

## Inicio rápido

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

## Estructura

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

## Características de ClaimLedger

- **Afirmaciones** con firmas Ed25519.
- **Citas** que vinculan las afirmaciones con pruebas criptográficas.
- **Atestados** (revisión por pares, reproducción, aprobación institucional).
- **Revocaciones** con firmas de testigos.
- **Marcas de tiempo RFC 3161** para la irrefutabilidad.
- **ClaimPacks** para paquetes listos para la distribución.
- **Registro local** para la resolución de citas sin conexión.
- **Comando de publicación** para la distribución con un solo clic.

## Características de CreatorLedger

- **Pruebas de autenticidad del creador** para activos digitales.
- **Verificación de la suma de comprobación del contenido**.
- **Cadenas de atestados multipartes**.
- **Paquetes de pruebas** para la verificación portátil.

## Licencia

MIT

---

Desarrollado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
