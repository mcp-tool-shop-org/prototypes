<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/escape-the-valley/readme.png" width="400" alt="Escape the Valley">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/escape-the-valley"><img src="https://img.shields.io/npm/v/@mcptoolshop/escape-the-valley" alt="npm version"></a>
  <a href="https://pypi.org/project/escape-the-valley/"><img src="https://img.shields.io/pypi/v/escape-the-valley" alt="PyPI"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-escape-the-valley/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License"></a>
  <a href="https://mcp-tool-shop-org.github.io/escape-the-valley/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Jeu de survie de type Oregon Trail, avec narration par intelligence artificielle et un sac à dos optionnel utilisant la blockchain XRPL.

**Aucun Python requis.** Ce paquet télécharge un exécutable précompilé et l'exécute localement.

## Installation et Exécution

```bash
npx @mcptoolshop/escape-the-valley tui --seed 42
```

C'est tout. Pas de Python, pas de pip, pas d'environnements virtuels.

### Continuer une partie sauvegardée

```bash
npx @mcptoolshop/escape-the-valley tui --continue
```

La partie reprend exactement là où vous l'avez laissée — le jeu sauvegarde automatiquement à chaque point de contrôle.

## Ce qui se passe

1. Lors du premier lancement, un exécutable spécifique à la plateforme (environ 15 Mo) est téléchargé depuis [GitHub Releases](https://github.com/mcp-tool-shop-org/escape-the-valley/releases)
2. La somme de contrôle SHA256 est vérifiée.
3. Le fichier est mis en cache localement (`~/.cache/mcptoolshop/escape-the-valley/`).
4. L'exécution se fait avec transmission complète des arguments.

Les exécutions suivantes se lancent instantanément depuis le cache.

## Le Jeu

Guidez un groupe de colons à travers une nature générée aléatoirement. Gérez la nourriture, l'eau, l'état du chariot et le moral, tout en gérant les événements, les dangers et les choix difficiles. La vallée est impitoyable mais juste : un joueur compétent réussit environ 1 fois sur 3.

Un **Maître de Jeu IA** optionnel (alimenté par Ollama) narre votre aventure avec trois voix de conteur. Un **sac à dos de registre XRPL Testnet** optionnel enregistre chaque changement de ravitaillement sous forme de transactions sur la blockchain.

### Actions au Campement

| Action | Ce qu'elle fait |
|--------|-------------|
| **Travel** | Avancer vers la sortie — chaque tour où vous ne bougez consomme des ressources inutilement. |
| **Rest** | Restaurez la santé et le moral, avec une chance de soigner certaines affections. |
| **Hunt** | Cherchez de la nourriture (meilleur dans les forêts et les plaines). |
| **Repair** | Réparez les dommages du chariot avant qu'il ne vous immobilise. |
| **Ration** | Réduisez les rations de moitié lorsque la nourriture est rare (cela réduit le moral). |
| **Abandon** | Allégez la charge du chariot pour gagner en vitesse (solution de dernier recours). |

### Profils du Maître de Jeu

| Profil | Voix |
|---------|-------|
| **Chronicler** | Ton factuel, historique et neutre. |
| **Fireside** | Conteuse chaleureuse et conviviale. |
| **Lantern-Bearer** | Atmosphère étrange et inquiétante. |

## Commandes

```bash
npx @mcptoolshop/escape-the-valley tui                    # start a new game
npx @mcptoolshop/escape-the-valley tui --seed 42          # seeded world gen
npx @mcptoolshop/escape-the-valley tui --continue         # resume saved game
npx @mcptoolshop/escape-the-valley tui --gm chronicler    # choose GM voice
npx @mcptoolshop/escape-the-valley tui --callouts minimal # fewer warnings
npx @mcptoolshop/escape-the-valley ledger                 # print trail ledger
npx @mcptoolshop/escape-the-valley --help                 # see all commands
```

## Plateformes supportées

- Linux x64
- macOS ARM64 (Apple Silicon)
- Windows x64

## Dépannage

```bash
npx @mcptoolshop/escape-the-valley --print-cache-path  # show cached binary location
npx @mcptoolshop/escape-the-valley --clear-cache       # force fresh re-download
```

**Fixez une version spécifique** si la dernière version contient un problème :

```bash
npx @mcptoolshop/escape-the-valley@1.0.0 tui --seed 42
```

## Sécurité

Tous les exécutables sont vérifiés par rapport aux sommes de contrôle SHA256 avant l'exécution. Aucune télémétrie. Aucun accès réseau en dehors du téléchargement initial depuis GitHub.

Fonctionne avec [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher).

## Alternative : Installation via Python

Si vous préférez Python :

```bash
pip install escape-the-valley
trail tui --seed 42
```

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
