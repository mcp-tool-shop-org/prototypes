---
title: Gameplay
description: Camp actions, GM profiles, supplies, doctrines, and survival strategy for Escape the Valley.
sidebar:
  order: 2
---

## Overview

You lead a party of settlers through a procedurally generated valley. Each turn you choose a camp action, then the game engine resolves events, weather, encounters, and resource changes. The goal is to reach the valley exit before your supplies or your people give out.

The world uses seeded generation -- pass `--seed 42` to get the same terrain, weather patterns, and event deck every time. Useful for comparing strategies or sharing challenges.

## Camp actions

Every turn at camp, you choose one of four core actions:

| Action | What it does |
|--------|-------------|
| **Travel** | Move toward the exit. Costs food and water. Risk of breakdown and events. |
| **Rest** | Heal the party, recover morale. Costs supplies but no progress. |
| **Hunt** | Spend ammo for a chance at food. Better in forests and plains. |
| **Repair** | Spend a spare part to fix the wagon. Critical for survival. |

The tension is always between moving forward and keeping your party healthy. Travel too hard and people break down. Rest too long and you starve.

### Escape valves

Three emergency actions exist for desperate situations. They have side effects and cooldowns -- use them as last resorts, not strategies:

| Escape Valve | What it does |
|--------------|-------------|
| **Hard Ration** | Halve food consumption at the cost of morale and health. |
| **Desperate Repair** | A coin-flip wagon fix that can make things worse. |
| **Abandon Cargo** | Drop supplies to reduce weight and save the wagon. |

## Supplies

The game tracks 12 resource types across two categories:

**Consumables:** food, water, firewood, meds, salt, ammo, lantern oil, cloth

**Gear:** parts, rope, tools, boots

The 5 core supplies (food, water, meds, ammo, parts) are the most critical. Extended supplies add depth: firewood fuels night camps, salt prevents food spoilage, lantern oil enables safer night travel, and cloth patches gear and wagon cover.

## Pace

Pace controls the trade-off between speed and safety:

- **Steady** -- the default. Balanced consumption and progress.
- **Hard** -- covers more ground but burns more food, more water, and breaks wagons faster.
- **Slow** -- sounds safe but extends the journey, increasing total consumption. Use only when the wagon is fragile.

## Doctrines

Each run assigns a doctrine that changes the rules slightly:

- **Travel Light** -- less consumption, slightly more breakdowns, good hunting bonus. A speed-run doctrine.
- **Careful Hands** -- better repairs, slower travel, longer maintenance windows. The careful player's choice.
- **No Debts** -- morale floor prevents total despair, better trading at towns. Steady and resilient.

No doctrine is best. They reward different play styles.

## Events

Events interrupt travel with choices (A/B/C). Cautious choices are safer but cost time. Bold choices are faster but risky. There is no always-right answer -- read the situation and match your choice to your party's condition.

The twist deck introduces 10-15% weird folklore events that bend the rules in unexpected ways.

## Towns

Towns are safe harbors. They refill water, offer a chance to trade for food (better if morale is high), and serve as ledger checkpoints if you are using the XRPL backpack. Plan your route to hit towns when possible.

## GM profiles

The AI Game Master narrates your journey using one of three storytelling voices. The GM shapes the tone, not the mechanics -- all three profiles use the same underlying rules engine.

| Profile | Tone | Best for |
|---------|------|----------|
| **Chronicler** | Grounded, practical, spare | Players who want the facts straight |
| **Fireside** | Serious campfire narrator, subtle uncanny moments | First playthrough (default) |
| **Lantern-Bearer** | Uncanny, liminal, atmospheric | Experienced players looking for tension |

Choose a profile at launch:

```bash
trail tui --gm-profile chronicler
trail tui --gm-profile fireside
trail tui --gm-profile lantern
```

The GM runs locally via [Ollama](https://ollama.com/). If Ollama is not installed or not running, the game falls back to built-in narration. Use `--gm-off` to disable the GM entirely for deterministic mode.

## Warning callouts

By default, the game shows verbose warnings to help new players spot danger early. Experienced players can switch to minimal mode, which only shows cliff-edge warnings (last-moment, critical threats):

```bash
trail tui --callouts minimal
```

## XRPL Ledger Backpack

An optional feature: every supply change for the 5 core supplies (food, water, meds, ammo, parts) is tracked as a token on the XRPL Testnet. After your run, the trail ledger shows an on-chain receipt of your entire journey.

```bash
trail ledger enable     # enable the backpack
trail ledger status     # check backpack status
trail ledger reconcile  # retry failed settlements
```

This feature requires a testnet connection and is entirely optional. The game works fully offline without it.

## Multiplayer parcel trading

Send supplies to other travelers via the XRPL backpack:

```bash
trail parcel send <address> <supply> <amount>  # send supplies
trail parcel list                               # list received parcels
trail parcel accept <id>                        # accept a parcel
trail wallet share                              # share your address
```
