<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/stresskit-mcp/readme.png" width="400" alt="StressKit-MCP">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/stresskit-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Kit de herramientas de pruebas de salud y seguridad para servidores MCP (Protocolo de Contexto del Modelo). Proporciona evidencia confiable de la preparación de los servidores MCP a través de pruebas de estrés, validación de seguridad y análisis de rendimiento.

## Características

- **Pruebas de carga:** Simula un gran volumen de llamadas a herramientas para identificar cuellos de botella.
- **Análisis de seguridad:** Valida la sanitización de entradas, los flujos de autenticación y el manejo de errores.
- **Análisis de rendimiento:** Mide la latencia, el rendimiento y el uso de recursos.
- **Verificaciones de cumplimiento:** Verifica el cumplimiento del protocolo MCP.
- **Generación de evidencia:** Produce informes de prueba verificables con trazabilidad.

## Inicio rápido

```bash
# Install
pip install stresskit-mcp

# Run basic health check
stresskit check http://localhost:3000

# Run full stress test suite
stresskit stress http://localhost:3000 --profile default

# Generate security report
stresskit security http://localhost:3000 --output report.json
```

## Configuración

StressKit utiliza perfiles para escenarios de prueba configurables:

```json
{
  "profile": "production",
  "duration": 300,
  "concurrency": 50,
  "tools": ["*"],
  "checks": {
    "latency_p99_ms": 500,
    "error_rate_max": 0.01,
    "memory_mb_max": 512
  }
}
```

## Estructura del proyecto

```
stresskit-mcp/
├── engines/        # Test execution engines
├── profiles/       # Pre-built test profiles
├── schemas/        # JSON schemas for configuration
├── tests/          # Unit and integration tests
└── stresskit.targets.json  # Default target configuration
```

## Proyectos relacionados

- [tool-scan](https://github.com/mcp-tool-shop-org/tool-scan) — Analizador de seguridad para herramientas MCP.
- [mcp-stress-test](https://github.com/mcp-tool-shop-org/mcp-stress-test) — Kit de herramientas de "equipo rojo" para la validación del analizador.

## Licencia

Licencia MIT — consulte [LICENSE](LICENSE) para obtener más detalles.

---

Desarrollado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
