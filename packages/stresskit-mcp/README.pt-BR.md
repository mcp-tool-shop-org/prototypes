<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/stresskit-mcp/readme.png" width="400" alt="StressKit-MCP">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/stresskit-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Kit de ferramentas de teste de saúde e segurança para servidores MCP (Model Context Protocol). Fornece evidências confiáveis da prontidão do servidor MCP por meio de testes de carga, validação de segurança e análise de desempenho.

## Características

- **Teste de Carga:** Simula um grande volume de chamadas para identificar gargalos.
- **Análise de Segurança:** Valida a sanitização de entrada, os fluxos de autenticação e o tratamento de erros.
- **Análise de Desempenho:** Mede a latência, a taxa de transferência e o uso de recursos.
- **Verificações de Conformidade:** Verifica a aderência ao protocolo MCP.
- **Geração de Evidências:** Produz relatórios de teste verificáveis com informações de rastreamento.

## Início Rápido

```bash
# Install
pip install stresskit-mcp

# Run basic health check
stresskit check http://localhost:3000

# Run full stress test suite
stresskit stress http://localhost:3000 --profile default

# Generate security report
stresskit security http://localhost:3000 --output report.json
```

## Configuração

O StressKit utiliza perfis para cenários de teste configuráveis:

```json
{
  "profile": "production",
  "duration": 300,
  "concurrency": 50,
  "tools": ["*"],
  "checks": {
    "latency_p99_ms": 500,
    "error_rate_max": 0.01,
    "memory_mb_max": 512
  }
}
```

## Estrutura do Projeto

```
stresskit-mcp/
├── engines/        # Test execution engines
├── profiles/       # Pre-built test profiles
├── schemas/        # JSON schemas for configuration
├── tests/          # Unit and integration tests
└── stresskit.targets.json  # Default target configuration
```

## Projetos Relacionados

- [tool-scan](https://github.com/mcp-tool-shop-org/tool-scan) — Analisador de segurança para ferramentas MCP.
- [mcp-stress-test](https://github.com/mcp-tool-shop-org/mcp-stress-test) — Kit de ferramentas para equipes de teste (red team) para validação de analisadores.

## Licença

Licença MIT — veja [LICENSE](LICENSE) para detalhes.

---

Desenvolvido por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
