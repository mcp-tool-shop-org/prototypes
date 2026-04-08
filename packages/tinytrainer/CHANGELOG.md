# Changelog

## 1.0.0 — 2026-03-28

### Added
- Schema: TrainConfig, KitManifest, Recipe, TrainResult, EvalResult
- Backbone: SentenceEmbedder (frozen sentence-transformers wrapper, all-MiniLM-L6-v2)
- Models: ClassifierHead (Linear + MLP variants)
- Training: train_model() with early stopping, metrics tracking, Adam/SGD
- Export: ONNX (head-only), Core ML (updatable layers), .kit.zip packaging
- Eval: Run edgepacks pack eval protocol with per-class metrics
- CLI: train, eval, export, kit, info, list-models
- Structured error handling (TinyTrainerError with code/message/hint)
- SECURITY.md with threat model
- verify.sh one-command verification
