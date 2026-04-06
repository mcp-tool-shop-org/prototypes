<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-aside/readme.png" alt="mcp-aside logo" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-aside"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-aside" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-aside/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  An MCP server that gives your AI a place to jot things down mid-conversation — without derailing the task at hand.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#tools">Tools</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#license">License</a>
</p>

---

## ¿Por qué?

Los LLM (Modelos de Lenguaje Grandes) pierden el hilo de las cosas. Un pensamiento aislado, una preocupación a medio formar, un "deberíamos volver a esto" que nunca se revisa. **mcp-aside** proporciona al modelo una bandeja de entrada dedicada para registrar estas notas — con límites de velocidad, eliminación de duplicados y caducidad automática, para que la bandeja de entrada no se convierta en un problema en sí misma.

Piénsalo como un bloc de notas adhesivo al lado de la conversación. El modelo escribe notas. Tú (o el modelo) las lees cuando sea el momento adecuado.

## ¿Cómo funciona?

1. El modelo llama a `aside.push` con un pensamiento, etiquetado por prioridad.
2. Los mecanismos de control verifican si hay duplicados, límites de velocidad y límites de tiempo de vida (TTL).
3. Si pasa la verificación, la nota se guarda en una bandeja de entrada en memoria.
4. Los clientes reciben una notificación a través de `notifications/resources/updated`.
5. Cualquiera puede leer la bandeja de entrada a través del recurso `interject://inbox`.

No hay base de datos. No hay persistencia. Si el servidor se detiene, la bandeja de entrada desaparece; esto es por diseño.

## Guía de inicio rápido

```bash
npm install
npm run build
node build/index.js
```

El servidor utiliza MCP a través de **stdio**. Dirige cualquier cliente compatible con MCP hacia él:

```json
{
  "mcpServers": {
    "aside": {
      "command": "node",
      "args": ["build/index.js"]
    }
  }
}
```

## Herramientas

| Herramienta | ¿Qué hace? |
| --- | --- |
| `aside.push` | Envía una nota a la bandeja de entrada. Acepta `text`, `priority` (bajo/medio/alto), `reason`, `tags`, `expiresAt`, `source` y `meta`. |
| `aside.configure` | Ajusta los mecanismos de control en tiempo de ejecución: límites de tiempo de vida (TTL), límites de velocidad, ventanas de eliminación de duplicados, umbrales de notificación. |
| `aside.clear` | Borra la bandeja de entrada. |
| `aside.status` | Captura de solo lectura del tamaño de la bandeja de entrada y la configuración actual de los mecanismos de control. |

## Recurso

| URI | Descripción |
| --- | --- |
| `interject://inbox` | Arreglo JSON de notas pendientes, ordenadas de la más reciente a la más antigua. Los elementos caducados se filtran al leer. |

## Mecanismos de control

Todo es configurable a través de `aside.configure`. Valores predeterminados:

| Configuración | Valor predeterminado | ¿Qué controla? |
| --- | --- | --- |
| `defaultTtlSeconds` | 600 (10 minutos) | Cuánto tiempo vive una nota si no se establece una fecha de caducidad explícita. |
| `maxTtlSeconds` | 3600 (1 hora) | Límite máximo de tiempo de vida (TTL), incluso si el solicitante pide más. |
| `dedupeWindowSeconds` | 300 (5 minutos) | Misma prioridad + texto + razón = suprimida dentro de este intervalo. |
| `rateLimitWindowSeconds` | 60 | Ventana deslizante para el límite de velocidad. |
| `rateLimitMax` | bajo: 6, medio: 3, alto: 1 | Máximo número de notas por prioridad por ventana. |
| `notifyAtOrAbove` | alto | Solo envía notificaciones de registro para elementos con una prioridad igual o superior a esta. |

## Configuración

### Temporizador

Un temporizador interno se activa cada 5 minutos, enviando una nota de baja prioridad para verificar si hay "algún problema?". Respeta los mismos mecanismos de control que las notas enviadas manualmente (por lo que se eliminarán o limitarán como cualquier otra cosa). Desactívalo comentando la llamada `startTimerTrigger` en `index.ts`.

### Inspector de MCP

Para pruebas locales:

```
Transport: STDIO
Command:   node
Args:      build/index.js
```

## Notas

- Los registros se envían a **stderr**; la salida estándar (stdout) está reservada para el JSON-RPC de MCP.
- La bandeja de entrada es efímera. Reiniciar = volver a empezar.
- Las notas se almacenan en orden de la más reciente a la más antigua. Los elementos caducados se eliminan cada vez que se lee o se envía una nota.

## Licencia

[MIT](LICENSE)

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
