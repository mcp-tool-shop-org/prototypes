<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/Registrum/readme.png" width="400" alt="Registrum">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcp-tool-shop/registrum"><img src="https://img.shields.io/npm/v/@mcp-tool-shop/registrum" alt="npm version"></a>
  <a href="https://github.com/mcp-tool-shop-org/Registrum/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/Registrum/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center"><strong>Un registre déterministe, avec double validation, qui conserve un historique consultable et qui peut éventuellement être attesté par une entité externe.</strong></p>

---

## Qu'est-ce que Registrum ?

Registrum est un **registre structuré** : une bibliothèque qui enregistre, valide et ordonne les transitions d'état en respectant des contraintes explicites, afin que la structure reste interprétable, même lorsque l'entropie augmente.

| Propriété | Signification |
|----------|---------|
| **Structural** | Opère sur la forme, pas sur le sens. |
| **Deterministic** | Les mêmes entrées produisent toujours les mêmes sorties. |
| **Fail-closed** | Une entrée invalide provoque un échec total, et non une récupération partielle. |
| **Replayable** | Les décisions passées peuvent être réexécutées avec des résultats identiques. |
| **Non-agentic** | Ne prend jamais de décisions, n'optimise ni ne fait de choix. |

**Registrum garantit que les modifications restent compréhensibles.**

---

## Pourquoi Registrum ?

Les systèmes évoluent. L'entropie s'accumule. La structure se dégrade.

La plupart des outils y répondent en ajoutant de l'intelligence : optimiseurs, agents, couches d'auto-réparation. Registrum adopte une approche différente : **elle ajoute des contraintes**.

- **Pour les auteurs de bibliothèques** : Intégrez des garanties structurelles dans la gestion de l'état, afin que les utilisateurs bénéficient de la lisibilité sans effort.
- **Pour les systèmes critiques pour l'audit** : Chaque transition d'état est déterministe, reproductible et vérifiable de manière indépendante.
- **Pour les équipes qui résistent à la complexité** : Registrum rejette les transitions invalides avec des diagnostics structurés, au lieu de se dégrader silencieusement.

Le résultat : un système où l'identité, la traçabilité et l'ordre restent vérifiables, quel que soit le nombre de modifications qui ont eu lieu.

---

## Principe fondamental

> **L'entropie est autorisée. L'illisibilité ne l'est pas.**

Registrum ne réduit pas l'entropie globalement.
Elle contraint les endroits où l'entropie peut exister, afin que l'identité, la traçabilité et la structure restent vérifiables au fil du temps.

---

## Ce que Registrum n'est pas

Registrum **n'est pas explicitement** :

- Un optimiseur, un agent ou un décideur.
- Un contrôleur, un recommandateur ou une intelligence.
- Adaptatif, apprenant ou auto-réparateur.

Il ne répond jamais à la question de *ce qui est important*.
Il ne fait que préserver les conditions dans lesquelles cette question reste pertinente.

---

## Aperçu de l'architecture

