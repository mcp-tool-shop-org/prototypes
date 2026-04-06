<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/soundboard-plugin/main/assets/logo-dark.jpg" alt="Soundboard Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin"><img src="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="https://pypi.org/project/voice-soundboard-plugin/"><img src="https://img.shields.io/pypi/v/voice-soundboard-plugin" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  A <a href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/plugins">Claude Code plugin</a> that speaks code walkthroughs, announces build results,<br>
  and adds context-aware text-to-speech to your development workflow.
</p>

---

## Highlights

- **12 voces seleccionadas** con enrutamiento que detecta emociones (alegría, ira, tristeza, miedo, sorpresa, urgencia, calma, neutralidad).
- **Diálogo con múltiples voces** con asignación automática, indicaciones de escena y modificadores de velocidad.
- **Fragmentación inteligente** que divide textos largos al final de las oraciones, con soporte para interrupciones.
- **SSML-lite** para un control preciso (pausas, énfasis, tono, velocidad).
- **Etiquetas de efectos de sonido (SFX)** que generan archivos WAV en Python directamente (`<ding>`, `<chime>`).
- **Sistema de monólogo interno** con limitación de velocidad y eliminación automática de información sensible.
- **Protección de la reproducción** con un proceso único, un "watchdog" de 30 segundos y políticas de cola (interrupción/en cola/descarte).
- **Seguridad primero:** Aislamiento de rutas, control de concurrencia, errores estructurados y validación de archivos WAV.

## Comandos de acceso directo

| Comando | Función |
|---------|-------------|
| `/soundboard:speak` | Conversión de texto a voz con detección de emociones y soporte para SSML. |
| `/soundboard:narrate` | Narración de código con ritmo adaptable. |
| `/soundboard:notify` | Notificaciones habladas sobre el flujo de trabajo (eventos de compilación, pruebas, despliegue). |
| `/soundboard:voices` | Lista de voces y configuraciones disponibles. |
| `/soundboard:voice-status` | Estado del motor, información del backend y límites establecidos. |

Además, acceso a todas las funciones de la herramienta MCP: `voice.dialogue`, `voice.inner_monologue`, `voice.interrupt`, `voice.stream`, `voice.playback_diagnose`, `voice.ambient_enable`, `voice.ambient_mute`.

## Guía de inicio rápido

### Requisitos previos

- [voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) >= 2.5.0 (el motor de síntesis).
- Python >= 3.10
- Windows (plataforma principal; utiliza `winsound` para la reproducción).

### Instalación

```bash
# 1. Install the voice engine
cd voice-soundboard
pip install -e ".[kokoro]"

# 2. Install the plugin
cd soundboard-plugin
pip install -e .

# 3. Register with Claude Code
claude plugin add /path/to/soundboard-plugin
```

### Prueba

```
/soundboard:speak Hello! I'm your coding assistant.
/soundboard:narrate src/server.py
/soundboard:notify Build succeeded with 0 warnings
```

## Arquitectura

```
Claude Code
    | stdio (JSON-RPC)
    v
stdio_bridge.py ──── security/guardrails.py
    |                     concurrency gate
    |                     rate limiter
    |                     structured errors
    v
speech pipeline
    ├── chunking.py        smart sentence splitting
    ├── ssml_lite.py       safe SSML subset parser
    ├── emotion/           8 emotions + voice routing
    ├── dialogue/          multi-speaker parser + casting
    ├── sfx_parser.py      <ding>/<chime> WAV generation
    ├── orchestrator.py    multi-chunk synthesis loop
    └── concat.py          WAV concatenation
    v
voice-soundboard engine
    ├── Kokoro (local, default)
    ├── Piper / OpenAI / Azure / ElevenLabs
    v
playback/worker.py ──── single-thread queue
    ├── 30s watchdog timer
    ├── interrupt / enqueue / drop policies
    └── retention.py (auto-cleanup)
    v
PCM audio -> speakers
```

## Seguridad

Este plugin se ejecuta **completamente en su máquina**. No realiza llamadas de red, no recopila datos de telemetría ni utiliza APIs en la nube (a menos que configure un backend de voz remoto).

