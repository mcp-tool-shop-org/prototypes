---
title: Beginner's Survival Guide
description: Tips, tactics, and common mistakes for your first few runs in Escape the Valley.
sidebar:
  order: 99
---

## What to expect

You will die. Probably several times. The valley is harsh but fair -- a skilled player escapes about one run in three, and that is by design. Some seeds are harder than others, and some twists stack against you. The goal of this guide is to shorten the learning curve so your first escape comes sooner rather than later.

## Your first run

Start with the defaults. Do not change the GM profile, pace, or callouts on your first game. The default settings (Fireside narrator, steady pace, verbose callouts) are tuned for new players.

```bash
npx @mcptoolshop/escape-the-valley tui --seed 42
```

Using a seed lets you retry the same world if things go wrong. Once you survive seed 42, try a random run (drop the `--seed` flag) to see how you handle the unknown.

## Core survival rules

These five rules cover 90% of what separates survivors from casualties:

1. **Travel is king.** Every turn you spend resting, hunting, or repairing is a turn you burn food and water without getting closer to the exit. The clock is always ticking. Travel whenever you can. Only stop when stopping prevents something worse.

2. **The wagon is your life.** If the wagon breaks and you have no spare parts, the run is over. Watch the condition number. When it drops below half, act immediately. Do not wait for the warning -- by then it is a coin flip.

3. **Maintenance windows work.** Rest followed by repair (or repair followed by rest) creates a brief period where breakdowns are much less likely. This is the single most valuable trick in the game. Time it before the wagon gets critical, not after.

4. **Hunt smart.** Hunting costs a full turn and one ammo. Success is not guaranteed. In forests and plains your odds are decent. In deserts, do not bother. Only hunt when food is genuinely running low -- not "getting low," but "we eat tomorrow and then we starve."

5. **Read the warnings.** When you see a cliff-edge warning like "Food for one day," that means exactly what it says. One day of margin. The next turn without food, people start dying. These warnings are your last-chance signal.

## Understanding supplies

The 5 core supplies to watch are:

| Supply | Why it matters |
|--------|---------------|
| **Food** | Party eats every turn. Run out and people die fast. |
| **Water** | Consumed every turn. Refills at towns. |
| **Meds** | Cure conditions and heal during rest. Scarce and valuable. |
| **Ammo** | Spent when hunting. No ammo means no hunting. |
| **Parts** | Spent on wagon repair. No parts and a broken wagon ends the run. |

Extended supplies (firewood, salt, lantern oil, cloth, rope, tools, boots) add depth but are secondary. Focus on the five core supplies first.

## Common mistakes

**Resting too much.** Rest feels safe, but every rest turn burns supplies without moving you closer to the exit. Rest only to cure conditions or recover from dangerously low morale.

**Ignoring the wagon.** New players watch food and water but forget about the wagon. A sudden breakdown with no spare parts is the most common way to lose a run.

**Using escape valves as strategy.** Hard ration, desperate repair, and abandon cargo exist for emergencies. They have harsh side effects and cooldowns. If you are using them every other turn, something went wrong three turns ago.

**Hunting in the desert.** Terrain matters. Forests and plains give decent hunting odds. Deserts give almost nothing. Check your terrain before wasting ammo.

**Ignoring events.** Events give you choices (A/B/C). Cautious choices cost time or supplies but keep you safe. Bold choices save time but risk damage. Match your choice to your party's current condition -- do not always pick the same option.

## Doctrines and pace

Each run assigns a **doctrine** that changes the rules slightly:

- **Travel Light** rewards speed runners with lower consumption but more breakdowns.
- **Careful Hands** rewards cautious players with better repairs and longer maintenance windows.
- **No Debts** rewards steady play with a morale floor and better town trading.

**Pace** controls speed vs. safety. Stick with **steady** until you understand the rhythm. Hard pace burns through supplies and breaks wagons. Slow pace extends the journey, which means more total consumption -- only use it when the wagon is fragile.

## Quick-reference cheat sheet

| Situation | What to do |
|-----------|-----------|
| Wagon below 50% condition | Maintenance window (rest then repair) |
| Food below 3 days | Hunt if in forest/plains, otherwise push to next town |
| No spare parts | Travel carefully, avoid hard pace, pray |
| Morale tanking | Rest one turn, then keep moving |
| Event choice with healthy party | Bold choices save time |
| Event choice with weak party | Cautious choices save lives |
| Cliff-edge warning | Drop everything and address it immediately |
| First few turns | Travel, travel, travel -- build distance while supplies are full |
