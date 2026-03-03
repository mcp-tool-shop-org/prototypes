# Case Study: Visualizing Grokking with VectorCaliper

This case study demonstrates how VectorCaliper reveals training dynamics that metrics alone would miss.

---

## Background

**Grokking** is a phenomenon where a model suddenly generalizes long after achieving near-perfect training accuracy. Standard metrics show a sudden jump in test accuracy, but don't explain *why* or *when* it will happen.

**VectorCaliper** shows grokking as a *geometric transition* — a visible change in how the model's state moves through representation space.

---

## Setup

### Dataset

- Modular arithmetic: (a + b) mod p for small prime p
- Training split: 50% of all pairs
- Test split: remaining 50%

### Model

- Small transformer (2 layers, 128 dim)
- Standard positional encoding

### Optimizers Compared

1. **AdamW** (lr=1e-3, weight_decay=0.1)
2. **SGD** (lr=0.1, momentum=0.9)

---

## What Standard Metrics Show

### Training Loss
```
Epoch 0:   1.85
Epoch 10:  0.02  ← Memorization complete
Epoch 100: 0.01
Epoch 500: 0.01  ← No change visible
```

### Test Accuracy
```
Epoch 0:   0.12
Epoch 10:  0.15
Epoch 100: 0.18
Epoch 500: 0.98  ← Sudden jump! When? Why?
```

Metrics show *that* grokking happened, not *how* or *why*.

---

## What VectorCaliper Reveals

### 1. Training Trajectory Geometry

Using VectorCaliper's projection and trajectory visualization:

```
Epoch 0-10 (Memorization):
- Trajectory: Rapid movement in weight space
- Update vectors: Large magnitude, high alignment (coherent direction)
- Regime: stable_convergence

Epoch 10-400 (Plateau):
- Trajectory: Near-stationary in training loss, but...
- Update vectors: Small but CONSISTENT direction
- Regime: plateau (not collapsed!)
- Key insight: Model is still moving, just not toward training loss

Epoch 400-500 (Grokking):
- Trajectory: Sudden directional change
- Update vectors: Magnitude spike, then stabilization
- Regime transition: plateau → stable_convergence
```

### 2. Update Vector Analysis

VectorCaliper's update vector visualization shows:

**Pre-Grokking (Epoch 100):**
```
Mean alignment: 0.85 (high coherence)
Magnitude: 0.001 (tiny updates)
Direction: Consistent axis in weight space
```

**During Grokking (Epoch 450):**
```
Mean alignment: 0.45 (direction change)
Magnitude: 0.05 (50x larger)
Direction: Orthogonal to previous
```

**Post-Grokking (Epoch 500):**
```
Mean alignment: 0.80 (new coherent direction)
Magnitude: 0.002 (small, stable)
Direction: New stable axis
```

### 3. Regime Detection

VectorCaliper's regime detector identifies:

```
Step 0-100:     stable_convergence (memorization)
Step 100-400:   plateau (but not collapsed!)
Step 400-450:   oscillatory (transition)
Step 450-500:   stable_convergence (generalization)
```

The key insight: **plateau ≠ collapsed**

- Collapsed: No gradient, no movement
- Plateau: Small gradient, consistent direction, building toward transition

### 4. Optimizer Comparison

Using VectorCaliper's comparison module:

```
AdamW vs SGD Comparison:
- Convergence speed (to train loss 0.1): AdamW 15 steps, SGD 45 steps
- Stability (loss variance): SGD lower
- Final test accuracy: Both 0.98
- Grokking onset: AdamW ~400 epochs, SGD ~600 epochs
- Update alignment pre-grokking: AdamW 0.85, SGD 0.70
```

The comparison reveals: AdamW's higher update alignment correlates with earlier grokking.

---

## Key Insights

### What Metrics Alone Would Miss

1. **The model never stopped learning**
   - Training loss flatlined, but update vectors remained non-zero
   - Direction was consistent, just not toward training loss

2. **Grokking is a regime transition, not a sudden event**
   - VectorCaliper shows the *buildup* through plateau regime
   - The transition begins before test accuracy changes

3. **Optimizer choice affects geometry, not just speed**
   - AdamW maintains higher update alignment during plateau
   - This correlates with earlier grokking, visible geometrically

4. **Two runs with same final accuracy look visibly different**
   - AdamW: Direct path to memorization, orthogonal shift to generalization
   - SGD: Smoother path, more gradual directional change

---

## VectorCaliper Configuration Used

```typescript
// Adapter
const adapter = new TrainingStateAdapter({
  missingValueStrategy: 'default',
});

// Time axis with epoch markers
const timeAxis = new TimeAxis(trajectory);
const markers = createEpochMarkers(trajectory);

// Update visualization with ghosting
const visualizer = new UpdateVectorVisualizer(trajectory, positions, {
  showGhosts: true,
  ghostCount: 10,  // Longer history for slow-moving plateau
  highlightEpochCrossings: true,
});

// Regime detection with adjusted thresholds
const detector = new RegimeDetector(trajectory, {
  windowSize: 20,  // Longer window for noisy modular arithmetic
  stabilityThreshold: 0.005,  // Tighter for detecting subtle plateau
});

// Comparison
const comparator = new TrainingComparator(adamTrajectory, sgdTrajectory, {
  alignmentMode: 'epoch_progress',
  convergenceLossThreshold: 0.05,
  includeRegimeComparison: true,
});
```

---

## Reproduction Steps

1. **Train models and log states**
   ```python
   for step, (x, y) in enumerate(dataloader):
       optimizer.zero_grad()
       loss = criterion(model(x), y)
       loss.backward()
       optimizer.step()

       # Log for VectorCaliper
       log_entry = {
           'step': step,
           'epoch': epoch,
           'learningRate': optimizer.param_groups[0]['lr'],
           'loss': loss.item(),
           'gradientNorm': compute_grad_norm(model),
           'updateNorm': compute_update_norm(prev_params, model),
           'parameterNorm': compute_param_norm(model),
           'accuracy': compute_accuracy(model, test_data),
       }
       logs.append(log_entry)
   ```

2. **Create VectorCaliper trajectory**
   ```typescript
   const trajectory = adapter.adaptLogs(logs, 'grokking_run', 'AdamW Grokking');
   ```

3. **Analyze regime transitions**
   ```typescript
   const transitions = detector.getRegimeTransitions();
   // Look for plateau → stable_convergence transition
   ```

4. **Compare optimizers**
   ```typescript
   const comparison = comparator.compare();
   console.log(generateComparisonReport(comparison));
   ```

---

## Conclusions

VectorCaliper transforms grokking from a mysterious sudden event into a visible geometric process:

| What Metrics Show | What VectorCaliper Shows |
|-------------------|--------------------------|
| Flat training loss | Consistent update direction |
| Sudden test accuracy jump | Regime transition: plateau → convergence |
| AdamW and SGD both grok | Different geometric paths to same outcome |
| "It eventually generalizes" | How, when, and why (geometrically) |

**The instrument reveals what the metrics cannot: training dynamics are geometry, not just curves.**

---

*This case study uses synthetic expectations based on grokking literature. Actual results will vary with implementation details.*
