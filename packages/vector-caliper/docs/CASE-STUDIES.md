# VectorCaliper Case Studies

Real integration examples showing VectorCaliper in practice.

**Important**: These case studies show what VectorCaliper *visualizes*, not what it *interprets*. Any analysis or interpretation is performed by the human researcher, not by VectorCaliper.

---

## Case Study 1: ResNet-50 on ImageNet

### Setup

```python
# capture_resnet.py
import torch
import torchvision.models as models
import json

model = models.resnet50(pretrained=False)
optimizer = torch.optim.SGD(model.parameters(), lr=0.1, momentum=0.9)
scheduler = torch.optim.lr_scheduler.StepLR(optimizer, step_size=30, gamma=0.1)

captures = []

for epoch in range(90):
    for step, (images, labels) in enumerate(train_loader):
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()

        # Capture BEFORE step
        grad_norm = sum(p.grad.norm(2).item()**2 for p in model.parameters()
                        if p.grad is not None) ** 0.5
        param_norm = sum(p.norm(2).item()**2 for p in model.parameters()) ** 0.5

        captures.append({
            'step': epoch * len(train_loader) + step,
            'epoch': epoch,
            'learningRate': optimizer.param_groups[0]['lr'],
            'loss': loss.item(),
            'gradientNorm': grad_norm,
            'updateNorm': 0.0,
            'parameterNorm': param_norm,
        })

        optimizer.step()
    scheduler.step()

with open('resnet50_training.json', 'w') as f:
    json.dump(captures, f)
```

### What VectorCaliper Shows

- Loss curve over 90 epochs
- Gradient norm evolution
- Parameter norm growth
- Learning rate schedule (visible as discrete jumps)

### What VectorCaliper Does NOT Tell You

- Whether convergence is "good"
- If you should change learning rate
- Why gradient norm spiked at epoch 30
- If the model will generalize

---

## Case Study 2: Transformer Language Model (JAX)

### Setup

```python
# capture_transformer.py
import jax
import jax.numpy as jnp
import optax
import json

def tree_norm(tree):
    leaves = jax.tree_util.tree_leaves(tree)
    return float(jnp.sqrt(sum(jnp.sum(x ** 2) for x in leaves)))

optimizer = optax.adamw(learning_rate=1e-4, weight_decay=0.01)
opt_state = optimizer.init(params)

captures = []

for step in range(100000):
    batch = next(data_iterator)

    def loss_fn(p):
        logits = model.apply(p, batch['input_ids'])
        return optax.softmax_cross_entropy_with_integer_labels(
            logits, batch['labels']
        ).mean()

    loss, grads = jax.value_and_grad(loss_fn)(params)
    updates, opt_state = optimizer.update(grads, opt_state, params)
    new_params = optax.apply_updates(params, updates)

    # Compute update norm
    param_diff = jax.tree_util.tree_map(lambda a, b: a - b, new_params, params)

    captures.append({
        'step': step,
        'epoch': step // steps_per_epoch,
        'learningRate': 1e-4,  # or extract from schedule
        'loss': float(loss),
        'gradientNorm': tree_norm(grads),
        'updateNorm': tree_norm(param_diff),
        'parameterNorm': tree_norm(new_params),
    })

    params = new_params

with open('transformer_training.json', 'w') as f:
    json.dump(captures, f)
```

### What VectorCaliper Shows

- Loss progression over 100k steps
- Update norm (actual parameter changes)
- Gradient norm patterns
- Parameter norm evolution

### What VectorCaliper Does NOT Tell You

- If gradients are "too small" or "too large"
- Optimal batch size
- Whether to use learning rate warmup
- If the model is overfitting

---

## Case Study 3: Distributed Training with Gradient Accumulation

### Setup

```python
# capture_distributed.py
import torch
import torch.distributed as dist
import json

accumulation_steps = 4
captures = []

for epoch in range(num_epochs):
    for step, batch in enumerate(dataloader):
        # Forward pass
        loss = model(batch) / accumulation_steps
        loss.backward()

        if (step + 1) % accumulation_steps == 0:
            # All-reduce gradients
            for p in model.parameters():
                if p.grad is not None:
                    dist.all_reduce(p.grad, op=dist.ReduceOp.AVG)

            # Capture accumulated gradients
            grad_norm = sum(p.grad.norm(2).item()**2 for p in model.parameters()
                            if p.grad is not None) ** 0.5
            param_norm = sum(p.norm(2).item()**2 for p in model.parameters()) ** 0.5

            effective_step = (epoch * len(dataloader) + step) // accumulation_steps

            captures.append({
                'step': effective_step,
                'epoch': epoch,
                'learningRate': optimizer.param_groups[0]['lr'],
                'loss': loss.item() * accumulation_steps,  # Reconstruct full loss
                'gradientNorm': grad_norm,
                'updateNorm': 0.0,
                'parameterNorm': param_norm,
            })

            optimizer.step()
            optimizer.zero_grad()

# Only rank 0 saves
if dist.get_rank() == 0:
    with open('distributed_training.json', 'w') as f:
        json.dump(captures, f)
```

### Key Points

- Capture AFTER all-reduce, not before
- Use effective step count (accounting for accumulation)
- Save from rank 0 only to avoid duplicates
- Reconstruct full loss if averaged for accumulation

---

## Case Study 4: Mixed Precision Training

### Setup

