<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/zip-meta-map/readme.png" width="400" />
</p>

<p align="center">
  Turn a ZIP or folder into a guided, LLM-friendly metadata bundle.<br>
  <strong>Map + Route + Guardrails</strong> — inside the archive itself.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/zip-meta-map/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="https://pypi.org/project/zip-meta-map/"><img src="https://img.shields.io/pypi/v/zip-meta-map" alt="PyPI" /></a>
  <a href="https://github.com/mcp-tool-shop-org/zip-meta-map/blob/main/LICENSE"><img src="https://img.shields.io/github/license/mcp-tool-shop-org/zip-meta-map" alt="License: MIT" /></a>
  <a href="https://mcp-tool-shop-org.github.io/zip-meta-map/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page" /></a>
</p>

---

## Ce que fait zip-meta-map

zip-meta-map génère une couche de métadonnées déterministe qui répond à trois questions pour les agents d'IA :

- **Qu'est-ce qu'il y a ici ?** — Inventaire de fichiers classés par rôle, avec des scores de confiance.
- **Qu'est-ce qui est le plus important ?** — Liste classée des éléments à consulter en premier, avec des extraits.
- **Comment puis-je naviguer sans me perdre dans le contexte ?** — Plans de navigation avec des budgets d'utilisation de données.

## Démonstration rapide

```bash
$ zip-meta-map build my-project/ -o output/ --summary

Wrote META_ZIP_FRONT.md and META_ZIP_INDEX.json to output/
  Profile:  python_cli
  Files:    47
  Modules:  8
  Flagged:  2 file(s) with risk flags
```

```bash
$ zip-meta-map explain my-project/

Profile:  python_cli
Files:    47

Top files to read first:
  README.md                     [doc]        conf=0.95  README is primary documentation
  src/app/main.py               [entrypoint] conf=0.95  matches profile entrypoint pattern
  pyproject.toml                [config]     conf=0.95  Python project configuration

Overview plan:
  Quick orientation — what is this tool and how is it structured?
  1. READ README.md for project purpose and usage
  2. READ pyproject.toml for dependencies and entry points
  3. READ entrypoint file to understand CLI structure
  Budget: ~32 KB
```

Consultez la [sortie de démonstration](examples/tiny_python_cli/) pour un exemple complet.

## Installation

```bash
pip install zip-meta-map
```

