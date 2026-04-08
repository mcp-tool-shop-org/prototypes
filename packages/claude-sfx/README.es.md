<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/claude-sfx/readme.jpg" width="400" alt="Claude-SFX">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/claude-sfx"><img src="https://img.shields.io/npm/v/@mcptoolshop/claude-sfx" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/claude-sfx/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx"><img src="https://codecov.io/gh/mcp-tool-shop-org/claude-sfx/branch/main/graph/badge.svg" alt="codecov"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-sfx/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Retroalimentación de audio procedimental para [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Cada llamada a una herramienta, edición de archivo, búsqueda, envío a Git y despliegue de agente genera un sonido distinto, sintetizado a partir de matemáticas, no de archivos de audio.

## Inicio rápido

```bash
npm install -g @mcptoolshop/claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

Eso es todo. Claude Code ahora reproducirá sonidos mientras trabaja.

## ¿Por qué retroalimentación de audio?

Cuando un agente de IA lee, escribe, busca y despliega en su nombre, pierde visibilidad. Está mirando texto que se desplaza. La retroalimentación de audio restablece la conciencia:

- **Accesibilidad** — escuche los cambios de estado, los errores y las finalizaciones sin tener que mirar la terminal.
- **Flujo** — sepa si una prueba ha pasado o si un envío se ha completado sin tener que cambiar de contexto.
- **Presencia** — el agente se siente como un colaborador, no como una caja negra.

## Los 7 verbos

Cada acción de Claude Code se corresponde con uno de 7 verbos principales. Los modificadores (estado, alcance, dirección) alteran el sonido sin romper la coherencia.

| Verbo | Desencadenantes | Sonido |
|---|---|---|
| **intake** | `Read`, `WebFetch`, `WebSearch` | Onda sinusoidal ascendente — algo que está entrando |
| **transform** | `Edit` | Pulso con textura FM — remodelación |
| **commit** | `Write`, `NotebookEdit`, `git commit` | Tono de timbre agudo — sellado |
| **navigate** | `Grep`, `Glob` | Pitido de sonar — escaneo |
| **execute** | `Bash`, `npm test`, `tsc` | Estallido de ruido + tono — acción mecánica |
| **move** | `mv`, `cp`, inicio de subagente | Silbido de viento — desplazamiento de aire |
| **sync** | `git push`, `git pull` | Silbido dramático + ancla tonal |

### Modificadores

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

### Detección inteligente de Bash

El controlador de eventos examina los comandos de Bash para seleccionar el sonido correcto:

| Comando de Bash | Verbo | Estado |
|---|---|---|
| `git push` | sync (arriba) | a partir del código de salida |
| `git pull` | sync (abajo) | a partir del código de salida |
| `npm test`, `pytest` | ejecutar | a partir del código de salida |
| `tsc`, `npm run build` | ejecutar | a partir del código de salida |
| `mv`, `cp` | mover | — |
| `rm` | mover | advertencia |
| todo lo demás | ejecutar | a partir del código de salida |

## Perfiles

Paletas de sonido que cambian todo el carácter con una sola opción.

| Perfil | Carácter |
|---|---|
| **minimal** (default) | Tonos de onda sinusoidal — sutiles, profesionales, para uso diario |
| **retro** | Ruido de onda cuadrada de 8 bits — divertido pero controlado |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### Perfiles personalizados

Copie `profiles/minimal.json`, edite los parámetros de síntesis y cárguelo:

```bash
claude-sfx play navigate --profile ./my-profile.json
```

Cada número en el archivo JSON se corresponde directamente con el motor de síntesis: forma de onda, frecuencia, duración, envolvente (ADSR), profundidad FM, ancho de banda, ganancia.

## Anti-molestias

Lo que diferencia un producto de un juguete.

| Función | Comportamiento |
|---|---|
| **Debounce** | El mismo verbo dentro de 200 ms → un sonido |
| **Rate limit** | Máximo de 8 sonidos por ventana de 10 segundos |
| **Quiet hours** | Todos los sonidos se suprimen durante las horas configuradas |
| **Mute** | Activación instantánea, persiste al reiniciar la sesión |
| **Volume** | Control de ganancia de 0 a 100 |
| **Per-verb disable** | Desactive los verbos específicos que no desee |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## Ambiente (operaciones de larga duración)

Para comandos que tardan un tiempo (compilaciones, despliegues, suites de pruebas grandes):

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## Sonidos de sesión

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## Todos los comandos

```
Setup:
  init                            Install hooks into .claude/settings.json
  uninstall                       Remove hooks

Playback:
  play <verb> [options]           Play a sound (goes through guard)
  demo [--profile <name>]         Play all 7 verbs
  preview [profile]               Audition all sounds in a profile
  session-start / session-end     Chimes
  ambient-start / ambient-resolve / ambient-stop

Config:
  mute / unmute                   Toggle all sounds
  volume [0-100]                  Get or set volume
  config                          Print current config
  config set <key> <value>        Set a value
  config reset                    Reset to defaults
  config repo <profile|clear>     Per-directory profile override
  disable / enable <verb>         Toggle specific verbs
  export [dir] [--profile]        Export all sounds as .wav files
```

## Cómo funciona

No se utilizan archivos de audio. Cada sonido se sintetiza en tiempo de ejecución a partir de matemáticas:

- **Osciladores** — seno, cuadrado, diente de sierra, triángulo, ruido blanco
- **Envolventes ADSR** — ataque, decaimiento, sostenimiento, liberación
- **Síntesis FM** — modulación de frecuencia para textura
- **Filtro de estado variable** — ruido filtrado en banda para silbidos
- **Barridos de frecuencia** — interpolación lineal para movimiento
- **Limitador de volumen** — compresión de "suave rodilla", límite máximo

Todo el paquete tiene aproximadamente 2800 líneas de TypeScript y no tiene dependencias de producción. Los sonidos se generan como búferes PCM, se codifican en WAV en la memoria y se reproducen a través del reproductor de audio nativo del sistema operativo (PowerShell en Windows, afplay en macOS, aplay en Linux).

## Seguridad y privacidad

**Datos modificados:** `~/.claude-sfx/config.json` (preferencias), `.claude/settings.json` (registro de hooks). Los búferes de audio se generan en la memoria y nunca se escriben en el disco, a menos que ejecute el comando `export`.

**Datos NO modificados:** código fuente, historial de Git, red, credenciales, variables de entorno. No se recopilan ni se envían datos de telemetría. No se descargan archivos de audio; cada sonido se sintetiza localmente a partir de cálculos matemáticos.

**Permisos:** lectura/escritura en el sistema de archivos para la configuración y los hooks, invocación del reproductor de audio del sistema operativo. Consulte [SECURITY.md](SECURITY.md) para obtener la política completa.

## Requisitos

- Node.js 18+
- Claude Code
- Salida de audio del sistema (altavoces o auriculares)

## Licencia

[MIT](LICENSE)

---

Desarrollado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
