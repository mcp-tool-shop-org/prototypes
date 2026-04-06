<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/soundboard-plugin/main/assets/logo-dark.jpg" alt="Soundboard Plugin" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/soundboard-plugin/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin"><img src="https://codecov.io/gh/mcp-tool-shop-org/soundboard-plugin/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="https://pypi.org/project/voice-soundboard-plugin/"><img src="https://img.shields.io/pypi/v/voice-soundboard-plugin" alt="PyPI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/soundboard-plugin/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  A <a href="https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/plugins">Claude Code plugin</a> that speaks code walkthroughs, announces build results,<br>
  and adds context-aware text-to-speech to your development workflow.
</p>

---

## Highlights

- **12 voix sélectionnées** avec routage adaptatif en fonction de l'émotion (joie, colère, tristesse, peur, surprise, urgence, calme, neutre)
- **Dialogue multi-voix** avec attribution automatique, indications scéniques et modificateurs de vitesse
- **Segmentation intelligente** qui divise les longs textes aux limites des phrases, avec prise en charge des interruptions
- **SSML-lite** pour un contrôle précis (pauses, emphase, intonation, vitesse)
- **Balises SFX** pour générer des sons de cloche en Python pur, intégrés directement (`<ding>`, `<chime>`)
- **Monologue intérieur** : système d'arrière-plan avec limitation de débit et suppression automatique des informations sensibles
- **Robustesse de la lecture** : processus unique, surveillance toutes les 30 secondes, politiques de file d'attente (interruption / ajout / suppression)
- **Sécurité avant tout** : sandboxing des chemins d'accès, contrôle de la concurrence, erreurs structurées, validation des fichiers WAV

## Commandes raccourcies (Slash Commands)

| Commande | Description |
|---------|-------------|
| `/soundboard:speak` | Synthèse vocale générale avec détection des émotions et prise en charge de SSML |
| `/soundboard:narrate` | Narration du code avec adaptation du rythme |
| `/soundboard:notify` | Notifications vocales pour les flux de travail (événements de construction, de test, de déploiement) |
| `/soundboard:voices` | Liste des voix et des préréglages disponibles |
| `/soundboard:voice-status` | État du moteur, informations sur le backend, limites imposées |

Plus l'ensemble des fonctionnalités de l'outil MCP : `voice.dialogue`, `voice.inner_monologue`, `voice.interrupt`, `voice.stream`, `voice.playback_diagnose`, `voice.ambient_enable`, `voice.ambient_mute`.

## Démarrage rapide

### Prérequis

- [voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) >= 2.5.0 (le moteur de synthèse)
- Python >= 3.10
- Windows (cible principale ; utilise `winsound` pour la lecture)

### Installation

```bash
# 1. Install the voice engine
cd voice-soundboard
pip install -e ".[kokoro]"

# 2. Install the plugin
cd soundboard-plugin
pip install -e .

# 3. Register with Claude Code
claude plugin add /path/to/soundboard-plugin
```

### Test

```
/soundboard:speak Hello! I'm your coding assistant.
/soundboard:narrate src/server.py
/soundboard:notify Build succeeded with 0 warnings
```

## Architecture

```
Claude Code
    | stdio (JSON-RPC)
    v
stdio_bridge.py ──── security/guardrails.py
    |                     concurrency gate
    |                     rate limiter
    |                     structured errors
    v
speech pipeline
    ├── chunking.py        smart sentence splitting
    ├── ssml_lite.py       safe SSML subset parser
    ├── emotion/           8 emotions + voice routing
    ├── dialogue/          multi-speaker parser + casting
    ├── sfx_parser.py      <ding>/<chime> WAV generation
    ├── orchestrator.py    multi-chunk synthesis loop
    └── concat.py          WAV concatenation
    v
voice-soundboard engine
    ├── Kokoro (local, default)
    ├── Piper / OpenAI / Azure / ElevenLabs
    v
playback/worker.py ──── single-thread queue
    ├── 30s watchdog timer
    ├── interrupt / enqueue / drop policies
    └── retention.py (auto-cleanup)
    v
PCM audio -> speakers
```

## Sécurité

Ce plugin s'exécute **entièrement sur votre machine**. Pas d'appels réseau, pas de télémétrie, pas d'API cloud (sauf si vous configurez un backend vocal distant).

