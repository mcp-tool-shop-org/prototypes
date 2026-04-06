<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/mcp-aside/readme.png" alt="mcp-aside logo" width="400" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/mcp-aside/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/mcp-aside"><img src="https://img.shields.io/npm/v/@mcptoolshop/mcp-aside" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/mcp-aside/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  An MCP server that gives your AI a place to jot things down mid-conversation — without derailing the task at hand.
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> &middot;
  <a href="#how-it-works">How It Works</a> &middot;
  <a href="#tools">Tools</a> &middot;
  <a href="#configuration">Configuration</a> &middot;
  <a href="#license">License</a>
</p>

---

## Pourquoi

Les LLM (Large Language Models) perdent parfois le fil. Une idée fugitive, une préoccupation à moitié formulée, une remarque du type "il faudrait revenir sur ce point" qui n'est jamais reprise. **mcp-aside** offre au modèle une boîte de réception dédiée pour y enregistrer ces remarques. Cette boîte est soumise à des limitations de débit, à une déduplication et à une expiration automatique, afin d'éviter qu'elle ne devienne un problème en soi.

Considérez-la comme un bloc-notes collé à côté de la conversation. Le modèle y écrit des notes. Vous (ou le modèle) les consultez au moment opportun.

## Fonctionnement

1. Le modèle appelle `aside.push` avec une idée, classée par priorité.
2. Les mécanismes de contrôle vérifient les doublons, les limites de débit et les délais d'expiration.
3. Si tout est en ordre, la remarque est enregistrée dans une boîte de réception en mémoire.
4. Les clients sont notifiés via `notifications/resources/updated`.
5. Tout le monde peut consulter la boîte de réception via la ressource `interject://inbox`.

Il n'y a pas de base de données. Il n'y a pas de persistance. Si le serveur s'arrête, la boîte de réception disparaît, et c'est de conception.

## Démarrage rapide

```bash
npm install
npm run build
node build/index.js
```

Le serveur utilise MCP via **stdio**. Connectez n'importe quel client compatible MCP à celui-ci :

```json
{
  "mcpServers": {
    "aside": {
      "command": "node",
      "args": ["build/index.js"]
    }
  }
}
```

## Outils

| Outil | Ce qu'il fait |
| --- | --- |
| `aside.push` | Enregistre une remarque dans la boîte de réception. Accepte les paramètres `text`, `priority` (faible/moyen/élevée), `reason`, `tags`, `expiresAt`, `source` et `meta`. |
| `aside.configure` | Ajustez les mécanismes de contrôle au moment de l'exécution : délais d'expiration, limites de débit, fenêtres de déduplication, seuils de notification. |
| `aside.clear` | Efface la boîte de réception. |
| `aside.status` | Instantané en lecture seule de la taille de la boîte de réception et de la configuration actuelle des mécanismes de contrôle. |

## Ressource

| URI | Description |
| --- | --- |
| `interject://inbox` | Tableau JSON des remarques en attente, triées par ordre chronologique inverse (la plus récente en premier). Les éléments expirés sont filtrés lors de la lecture. |

## Mécanismes de contrôle

Tout est configurable via `aside.configure`. Valeurs par défaut :

| Paramètre | Valeur par défaut | Ce qu'il contrôle |
| --- | --- | --- |
| `defaultTtlSeconds` | 600 (10 min) | Durée de vie d'une remarque si aucun délai d'expiration explicite n'est défini. |
| `maxTtlSeconds` | 3600 (1 hr) | Limite maximale du délai d'expiration, même si l'appelant en demande une durée supérieure. |
| `dedupeWindowSeconds` | 300 (5 min) | Même priorité + texte + raison = supprimé dans cette fenêtre. |
| `rateLimitWindowSeconds` | 60 | Fenêtre glissante pour la limitation du débit. |
| `rateLimitMax` | faible : 6, moyen : 3, élevé : 1 | Nombre maximal d'enregistrements par priorité par fenêtre. |
| `notifyAtOrAbove` | élevée | Envoie uniquement les notifications de journalisation pour les éléments de cette priorité ou supérieure. |

## Configuration

### Déclencheur de minuteur

Un minuteur intégré se déclenche toutes les 5 minutes et enregistre une remarque de faible priorité du type "y a-t-il des blocages ?". Il respecte les mêmes mécanismes de contrôle que les enregistrements manuels (il sera donc dédupliqué ou limité en débit comme tout le reste). Pour le désactiver, commentez l'appel `startTimerTrigger` dans `index.ts`.

### Inspecteur MCP

Pour les tests locaux :

```
Transport: STDIO
Command:   node
Args:      build/index.js
```

## Notes

- Les journaux sont envoyés vers **stderr** — stdout est réservé aux appels JSON-RPC MCP.
- La boîte de réception est éphémère. Le redémarrage efface tout.
- Les remarques sont stockées dans l'ordre chronologique inverse (la plus récente en premier). Les éléments expirés sont supprimés à chaque lecture et à chaque enregistrement.

## Licence

[MIT](LICENSE)

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a
