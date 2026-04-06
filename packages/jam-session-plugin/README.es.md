<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/jam-session-plugin/readme.png" alt="Jam Session Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/jam-session-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/jam-session-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Un piano virtual con inteligencia artificial que cuenta con una biblioteca de 100 canciones, enseñanza estructurada y sesiones de improvisación. Se reproduce a través de tus altavoces, sin necesidad de software externo.

Este plugin integra el servidor MCP de [AI Jam Session](https://github.com/mcp-tool-shop-org/ai_jam_session), añadiendo comandos de barra, personalidades de agentes y flujos de trabajo estructurados para el aprendizaje y la improvisación.

## Instalación

```bash
claude plugin add ai-jam-session
```

El servidor MCP (`@mcptoolshop/ai-jam-session`) se descarga automáticamente a través de npx. Requiere Node.js 18 o superior.

## Lo que obtienes

### Habilidades (comandos de barra)

| Comando | Descripción |
| --------- | ------------- |
| `/ai-jam-session:teach <song>` | Inicia una sesión de enseñanza estructurada. |
| `/ai-jam-session:practice <song> [level]` | Obtén un plan de práctica personalizado. |
| `/ai-jam-session:explore [query]` | Explora la biblioteca de 100 canciones por género, dificultad o palabra clave. |
| `/ai-jam-session:jam <song or genre>` | Inicia una sesión de improvisación: Claude crea su propia interpretación. |

### Agentes

| Agent | Descripción |
| ------- | ------------- |
| `piano-teacher` | Profesor paciente y pedagógico que se adapta al nivel del estudiante. |
| `jam-musician` | Músico relajado para sesiones de improvisación: prioriza el ritmo y fomenta la experimentación. |

### Herramientas MCP (15)

Explora, reproduce, enseña, improvisa y gestiona canciones. Las habilidades del plugin orquestan automáticamente estas herramientas, pero también están disponibles para su uso directo.

## Uso

Utiliza comandos de barra:

```
/ai-jam-session:explore jazz
/ai-jam-session:teach moonlight-sonata-mvt1
/ai-jam-session:practice let-it-be beginner
/ai-jam-session:jam autumn-leaves as blues
/ai-jam-session:jam jazz
```

O simplemente habla de forma natural: los agentes se activan según el contexto.

```
I want to learn a beginner jazz song on piano.
Help me practice Fur Elise at half speed.
Let's jam on some blues.
```

## Biblioteca de canciones

100 canciones integradas en 10 géneros (clásica, jazz, pop, blues, rock, R&B, latina, bandas sonoras, ragtime, new-age) en niveles principiante, intermedio y avanzado.

## Requisitos

- Node.js 18 o superior
- Altavoces (el piano se reproduce a través del audio del sistema)

## Enlaces

- Servidor MCP: [@mcptoolshop/ai-jam-session](https://www.npmjs.com/package/@mcptoolshop/ai-jam-session)
- Código fuente: [mcp-tool-shop-org/ai_jam_session](https://github.com/mcp-tool-shop-org/ai_jam_session)

## Licencia

MIT
