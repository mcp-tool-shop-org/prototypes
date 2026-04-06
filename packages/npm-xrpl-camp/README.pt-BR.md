<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/xrpl-camp/readme.png" width="400" alt="xrpl-camp" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/xrpl-camp"><img src="https://img.shields.io/npm/v/@mcptoolshop/xrpl-camp" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-xrpl-camp/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/xrpl-camp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Aprenda sobre o XRP Ledger em uma única sessão — carteira, pagamento, verificação, certificado em 10 minutos.

**Não é necessário Python.** Este pacote baixa um binário pré-compilado e o executa localmente.

## Instalação e Execução

```bash
npx @mcptoolshop/xrpl-camp start
```

E é isso. Sem Python, sem pip, sem ambientes virtuais.

## O que acontece

1. A primeira execução baixa um binário específico para a plataforma (aproximadamente 20 MB) de [GitHub Releases](https://github.com/mcp-tool-shop-org/xrpl-camp/releases).
2. Verifica o checksum SHA256.
3. Armazena em cache localmente (`~/.cache/mcptoolshop/xrpl-camp/`).
4. Executa com a passagem completa de argumentos.

Execuções subsequentes são iniciadas instantaneamente a partir do cache.

## Comandos

```bash
npx @mcptoolshop/xrpl-camp start      # begin the training
npx @mcptoolshop/xrpl-camp status     # check progress
npx @mcptoolshop/xrpl-camp --help     # see all commands
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
pipx install xrpl-camp
xrpl-camp start
```

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
