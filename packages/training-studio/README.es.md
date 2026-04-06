<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

# Training Studio

[![CI](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/mcp-tool-shop-org/training-studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/mcp-tool-shop-org/training-studio)](LICENSE)
[![Landing Page](https://img.shields.io/badge/Landing_Page-live-blue)](https://mcp-tool-shop-org.github.io/training-studio/)

**Entrene modelos de aprendizaje automático directamente en su navegador. Sin nube. Sin carga de datos. Sin configuración de Python.**

Training Studio es una aplicación de entrenamiento de ML impulsada por TensorFlow.js que se ejecuta completamente de forma local. Sus datos nunca abandonan su dispositivo.

## ¿Por qué Training Studio?

| Problema | Solución |
| --------- | ---------- |
| Problemas con el entorno de Python | **Configuración cero** - simplemente abra y entrene |
| Preocupaciones de privacidad con el ML en la nube | **100% local** - los datos nunca abandonan su dispositivo |
| Herramientas de ML complejas | **Flujo de trabajo simple** - CSV de entrada, modelo entrenado de salida |
| Ciclos de iteración lentos | **Retroalimentación en tiempo real** - gráficos y métricas en vivo |

## Características

### Entrenamiento principal
- **Cargue conjuntos de datos CSV** - Detección automática de características/etiquetas
- **Configure modelos MLP** - Capas ocultas, activación, dropout
- **Gráficos de entrenamiento en tiempo real** - Visualización de pérdida y precisión
- **Detención temprana** - Detección automática de convergencia
- **Aceleración de GPU** - WebGPU/WebGL para un entrenamiento rápido

### Evaluación y predicción
- **Matriz de confusión** - Rendimiento visual de la clasificación
- **Métricas por clase** - Precisión, exhaustividad, puntaje F1
- **Predicciones individuales** - Pruebe muestras individuales
- **Inferencia por lotes** - Prediga en archivos CSV
- **Exporte resultados** - Descargue las predicciones como CSV

### Herramientas de datos
- **Preprocesamiento** - Normalización, manejo de valores faltantes
- **Codificación one-hot** - Conversión automática de categorías
- **División de entrenamiento/prueba** - Porcentaje de validación configurable
- **Historial de entrenamiento** - Compare ejecuciones, encuentre los mejores modelos

### Listo para producción
- **283 pruebas** - Cobertura de pruebas completa
- **Accesible** - Base WCAG 2.1 AA
- **Adaptable** - Funciona en tabletas y dispositivos móviles
- **Funciona sin conexión** - No se requiere conexión a Internet después de la instalación

## Instalación

### Desde el código fuente

```bash
git clone https://github.com/mcp-tool-shop-org/training-studio.git
cd training-studio/TrainingStudio.Web
npm install
npm run build
```

## Guía rápida

### Validar un paquete (30 segundos)

```bash
# From source
npm run validate ./src/tests/fixtures/golden-v1

# JSON output
training-studio validate --json ./my-bundle
```

### Salida JSON

```json
{
  "ok": true,
  "exit_code": 0,
  "bundle_id": "00000000-0000-4000-8000-000000000001",
  "bundle_digest": "719823b86e10fe388aa8a9b14cb135624e73c253dc69f5065f78871403c3df3f",
  "version": "0.1",
  "schema_uri": "https://github.com/mcp-tool-shop-org/training-studio/blob/main/bundle.schema.json",
  "schema_version": "0.1",
  "errors": [],
  "warnings": [],
  "stats": {
    "files_total": 7,
    "artifacts_listed": 6,
    "artifacts_verified": 6
  }
}
```

### Códigos de salida

| Code | Significado |
| ------ | --------- |
| 0 | Paquete válido |
| 2 | Válido con advertencias |
| 3 | Paquete inválido |

## Formato del paquete

Consulte [SPEC.md](SPEC.md) para la especificación completa del paquete.

### Estructura de directorios

```
bundle/
├── bundle.json           # Manifest
├── model/
│   ├── model.json        # TF.js topology
│   └── weights.bin       # Model weights
├── metrics/
│   ├── metrics.jsonl     # Per-epoch metrics
│   └── summary.json      # Training summary
├── config/
│   └── run_config.json   # Hyperparameters
└── data/
    └── schema.json       # Feature/label schema
```

## Guía rápida (aplicación web)

```bash
cd TrainingStudio.Web
npm install
npm run dev
```

Luego abra http://localhost:5173 en su navegador.

### Pruebe con datos de muestra

1. Haga clic en la pestaña **Dataset**
2. Cargue `sample_data/iris.csv`
3. Seleccione las características: sepal_length, sepal_width, petal_length, petal_width
4. Seleccione la etiqueta: species
5. Vaya a la pestaña **Model**, use los valores predeterminados (capas ocultas de 64 y 32)
6. Vaya a la pestaña **Train**, haga clic en **Start Training**
7. ¡Observe cómo los gráficos se actualizan en tiempo real!

## Aplicación de escritorio (Windows)

```bash
cd TrainingStudio.Web && npm run build
cd ../TrainingStudio.App
dotnet build -c Release
dotnet run
```

Requiere Windows 10 1809+, 4 GB de RAM (se recomiendan 8 GB), GPU con WebGL 2.0 o WebGPU (opcional, alternativa con CPU).

## Desarrollo

```bash
cd TrainingStudio.Web

# Run all 283 tests
npm test

# Watch mode
npm test -- --watch

# Build production web app
npm run build
```

## Documentación

| Documento | Descripción |
| ---------- | ------------- |
| [SPEC.md](SPEC.md) | Especificación del formato del paquete |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Problemas comunes y soluciones |
| [CHANGELOG.md](CHANGELOG.md) | Historial de versiones |
| [ROADMAP.md](ROADMAP.md) | Hoja de ruta de desarrollo |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Cómo contribuir |

## Conjuntos de datos de ejemplo

| File | Task | Características | Clases |
| ------ | ------ | ---------- | --------- |
| `sample_data/iris.csv` | Clasificación multiclase | 4 | 3 |
| `sample_data/binary_classification.csv` | Clasificación binaria | 2 | 2 |

## Privacidad y seguridad

- **No se recopilan datos** - Sus datos permanecen en su dispositivo.
- **Sin telemetría** - No rastreamos el uso.
- **Funciona sin conexión** - Funciona sin internet.
- **Código abierto** - Puede auditar el código usted mismo.

Consulte [PRIVACY.md](PRIVACY.md) y [SECURITY.md](SECURITY.md) para obtener más detalles.

## Licencia

MIT - Consulte [LICENSE](LICENSE) para obtener más detalles.

---

Creado por [MCP Tool Shop](https://mcp-tool-shop.github.io/)
