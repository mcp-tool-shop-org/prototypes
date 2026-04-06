> ⚠️ **Este repositório foi movido para [accessibility-suite](https://github.com/mcp-tool-shop-org/accessibility-suite)**
> O código-fonte agora está localizado em: `docs/prov-spec/`

---

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/prov-spec/readme.png" alt="Prov-Spec — Provenance Specification Framework" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/prov-spec/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="spec/PROV_METHODS_SPEC.md"><img src="https://img.shields.io/badge/spec-v0.1.0-blue" alt="Spec Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/prov-spec/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

**Especificação e conjunto de testes formais e versionados para identificadores de métodos de rastreabilidade, registros e validação.**

---

## O que é isso?

Uma especificação normativa que define:
- **Identificadores de métodos** — identificadores estáveis e com namespace para operações de rastreabilidade.
- **Registros de rastreabilidade** — documentos JSON estruturados que registram a execução de ferramentas.
- **Níveis de conformidade** — níveis de conformidade testáveis.
- **Vetores de teste** — entradas/saídas canônicas para interoperabilidade.

## O que isso não é?

- Não é um framework.
- Não é um SDK.
- Não é específico para MCP.
- Não é específico para Python.

## Para quem é isso?

- **Desenvolvedores de engines** — implementam a rastreabilidade em qualquer linguagem.
- **Integradores de ferramentas** — incorporam rastreabilidade em ferramentas existentes.
- **Auditores** — verificam as alegações de rastreabilidade.
- **Construtores de infraestrutura** — constroem sistemas com consciência de rastreabilidade.

---

## Garantia de Estabilidade

> **Os identificadores de métodos marcados como `estáveis` são somente para anexação e nunca terão sua semântica alterada.**
> **A compatibilidade é garantida dentro de uma versão principal.**

---

## Como começar

### Verifique em 10 segundos

```bash
# Clone and run a test vector
git clone https://github.com/mcp-tool-shop-org/prov-spec
cd prov-spec
python tools/python/prov_validator.py check-vector integrity.digest.sha256
```

Saída esperada: `INFO: Teste de integridade do vetor de teste.digest.sha256 passou`

---

### 1. Entenda a especificação

Leia [`spec/PROV_METHODS_SPEC.md`](spec/PROV_METHODS_SPEC.md) — a especificação normativa.

### 2. Consulte o catálogo

Navegue em [`spec/methods.json`](spec/methods.json) — registro de métodos legível por máquina.

### 3. Declare a conformidade

Inclua um arquivo `prov-capabilities.json` no seu projeto:

```json
{
  "schema": "prov-capabilities@v0.1",
  "engine": {
    "name": "your-engine",
    "version": "1.0.0"
  },
  "implements": [
    "adapter.wrap.envelope_v0_1",
    "integrity.digest.sha256"
  ],
  "conformance_level": "fully-conformant"
}
```

### 4. Valide (opcional)

Use o validador de referência:

```bash
# List known methods
python -m prov_validator list-methods

# Validate a provenance record
python -m prov_validator validate-methods record.json --strict

# Run test vectors
python -m prov_validator check-vector integrity.digest.sha256
```

---

## Estrutura do Repositório

```
prov-spec/
├── spec/                    # Normative specification
│   ├── PROV_METHODS_SPEC.md # Main specification document
│   ├── methods.json         # Machine-readable method catalog
│   ├── schemas/             # JSON Schemas
│   │   ├── prov.record.schema.v0.1.json
│   │   ├── artifact.schema.v0.1.json
│   │   ├── evidence.schema.v0.1.json
│   │   ├── mcp.envelope.schema.v0.1.json
│   │   └── prov-capabilities.schema.json
│   └── vectors/             # Test vectors
│       ├── integrity.digest.sha256/
│       ├── adapter.wrap.envelope_v0_1/
│       └── ...
├── tools/                   # Reference implementations (optional)
│   └── python/              # Python reference validator
├── examples/                # Example files
├── CONFORMANCE_LEVELS.md    # Conformance tiers
└── CHANGELOG.md             # Version history
```

**Observação:** As ferramentas de referência são fornecidas para conveniência e não são necessárias para a conformidade.

---

## Níveis de Conformidade

| Level | Name | Requisitos |
| ------- | ------ | -------------- |
| **1** | Integridade | Métodos `integrity.digest.*` |
| **2** | Engine | Nível 1 + métodos `engine.*` |
| **3** | Rastreabilidade | Nível 2 + métodos `lineage.*` |

Consulte [`CONFORMANCE_LEVELS.md`](CONFORMANCE_LEVELS.md) para obter detalhes.

---

## Namespaces de Métodos

| Namespace | Propósito |
| ----------- | --------- |
| `adapter.*` | Embrulho, transporte |
| `engine.*` | Extração de evidências, construção de rastreabilidade |
| `integrity.*` | Hashing, assinaturas, verificação |
| `lineage.*` | Vinculação de pais, operações de grafo |

Reservado para uso futuro: `policy.*`, `attestation.*`, `execution.*`, `audit.*`

---

## Versionamento

- **Versão da especificação:** `v0.1.0`
- **Catálogo de métodos:** somente para anexação dentro da versão principal.
- **Esquemas:** `additionalProperties: false` — compatível com versões anteriores dentro do patch.

---

## Contribuições

1. Novos identificadores de métodos: abra um problema com o caso de uso.
2. Esclarecimentos da especificação: envie um pull request para `spec/`.
3. Ferramentas de referência: envie um pull request para `tools/`.

Os identificadores de métodos requerem justificativa no mundo real. Não adicionamos identificadores especulativamente.

---

## Licença

MIT — veja [LICENSE](LICENSE)

---

## Referências

- [PROV_METHODS_SPEC.md](spec/PROV_METHODS_SPEC.md) — Especificação normativa
- [PROV_METHODS_CATALOG.md](spec/PROV_METHODS_CATALOG.md) — Catálogo legível por humanos
- [CONFORMANCE_LEVELS.md](CONFORMANCE_LEVELS.md) — Níveis de conformidade
- [MCP_COMPATIBILITY.md](spec/MCP_COMPATIBILITY.md) — Compatibilidade com envelopes MCP
