<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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

Feedback de áudio procedural para [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Cada chamada de ferramenta, edição de arquivo, pesquisa, envio para o Git e despacho de agente recebe um som distinto — sintetizado a partir de cálculos matemáticos, e não de arquivos de áudio.

## Início Rápido

```bash
npm install -g @mcptoolshop/claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

Pronto. O Claude Code agora emitirá sons enquanto estiver em execução.

## Por que o feedback de áudio?

Quando um agente de IA lê, escreve, pesquisa e implanta em seu nome, você perde a visibilidade. Você está apenas olhando para o texto passando na tela. O feedback de áudio restaura a consciência:

- **Acessibilidade** — ouça as mudanças de estado, erros e conclusões sem precisar observar o terminal.
- **Fluxo** — saiba se um teste foi aprovado ou se um envio foi concluído sem precisar alternar entre diferentes contextos.
- **Presença** — o agente parece um colaborador, e não uma caixa preta.

## Os 7 Verbos

Cada ação do Claude Code corresponde a um dos 7 verbos principais. Modificadores (status, escopo, direção) alteram o som sem comprometer a coerência.

| Verbo | Gatilhos | Som |
|---|---|---|
| **intake** | `Read`, `WebFetch`, `WebSearch` | Onda senoidal ascendente — algo chegando |
| **transform** | `Edit` | Pulso texturizado por FM — remodelando |
| **commit** | `Write`, `NotebookEdit`, `git commit` | Tom de estalo agudo — finalizado |
| **navigate** | `Grep`, `Glob` | Ping de sonar — escaneando |
| **execute** | `Bash`, `npm test`, `tsc` | Ruído + tom — ação mecânica |
| **move** | `mv`, `cp`, criação de subagente | Sopro de vento — deslocamento de ar |
| **sync** | `git push`, `git pull` | Sopro dramático + âncora tonal |

### Modificadores

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

### Detecção Inteligente de Bash

O manipulador de eventos inspeciona os comandos Bash para escolher o som correto:

| Comando Bash | Verbo | Status |
|---|---|---|
| `git push` | sync (para cima) | com base no código de saída |
| `git pull` | sync (para baixo) | com base no código de saída |
| `npm test`, `pytest` | execução | com base no código de saída |
| `tsc`, `npm run build` | execução | com base no código de saída |
| `mv`, `cp` | movimento | — |
| `rm` | movimento | aviso |
| tudo o mais | execução | com base no código de saída |

## Perfis

Paletas de som que alteram todo o "caráter" com um único parâmetro.

| Perfil | Caráter |
|---|---|
| **minimal** (default) | Tons de onda senoidal — sutis, profissionais, para uso diário |
| **retro** | Ruídos de onda quadrada em 8 bits — divertidos, mas controlados |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### Perfis Personalizados

Copie `profiles/minimal.json`, edite os parâmetros de síntese e carregue-o:

```bash
claude-sfx play navigate --profile ./my-profile.json
```

Cada número no JSON corresponde diretamente ao motor de síntese — forma de onda, frequência, duração, envelope (ADSR), profundidade de modulação por frequência (FM), largura de banda, ganho.

## Prevenção de Irritação

O que diferencia um produto de um brinquedo.

| Recurso | Comportamento |
|---|---|
| **Debounce** | Mesmo verbo dentro de 200ms → um som |
| **Rate limit** | Máximo de 8 sons por janela de 10 segundos |
| **Quiet hours** | Todos os sons são suprimidos durante as horas configuradas |
| **Mute** | Alternância instantânea, persiste após a reinicialização da sessão |
| **Volume** | Controle de ganho de 0 a 100 |
| **Per-verb disable** | Desative verbos específicos que você não deseja |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## Ambiente (Operações de Longa Duração)

Para comandos que levam um tempo (compilações, implantações, grandes conjuntos de testes):

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## Sons da Sessão

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## Todos os comandos

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

## Como Funciona

Nenhum arquivo de áudio. Cada som é sintetizado em tempo de execução a partir de cálculos matemáticos:

- **Osciladores** — seno, quadrado, dente de serra, triângulo, ruído branco
- **Envelopes ADSR** — ataque, decaimento, sustentação, liberação
- **Síntese por modulação de frequência (FM)** — para textura
- **Filtro de estado variável** — ruído filtrado em banda para sons de "whoosh"
- **Varreduras de frequência** — interpolação linear para movimento
- **Limitador de volume** — compressão "soft-knee", limite máximo

Todo o pacote tem aproximadamente 2.800 linhas de TypeScript, sem dependências de produção. Os sons são gerados como buffers PCM, codificados para WAV na memória e reproduzidos através do reprodutor de áudio nativo do sistema operacional (PowerShell no Windows, afplay no macOS, aplay no Linux).

## Segurança e Privacidade

**Dados acessados:** `~/.claude-sfx/config.json` (preferências), `.claude/settings.json` (registro de hooks). Os buffers de áudio são gerados na memória e nunca são gravados em disco, a menos que você execute o comando `export`.

**Dados NÃO acessados:** código-fonte, histórico do Git, rede, credenciais, variáveis de ambiente. Nenhuma informação de telemetria é coletada ou enviada. Nenhum arquivo de áudio é baixado; todos os sons são sintetizados localmente a partir de cálculos matemáticos.

**Permissões:** leitura/escrita no sistema de arquivos para configurações e hooks, invocação do reprodutor de áudio do sistema operacional. Consulte o arquivo [SECURITY.md](SECURITY.md) para a política completa.

## Requisitos

- Node.js 18 ou superior
- Claude Code
- Saída de áudio do sistema (alto-falantes ou fones de ouvido)

## Licença

[MIT](LICENSE)

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
