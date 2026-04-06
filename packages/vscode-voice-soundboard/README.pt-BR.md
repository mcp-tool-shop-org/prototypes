<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/vscode-voice-soundboard/readme.png" alt="Voice Soundboard" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/vscode-voice-soundboard/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=mcp-tool-shop.vscode-voice-soundboard"><img src="https://img.shields.io/visual-studio-marketplace/v/mcp-tool-shop.vscode-voice-soundboard.svg" alt="Marketplace"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/vscode-voice-soundboard"><img src="https://img.shields.io/codecov/c/github/mcp-tool-shop-org/vscode-voice-soundboard" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/vscode-voice-soundboard/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Extensão de texto para fala com 48 vozes, predefinições e diálogo multi-alto-falante — alimentada por [MCP Voice Soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard).

## Características

- **Painel lateral** com abas "Falar", "Vozes" e "Diálogo"
- **48 vozes** em 9 idiomas (inglês, japonês, mandarim, espanhol, francês, hindi, italiano, português)
- **5 predefinições** — Assistente, Narrador, Locutor, Contador de histórias, Sussurro
- **Diálogo multi-alto-falante** — escreva roteiros, atribua vozes, reproduza tudo
- **Seleção de fala** — destaque código ou texto e pressione `Ctrl+Shift+S`
- Reprodução de áudio **multiplataforma** (Windows, macOS, Linux)

## Como começar

1. Instale a extensão
2. O servidor do MCP Voice Soundboard inicia automaticamente
3. Clique no ícone do microfone na barra de atividades
4. Digite o texto e clique em **Falar**

## Comandos

| Comando | Atalho | Descrição |
|---------|----------|-------------|
| Voice Soundboard: Falar texto... | — | Digite o texto a ser falado |
| Voice Soundboard: Falar seleção | `Ctrl+Shift+S` | Fala o texto selecionado no editor |
| Voice Soundboard: Parar de falar | — | Interrompe a reprodução atual |
| Voice Soundboard: Alterar voz | — | Seletor rápido de voz |
| Voice Soundboard: Alternar painel | — | Mostra/oculta o painel lateral |
| Voice Soundboard: Exportar diálogo como WebVTT | — | Exporta o roteiro do diálogo como um arquivo de legenda `.vtt` |

## Exportação de diálogo

Escreva um roteiro multi-alto-falante na aba "Diálogo", atribua vozes e, em seguida, clique em **Exportar VTT**. A extensão sintetiza cada linha, calcula os códigos de tempo cumulativos a partir das durações do áudio e salva um arquivo de legenda [WebVTT](https://developer.mozilla.org/en-US/docs/Web/API/WebVTT_API).

O arquivo `.vtt` exportado usa tags de voz (`<v Speaker>`) e pode ser usado com players de vídeo, editores de legendas ou ferramentas de acessibilidade.

## Configurações

| Configuração | Padrão | Descrição |
|---------|---------|-------------|
| `voiceSoundboard.defaultVoice` | `bm_george` | ID da voz padrão |
| `voiceSoundboard.speed` | `1.0` | Velocidade da fala (0,5–2,0) |
| `voiceSoundboard.backend` | `python` | Backend TTS (python/http/mock) |
| `voiceSoundboard.autoStart` | `true` | Iniciar automaticamente o servidor na ativação |
| `voiceSoundboard.format` | `wav` | Formato de saída de áudio |

## Segurança e escopo de dados

- **Backend local (padrão):** O Python/Kokoro TTS é executado inteiramente na sua máquina — sem tráfego de rede.
- **Backend na nuvem (opcional):** envia texto para uma API TTS configurada pelo usuário (OpenAI/ElevenLabs) — requer uma chave de API explícita.
- **Reprodução de áudio:** usa `spawn` com um array de argumentos, e não com o shell — veja [SECURITY.md](SECURITY.md) para detalhes.
- **Nenhum** dado de telemetria é coletado ou enviado.

## Licença

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
