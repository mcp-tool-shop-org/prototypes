# What VectorCaliper Is Not

VectorCaliper is a scientific instrument for model-state representation. To preserve that identity, it explicitly rejects several adjacent use cases.

## Not an Embedding Visualizer

VectorCaliper does not visualize raw embeddings, activations, or weight matrices. It visualizes **derived state metrics** (dimensionality, entropy, calibration) that have semantic meaning independent of the embedding space.

If you want to see "where points cluster," use UMAP directly. VectorCaliper shows *what the clustering means*.

## Not a Dimensionality-Reduction Playground

The projection engine exists to place states in 2D, not to explore projection methods. PCA is the default because it's deterministic and interpretable. UMAP/t-SNE are explicitly deprioritized because:

- They introduce stochasticity
- They encourage over-reading spatial proximity
- They obscure the semantic mapping

Projection in VectorCaliper is a *transport mechanism*, not an analysis tool.

## Not an Animation Engine

VectorCaliper supports trajectories and time scrubbing, but it is not for making videos or GIFs. Animations encourage:

- Aesthetic interpolation (which can violate invariants)
- Autoplay (which hides the ability to inspect)
- Easing functions (which distort temporal meaning)

Time in VectorCaliper is a *variable*, not a playback rate.

## Not a Model-Comparison Dashboard

VectorCaliper visualizes a single model's state (or trajectory). It does not:

- Compare Model A vs Model B side-by-side
- Aggregate across runs
- Show "best" or "worst" configurations

Comparison requires decisions about alignment, normalization, and selection that are outside the instrument's scope. Use VectorCaliper to *measure* each model, then compare measurements elsewhere.

## Not a Storytelling Tool

VectorCaliper does not:

- Generate captions
- Suggest narratives
- Highlight "interesting" regions
- Animate to guide attention

These features privilege interpretation over measurement. A microscope doesn't tell you what to look at.

---

## Why These Constraints Matter

Every feature VectorCaliper *could* add creates a decision point where meaning can drift. By refusing these use cases:

1. **The mapping table stays canonical** — no "depends on context"
2. **Outputs remain reproducible** — no "looked different yesterday"
3. **Trust is auditable** — no "the tool decided this was important"

VectorCaliper's job is to show you *exactly what the state is*, not to help you feel something about it.

---

## If You Need These Features

| If you want... | Use instead |
|----------------|-------------|
| Embedding exploration | UMAP, t-SNE, PaCMAP |
| Animated explanations | Manim, D3.js |
| Model comparison | Weights & Biases, MLflow |
| Storytelling | Observable, Jupyter |

VectorCaliper can *export to* these tools. It should not *become* them.