| Propiedad | Implementación |
|----------|---------------|
| Límites de entrada | Máximo de 10.000 caracteres, velocidad limitada, límites de fragmentos/líneas. |
| Lista de voces permitidas | 12 voces preaprobadas, las desconocidas son rechazadas. |
| Aislamiento de rutas | Los archivos WAV de salida se guardan en `{tempdir}/voice-soundboard/`. |
| Concurrencia | Solo se puede realizar una síntesis a la vez (control de semáforo). |
| Seguridad en caso de error | Errores estructurados en formato JSON con identificadores de seguimiento; no se muestran trazas de pila al cliente. |
| Eliminación de información sensible | Rutas, tokens, direcciones IP, datos en base64 y pares clave=valor se eliminan de los registros. |
| Validación de archivos WAV | Comprobación de la firma "RIFF/WAVE" y el tamaño mínimo en cada archivo de salida. |

Consulte [`SECURITY.md`](SECURITY.md) para obtener la política completa y [`docs/SECURITY_THREAT_MODEL.md`](docs/SECURITY_THREAT_MODEL.md) para el modelo de amenazas STRIDE-lite.

## Voces

El plugin incluye 12 voces seleccionadas:

| Voz | ID | Género | Estilo |
|-------|-----|--------|-------|
| Fenrir | `am_fenrir` | M | Potente, autoritaria (predeterminada) |
| Eric | `am_eric` | M | Enérgica, urgente |
| Liam | `am_liam` | M | Cálida, conversacional |
| Onyx | `am_onyx` | M | Profunda, constante |
| Aoede | `af_aoede` | F | Clara, expresiva |
| Jessica | `af_jessica` | F | Profesional, neutral |
| Sky | `af_sky` | F | Brillante, amigable |
| Alice | `bf_alice` | F | Británica, compuesta |
| Emma | `bf_emma` | F | Británica, cálida |
| Isabella | `bf_isabella` | F | Británica, refinada |
| George | `bm_george` | M | Británico, formal |
| Lewis | `bm_lewis` | M | Británico, mesurado |

## Configuración

Toda la configuración se realiza a través de variables de entorno (no se utilizan archivos de configuración):

| Variable | Valor predeterminado | Descripción |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_OUTPUT_ROOT` | `{tempdir}/voice-soundboard/` | Directorio de salida de archivos WAV. |
| `VOICE_SOUNDBOARD_RATE_COOLDOWN_MS` | `0` (deshabilitado). | Tiempo de espera para limitar la velocidad de cada herramienta. |
| `VOICE_SOUNDBOARD_RETENTION_MINUTES` | `240` | Eliminar automáticamente los archivos WAV más antiguos que esta antigüedad. |
| `VOICE_SOUNDBOARD_AMBIENT_ENABLED` | `0` | Activar el sistema de monólogo interno. |

## Desarrollo

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run the test suite (323 tests)
python -m pytest tests/ -q

# Run the security battery only
python -m pytest tests/test_security.py -q

# Pre-release gate (tests + optional pip-audit)
python scripts/ship_gate.py
```

## Estructura del proyecto

```
soundboard-plugin/
├── voice_soundboard_plugin/
│   ├── bridge/          MCP stdio server + health checks
│   ├── speech/          TTS pipeline (chunking, SSML, orchestrator, concat)
│   │   ├── dialogue/    Multi-speaker parser + auto-casting
│   │   └── emotion/     Emotion detection + voice routing
│   ├── playback/        Single-thread worker + retention
│   ├── ambient/         Inner monologue subsystem
│   ├── security/        Guardrails, fs sandbox, redaction, WAV validation
│   └── audio/           Audio utilities
├── tests/               323 tests (unit + integration + security battery)
├── scripts/             ship_gate.py pre-release script
├── docs/                Threat model, privacy policy, release checklist
├── assets/              Logo and branding
├── SECURITY.md          Security policy + vulnerability reporting
└── pyproject.toml       Project metadata + dependencies
```

## Seguridad y alcance de los datos

- **Datos accedidos:** Lee la entrada de texto para la síntesis de voz. Procesa el habla a través del motor de voz local. El análisis de SSML utiliza un analizador de subconjunto seguro. El monólogo interno elimina información confidencial antes de almacenarla.
- **Datos NO accedidos:** No hay salida de red por defecto. No hay telemetría, análisis ni seguimiento. No se almacena ningún dato de usuario más allá de los archivos WAV temporales. Los servicios de voz remotos son opcionales.
- **Permisos requeridos:** Acceso de lectura al motor de voz. Acceso de escritura opcional para el directorio de salida de archivos WAV.

## Informe de evaluación

| Puerta de control. | Estado. |
|------|--------|
| A. Base de seguridad. | PASADO. |
| B. Manejo de errores. | PASADO. |
| C. Documentación para el operador. | PASADO. |
| D. Higiene en el despliegue. | PASADO. |
| E. Identidad. | PASADO. |

## Licencia

[MIT](LICENSE)

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.