```python
# capture_amp.py
import torch
from torch.cuda.amp import autocast, GradScaler
import json

scaler = GradScaler()
captures = []

for epoch in range(num_epochs):
    for step, (inputs, targets) in enumerate(dataloader):
        optimizer.zero_grad()

        with autocast():
            outputs = model(inputs)
            loss = criterion(outputs, targets)

        # Scale loss and backward
        scaler.scale(loss).backward()

        # Unscale to get true gradient norms
        scaler.unscale_(optimizer)

        # Capture AFTER unscale, BEFORE step
        grad_norm = sum(p.grad.norm(2).item()**2 for p in model.parameters()
                        if p.grad is not None) ** 0.5
        param_norm = sum(p.norm(2).item()**2 for p in model.parameters()) ** 0.5

        # Check for inf/nan (scaler might skip step)
        if not torch.isfinite(torch.tensor(grad_norm)):
            grad_norm = 0.0  # Mark as invalid

        captures.append({
            'step': epoch * len(dataloader) + step,
            'epoch': epoch,
            'learningRate': optimizer.param_groups[0]['lr'],
            'loss': loss.item(),
            'gradientNorm': grad_norm,
            'updateNorm': 0.0,
            'parameterNorm': param_norm,
            'metadata': {'scale': scaler.get_scale()},  # Track scaler state
        })

        scaler.step(optimizer)
        scaler.update()

with open('amp_training.json', 'w') as f:
    json.dump(captures, f)
```

### Key Points

- Call `scaler.unscale_()` BEFORE capturing gradients
- Handle inf/nan gradients (scaler may skip steps)
- Optionally track scaler state in metadata

---

## Case Study 5: Reinforcement Learning (PPO)

### Setup

```python
# capture_ppo.py
import json

captures = []

for iteration in range(num_iterations):
    # Collect rollouts
    rollouts = collect_rollouts(env, policy, num_steps)

    # Multiple epochs over rollout data
    for epoch in range(ppo_epochs):
        for batch in rollout_batches(rollouts, batch_size):
            # PPO update
            loss, grads = compute_ppo_loss_and_grads(policy, batch)

            grad_norm = compute_grad_norm(grads)
            param_norm = compute_param_norm(policy.parameters())

            captures.append({
                'step': iteration * ppo_epochs * num_batches + epoch * num_batches + batch_idx,
                'epoch': iteration,  # Treat iteration as epoch
                'learningRate': optimizer.param_groups[0]['lr'],
                'loss': float(loss),
                'gradientNorm': grad_norm,
                'updateNorm': 0.0,
                'parameterNorm': param_norm,
                'metadata': {
                    'policy_loss': float(policy_loss),
                    'value_loss': float(value_loss),
                    'entropy': float(entropy),
                },
            })

            optimizer.step()

with open('ppo_training.json', 'w') as f:
    json.dump(captures, f)
```

### Key Points

- RL has multiple loss components; track total loss as primary
- Use `metadata` for additional metrics (policy loss, value loss, entropy)
- Define "epoch" consistently (e.g., iteration = epoch)

---

## Case Study 6: Fine-tuning with LoRA

### Setup

```python
# capture_lora.py
import torch
from peft import get_peft_model, LoraConfig
import json

# Apply LoRA
lora_config = LoraConfig(r=8, lora_alpha=32, target_modules=['q_proj', 'v_proj'])
model = get_peft_model(base_model, lora_config)

captures = []

for epoch in range(num_epochs):
    for step, batch in enumerate(dataloader):
        optimizer.zero_grad()
        outputs = model(**batch)
        loss = outputs.loss
        loss.backward()

        # Only count LoRA parameters
        grad_norm = 0.0
        param_norm = 0.0
        for name, param in model.named_parameters():
            if param.requires_grad:
                if param.grad is not None:
                    grad_norm += param.grad.norm(2).item() ** 2
                param_norm += param.norm(2).item() ** 2

        grad_norm = grad_norm ** 0.5
        param_norm = param_norm ** 0.5

        captures.append({
            'step': epoch * len(dataloader) + step,
            'epoch': epoch,
            'learningRate': optimizer.param_groups[0]['lr'],
            'loss': loss.item(),
            'gradientNorm': grad_norm,
            'updateNorm': 0.0,
            'parameterNorm': param_norm,
            'metadata': {
                'trainable_params': sum(p.numel() for p in model.parameters() if p.requires_grad),
            },
        })

        optimizer.step()

with open('lora_training.json', 'w') as f:
    json.dump(captures, f)
```

### Key Points

- Only count trainable (LoRA) parameters for norms
- Filter by `requires_grad` to exclude frozen base model
- Track trainable param count in metadata

---

## CI Integration Example

### GitHub Actions Workflow

```yaml
# .github/workflows/training-test.yml
name: Training Regression Test

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'

    - name: Setup Node
      uses: actions/setup-node@v4
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        npm install vectorcaliper

    - name: Run training
      run: |
        python train.py --steps 100 --seed 42 > training.json

    - name: Validate artifact
      run: |
        npx vectorcaliper validate training.json

    - name: Compare to golden
      run: |
        npx vectorcaliper diff golden/training_100steps.json training.json
```

### Key Points

- Use fixed seed for reproducibility
- Keep golden artifacts in `golden/` directory
- Run limited steps for CI speed
- Validate before diff to catch format errors

---

## Summary

These case studies demonstrate:

1. **VectorCaliper is framework-agnostic** — it accepts JSON from any source
2. **You compute the norms** — VectorCaliper only visualizes them
3. **Capture consistently** — always at the same point in your loop
4. **Use metadata for extras** — but don't expect VectorCaliper to interpret them
5. **CI integration is straightforward** — deterministic artifacts enable diffing

Remember: VectorCaliper shows you the data. You interpret it.
