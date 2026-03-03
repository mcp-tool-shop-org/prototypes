# When VectorCaliper Is Useful

This document defines when VectorCaliper adds value, when it doesn't, and what it explicitly does not claim.

---

## When Metrics Are Sufficient (Don't Use VectorCaliper)

VectorCaliper is overhead when:

### 1. You have a known, stable training setup
- Loss decreases predictably
- No unexpected behavior
- You're running routine experiments

### 2. You only need final outcomes
- "Did accuracy reach 95%?"
- "Did loss converge below threshold?"
- Binary success/failure is sufficient

### 3. You're doing hyperparameter sweeps
- Metrics suffice for ranking runs
- You don't need to understand *why* one config won

### 4. Training is fast and cheap
- If you can just re-run, you don't need deep inspection
- The cost of debugging < cost of understanding

### 5. You trust your optimizer
- Well-understood architecture
- Well-understood data
- No surprises expected

**In these cases, standard logging (loss curves, accuracy plots) is the right tool.**

---

## When Geometry Adds Value (Use VectorCaliper)

VectorCaliper is valuable when:

### 1. Training behaves unexpectedly
- Loss plateaus without explanation
- Accuracy oscillates
- Model "forgets" learned behavior
- Sudden divergence

**VectorCaliper shows:** Where the model is moving (or not), even when metrics are flat.

### 2. You're debugging optimizer behavior
- Comparing Adam vs SGD vs custom optimizer
- Investigating learning rate schedules
- Understanding momentum effects

**VectorCaliper shows:** Optimizers as motion laws, not just hyperparameters.

### 3. You suspect hidden dynamics
- Grokking (sudden generalization)
- Catastrophic forgetting
- Mode collapse in generative models
- Double descent phenomena

**VectorCaliper shows:** Regime transitions before metrics change.

### 4. Two runs have same outcome but feel different
- Same final accuracy, different training curves
- One stable, one lucky
- You need to know which is reproducible

**VectorCaliper shows:** Different geometric paths to same destination.

### 5. You're doing research on learning dynamics
- Studying optimization landscapes
- Investigating generalization
- Understanding training instability

**VectorCaliper provides:** A geometrical instrument, not a metrics dashboard.

---

## When Geometry Can Mislead (Use With Caution)

VectorCaliper can mislead when:

### 1. You over-interpret projections
- PCA preserves variance, not all structure
- 2D projections lose information
- "Close" in projection ≠ "close" in reality

**Mitigation:** Remember projections are lossy. Don't treat visual proximity as semantic similarity without verification.

### 2. You confuse correlation with causation
- Regime transitions correlate with metric changes
- They don't *cause* them (necessarily)
- VectorCaliper observes, it doesn't explain

**Mitigation:** Use VectorCaliper for *what* happened, not *why*.

### 3. You expect VectorCaliper to optimize
- It won't tell you the "best" learning rate
- It won't recommend optimizer changes
- It won't auto-tune anything

**Mitigation:** VectorCaliper is a debugger, not an advisor.

### 4. You ignore the source data quality
- Garbage in, garbage out
- Missing or corrupted logs → misleading trajectories
- Incomplete data looks like partial dynamics

**Mitigation:** Validate your logging first. VectorCaliper cannot fix bad data.

### 5. You use it for every run
- Overhead is real
- Most runs don't need geometric inspection
- Reserve it for debugging, not monitoring

**Mitigation:** Use standard metrics for routine monitoring. Deploy VectorCaliper for investigation.

---

## What VectorCaliper Explicitly Does NOT Claim

### Does NOT claim: "This optimizer is better"
VectorCaliper shows differences. "Better" requires your criteria.

### Does NOT claim: "Training will succeed/fail"
Regime detection is descriptive, not predictive.

### Does NOT claim: "This is the cause of the problem"
Correlation is visible. Causation requires your analysis.

### Does NOT claim: "This run is optimal"
Optimality is your judgment. VectorCaliper shows geometry.

### Does NOT claim: "You should use these hyperparameters"
No recommendations. No prescriptions. No advice.

### Does NOT claim: "The projection shows the true structure"
Projections are dimensionality reductions. They lose information by design.

### Does NOT claim: "Regimes are ground truth"
Regime detection uses explicit thresholds. Different thresholds → different classifications.

### Does NOT claim: "Smoothing/averaging would help"
VectorCaliper explicitly avoids smoothing. If you want smoothing, do it yourself.

---

## Summary Table

| Situation | Use VectorCaliper? | Why |
|-----------|-------------------|-----|
| Routine training run | No | Metrics suffice |
| Hyperparameter sweep | No | Ranking doesn't need geometry |
| Unexpected plateau | Yes | Shows movement metrics miss |
| Optimizer comparison | Yes | Shows geometry, not just speed |
| Debugging instability | Yes | Reveals regime before divergence |
| Grokking investigation | Yes | Shows transition before metric spike |
| Final accuracy only | No | Outcome doesn't need path |
| Research on dynamics | Yes | Instrument for observation |

---

## The Core Principle

**VectorCaliper is an instrument, not an oracle.**

It reveals structure. It does not interpret meaning.
It shows geometry. It does not prescribe action.
It observes dynamics. It does not predict outcomes.

The value is in *looking*, not in *being told*.

---

*If you're looking for a tool that tells you what to do, VectorCaliper is not that tool. If you're looking for a tool that shows you what's happening, VectorCaliper is exactly that tool.*