```
┌─────────────────────────────────────────────────────────┐
│                  StructuralRegistrar                     │
│                                                         │
│  ┌───────────────┐         ┌──────────────────────┐     │
│  │  Registry      │  parity │  Legacy              │     │
│  │  (RPEG v1 DSL) │◄──────►│  (TS predicates)     │     │
│  │  [primary]     │         │  [secondary witness] │     │
│  └───────┬───────┘         └──────────┬───────────┘     │
│          │         agree?             │                  │
│          └────────────┬───────────────┘                  │
│                       ▼                                  │
│              11 Structural Invariants                    │
│         ┌──────────┬──────────┬──────────┐              │
│         │ Identity │ Lineage  │ Ordering │              │
│         │  (3)     │  (4)     │  (4)     │              │
│         └──────────┴──────────┴──────────┘              │
│                       │                                  │
│          ┌────────────┴────────────┐                     │
│          ▼                         ▼                     │
│     ✅ Accepted                ❌ Refused                │
│     (stateId, orderIndex)      (violations[])            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Persistence: Snapshot · Replay · Rehydrate      │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Attestation (optional): XRPL witness ledger     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## Comment Registrum fonctionne

### Registre structuré

Le registre est la seule autorité constitutionnelle :

- Valide toutes les transitions d'état par rapport à **11 invariants structurels**.
- Applique les contraintes d'identité, de traçabilité et d'ordre.
- Garantit le déterminisme et la traçabilité.
- Signale les violations sans les résoudre (mode "fail-closed").

Tout passe par lui. Rien ne le contourne.

### Les 11 invariants

| Classe | Nombre | Fonction |
|-------|-------|---------|
| **Identity** | 3 | Unique, immuable, adressé par son contenu. |
| **Lineage** | 4 | Ascendance valide, acyclique, traçable. |
| **Ordering** | 4 | Monotonique, sans lacune, déterministe. |

Ces invariants sont constitutionnels. Leur modification nécessite une gouvernance formelle.

---

## Double autorité constitutionnelle

Registrum maintient **deux moteurs d'invariants indépendants** :

| Autorité | Rôle | Implémentation |
|---------|------|----------------|
| **Registry** | Autorité principale | DSL compilé (RPEG v1) |
| **Legacy** | Autorité secondaire | Prédicats TypeScript |

À partir de la phase H, **le registre est le moteur constitutionnel par défaut**.
L'ancienne version reste en place en tant que deuxième autorité indépendante.

### Pourquoi deux autorités ?

- **L'accord est requis** : Les deux doivent être d'accord pour qu'une transition soit valide.
- **Le désaccord arrête le système** : Une divergence de parité arrête le système (mode "fail-closed").
- **L'indépendance est intentionnelle** : Aucune ne peut outrepasser l'autre.

Ceci est une fonctionnalité de sécurité et de lisibilité, et non une dette technique.
Le mode double est indéfini. Il n'y a pas de plan pour supprimer l'un des témoins.

### Preuves de parité

274 tests prouvent l'équivalence comportementale :
- 58 tests de parité sur toutes les classes invariantes
- 12 tests de parité de persistance (stabilité temporelle)
- Parité de relecture : exécution en direct ≡ exécution rejouée

---

## Historique, relecture et auditabilité

| Capacité | Description |
|------------|-------------|
| **Snapshot** | Schéma versionné (`RegistrarSnapshotV1`), hachages adressés par contenu, sérialisation déterministe |
| **Replay** | Re-exécution en lecture seule par rapport à un registraire neuf – prouve le déterminisme temporel |
| **Audit** | Chaque jugement structurel est reproductible, indépendant du contexte et vérifiable par toute partie disposant de l'instantané. |

---

## Attestation externe (facultatif)

Registrum peut facultativement émettre des attestations cryptographiques vers un registre immuable externe (comme XRPL) pour une validation publique.

| Propriété | Valeur |
|----------|-------|
| Par défaut | Désactivé |
| Autorité | Non autoritaire (témoin uniquement) |
| Effet sur le comportement | Aucun |

Les attestations enregistrent *ce que* Registrum a décidé.
Registrum décide *ce qui* est valide.

**L'autorité est interne. Le témoignage est externe.**

Voir :
- [`docs/WHY_XRPL.md`](docs/WHY_XRPL.md) — Justification
- [`docs/ATTESTATION_SPEC.md`](docs/ATTESTATION_SPEC.md) — Spécification

---

## Premiers pas

### Installation

```bash
npm install @mcp-tool-shop/registrum
```

### Démarrage rapide

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

const registrar = new StructuralRegistrar({ mode: "legacy" });

// Register a root state
const result = registrar.register({
  from: null,
  to: { id: "state-1", structure: { version: 1 }, data: {} },
});

if (result.kind === "accepted") {
  console.log(`Registered at index ${result.orderIndex}`);
} else {
  // Structured refusal — the violations name which invariants failed
  console.log(`Refused: ${result.violations.map((v) => v.invariantId)}`);
}
```

### Modes

| Mode | Moteur | Quand utiliser |
|------|--------|-------------|
| `"legacy"` | Prédicats TypeScript | Prototypage rapide, sans dépendances externes |
| `"registry"` (par défaut) | DSL RPEG v1 compilé | Utilisation en production avec double témoin complet |

```typescript
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";
import { loadCompiledRegistry } from "@mcp-tool-shop/registrum/registry";

// Registry mode (default) — compiled DSL + legacy as dual witnesses
const compiledRegistry = loadCompiledRegistry();
const registrar = new StructuralRegistrar({ compiledRegistry });
```

### Exemples

