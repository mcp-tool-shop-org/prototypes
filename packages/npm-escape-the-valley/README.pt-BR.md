<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/escape-the-valley/readme.png" width="400" alt="Escape the Valley">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/escape-the-valley"><img src="https://img.shields.io/npm/v/@mcptoolshop/escape-the-valley" alt="npm version"></a>
  <a href="https://pypi.org/project/escape-the-valley/"><img src="https://img.shields.io/pypi/v/escape-the-valley" alt="PyPI"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-escape-the-valley/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/escape-the-valley/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Um jogo de sobrevivência no estilo de Oregon Trail, com narração por inteligência artificial e uma mochila opcional que utiliza o ledger XRPL.

**Não é necessário Python.** Este pacote baixa um binário pré-compilado e o executa localmente.

## Instalação e Execução

```bash
npx @mcptoolshop/escape-the-valley tui --seed 42
```

É só isso. Sem Python, sem pip, sem ambientes virtuais.

### Continuar um jogo salvo

```bash
npx @mcptoolshop/escape-the-valley tui --continue
```

Retoma exatamente de onde você parou — o jogo salva automaticamente em cada ponto de controle.

## O que acontece

1. Na primeira execução, o programa baixa um binário específico para a plataforma (aproximadamente 15 MB) de [GitHub Releases](https://github.com/mcp-tool-shop-org/escape-the-valley/releases)
2. Verifica o checksum SHA256
3. Armazena em cache localmente (`~/.cache/mcptoolshop/escape-the-valley/`)
4. Executa com a passagem completa de argumentos

Execuções subsequentes são iniciadas instantaneamente a partir do cache.

## O Jogo

Lidere um grupo de colonos através de uma área selvagem gerada aleatoriamente. Gerencie alimentos, água, condição da carroça e moral, enquanto lida com eventos, perigos e decisões difíceis. O vale é implacável, mas justo — um jogador habilidoso vence aproximadamente 1 em cada 3 tentativas.

Um **Mestre de Jogo por IA** (powered by Ollama) opcional narra sua jornada com três vozes narrativas. Uma **mochila opcional de ledger XRPL Testnet** rastreia cada alteração de suprimentos como registros na blockchain.

### Ações no Acampamento

| Ação | O que ela faz |
|--------|-------------|
| **Travel** | Mover em direção à saída — a cada turno em que você não se move, você gasta suprimentos sem progredir. |
| **Rest** | Recupera saúde e moral, com chance de curar condições. |
| **Hunt** | Coleta alimentos (melhor em florestas e planícies). |
| **Repair** | Repara danos na carroça antes que ela te deixe na mão. |
| **Ration** | Reduz a quantidade de comida para metade quando ela é escassa (afeta o moral). |
| **Abandon** | Reduz o peso da carga para aumentar a velocidade (último recurso). |

### Perfis do GM

| Perfil | Voz |
|---------|-------|
| **Chronicler** | Tom factual, histórico e direto. |
| **Fireside** | Narrador acolhedor e com tom de histórias populares. |
| **Lantern-Bearer** | Tom sombrio, atmosférico e ameaçador. |

## Comandos

```bash
npx @mcptoolshop/escape-the-valley tui                    # start a new game
npx @mcptoolshop/escape-the-valley tui --seed 42          # seeded world gen
npx @mcptoolshop/escape-the-valley tui --continue         # resume saved game
npx @mcptoolshop/escape-the-valley tui --gm chronicler    # choose GM voice
npx @mcptoolshop/escape-the-valley tui --callouts minimal # fewer warnings
npx @mcptoolshop/escape-the-valley ledger                 # print trail ledger
npx @mcptoolshop/escape-the-valley --help                 # see all commands
```

## Plataformas Suportadas

- Linux x64
- macOS ARM64 (Apple Silicon)
- Windows x64

## Solução de Problemas

```bash
npx @mcptoolshop/escape-the-valley --print-cache-path  # show cached binary location
npx @mcptoolshop/escape-the-valley --clear-cache       # force fresh re-download
```

**Fixe em uma versão específica** se a versão mais recente tiver regressões:

```bash
npx @mcptoolshop/escape-the-valley@1.0.0 tui --seed 42
```

## Segurança

Todos os binários são verificados em relação aos checksums SHA256 antes da execução. Sem telemetria. Sem acesso à rede além do download inicial do GitHub.

Desenvolvido por [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternativa: Instale via Python

Se você preferir Python:

```bash
pip install escape-the-valley
trail tui --seed 42
```

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
