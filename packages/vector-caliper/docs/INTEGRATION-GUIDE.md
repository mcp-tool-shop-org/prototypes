# VectorCaliper Integration Guide

This guide covers integrating VectorCaliper into your ML training pipeline.

**Core Principle**: VectorCaliper never mutates your training. All integrations are read-only observers.

## Quick Start

### 1. Install VectorCaliper

```bash
npm install vectorcaliper
```

### 2. Capture Training Data

Choose your framework:

- [PyTorch Integration](#pytorch-integration)
- [JAX Integration](#jax-integration)
- [Generic JSON](#generic-json-integration)

### 3. Visualize

```bash
npx vectorcaliper view training.json
```

---

## PyTorch Integration

### Minimal Example

```python
import torch
import json

def capture_step(model, optimizer, loss, step, epoch):
    """Capture training state for VectorCaliper."""

    # Compute norms (VectorCaliper does NOT do this for you)
    grad_norm = 0.0
    param_norm = 0.0

    for p in model.parameters():
        if p.grad is not None:
            grad_norm += p.grad.data.norm(2).item() ** 2
        param_norm += p.data.norm(2).item() ** 2

    grad_norm = grad_norm ** 0.5
    param_norm = param_norm ** 0.5

    # Get learning rate
    lr = optimizer.param_groups[0]['lr']

    return {
        'step': step,
        'epoch': epoch,
        'learningRate': lr,
        'loss': loss.item(),
        'gradientNorm': grad_norm,
        'updateNorm': 0.0,  # Compute if needed
        'parameterNorm': param_norm,
    }

# Training loop
captures = []
for epoch in range(num_epochs):
    for step, (x, y) in enumerate(dataloader):
        optimizer.zero_grad()
        loss = criterion(model(x), y)
        loss.backward()

        # Capture BEFORE optimizer.step()
        captures.append(capture_step(model, optimizer, loss, step, epoch))

        optimizer.step()

# Save for VectorCaliper
with open('training.json', 'w') as f:
    json.dump(captures, f)
```

### Computing Update Norm

To track parameter updates:

```python
def capture_with_update(model, optimizer, loss, step, epoch, prev_params=None):
    """Capture including update norm."""

    # Current parameters
    current_params = {n: p.data.clone() for n, p in model.named_parameters()}

    # Compute update norm if we have previous params
    update_norm = 0.0
    if prev_params is not None:
        for name, param in current_params.items():
            diff = param - prev_params[name]
            update_norm += diff.norm(2).item() ** 2
        update_norm = update_norm ** 0.5

    # ... rest of capture logic

    return capture, current_params  # Return params for next iteration
```

### Using PyTorch Hooks

For automatic gradient capture:

```python
class GradientCapture:
    def __init__(self, model):
        self.gradients = {}
        self.handles = []

        for name, param in model.named_parameters():
            handle = param.register_hook(
                lambda grad, n=name: self._save_grad(n, grad)
            )
            self.handles.append(handle)

    def _save_grad(self, name, grad):
        self.gradients[name] = grad.data.clone()

    def get_gradient_norm(self):
        total = sum(g.norm(2).item() ** 2 for g in self.gradients.values())
        return total ** 0.5

    def remove(self):
        for h in self.handles:
            h.remove()
```

---

## JAX Integration

### Minimal Example

```python
import jax
import jax.numpy as jnp
import json

def capture_jax_step(params, grads, opt_state, loss, step, epoch, lr):
    """Capture JAX training state for VectorCaliper.

    This function is pure - same inputs always produce same outputs.
    Safe to use inside jax.jit.
    """

    # Compute norms from pytrees
    def tree_norm(tree):
        leaves = jax.tree_util.tree_leaves(tree)
        return jnp.sqrt(sum(jnp.sum(x ** 2) for x in leaves))

    return {
        'step': int(step),
        'epoch': int(epoch),
        'learningRate': float(lr),
        'loss': float(loss),
        'gradientNorm': float(tree_norm(grads)),
        'updateNorm': 0.0,  # Compute from param diff if needed
        'parameterNorm': float(tree_norm(params)),
    }

# Training loop
captures = []

@jax.jit
def train_step(params, opt_state, x, y):
    def loss_fn(p):
        return jnp.mean((model.apply(p, x) - y) ** 2)

    loss, grads = jax.value_and_grad(loss_fn)(params)
    updates, new_opt_state = optimizer.update(grads, opt_state, params)
    new_params = optax.apply_updates(params, updates)

    return new_params, new_opt_state, loss, grads

for epoch in range(num_epochs):
    for step, (x, y) in enumerate(dataloader):
        params, opt_state, loss, grads = train_step(params, opt_state, x, y)

        # Capture AFTER step (we have grads)
        captures.append(capture_jax_step(
            params, grads, opt_state, loss, step, epoch, learning_rate
        ))

# Save for VectorCaliper
with open('training.json', 'w') as f:
    json.dump(captures, f)
```

### Computing Update Norm in JAX

```python
def capture_with_update(params, prev_params, grads, loss, step, epoch, lr):
    """Capture including update norm."""

    def tree_norm(tree):
        leaves = jax.tree_util.tree_leaves(tree)
        return jnp.sqrt(sum(jnp.sum(x ** 2) for x in leaves))

    # Update norm = difference between current and previous params
    param_diff = jax.tree_util.tree_map(
        lambda a, b: a - b, params, prev_params
    )
    update_norm = tree_norm(param_diff)

    return {
        'step': int(step),
        'epoch': epoch,
        'learningRate': float(lr),
        'loss': float(loss),
        'gradientNorm': float(tree_norm(grads)),
        'updateNorm': float(update_norm),
        'parameterNorm': float(tree_norm(params)),
    }
```

---

## Generic JSON Integration

Any framework can integrate by producing JSON in this format:

```json
[
  {
    "step": 0,
    "epoch": 0,
    "learningRate": 0.001,
    "loss": 2.5,
    "gradientNorm": 1.2,
    "updateNorm": 0.01,
    "parameterNorm": 15.3
  },
  {
    "step": 1,
    "epoch": 0,
    "learningRate": 0.001,
    "loss": 2.3,
    "gradientNorm": 1.1,
    "updateNorm": 0.009,
    "parameterNorm": 15.4
  }
]
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `step` | integer ≥ 0 | Training step (0-indexed) |
| `epoch` | integer ≥ 0 | Epoch number (0-indexed) |
| `learningRate` | number > 0 | Current learning rate |
| `loss` | number ≥ 0 | Loss value (must be finite) |
| `gradientNorm` | number ≥ 0 | L2 norm of gradients |
| `updateNorm` | number ≥ 0 | L2 norm of parameter update |
| `parameterNorm` | number ≥ 0 | L2 norm of all parameters |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `accuracy` | number [-1, 1] | Accuracy (-1 if not applicable) |
| `timestamp` | ISO 8601 string | Capture timestamp |
| `metadata` | object | Custom user data (preserved, not visualized) |

---

## Streaming Integration

For real-time visualization during training:

```python
import json
import sys

def stream_capture(capture):
    """Stream a capture to stdout for real-time visualization."""
    print(json.dumps(capture), flush=True)

# In training loop
for step in range(num_steps):
    # ... training code ...

    capture = capture_step(model, optimizer, loss, step, epoch)
    stream_capture(capture)  # Stream to stdout
```

Then pipe to VectorCaliper:

```bash
python train.py | npx vectorcaliper stream
```

### Streaming Protocol

Each line is a complete JSON object (NDJSON format):

```
{"step":0,"epoch":0,"learningRate":0.001,...}
{"step":1,"epoch":0,"learningRate":0.001,...}
{"step":2,"epoch":0,"learningRate":0.001,...}
```

VectorCaliper will:
- Display partial data with visual indicators
- Never interpolate missing steps
- Converge to offline visualization when complete

---

## CI Integration

### Golden Artifact Testing

1. Generate a golden artifact from known-good training:

```bash
python train.py > golden.json
npx vectorcaliper validate golden.json
```

2. In CI, compare against golden:

```bash
python train.py > current.json
npx vectorcaliper diff golden.json current.json
```

Exit codes:
- `0`: Artifacts are identical
- `1`: Artifacts differ

### Deterministic Artifacts

For reproducible comparisons:

```bash
# Generate deterministic JSON (sorted keys, no pretty print)
npx vectorcaliper generate training.json --format json > artifact.json

# Compare
npx vectorcaliper diff expected.json artifact.json
```

### CSV for Spreadsheet Analysis

```bash
npx vectorcaliper generate training.json --format csv > training.csv
```

---

## Validation

### Validate Before Visualization

```bash
npx vectorcaliper validate training.json
```

Output:
```
Artifact is valid
  Entries: 1000
  Contract version: v1
```

### Programmatic Validation

```typescript
import { validateArtifact, parse } from 'vectorcaliper/integration';

const content = fs.readFileSync('training.json', 'utf-8');
const artifact = parse(content);
const result = validateArtifact(artifact);

if (!result.valid) {
  console.error('Invalid artifact:', result.errors);
  process.exit(1);
}
```

---

## Troubleshooting

### "Missing required field"

Your captures are missing one of: `step`, `epoch`, `learningRate`, `loss`, `gradientNorm`, `updateNorm`, `parameterNorm`.

**Fix**: Ensure all required fields are present in every capture.

### "Loss must be finite"

Your loss value is `NaN` or `Infinity`.

**Fix**: Add gradient clipping or check for numerical issues in your model.

### "Learning rate must be positive"

Your learning rate is 0 or negative.

**Fix**: This often happens with certain schedulers. Use the actual LR used for the step.

### Streaming shows "partial" badges

VectorCaliper is receiving incomplete data.

**Fix**: Ensure each streamed line is a complete JSON object with all required fields.

### CI diff fails but training looks correct

Check if:
1. Random seeds are different (affects parameter norms)
2. Data ordering changed (affects loss curve)
3. Floating point precision differs across machines

**Fix**: Use tolerances in custom diff scripts, or accept minor variations.

---

## Best Practices

### DO

- Capture at consistent points (before or after `optimizer.step()`, not mixed)
- Include all required fields in every capture
- Use deterministic output for CI
- Validate artifacts before committing as golden

### DON'T

- Capture inside `@jax.jit` if you need Python-side I/O
- Mix different capture points in the same run
- Rely on VectorCaliper to compute norms (you must compute them)
- Expect VectorCaliper to explain or interpret your results

---

## What VectorCaliper Does NOT Do

VectorCaliper is a visualization tool, not an analysis tool.

It will NOT:
- Compute gradient or parameter norms for you
- Tell you if your training is "good" or "bad"
- Recommend hyperparameter changes
- Diagnose convergence issues
- Interpolate missing data points
- Smooth noisy signals

See [WHEN-VECTORCALIPER-IS-USEFUL.md](./WHEN-VECTORCALIPER-IS-USEFUL.md) for more details.
