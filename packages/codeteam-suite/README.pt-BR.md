<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/codeteam-suite/readme.png" alt="CodeTeam Suite" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/codeteam-suite/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://mcp-tool-shop-org.github.io/codeteam-suite/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**A implementação autoritária do CodeTeam** — uma CLI e biblioteca baseadas em .NET para verificação, aprovação e assinatura de pacotes.

## Status

**v0.2.0 Lançada** — Ciclo de confiança criptográfico completo. Contrato de interoperabilidade definido.

### O que está estável

Os seguintes elementos estão congelados e protegidos pelo CI:

| Artefato | Localização | Garantia |
| ---------- | ---------- | ----------- |
| Esquemas JSON | `/schemas/*.v0.1.json` | Apenas alterações incrementais |
| Saída da CLI `verify --json` | `codeteam.cli.verify.schema.v0.1.json` | Compatível com versões anteriores |
| Códigos de erro | `ErrorCode.cs` | Sem remoções ou renomeações |
| Mapeamento de severidade | `severity-map.v0.1.json` | Novos códigos requerem mapeamento |

Os testes de interoperabilidade garantem essas condições. Alterações incompatíveis fazem com que o CI falhe.

## Pacotes NuGet

| Pacote | Descrição |
| --------- | ------------- |
| `CodeTeam` | Ferramenta global .NET para verificação, aprovação e assinatura de pacotes. Instale com `dotnet tool install -g CodeTeam`. |
| `CodeTeam.Core` | Modelos de domínio, lógica de verificação, JSON canônico e avaliação de políticas baseada em quórum. |
| `CodeTeam.Crypto` | Verificação de assinatura Ed25519 e cálculo de hash SHA-256 via NSec.Cryptography. |
| `CodeTeam.Packaging` | Leitura e verificação de pacotes com proteção contra travessia de diretórios e validação de esquema JSON. |

## Visão geral

O CodeTeam Suite é a implementação "oficial" que todas as extensões de editor (VS Code, Visual Studio) utilizam. As extensões invocam a CLI e exibem os resultados; elas NÃO implementam a lógica de verificação.

## Arquitetura

```
CodeTeam.Core       → Domain models, status codes, error types
CodeTeam.Crypto     → Ed25519 signatures, SHA-256 hashing
CodeTeam.Packaging  → Package loading and verification
CodeTeam.Cli        → CLI entry point (codeteam verify/approve/sign)
```

## Uso da CLI

```bash
# Verify a package
codeteam verify <package-path> --json

# Approve a package
codeteam approve <package-path> --key <key-id> --json

# Sign a package
codeteam sign <package-path> --key <key-id> --json
```

## Códigos de saída

| Code | Status | Significado |
| ------ | -------- | --------- |
| 0 | OK_VERIFIED | Pacote verificado com assinatura válida |
| 1 | OK_UNSIGNED | Pacote válido, mas não assinado |
| 2 | FAIL_INTEGRITY | Arquivo ausente, incompatibilidade de tamanho/hash |
| 3 | FAIL_SCHEMA | Validação do esquema falhou |
| 4 | FAIL_SIGNATURE | Verificação da assinatura falhou |
| 5 | FAIL_THRESHOLD | Limite de aprovação não atingido |
| 6 | FAIL_UNAUTHORIZED | Usuário não autorizado |

## Documentação

- [CONTRACT.md](CONTRACT.md) — Semântica oficial do pacote
- [VERIFICATION.md](VERIFICATION.md) — Regras normativas de verificação
- [docs/EDITOR_INTEGRATION.md](docs/EDITOR_INTEGRATION.md) — Contrato de extensão do editor (VS Code, Visual Studio)
- [docs/PRESS_KIT.md](docs/PRESS_KIT.md) — Materiais de marketing para lançamento
- [docs/sealing.md](docs/sealing.md) — Design de selagem (informativo)

## Fixtures de Teste

Os fixtures de teste definem os resultados de verificação esperados:

| Fixture | Status Esperado |
| --------- | ----------------- |
| `fixtures/minimal_unsigned/` | OK_UNSIGNED |
| `fixtures/approved_threshold_met/` | OK_UNSIGNED |
| `fixtures/signed_verified/` | OK_VERIFIED |
| `fixtures/tampered_artifact/` | FAIL_INTEGRITY |
| `fixtures/invalid_manifest/` | FAIL_SCHEMA |
| `fixtures/signed_verified_real/` | OK_VERIFIED |
| `fixtures/signed_invalid_sig/` | FAIL_SIGNATURE |

## Construção

```bash
dotnet build
dotnet test
```

## Licença

MIT
