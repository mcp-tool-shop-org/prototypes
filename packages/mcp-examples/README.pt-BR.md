<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-examples/readme.png" alt="MCP Examples" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-examples/actions/workflows/validate.yml/badge.svg" alt="Validate Examples"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-examples/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Exemplos de ambientes de trabalho para [MCP Tool Shop](https://github.com/mcp-tool-shop).

## Como o MCP Tool Shop se encaixa

- **Registro** ([mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry)) → quais ferramentas existem
- **Interface de Linha de Comando (CLI)** ([mcpt](https://github.com/mcp-tool-shop-org/mcpt)) → como você as utiliza
- **Exemplos** → como você aprende a usar o sistema (este repositório)
- **Tags** (v0.1.0, v0.2.0) → estabilidade, reprodutibilidade
- **main** → apenas para desenvolvimento; pode mudar sem aviso; as compilações podem falhar
- **As ferramentas funcionam com o mínimo de privilégios** → sem acesso à rede, sem escrita, sem efeitos colaterais
- **A funcionalidade é sempre explícita e opcional** → você decide quando habilitar

## Exemplos

| Exemplo | Descrição |
| --------- | ------------- |
| [hello-tools](./hello-tools/) | Seu primeiro ambiente de trabalho MCP em 2 minutos |
| [hello-filesystem](./hello-filesystem/) | Efeitos colaterais irreversíveis tratados com segurança |

## Início Rápido

```bash
cd hello-tools
python -m tools.echo.main "Hello, MCP!"
```

## Relacionados

- [mcpt](https://github.com/mcp-tool-shop-org/mcpt) - Interface de linha de comando para descobrir e executar ferramentas
- [mcp-tool-registry](https://github.com/mcp-tool-shop-org/mcp-tool-registry) - Registro de metadados das ferramentas