Ou avec [pipx](https://pipx.pypa.io/):

```bash
pipx install zip-meta-map
```

À partir du code source :

```bash
git clone https://github.com/mcp-tool-shop-org/zip-meta-map
cd zip-meta-map
pip install -e ".[dev]"
```

## Action GitHub

Utilisez zip-meta-map dans votre CI avec l'action composite :

```yaml
- name: Generate metadata map
  uses: mcp-tool-shop-org/zip-meta-map@v0
  with:
    path: .
```

Cela installe l'outil, génère les métadonnées et affiche un résumé de l'étape. Les sorties incluent `index-path`, `front-path`, `profile`, `file-count` et `warnings-count`. Définissez `pr-comment: 'true'` pour afficher le résumé sous forme de commentaire de pull request.

Consultez [examples/github-action/](examples/github-action/) pour un flux de travail complet.

## Ce que cela génère

| Fichier | Objectif |
| ------ | --------- |
| `META_ZIP_FRONT.md` | Page d'orientation lisible par l'homme |
| `META_ZIP_INDEX.json` | Index lisible par la machine (rôles, confiance, plans, segments, extraits, indicateurs de risque) |
| `META_ZIP_REPORT.md` | Rapport détaillé consultable (avec `--report md`) |

## Référence de l'interface en ligne de commande

```bash
# Build metadata for a folder or ZIP
zip-meta-map build path/to/repo -o output/
zip-meta-map build archive.zip -o output/

# Build with step summary and report
zip-meta-map build . -o output/ --summary --report md

# Output formats for piping
zip-meta-map build . --format json          # JSON to stdout
zip-meta-map build . --format ndjson        # one JSON line per file
zip-meta-map build . --manifest-only        # skip FRONT.md

# Explain what the tool detected
zip-meta-map explain path/to/repo
zip-meta-map explain path/to/repo --json

# Compare two indices (CI-friendly)
zip-meta-map diff old.json new.json             # human-readable
zip-meta-map diff old.json new.json --json       # JSON output
zip-meta-map diff old.json new.json --exit-code  # exit 1 if changes

# Validate an existing index
zip-meta-map validate META_ZIP_INDEX.json

# Policy overrides
zip-meta-map build . --policy META_ZIP_POLICY.json -o output/
```

## Profils

Détectés automatiquement en fonction de la structure du dépôt. Profils intégrés actuels :

| Profil | Détecté par | Plans |
| --------- | ------------ | ------- |
| `python_cli` | `pyproject.toml`, `setup.py` | aperçu, débogage, ajout_fonctionnalité, revue_sécurité, analyse_approfondie |
| `node_ts_tool` | `package.json`, `tsconfig.json` | aperçu, débogage, ajout_fonctionnalité, revue_sécurité, analyse_approfondie |
| `monorepo` | `pnpm-workspace.yaml`, `lerna.json` | aperçu, débogage, ajout_fonctionnalité, revue_sécurité, analyse_approfondie |

Consultez [docs/PROFILES.md](docs/PROFILES.md).

## Rôles et confiance

Chaque entrée de fichier comprend un **rôle** (vocabulaire limité), un **niveau de confiance** (de 0,0 à 1,0) et une **raison**.

| Bande | Plage | Signification |
| ------ | ------- | --------- |
| Élevé | >= 0,9 | Signal structurel fort (correspondance du nom de fichier, point d'entrée du profil) |
| Bon | >= 0,7 | Correspondance de motif (convention du répertoire, extension + emplacement) |
| Moyen | >= 0,5 | Signal de position faible ou uniquement basé sur l'extension |
| Faible | < 0,5 | Attribué à "inconnu" ; la raison explique l'ambiguïté. |

## Divulgation progressive (v0.2)

- **Cartes de segments** pour les fichiers > 32 Ko : identifiants stables, plages de lignes, titres.
- **Résumés de modules** : distribution des rôles au niveau du répertoire et fichiers clés.
- **Extraits** : premières lignes des fichiers de grande valeur.
- **Indicateurs de risque** : `exec_shell`, `secrets_like`, `network_io`, `path_traversal`, `binary_masquerade`, `binary_executable`.
- **Capacités** : `capabilities[]` indique quelles fonctionnalités facultatives sont disponibles.

## Stabilité

- La version des spécifications suit des règles similaires à celles de semver : les mises à jour mineures ajoutent des champs, les mises à jour majeures cassent les consommateurs.
- `capabilities[]` est le mécanisme officiel de négociation des fonctionnalités.
- Les consommateurs plus anciens qui ignorent les champs inconnus continueront de fonctionner lors des mises à jour mineures.
- Consultez [docs/SPEC.md](docs/SPEC.md) pour connaître le contrat complet.

## Structure du dépôt

```
src/zip_meta_map/
  cli.py        # argparse CLI (build, explain, diff, validate)
  builder.py    # scan -> index -> validate -> write
  diff.py       # index comparison (diff command)
  report.py     # GitHub step summary + detailed report
  scanner.py    # directory + ZIP scanning with SHA-256
  roles.py      # role assignment heuristics + confidence
  profiles.py   # built-in profiles + traversal plans
  chunker.py    # deterministic text chunking
  modules.py    # folder-level module summaries
  safety.py     # risk flag detection + warning generation
  schema/       # JSON Schemas and loaders
docs/
  SPEC.md       # v0.2 contract (format semantics)
  PROFILES.md   # profile behaviors + plans
examples/
  tiny_python_cli/   # golden demo output
  github-action/     # consumer workflow example
tests/
  fixtures/     # tiny fixture repos
```

## Contribution

Ce projet est volontairement petit. Si vous contribuez :

- Maintenir les heuristiques déterministes.
- Limiter les rôles, et intégrer les nuances dans les balises.
- Ajouter des tests pour toute nouvelle heuristique.
- Ne pas assouplir les schémas sans mettre à jour la documentation et le fichier SPEC.md, ainsi que les exemples de référence.

```bash
pytest
```

## Documentation

- [Spécification (v0.2)](docs/SPEC.md) — le contrat pour tous les fichiers générés.
- [Profils](docs/PROFILES.md) — profils de types de projets intégrés.
- [Sécurité](SECURITY.md) — signalement des vulnérabilités.

## Licence

MIT

---

<p align="center">
  Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
</p>
