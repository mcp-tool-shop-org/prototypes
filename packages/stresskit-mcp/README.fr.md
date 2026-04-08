<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/stresskit-mcp/readme.png" width="400" alt="StressKit-MCP">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/stresskit-mcp/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Kit d'outils de test de santé et de sécurité pour les serveurs MCP (Model Context Protocol). Fournit des preuves fiables de la préparation des serveurs MCP grâce à des tests de charge, à la validation de la sécurité et au profilage des performances.

## Fonctionnalités

- **Tests de charge** : Simule un grand nombre d'appels d'outils pour identifier les goulots d'étranglement.
- **Analyse de sécurité** : Valide la désinfection des entrées, les flux d'authentification et la gestion des erreurs.
- **Profilage des performances** : Mesure la latence, le débit et l'utilisation des ressources.
- **Vérifications de conformité** : Vérifie la conformité au protocole MCP.
- **Génération de preuves** : Produit des rapports de test vérifiables avec traçabilité.

## Démarrage rapide

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

## Configuration

StressKit utilise des profils pour des scénarios de test configurables :

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

## Structure du projet

```
stresskit-mcp/
├── engines/        # Test execution engines
├── profiles/       # Pre-built test profiles
├── schemas/        # JSON schemas for configuration
├── tests/          # Unit and integration tests
└── stresskit.targets.json  # Default target configuration
```

## Projets connexes

- [tool-scan](https://github.com/mcp-tool-shop-org/tool-scan) : Analyseur de sécurité pour les outils MCP.
- [mcp-stress-test](https://github.com/mcp-tool-shop-org/mcp-stress-test) : Kit d'outils "red team" pour la validation des analyseurs.

## Licence

Licence MIT — voir [LICENSE](LICENSE) pour plus de détails.

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
