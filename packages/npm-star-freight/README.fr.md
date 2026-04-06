<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/star-freight/readme.png" alt="Star Freight -- Trade. Decide. Survive." width="400">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@mcptoolshop/star-freight"><img src="https://img.shields.io/npm/v/@mcptoolshop/star-freight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/npm-star-freight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

# @mcptoolshop/star-freight

> Jeu de rôle de marchand spatial en ligne de commande (CLI) -- installation npx sans prérequis.

```bash
npx @mcptoolshop/star-freight
```

Ou installez-le globalement :

```bash
npm i -g @mcptoolshop/star-freight
star-freight
```

Aucun besoin de Python, pip ou d'outils de construction. Les binaires précompilés sont téléchargés, vérifiés avec SHA256 et mis en cache localement.

---

## Le jeu

Vous étiez un pilote militaire. Ensuite, vous avez été discrédité. Maintenant, vous êtes un capitaine avec un vaisseau délabré, sans statut, et un système stellaire qui était déjà en mouvement avant que vous n'arriviez.

**Star Freight** est un jeu de rôle de marchand tactique basé sur du texte, où vous transportez des marchandises à travers un système stellaire politiquement divisé. Cinq civilisations. Une économie. Quatre vérités qui ne vous permettront pas de vivre la même vie deux fois.

Vous accostez dans des stations où la culture modifie votre façon de négocier. Vous choisissez des itinéraires où le terrain modifie votre façon de combattre. Vous embauchez des membres d'équipage qui modifient ce que vous pouvez faire, ce que vous pouvez accéder et ce que vous devez. Vous acceptez des contrats qui semblent simples jusqu'à ce que les formalités administratives se compliquent, que la pénurie modifie le prix, ou que la cargaison s'avère être une preuve.

## Pourquoi cela semble différent

**L'équipage est une loi contraignante.** Thal n'est pas un bonus de +10% de réparation. Thal est *pourquoi* vous pouvez accoster dans les stations de Keth, *pourquoi* votre vaisseau a une capacité de réparation d'urgence, et *pourquoi* vous avez remarqué que la cargaison médicale ne correspondait pas à la saison. Perdre Thal signifie que trois systèmes perdent des capacités en même temps.

**Le combat est un événement de campagne.** La victoire rapporte des crédits de récupération et de l'influence auprès des factions. La retraite coûte de la cargaison larguée et une réputation de personne qui fuit. La défaite signifie une cargaison confisquée, un équipage blessé et un vaisseau qui se traîne jusqu'à la station la plus proche, à un prix élevé.

**La culture est une logique sociale.** Les Keth n'ont pas seulement des prix différents. Ils ont un calendrier biologique saisonnier qui modifie ce que signifie offrir des cadeaux et quand faire pression pour conclure une affaire est une insulte. Les Veshan défient -- et refuser est pire que perdre.

**L'enquête émerge de la vie.** Vous remarquez que la cargaison médicale ne correspond pas à la saison parce que vous l'avez transportée. Le complot ne s'annonce pas. Vous y tombez en faisant votre travail.

## Le monde

Cinq civilisations partagent un système stellaire appelé le Seuil.

**Le Compact Terrien** -- Gouvernement humain bureaucratique. Ils vous ont discrédité. Pour revenir, il faut des permis, de la patience et de l'humilité.

**La Communion Keth** -- Collectif d'arthropodes sur un calendrier biologique. Les meilleurs marges du système si vous comprenez les saisons. L'effondrement de la réputation le plus rapide si vous ne le faites pas.

**Les Principautés Veshan** -- Maisons féodales reptiliennes obsédées par l'honneur et la dette. Le registre des dettes n'est pas une simple particularité. C'est un levier.

**La Dérive Orryn** -- Civilisation de courtiers mobiles. Ils commercent avec tout le monde, savent tout et facturent pour tout.

**La Zone Sableuse** -- Factions pirates, récupérateurs de technologie ancestrale, et des gens que le Compact préférerait oublier. Pas de loi. Pas de douanes. Pas de remboursement.

## Trois types de capitaine

**Capitaine de relève.** Discipline de convoi, accès basé sur la confiance, conséquences publiques. Vous nourrissez les gens et vous vous retrouvez piégé par la légitimité.

**Coyote.** Levier administratif, abus du timing, risque institutionnel. Vous gagnez de l'argent en étant difficile à cerner.

**Capitaine d'honneur.** Confrontation directe, politique interne, volatilité de la réputation. Vous résolvez les problèmes en face à face.

Ce ne sont pas des classes. Ce sont ce que vos choix vous ont transformé.

## Comment ce paquet fonctionne

Ce paquet npm utilise [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher) pour :

1. Téléchargez le fichier binaire précompilé de Star Freight depuis [GitHub Releases](https://github.com/mcp-tool-shop-org/star-freight/releases).
2. Vérifiez les sommes de contrôle SHA256.
3. Mettez en cache localement (`~/.cache/mcptoolshop/star-freight/`).
4. Exécutez le programme avec vos arguments.

### Gestion du cache

```bash
star-freight --print-cache-path
star-freight --clear-cache
```

### Prise en charge des plateformes

| Plateforme | Fichier binaire |
|----------|--------|
| Linux x64 | `star-freight-<version>-linux-x64` |
| macOS ARM64 | `star-freight-<version>-darwin-arm64` |
| Windows x64 | `star-freight-<version>-win-x64.exe` |

## Sécurité

**Modèle de menace :** Ce paquet télécharge des fichiers binaires précompilés depuis GitHub Releases via HTTPS et vérifie les sommes de contrôle SHA256 avant l'exécution. Il NE collecte PAS de données télémétriques, NE stocke PAS de mots de passe, NE fait PAS de requêtes réseau en dehors de `github.com`, et N'écrit PAS en dehors du répertoire de cache de l'utilisateur (`~/.cache/mcptoolshop/star-freight/`). Le fichier binaire exécuté fonctionne avec les permissions de l'utilisateur et enregistre les sauvegardes du jeu uniquement dans le répertoire de travail actuel. Consultez [SECURITY.md](SECURITY.md) pour la politique complète.

## Dépôt source

Le code source du jeu se trouve à [mcp-tool-shop-org/star-freight](https://github.com/mcp-tool-shop-org/star-freight).

## Licence

MIT

---

*Star Freight est un jeu qui explore le thème de la navigation dans des systèmes de pouvoir sans jamais y appartenir pleinement.*

Développé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
