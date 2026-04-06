<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/portlight/readme.png" width="600" alt="Portlight">
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/actions"><img src="https://github.com/mcp-tool-shop-org/npm-portlight/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/portlight"><img src="https://img.shields.io/npm/v/@mcptoolshop/portlight" alt="npm"></a>
  <a href="https://github.com/mcp-tool-shop-org/npm-portlight/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/npm-portlight/"><img src="https://img.shields.io/badge/docs-handbook-blue" alt="Handbook"></a>
</p>

Jeu de stratégie maritime axé sur le commerce. Développez une carrière de commerçant dans cinq régions grâce à l'arbitrage des routes, aux contrats, aux infrastructures, à la finance et à la réputation, le tout depuis l'interface. Aucune connaissance de Python n'est requise.

## Installation

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
```

Ou installez-le globalement :

```bash
npm install -g @mcptoolshop/portlight
portlight new "Captain Hawk" --type merchant
```

Disponible également via pip : `pip install portlight`

## Pourquoi Portlight ?

La plupart des jeux de commerce réduisent le commerce à un simple chiffre qui augmente. Portlight considère le commerce comme une discipline commerciale :

- **Les prix réagissent à vos transactions.** Déchargez une cargaison de céréales dans un port et le prix s'effondre. Chaque vente modifie le marché local.
- **Les ports ont une véritable identité économique.** Porto Novo produit des céréales à bas prix. Silk Haven exporte de la soie en grande quantité. Ce sont des caractéristiques structurelles, pas aléatoires.
- **Les voyages comportent des risques.** Tempêtes, pirates, inspections, dangers saisonniers. Vos provisions, la coque et l'équipage sont importants.
- **Les contrats nécessitent des preuves.** Livrez les bons produits au bon port avant la date limite. La traçabilité est assurée.
- **Les infrastructures modifient votre façon de commercer.** Les entrepôts stockent les marchandises. Les courtiers améliorent les contrats. Les licences débloquent un accès privilégié.
- **La réputation ouvre et ferme des portes.** Confiance commerciale, contrôles douaniers, position régionale et contacts dans le monde souterrain : quatre axes qui déterminent ce que vous pouvez faire et où.
- **Le jeu analyse ce que vous avez construit.** Votre historique commercial, vos infrastructures, votre réputation et vos itinéraires forment un profil de carrière. Quatre voies de victoire distinctes, basées sur le type de commerçant que vous êtes réellement devenu.

## Le Monde

Cinq régions. Vingt ports. Quarante-trois routes. Une économie dynamique.

| Région | Ports | Personnage |
|--------|-------|-----------|
| **Mediterranean** | Porto Novo, Al-Manar, Silva Bay, Corsair's Rest | Céréales, bois, marchés d'épices. Eaux de départ sûres. |
| **North Atlantic** | Ironhaven, Stormwall, Thornport | Fer, armes, commerce militaire. Inspections strictes. |
| **West Africa** | Sun Harbor, Palm Cove, Iron Point, Pearl Shallows | Coton, rhum, perles. Provisions les moins chères. |
| **East Indies** | Jade Port, Monsoon Reach, Silk Haven, Crosswind Isle, Dragon's Gate, Spice Narrows | Soie, épices, porcelaine, thé. Marges les plus élevées. Risque de mousson. |
| **South Seas** | Ember Isle, Typhoon Anchorage, Coral Throne | Perles, médicaments. Eaux de fin de partie éloignées. |

134 PNJ nommés dans chaque port. Quatre factions de pirates contrôlant différentes zones. Météo saisonnière qui modifie les dangers et la demande. Une couche culturelle avec des festivals, des superstitions et le moral de l'équipage.

## Neuf Capitaines

| Capitaine | Domicile | Avantage | Compromis |
|---------|------|------|-----------|
| **Merchant** | Porto Novo | Meilleurs prix, confiance qui grandit rapidement | Pénalités de "chaleur" doublées |
| **Smuggler** | Corsair's Rest | Marché noir, commerce de contrebande | Plus de "chaleur", plus d'inspections |
| **Navigator** | Monsoon Reach | Navires plus rapides, plus grande portée | Position initiale plus faible |
| **Privateer** | Ironhaven | Combats navals, avantage d'abordage | Mauvaise réputation commerciale |
| **Corsair** | Corsair's Rest | Équilibre entre combats et commerce | Maître de rien |
| **Scholar** | Jade Port | Avantage informationnel, meilleurs contrats | Faible capital, fragile |
| **Merchant Prince** | Porto Novo | Capital de départ élevé, accès privilégié | Frais plus élevés, cible des pirates |
| **Dockhand** | Crosswind Isle | Équipage le moins cher, débrouillard | Capital de départ le plus faible |
| **Bounty Hunter** | Stormwall | Maîtrise du combat, position dans une faction | Prix médiocres, méfiance |

## Démarrage rapide

```bash
npx @mcptoolshop/portlight new "Captain Hawk" --type merchant
npx @mcptoolshop/portlight market
npx @mcptoolshop/portlight buy grain 10
npx @mcptoolshop/portlight routes
npx @mcptoolshop/portlight sail al_manar
npx @mcptoolshop/portlight advance
npx @mcptoolshop/portlight sell grain 10
npx @mcptoolshop/portlight milestones
```

## Systèmes

**Économie** — Tarification basée sur la rareté dans 20 ports, 18 produits, 43 routes. Les pénalités de "déversement" sanctionnent la vente à perte. Les modificateurs de demande régionaux signifient que chaque port a une identité claire en matière d'importation/exportation.

**Voyages** — Voyages de plusieurs jours comprenant des conditions météorologiques, des rencontres avec des pirates et des inspections. Les provisions sont consommées quotidiennement. La coque subit des dommages. Les zones dangereuses saisonnières modifient les itinéraires sûrs.

**Contrats** — Six familles liées par la confiance et la réputation. Offres d'approvisionnement, secours en cas de pénurie, produits de luxe discrets, fret de retour, circuits commerciaux et commissions de factions. Délais réels, conséquences réelles.

**Réputation** — Quatre axes : réputation régionale, confiance commerciale, attention des douanes et relations avec le monde souterrain. Différents capitaines adoptent différentes éthiques.

**Combat** — Combat personnel (triangle de posture) avec 7 armes de mêlée, 7 armes à distance et différents styles de combat régionaux. Combat naval avec abordages et canons.

**Factions de pirates** — Crimson Tide, Iron Wolves, Deep Reef Brotherhood, Monsoon Syndicate. Chaque faction possède un territoire, des capitaines nommés et une attitude envers vous.

**Infrastructure** — Entrepôts, bureaux de courtiers, licences. Entretien réel. Chaque élément modifie les délais, l'ampleur ou l'accès aux échanges commerciaux.

**Finances** — Assurances et crédits. Effet de levier avec des conséquences.

**Compagnons** — Cinq rôles d'officier avec personnalité, moral et déclencheurs de départ.

**Carrière** — 27 étapes. 13 étiquettes de profil. Quatre voies de victoire : Maison commerciale légale, Réseau clandestin, Influence océanique, Empire commercial.

## Voies de victoire

- **Maison commerciale légale** — Élevée confiance, contrats premium, réputation irréprochable, vaste infrastructure.
- **Réseau clandestin** — Marges de luxe sous surveillance, gestion de la réputation, opérations résilientes.
- **Influence océanique** — Accès aux Indes orientales, infrastructure distante, maîtrise des itinéraires.
- **Empire commercial** — Infrastructure partout, diversification des revenus, effet de levier financier.

## Fonctionnement de ce package

Ce paquet télécharge le fichier binaire de Portlight précompilé pour votre plateforme depuis les versions de GitHub et le met en cache localement. Aucune installation de Python n'est requise.

| Préoccupations | Détails |
|---------|--------|
| **Network** | HTTPS uniquement vers le CDN `github.com` |
| **Filesystem** | Cache utilisateur uniquement (`~/.cache/mcptoolshop/portlight/`) |
| **Verification** | Vérification de la somme de contrôle SHA256 à chaque téléchargement |
| **Telemetry** | Aucun |
| **Platforms** | Windows (x64), macOS (x64/arm64), Linux (x64) |

## Sécurité

- Télécharge les fichiers binaires exclusivement depuis `github.com` via HTTPS
- Vérification de la somme de contrôle SHA256 à chaque téléchargement
- Écrit uniquement dans le répertoire de cache spécifique à l'utilisateur — ne touche jamais les répertoires système
- Pas de télémétrie, pas de secrets, pas de données d'identification stockées
- Pas d'accès réseau au-delà du téléchargement initial du fichier binaire

Consultez le fichier [SECURITY.md](SECURITY.md) pour connaître la politique complète.

## Licence

MIT

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
