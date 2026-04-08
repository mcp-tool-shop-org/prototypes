<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/nexus-suite/readme.png" alt="Nexus Suite" width="400">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/nexus-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/nexus-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Infraestructura de gobernanza, certificación y enrutamiento para ecosistemas de herramientas MCP.**

---

## Resumen

- **Certificación:** Firme y verifique los resultados de las herramientas con `nexus-attest`.
- **Gobernanza:** Defina y aplique políticas con `nexus-control`.
- **Enrutamiento:** Dirija las solicitudes a través de adaptadores modulares con `nexus-router`.
- **Modular:** Seis paquetes independientes, use lo que necesite.
- **Nativo de Python:** Flujo de trabajo estándar `pip install -e .`, `pytest` para pruebas.

---

## Proyectos

| Paquete | Descripción |
| --------- | ------------- |
| `nexus-attest` | Firma y verificación de la certificación. |
| `nexus-control` | Plano de control para políticas de gobernanza. |
| `nexus-router` | Enrutamiento y distribución de solicitudes. |
| `nexus-router-adapter-stdout` | Adaptador de enrutador para transporte a través de la salida estándar (stdout). |
| `nexus-router-adapter-http` | Adaptador de enrutador para transporte HTTP. |
| `nexus-router-adapter-template` | Plantilla para crear adaptadores personalizados. |

---

## Inicio rápido

```bash
# Clone
git clone https://github.com/mcp-tool-shop-org/nexus-suite.git
cd nexus-suite

# Install a component
cd src/nexus-router
pip install -e .

# Run tests
pytest
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     nexus-control                            │
│              (governance policies, config)                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-router                             │
│              (request dispatch + routing)                    │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   stdout    │      │    http     │      │  (custom)   │
│   adapter   │      │   adapter   │      │   adapter   │
└─────────────┘      └─────────────┘      └─────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     nexus-attest                             │
│              (signature verification)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Licencia

[MIT](LICENSE)
