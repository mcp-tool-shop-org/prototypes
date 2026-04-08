<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/stresskit-mcp/readme.png" width="400" alt="StressKit-MCP">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/stresskit-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Kit di strumenti per il test di sicurezza e affidabilità dei server MCP (Model Context Protocol). Fornisce prove affidabili della prontezza dei server MCP attraverso test di carico, validazione della sicurezza e profilazione delle prestazioni.

## Funzionalità

- **Test di carico:** Simula un elevato numero di chiamate agli strumenti per identificare i colli di bottiglia.
- **Scansione di sicurezza:** Verifica la sanificazione degli input, i flussi di autenticazione e la gestione degli errori.
- **Profilazione delle prestazioni:** Misura la latenza, la produttività e l'utilizzo delle risorse.
- **Controlli di conformità:** Verifica l'aderenza al protocollo MCP.
- **Generazione di prove:** Produce report di test verificabili con informazioni sull'origine dei dati.

## Guida rapida

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

## Configurazione

StressKit utilizza profili per definire scenari di test configurabili.

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

## Struttura del progetto

```
stresskit-mcp/
├── engines/        # Test execution engines
├── profiles/       # Pre-built test profiles
├── schemas/        # JSON schemas for configuration
├── tests/          # Unit and integration tests
└── stresskit.targets.json  # Default target configuration
```

## Progetti correlati

- [tool-scan](https://github.com/mcp-tool-shop-org/tool-scan) — Scanner di sicurezza per strumenti MCP.
- [mcp-stress-test](https://github.com/mcp-tool-shop-org/mcp-stress-test) — Kit di strumenti per il team "rosso" per la validazione degli scanner.

## Licenza

Licenza MIT — vedere [LICENSE](LICENSE) per i dettagli.

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
