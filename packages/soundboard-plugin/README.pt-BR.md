<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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

## Destaques

- **12 vozes selecionadas** com roteamento que considera emoções (alegria, raiva, tristeza, medo, surpresa, urgência, calma, neutro)
- **Diálogo com várias vozes** com atribuição automática, indicações de cena e modificadores de velocidade
- **Divisão inteligente do texto** que divide textos longos em frases, com suporte para interrupções
- **SSML-lite** para controle detalhado (pausas, ênfase, tom, velocidade)
- **Tags de efeitos sonoros** que geram sons em formato WAV diretamente no código Python (`<ding>`, `<chime>`)
- **Sistema de monólogo interno** com limitação de taxa e redação automática
- **Reprodução robusta** com thread único, watchdog de 30 segundos e políticas de fila (interrupção / enfileiramento / descarte)
- **Segurança em primeiro lugar:** sandboxing de caminhos, controle de concorrência, erros estruturados e validação de arquivos WAV

## Comandos de Barra

| Comando | O que ele faz |
|---------|-------------|
| `/soundboard:speak` | Conversão de texto em fala com detecção de emoções e suporte a SSML |
| `/soundboard:narrate` | Narração de código com ritmo adaptável |
| `/soundboard:notify` | Notificações faladas sobre o fluxo de trabalho (eventos de compilação, teste e implantação) |
| `/soundboard:voices` | Lista as vozes e configurações disponíveis |
| `/soundboard:voice-status` | Estado do motor, informações do backend e limites aplicados |

Além da interface completa da ferramenta MCP: `voice.dialogue`, `voice.inner_monologue`, `voice.interrupt`, `voice.stream`, `voice.playback_diagnose`, `voice.ambient_enable`, `voice.ambient_mute`.

## Início Rápido

### Pré-requisitos

- [voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) >= 2.5.0 (o motor de síntese)
- Python >= 3.10
- Windows (principal sistema operacional; usa `winsound` para reprodução)

### Instalação

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

### Experimente

```
/soundboard:speak Hello! I'm your coding assistant.
/soundboard:narrate src/server.py
/soundboard:notify Build succeeded with 0 warnings
```

## Arquitetura

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

## Segurança

Este plugin é executado **totalmente na sua máquina**. Não há chamadas de rede, telemetria ou APIs de nuvem (a menos que você configure um backend de voz remoto).

| Propriedade | Implementação |
|----------|---------------|
| Limites de entrada | Máximo de 10.000 caracteres, velocidade limitada, limites de fragmentação/linha |
| Lista de vozes permitidas | 12 vozes pré-aprovadas, vozes desconhecidas são rejeitadas |
| Sandboxing de caminhos | Arquivos WAV são salvos no diretório `{tempdir}/voice-soundboard/` |
| Concorrência | Uma síntese por vez (controle de semáforo) |
| Segurança em caso de erro | Erros estruturados em formato JSON com IDs de rastreamento, sem rastreamento de pilha para o cliente |
| Redação de informações confidenciais | Caminhos, tokens, endereços IP, base64 e pares chave=valor são removidos dos logs |
| Validação de arquivos WAV | Verificação de "magic" RIFF/WAVE e tamanho mínimo em todos os arquivos de saída |

Consulte [`SECURITY.md`](SECURITY.md) para a política completa e [`docs/SECURITY_THREAT_MODEL.md`](docs/SECURITY_THREAT_MODEL.md) para o modelo de ameaças STRIDE-lite.

## Vozes

12 vozes selecionadas são incluídas no plugin:

| Voz | ID | Gênero | Estilo |
|-------|-----|--------|-------|
| Fenrir | `am_fenrir` | M | Poderosa, autoritária (padrão) |
| Eric | `am_eric` | M | Energética, urgente |
| Liam | `am_liam` | M | Acolhedora, conversacional |
| Onyx | `am_onyx` | M | Profunda, constante |
| Aoede | `af_aoede` | F | Clara, expressiva |
| Jessica | `af_jessica` | F | Profissional, neutra |
| Sky | `af_sky` | F | Brilhante, amigável |
| Alice | `bf_alice` | F | Britânica, composta |
| Emma | `bf_emma` | F | Britânica, acolhedora |
| Isabella | `bf_isabella` | F | Britânica, refinada |
| George | `bm_george` | M | Britânico, formal |
| Lewis | `bm_lewis` | M | Britânico, ponderado |

## Configuração

Toda a configuração é feita por meio de variáveis de ambiente (não há arquivos de configuração):

| Variável | Padrão | Descrição |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_OUTPUT_ROOT` | `{tempdir}/voice-soundboard/` | Diretório de saída para arquivos WAV |
| `VOICE_SOUNDBOARD_RATE_COOLDOWN_MS` | `0` (desativado) | Tempo de espera para limitar a taxa de processamento de cada ferramenta. |
| `VOICE_SOUNDBOARD_RETENTION_MINUTES` | `240` | Exclui automaticamente arquivos WAV mais antigos que este. |
| `VOICE_SOUNDBOARD_AMBIENT_ENABLED` | `0` | Habilita o sistema de monólogo interno. |

## Desenvolvimento

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

## Estrutura do Projeto

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

## Segurança e Escopo de Dados

- **Dados acessados:** Lê a entrada de texto para a síntese de voz. Processa a fala através do motor de voz local. A análise de SSML utiliza um analisador de subconjunto seguro. O monólogo interno remove informações confidenciais antes de armazená-las.
- **Dados NÃO acessados:** Não há saída de dados pela rede por padrão. Não há telemetria, análise ou rastreamento. Não há armazenamento de dados do usuário além de arquivos WAV temporários. Os backends de voz remotos são opcionais.
- **Permissões necessárias:** Acesso de leitura ao motor de voz. Acesso de escrita opcional para o diretório de saída de arquivos WAV.

## Avaliação

| Critério | Status |
|------|--------|
| A. Base de Segurança | APROVADO |
| B. Tratamento de Erros | APROVADO |
| C. Documentação para Operadores | APROVADO |
| D. Boas Práticas de Implantação | APROVADO |
| E. Identidade | APROVADO |

## Licença

[MIT](LICENSE)

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
