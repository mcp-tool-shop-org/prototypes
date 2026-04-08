<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<div align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/civility-kernel/readme.png" alt="civility-kernel logo" width="360" />
</div>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/civility-kernel/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/civility-kernel/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/civility-kernel"><img src="https://img.shields.io/npm/v/%40mcptoolshop%2Fcivility-kernel" alt="npm version"></a>
</p>

Une couche de politique qui fait que le comportement de l'agent est **dirigé par des préférences** plutôt que purement par l'optimisation de l'efficacité.

Votre agent génère des plans candidats. Le noyau décide de ce qui se passe ensuite :

**générer → filtrer (contraintes strictes) → évaluer (poids) → choisir OU demander**

Les contraintes strictes sont non négociables. Les préférences, quant à elles, guident les compromis. L'incertitude peut nécessiter de "demander à l'utilisateur".

---

## Installation

```bash
npm i @mcptoolshop/civility-kernel
```

## Démarrage rapide

```typescript
import { createKernel, PolicyBuilder } from '@mcptoolshop/civility-kernel';

const policy = new PolicyBuilder()
  .setWeight('efficiency', 0.6)
  .setWeight('low_risk', 0.4)
  .addConstraint('no_irreversible_changes')
  .setUncertaintyThreshold(0.5)
  .build();

const kernel = createKernel({ policy });
const trace = kernel.decide('default', [plan1, plan2]);
// trace.outcome: 'EXECUTE' | 'ASK_USER' | 'NO_VALID_PLAN'
```

Le noyau configure les contraintes, les évaluateurs et le moteur de décision en une seule opération. Utilisez `decideAsync()` pour les vérifications de contraintes gourmandes en entrées/sorties.

## La boucle de gouvernance humaine

Vous pouvez toujours voir ce que fait votre politique.
L'agent doit afficher les modifications avant qu'elles ne soient appliquées.
Vous pouvez revenir en arrière.
Rien n'est mis à jour silencieusement.

Prévisualisez le contrat de la politique :
```bash
npm run policy:explain
```

Proposez une mise à jour (affiche les différences, demande une approbation) :
```bash
npm run policy:propose
```

Normalisez le fichier de politique actuel (normalisation du format uniquement) :
```bash
npm run policy:canonicalize
```

### Restauration automatique en cas d'erreur

Lors de l'application des modifications, `policy-check` peut sauvegarder l'ancienne politique en premier :

```bash
npx tsx scripts/policy-check.ts policies/default.json --propose policies/proposed.json --write-prev policies/previous.json
```

## Fichiers de politique

Convention recommandée :

- `policies/default.json` — politique active
- `policies/previous.json` — cible de restauration automatique
- `policies/profiles/*.json` — profils nommés (travail / faible friction / mode sécurisé)

## Options de la ligne de commande (policy-check)

- `--explain` — affiche un résumé de la politique lisible par l'homme
- `--propose <file>` — analyse + affiche les différences normalisées + demande une approbation
- `--apply` — réécrit le fichier de politique sous forme normalisée
- `--write-prev <file>` — sauvegarde l'ancienne politique normalisée avant de la remplacer
- `--diff short|full` — `short` affiche les modifications principales ; `full` affiche tout
- `--prev <file>` — mode de comparaison différentielle CI déterministe

## API publique