Le répertoire [`examples/`](examples/) contient des démonstrations illustratives (API non stable).
Ils nécessitent [`tsx`](https://github.com/esbuild-kit/tsx) :

```bash
npm run example:refusal        # Refusal-as-success demo
npx tsx examples/refusal-as-success.ts   # Or run directly
```

---

## Référence rapide de l'API

### Exportations principales

```typescript
// Implementation
import { StructuralRegistrar } from "@mcp-tool-shop/registrum";

// Types
import type {
  State,          // { id, structure, data }
  Transition,     // { from, to, metadata? }
  RegistrationResult,   // { kind: "accepted" | "refused", ... }
  Invariant,      // { id, scope, check }
  InvariantViolation,   // { invariantId, classification, message }
} from "@mcp-tool-shop/registrum";

// Invariants
import {
  INITIAL_INVARIANTS,     // All 11 invariants
  getInvariantsByScope,   // Filter by "identity" | "lineage" | "ordering"
  getInvariantById,       // Lookup by invariant ID
} from "@mcp-tool-shop/registrum";

// Version
import { REGISTRUM_VERSION } from "@mcp-tool-shop/registrum";
```

### `StructuralRegistrar`

| Méthode | Retourne | Description |
|--------|---------|-------------|
| `register(transition)` | `RegistrationResult` | Valider et enregistrer une transition d'état |
| `getState(id)` | `State \ | indéfini` | Récupérer un état enregistré par ID |
| `getHistory()` | `Transition[]` | Historique complet et ordonné des transitions acceptées |
| `snapshot()` | `RegistrarSnapshotV1` | Instantané déterministe, adressé par contenu |

---

## Gouvernance

Registrum est régi selon un **modèle constitutionnel**.

| Principe | Signification |
|-----------|---------|
| Garanties comportementales > vitesse de développement des fonctionnalités | La correction est prioritaire |
| Changements basés sur des preuves uniquement | Aucun changement sans preuve |
| Procédure formelle requise | Propositions, artefacts, décisions |

### Statut actuel

- **Phase H**: Complète (registre par défaut, attestation activée)
- **Gouvernance**: Active et appliquée
- **Tous les changements**: Nécessitent un processus de gouvernance formel

Tous les futurs changements sont des décisions de gouvernance, et non des tâches d'ingénierie.

Voir :
- [`docs/governance/PHILOSOPHY.md`](docs/governance/PHILOSOPHY.md) — Pourquoi la gouvernance existe
- [`docs/governance/SCOPE.md`](docs/governance/SCOPE.md) — Ce qui est régi
- [`docs/GOVERNANCE_HANDOFF.md`](docs/GOVERNANCE_HANDOFF.md) — Transition vers la gouvernance

---

## Statut du projet

**Registrum a atteint un état final stable.**

| Phase | Statut | Preuves |
|-------|--------|----------|
| A–C | Complète | Registraire principal, harnais de parité |
| E | Complète | Persistance, relecture, stabilité temporelle |
| G | Complète | Cadre de gouvernance |
| H | Complète | Configuration par défaut du registre, attestation activée. |

**Couverture des tests :** 279 tests réussis répartis sur 14 suites de tests.

Le développement a été transféré à une équipe de maintenance. Les modifications futures nécessitent une gouvernance.

Voir : [`docs/STEWARD_CLOSING_NOTE.md`](docs/STEWARD_CLOSING_NOTE.md)

---

## Documentation

| Document | Fonction |
|----------|---------|
| [`WHAT_REGISTRUM_IS.md`](docs/WHAT_REGISTRUM_IS.md) | Définition de l'identité |
| [`PROVABLE_GUARANTEES.md`](docs/PROVABLE_GUARANTEES.md) | Revendications formelles avec preuves |
| [`INVARIANTS.md`](docs/INVARIANTS.md) | Référence complète des invariants |
| [`FAILURE_BOUNDARIES.md`](docs/FAILURE_BOUNDARIES.md) | Conditions d'échec irréversible |
| [`HISTORY_AND_REPLAY.md`](docs/HISTORY_AND_REPLAY.md) | Garanties temporelles |
| [`TUTORIAL_DUAL_WITNESS.md`](docs/TUTORIAL_DUAL_WITNESS.md) | Tutoriel sur l'architecture à double témoin |
| [`CANONICAL_SERIALIZATION.md`](docs/CANONICAL_SERIALIZATION.md) | Format des instantanés (constitutionnel) |
| [`governance/DUAL_WITNESS_POLICY.md`](docs/governance/DUAL_WITNESS_POLICY.md) | Politique à double témoin |

---

## Principes de conception

- **Maîtrise** plutôt que pouvoir
- **Lisibilité** plutôt que performance
- **Contraintes** plutôt que heuristiques
- **Inspection** plutôt que intervention
- **Arrêt** plutôt que extension infinie

Registrum réussit lorsqu'il devient banal, fiable et prévisible.

---

## Sécurité et portée des données

| Aspect | Détail |
|--------|--------|
| **Data touched** | Transitions d'état en mémoire, instantanés JSON facultatifs vers le système de fichiers local. |
| **Data NOT touched** | Aucune requête réseau, aucune API externe, aucune base de données, aucune identifiant utilisateur. |
| **Permissions** | Lecture/écriture uniquement vers les chemins d'instantanés spécifiés par l'utilisateur (lorsque la persistance est utilisée). |
| **Network** | Aucun — bibliothèque entièrement hors ligne (l'attestation XRPL est désactivée par défaut). |
| **Telemetry** | Aucune donnée collectée ou envoyée. |

Voir [SECURITY.md](SECURITY.md) pour le signalement des vulnérabilités.

---

## Contribution

Registrum suit un modèle de contribution axé sur la gouvernance. Toutes les modifications nécessitent des propositions formelles avec preuves.

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour la philosophie et le processus de contribution complets.

---

## Tableau de bord

| Catégorie | Score |
|----------|-------|
| A. Sécurité | 10 |
| B. Gestion des erreurs | 10 |
| C. Documentation pour les opérateurs | 10 |
| D. Qualité du code | 10 |
| E. Identité (temporaire) | 10 |
| **Overall** | **50/50** |

> Audit complet : [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

---

## Licence

MIT

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
