<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" alt="receipt-factory">
</p>

<p align="center">
  Receipts are how we prove work happened — without trusting vibes.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/receipt-factory/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/receipt-factory/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/receipt-factory/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

---

Um recibo é um registro assinado, com data e hora, e reproduzível do **que aconteceu**:

- **O que foi feito** — ações, entradas, saídas
- **Por que foi feito** — intenção, política, contexto
- **Quem/o que fez isso** — ator, executador, versões das ferramentas
- **Prova de que aconteceu** — hashes, links, checksums, logs
- **Como verificar** — comandos, instruções de repetição

Você pode ler um recibo em 30 segundos e verificá-lo em 2 minutos. Tudo é reproduzível. Se não for, não é um recibo.

## Pacotes

| Pacote | Descrição |
|---------|-------------|
| [`@receipt-factory/core`](packages/core) | Esquema de recibo, normalização, hashing SHA-256, API de construtor fluente |
| [`@receipt-factory/render`](packages/render) | Renderizadores Markdown + HTML independentes |
| [`@receipt-factory/verify`](packages/verify) | Validação de esquema, integridade de hash, verificação de links, aplicação de políticas |
| [`@receipt-factory/sign`](packages/sign) | Assinatura baseada em Cosign — recibos, políticas, pacotes (sidecars separados) |
| [`@receipt-factory/evidence`](packages/evidence) | Pacotes de evidências — pacotes de evidências portáteis e endereçados por conteúdo |
| [`@receipt-factory/index`](packages/index) | Índice de recibos — digitalização, pesquisa e filtragem de diretórios de recibos |
| [`@receipt-factory/policy`](packages/policy) | Pacotes de políticas — configuração de lint portável e versionada |
| [`@receipt-factory/bundle`](packages/bundle) | Pacotes de recibos — cápsulas de veracidade auto-verificáveis (zip) |
| [`@receipt-factory/adapter-github`](packages/adapters/github) | Busca de dados do GitHub Actions via CLI `gh` |
| [`@receipt-factory/cli`](apps/factory-cli) | O comando `rf` — criação, coleta, renderização, verificação e assinatura de recibos |

## Pipelines

| Pipeline | Tipo de Recibo | O que ele prova |
|----------|-------------|----------------|
| [`ci-receipts`](pipelines/ci-receipts) | `ci_run` | Uma compilação/teste CI ocorreu com entradas e resultados específicos |
| [`release-receipts`](pipelines/release-receipts) | `release` | Uma versão foi publicada com ativos e commits específicos |
| [`registry-sync`](pipelines/registry-sync) | `registry_sync` | O que foi publicado versus o que está no repositório — classificação de desvio |
| [`security-audit`](pipelines/security-audit) | `audit` | O que foi escaneado, com qual ferramenta, quais vulnerabilidades foram encontradas |
| [`sbom`](pipelines/sbom) | `sbom` | Lista de materiais de software gerada e atestada |

## Como começar

```bash
# Install the CLI
npm install -g @receipt-factory/cli

# Create a receipt from a GitHub Actions run
rf make ci --from github --run 12345678

# Render it
rf render receipts/ci/2026-03-03/12345678.json --format html

# Verify it
rf verify receipts/ci/2026-03-03/12345678.json

# Verify with strict lint + policy
rf verify receipts/ci/2026-03-03/12345678.json --strict --policy policy.json

# Bundle receipts into a portable capsule
rf bundle create receipts/ci/2026-03-03/12345678.json --follow --policy policy.json

# Sign the bundle
rf bundle sign bundles/abc123.bundle.zip --keyless
```

## Camadas de Confiança

receipt-factory fornece quatro camadas de confiança sobrepostas:

1. **Integridade do recibo** — recibos endereçados por conteúdo SHA-256 (resistentes a adulteração)
2. **Integridade da governança** — regras de lint baseadas em políticas com arquivos de política assinados
3. **Integridade do pacote** — pacotes zip auto-verificáveis com manifestos de hash
4. **Autoridade do pacote** — assinaturas Cosign separadas em pacotes (resistentes a adulteração)

Ordem de verificação: assinatura → integridade do arquivo → integridade semântica → governança.

## O que isso prova

- Uma compilação, teste, lançamento, auditoria ou geração de SBOM ocorreu em um momento específico
- As entradas e saídas são endereçadas por conteúdo e resistentes a adulteração
- Você pode re-verificar o recibo a qualquer momento com `rf verify`
- A cadeia completa de rastreabilidade pode ser visualizada com `rf graph`

## O que isso NÃO prova

- Que o código subjacente está correto (os recibos provam o processo, não a qualidade)
- Que o próprio ambiente CI não foi comprometido (esse é um problema da cadeia de suprimentos)
- Que os artefatos não foram modificados após a criação do recibo (use a assinatura para isso)

## Segurança

Consulte [SECURITY.md](SECURITY.md) para o modelo de ameaças e relatório.

**Nenhuma telemetria.** receipt-factory nunca envia dados para servidores externos, rastreia o uso ou coleta análises.

## Licença

MIT

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
