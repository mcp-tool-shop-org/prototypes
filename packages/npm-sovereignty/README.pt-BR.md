<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/sovereignty/readme.png" width="400" alt="sovereignty" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/sovereignty"><img src="https://img.shields.io/npm/v/@mcptoolshop/sovereignty" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-sovereignty/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/sovereignty/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Um jogo de estratégia sobre governança, confiança e comércio — versão para tabuleiro offline + verificação online via XRPL.

**Não é necessário Python.** Este pacote baixa um binário pré-compilado e o executa localmente.

## Instalação e Execução

```bash
npx @mcptoolshop/sovereignty tutorial
```

E é isso. Sem Python, sem pip, sem ambientes virtuais.

## O que acontece

1. Na primeira execução, o programa baixa um binário específico para a plataforma (aproximadamente 25 MB) de [GitHub Releases](https://github.com/mcp-tool-shop-org/sovereignty/releases).
2. Verifica o checksum SHA256.
3. Armazena em cache localmente (`~/.cache/mcptoolshop/sovereignty/`).
4. Executa com a passagem completa de argumentos.

Execuções subsequentes são iniciadas instantaneamente a partir do cache.

## Comandos

```bash
npx @mcptoolshop/sovereignty tutorial    # learn the rules
npx @mcptoolshop/sovereignty new         # start a new game
npx @mcptoolshop/sovereignty status      # check game state
npx @mcptoolshop/sovereignty --help      # see all commands
```

## Plataformas suportadas

- Linux x64
- macOS ARM64 (Apple Silicon)
- macOS x64 (Intel)
- Windows x64

## Segurança

Todos os binários são verificados em relação aos checksums SHA256 antes da execução. Sem telemetria. Sem acesso à rede além do download inicial do GitHub.

Desenvolvido por [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternativa: Instalação via Python

Se você preferir Python:

```bash
pipx install sovereignty-game
sov tutorial
```

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
