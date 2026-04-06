---
title: World Map
description: The Known World — 20 ports across 5 maritime trade regions
sidebar:
  order: 3
---

import { Image } from 'astro:assets';
import worldMap from '../../../assets/world-map.svg';

The Known World spans five maritime regions connected by trade routes of increasing danger and reward. From the familiar shores of the Mediterranean to the distant Reef Kingdoms, each region has its own economy, culture, pirate faction, and seasonal rhythms.

<Image src={worldMap} alt="Portlight World Map — 20 ports across 5 regions" />

## Regions

| Region | Ports | Character | Sacred Good |
|--------|-------|-----------|-------------|
| **Mediterranean** | Porto Novo, Al-Manar, Silva Bay, Corsair's Rest | Commerce is civilization | Grain |
| **North Atlantic** | Ironhaven, Stormwall, Thornport | Strength is built, not born | Medicines |
| **West Africa** | Sun Harbor, Palm Cove, Iron Point, Pearl Shallows | Trade is relationship | Pearls |
| **East Indies** | Jade Port, Monsoon Reach, Silk Haven, Crosswind Isle, Dragon's Gate, Spice Narrows | Patience is mastery | Porcelain |
| **South Seas** | Ember Isle, Typhoon Anchorage, Coral Throne | Sea gives life and takes it | Pearls |

## Route Tiers

Routes are tiered by the minimum ship class needed to safely navigate them:

- **Sloop** — Regional coastal routes. Short, safe, low margins. Where every captain starts.
- **Brigantine** — Cross-region bridges. Medium distance, moderate risk. Bulk commodity routes.
- **Galleon** — Long-haul voyages. High distance, high danger, luxury margins justify the investment.
- **Man-of-War** — Dangerous shortcuts. Only the desperate or the bold.

## In-Game Map

View the world map from your terminal at any time:

```sh
portlight map              # full world map
portlight map --routes     # show trade route lines
portlight map --region med # zoom into a single region
```

## Seasonal Danger

| Season | Days | Key Effect |
|--------|------|------------|
| Spring | 1-90 | Calm seas, Mediterranean wakes |
| Summer | 91-180 | Monsoon devastates East Indies (1.7x), North Atlantic golden (0.7x) |
| Autumn | 181-270 | Grain harvest floods Mediterranean, storms build |
| Winter | 271-360 | North Atlantic deadly (1.8x), South Seas gentle |