**Noyau (point d'entrée recommandé) :**

- `createKernel({ policy, constraints?, scorers?, onDecision? })` — façade préconfigurée avec `decide`, `lint`, `explain`, `diff` et apprentissage
- `PolicyBuilder` — API fluide et chaînable pour la construction de politiques validées

**Opérations sur les politiques :**

- `lintPolicy(policy, { registry, scorers })` — valide une politique pour détecter les erreurs et les avertissements
- `canonicalizePolicy(policy, registry)` — normalise une politique à une forme canonique
- `diffPolicy(a, b, registry?)` — comparaison structurée entre deux politiques
- `explainPolicy(policy, registry, opts?)` — résumé de la politique lisible par l'homme

**Persistance :**

- `loadPolicy(json)` — chargement de la politique à partir d'une entrée inconnue, avec validation Zod
- `dumpPolicy(policy)` — sérialisation JSON déterministe (clés triées)
- `PreferencePolicySchema` — schéma Zod exporté pour la validation au moment de l'exécution

**Moteur de décision :**

- `DecisionEngine` — évalue les plans candidats par rapport à une politique (filtrer → évaluer → choisir ou demander)
- `decideAsync()` — variante asynchrone pour les vérifications de contraintes gourmandes en entrées/sorties
- `compileEffectivePolicy(base, context, plans)` — applique les règles de contexte (prend en charge les motifs glob comme `tool:*`)
- `onDecision` hook — rappel facultatif pour la journalisation/les métriques à chaque décision

**Registres :**

- `ConstraintRegistry` — enregistre et évalue les contraintes strictes (avec schémas de paramètres Zod facultatifs + prise en charge asynchrone)
- `ScorerRegistry` — enregistre les fonctions d'évaluation pour les clés de poids
- `registerDefaultConstraints(registry)` — charge les contraintes intégrées (`no_irreversible_changes`, `max_spend_without_confirm`, `require_confirm_if`)
- `registerDefaultScorers(registry)` — charge les évaluateurs intégrés (`efficiency`, `low_risk`, `concise`)

**Boucle d'apprentissage :**

- `proposePolicyUpdates(policy, events)` — suggère des ajustements de politique en fonction des événements de feedback utilisateur.
- `applyPolicyProposal(policy, proposal)` — fusionne une proposition dans la politique (boucle de rétroaction).
- Feedback étendu : `CONSTRAINT_RELAXED`, `PLAN_EDITED`, `TIMEOUT`, `ABORT`.

**Intégration MCP :**

- `planFromMcpToolCall(call, meta?)` — convertit un appel d'outil MCP en un Plan.
- `feedbackFromMcpResult(result, planId)` — convertit un résultat MCP en un événement de feedback.

**Utilitaires :**

- `extractTags(plan)` / `annotatePlanWithTags(plan)` — attribue automatiquement des balises aux plans en fonction du contenu des étapes.
- `matchesContext(pattern, context)` — correspondance de motifs de contexte, tenant compte des caractères génériques.

## CI

Exécutions CI :
- tests (143 tests répartis sur 17 fichiers)
- build
- `policy-check --strict` par rapport aux fichiers de configuration (`policies/default.json` vs `policies/previous.json`)

Cela permet d'éviter de déployer des politiques défectueuses ou des différences trompeuses.

## Développement

```bash
npm test
npm run build
npm run example:basic
npm run policy:check
```

## Sécurité et portée des données

Le noyau Civility est une **bibliothèque pure** — aucune requête réseau, aucune télémétrie, aucun effet secondaire.

- **Données accessibles :** Lecture de fichiers de politique JSON à partir du système de fichiers local. Validation, normalisation et comparaison des documents de politique en mémoire. Toutes les opérations sont déterministes.
- **Données NON accessibles :** Aucune requête réseau. Aucune télémétrie. Aucun stockage d'informations d'identification. Le noyau évalue les contraintes de la politique ; il n'observe ni ne journalise les actions de l'agent.
- **Permissions requises :** Accès en lecture au système de fichiers pour les fichiers JSON de politique. Écriture uniquement lorsque cela est explicitement demandé via `--apply`.

Consultez [SECURITY.md](SECURITY.md) pour signaler les vulnérabilités.

---

## Tableau de bord

| Catégorie | Score |
|----------|-------|
| Sécurité | 10/10 |
| Gestion des erreurs | 10/10 |
| Documentation pour les opérateurs | 10/10 |
| Qualité du code | 10/10 |
| Identité | 10/10 |
| **Overall** | **50/50** |

---

## Licence

MIT (voir LICENSE)

---

Construit par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
