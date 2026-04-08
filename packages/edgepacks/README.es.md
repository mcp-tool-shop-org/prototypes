<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/edgepacks/readme.png" width="400" alt="EdgePacks" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/actions"><img src="https://github.com/mcp-tool-shop-org/edgepacks/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/edgepacks/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/edgepacks/"><img src="https://img.shields.io/badge/docs-landing%20page-brightgreen" alt="Landing Page" /></a>
</p>

Plataforma para la creación de conjuntos de datos para el entrenamiento de modelos pequeños en tareas específicas.

## ¿Qué es esto?

Una biblioteca de conjuntos de datos estructurados y bien definidos, con licencias claras, diseñados para entrenar modelos en tareas específicas. Cada conjunto incluye reglas de generación, reglas de validación, conjuntos de evaluación y rutas de exportación para las plataformas de ajuste fino más comunes.

## ¿Qué NO es esto?

- Un repositorio genérico de conjuntos de datos.
- Un envoltorio para HuggingFace.
- Un marco de trabajo de entrenamiento.

## Instalación

```bash
pip install edgepacks
```

## Guía de inicio rápido

```bash
# List available packs
edgepacks list

# Inspect a pack
edgepacks info tool-routing

# Build a dataset (requires Ollama running locally)
edgepacks build tool-routing --count 2000 --model qwen2.5:7b

# Export for your trainer
edgepacks export tool-routing --format unsloth --output ./data/
```

## Ejecución de los conjuntos de datos

| Conjunto de datos | Tarea | ¿Qué se entrena? |
|------|------|---------------|
| `tool-routing` | Clasificación | Solicitud en lenguaje natural → herramienta correcta + argumentos |
| `structured-extraction` | Extracción | Texto desestructurado → JSON estructurado |
| `error-triage` | Clasificación | Registros de errores → causa + severidad + siguiente paso |

## Arquitectura

Tres capas:

1. **Esquema:** Especificación formal de lo que es un conjunto de datos.
2. **Plataforma:** Herramientas para crear, validar y dividir los conjuntos de datos.
3. **Distribución:** Interfaz de línea de comandos (CLI) + exportación a formatos JSONL, HuggingFace, Unsloth y torchtune.

## Cada conjunto de datos incluye:

- Definición de la tarea + esquema canónico.
- Divisiones de entrenamiento / validación / prueba.
- Ejemplos positivos y negativos difíciles.
- Receta de generación (sintética a través de Ollama).
- Validador que rechaza filas mal formadas o con baja calidad.
- Conjunto de evaluación que prueba la habilidad real después del ajuste fino.
- Exportación a formatos que se integran directamente con las herramientas comunes.

## Seguridad y Confianza

**Datos accedidos:** Archivos `.json` / `.jsonl` locales en los directorios de salida especificados por el usuario. Los ejemplos iniciales se incluyen en el paquete. Los ejemplos generados se escriben en `./output/` o en la ruta que especifique.

**Red:** HTTP solo a Ollama local (`localhost:11434`) para la generación sintética. No hay APIs en la nube, ni telemetría, ni análisis. Funciona completamente sin conexión una vez que Ollama está disponible.

**Datos NO accedidos:** No hay archivos de credenciales, ni archivos del sistema, ni variables de entorno. No lee ni escribe fuera del directorio de salida que especifique.

No se recopila ni se envía **telemetría**.

## Plataformas

- Python 3.11+
- Funciona en Linux, macOS, Windows
- Ollama es necesario solo para los comandos `generate`, `mutate` y `build`.

## Licencia

MIT

---

Desarrollado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