| Propriété | Implémentation |
|----------|---------------|
| Limites d'entrée | Maximum de 10 000 caractères, vitesse limitée, limites de segmentation/ligne |
| Liste des voix autorisées | 12 voix pré-approuvées, les voix inconnues sont rejetées |
| Sandboxing des chemins d'accès | Les fichiers WAV de sortie sont confinés au répertoire `{tempdir}/voice-soundboard/` |
| Concurrence | Une seule synthèse à la fois (mécanisme de verrouillage) |
| Gestion des erreurs | Erreurs structurées au format JSON avec identifiants de trace, pas de traces de pile envoyées au client |
| Suppression des informations sensibles | Les chemins d'accès, les jetons, les adresses IP, les données encodées en base64 et les paires clé=valeur sont supprimés des journaux. |
| Validation des fichiers WAV | Vérification de la présence des signatures magiques RIFF/WAVE et d'une taille minimale pour chaque fichier de sortie. |

Consultez le fichier [`SECURITY.md`](SECURITY.md) pour connaître la politique complète et le fichier [`docs/SECURITY_THREAT_MODEL.md`](docs/SECURITY_THREAT_MODEL.md) pour le modèle de menace STRIDE-lite.

## Voix

12 voix sélectionnées sont fournies avec le plugin :

| Voix | ID | Genre | Style |
|-------|-----|--------|-------|
| Fenrir | `am_fenrir` | M | Puissante, autoritaire (par défaut) |
| Eric | `am_eric` | M | Énergique, urgente |
| Liam | `am_liam` | M | Chaleureuse, conversationnelle |
| Onyx | `am_onyx` | M | Profonde, stable |
| Aoede | `af_aoede` | F | Claire, expressive |
| Jessica | `af_jessica` | F | Professionnelle, neutre |
| Sky | `af_sky` | F | Lumineuse, amicale |
| Alice | `bf_alice` | F | Britannique, posée |
| Emma | `bf_emma` | F | Britannique, chaleureuse |
| Isabella | `bf_isabella` | F | Britannique, raffinée |
| George | `bm_george` | M | Britannique, formelle |
| Lewis | `bm_lewis` | M | Britannique, mesurée |

## Configuration

Toute la configuration se fait via des variables d'environnement (pas de fichiers de configuration) :

| Variable | Valeur par défaut | Description |
|----------|---------|-------------|
| `VOICE_SOUNDBOARD_OUTPUT_ROOT` | `{tempdir}/voice-soundboard/` | Répertoire de sortie des fichiers WAV |
| `VOICE_SOUNDBOARD_RATE_COOLDOWN_MS` | `0` (désactivé) | Délai de refroidissement de la limite de débit par outil. |
| `VOICE_SOUNDBOARD_RETENTION_MINUTES` | `240` | Suppression automatique des fichiers WAV plus anciens que celui-ci. |
| `VOICE_SOUNDBOARD_AMBIENT_ENABLED` | `0` | Activer le système de monologue intérieur. |

## Développement

```bash
# Install dev dependencies
pip install -e ".[dev]"

# Run the test suite (323 tests)
python -m pytest tests/ -q

# Run the security battery only
python -m pytest tests/test_security.py -q

# Pre-release gate (tests + optional pip-audit)
python scripts/ship_gate.py
```

## Structure du projet

```
soundboard-plugin/
├── voice_soundboard_plugin/
│   ├── bridge/          MCP stdio server + health checks
│   ├── speech/          TTS pipeline (chunking, SSML, orchestrator, concat)
│   │   ├── dialogue/    Multi-speaker parser + auto-casting
│   │   └── emotion/     Emotion detection + voice routing
│   ├── playback/        Single-thread worker + retention
│   ├── ambient/         Inner monologue subsystem
│   ├── security/        Guardrails, fs sandbox, redaction, WAV validation
│   └── audio/           Audio utilities
├── tests/               323 tests (unit + integration + security battery)
├── scripts/             ship_gate.py pre-release script
├── docs/                Threat model, privacy policy, release checklist
├── assets/              Logo and branding
├── SECURITY.md          Security policy + vulnerability reporting
└── pyproject.toml       Project metadata + dependencies
```

## Sécurité et portée des données

- **Données accessibles :** Lecture du texte d'entrée pour la synthèse vocale. Traitement de la parole via le moteur vocal local. L'analyse SSML utilise un analyseur sécurisé. Le monologue intérieur censure les informations sensibles avant le stockage.
- **Données non accessibles :** Pas de communication réseau par défaut. Pas de télémétrie, d'analyse ou de suivi. Pas de stockage de données utilisateur au-delà des fichiers WAV temporaires. Les serveurs vocaux distants sont activables en option.
- **Autorisations requises :** Accès en lecture au moteur vocal. Accès en écriture optionnel pour le répertoire de sortie des fichiers WAV.

## Tableau de bord

| Étape | Statut |
|------|--------|
| A. Base de sécurité | PASSÉ |
| B. Gestion des erreurs | PASSÉ |
| C. Documentation pour les utilisateurs | PASSÉ |
| D. Bonnes pratiques de déploiement | PASSÉ |
| E. Identité | PASSÉ |

## Licence

[MIT](LICENSE)

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
