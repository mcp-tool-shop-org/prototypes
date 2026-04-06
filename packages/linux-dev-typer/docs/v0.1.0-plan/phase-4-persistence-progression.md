# Phase 4 — Persistence + progression (Commits 16–20)

> Goal: persistence is robust and progression feels real (leveling, per-language rating, history).

## Commit 16 — `feat(core): rating adjustment (simple Elo-like)`
- [ ] For each completion:
  - [ ] compute expected score from rating vs snippet difficulty
  - [ ] update rating by performance (accuracy + speed)
- [ ] Keep it simple; document constants
- [ ] Commit

## Commit 17 — `feat(app): persist recent results (N=50)`
- [ ] Extend `PersistedState` to include `List<Result> RecentResults`
- [ ] Append on completion; keep last 50
- [ ] Commit

## Commit 18 — `feat(app): results UI (last 5)`
- [ ] Display last 5 results in the stats panel or a small history drawer
- [ ] Include: language, wpm, acc, errors, xp
- [ ] Commit

## Commit 19 — `fix(app): persistence migrations`
- [ ] Use `SchemaVersion`
- [ ] If missing/older: migrate (or reset safely) without crashing
- [ ] Commit

## Commit 20 — `feat(core): difficulty ramp rules`
- [ ] Add “level influences selection”:
  - [ ] at higher level, widen difficulty window upward
  - [ ] introduce longer snippets more often (if you add length metadata later)
- [ ] Commit

---

## Phase 4 Exit Criteria
- [ ] Profile/settings persist reliably across restarts
- [ ] Ratings update per language
- [ ] Recent results persist and display
