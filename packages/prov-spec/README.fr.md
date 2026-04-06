> ⚠️ **Ce dépôt a été déplacé vers [accessibility-suite](https://github.com/mcp-tool-shop-org/accessibility-suite)**
> Le code source se trouve désormais à : `docs/prov-spec/`

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

**Spécification et ensemble de tests versionnés pour les identifiants, les enregistrements et la validation des méthodes de traçabilité.**

---

## Qu'est-ce que c'est ?

Une spécification normative définissant :
- **Identifiants de méthode** — identificateurs stables et namespaceés pour les opérations de traçabilité.
- **Enregistrements de traçabilité** — documents JSON structurés décrivant les invocations d'outils.
- **Niveaux de conformité** — niveaux de conformité testables.
- **Vecteurs de test** — entrées/sorties canoniques pour l'interopérabilité.

## Qu'est-ce que ce n'est pas ?

- Ce n'est pas un framework.
- Ce n'est pas un SDK.
- Ce n'est pas spécifique à MCP.
- Ce n'est pas spécifique à Python.

## À qui s'adresse-t-il ?

- **Développeurs de moteurs** — pour implémenter la traçabilité dans n'importe quel langage.
- **Intégrateurs d'outils** — pour intégrer des outils existants avec la traçabilité.
- **Auditeurs** — pour vérifier les affirmations de traçabilité.
- **Constructeurs d'infrastructure** — pour créer des systèmes compatibles avec la traçabilité.

---

## Garantie de stabilité

> **Les identifiants de méthode marqués comme `stable` sont en append-only et ne changeront jamais de sémantique.**
> **La compatibilité est garantie dans une version majeure.**

---

## Démarrage rapide

### Vérification en 10 secondes

```bash
# Clone and run a test vector
git clone https://github.com/mcp-tool-shop-org/prov-spec
cd prov-spec
python tools/python/prov_validator.py check-vector integrity.digest.sha256
```

Sortie attendue : `INFO: Test vector integrity.digest.sha256 passed`

---

### 1. Comprendre la spécification

Lisez [`spec/PROV_METHODS_SPEC.md`](spec/PROV_METHODS_SPEC.md) — la spécification normative.

### 2. Consulter le catalogue

Parcourez [`spec/methods.json`](spec/methods.json) — registre de méthodes lisible par machine.

### 3. Déclarer la conformité

Ajoutez un fichier `prov-capabilities.json` à votre projet :

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

### 4. Valider (facultatif)

Utilisez le validateur de référence :

```bash
# List known methods
python -m prov_validator list-methods

# Validate a provenance record
python -m prov_validator validate-methods record.json --strict

# Run test vectors
python -m prov_validator check-vector integrity.digest.sha256
```

---

## Structure du dépôt

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

**Note :** Les outils de référence sont fournis pour faciliter l'utilisation et ne sont pas obligatoires pour la conformité.

---

## Niveaux de conformité

| Level | Name | Exigences |
| ------- | ------ | -------------- |
| **1** | Intégrité | Méthodes `integrity.digest.*` |
| **2** | Moteur | Niveau 1 + méthodes `engine.*` |
| **3** | Lignée | Niveau 2 + méthodes `lineage.*` |

Consultez [`CONFORMANCE_LEVELS.md`](CONFORMANCE_LEVELS.md) pour plus de détails.

---

## Espaces de noms des méthodes

| Espace de noms | Objectif |
| ----------- | --------- |
| `adapter.*` | Encapsulation, transport |
| `engine.*` | Extraction de preuves, construction de la traçabilité |
| `integrity.*` | Hachage, signatures, vérification |
| `lineage.*` | Liaison parent, opérations graphiques |

Réservé pour une utilisation future : `policy.*`, `attestation.*`, `execution.*`, `audit.*`

---

## Gestion des versions

- **Version de la spécification :** `v0.1.0`
- **Catalogue des méthodes :** append-only dans une version majeure
- **Schémas :** `additionalProperties: false` — compatible avec les versions mineures

---

## Contribution

1. Nouveaux identifiants de méthode : ouvrez un problème avec le cas d'utilisation.
2. Clarifications de la spécification : soumettez une demande de tirage (PR) vers le répertoire `spec/`.
3. Outils de référence : soumettez une demande de tirage (PR) vers le répertoire `tools/`.

Les identifiants de méthode nécessitent une justification basée sur des cas réels. Nous n'ajoutons pas d'identifiants de manière spéculative.

---

## Licence

MIT — voir [LICENSE](LICENSE)

---

## Références

- [PROV_METHODS_SPEC.md](spec/PROV_METHODS_SPEC.md) — Spécification normative
- [PROV_METHODS_CATALOG.md](spec/PROV_METHODS_CATALOG.md) — Catalogue lisible par l'homme
- [CONFORMANCE_LEVELS.md](CONFORMANCE_LEVELS.md) — Niveaux de conformité
- [MCP_COMPATIBILITY.md](spec/MCP_COMPATIBILITY.md) — Compatibilité avec l'enveloppe MCP
