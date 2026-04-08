<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/tinytrainer/readme.png" width="400" alt="TinyTrainer" />
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/tinytrainer/actions"><img src="https://github.com/mcp-tool-shop-org/tinytrainer/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://mcp-tool-shop-org.github.io/tinytrainer/"><img src="https://img.shields.io/badge/docs-landing%20page-blue" alt="Landing Page" /></a>
</p>

Desktop training foundry + mobile personalization export pipeline.

## What this is

Train tiny classifier heads on frozen sentence embeddings, then export to Core ML (with updatable layers) and ONNX for mobile deployment. The phone personalizes; the desktop trains.

## What this is NOT

- PyTorch on an iPhone
- A general-purpose deep learning trainer
- "Fine-tune any LLM on your phone"

## Install

```bash
pip install tinytrainer

# For Core ML export (macOS)
pip install tinytrainer[coreml]
```

## Quick start

```bash
# Train a classifier from an edgepacks pack
tinytrainer train --pack error-triage --output ./model/

# Or from your own labeled data
tinytrainer train --data my_labels.jsonl --output ./model/

# Evaluate against pack protocol
tinytrainer eval ./model/ --pack error-triage

# Export to mobile formats
tinytrainer export ./model/ --format onnx --output ./export/
tinytrainer export ./model/ --format coreml --output ./export/

# Package everything into a training kit
tinytrainer kit ./model/ --output my_classifier.kit.zip
```

## How it works

1. **Backbone** (frozen): `all-MiniLM-L6-v2` sentence embeddings (384-dim)
2. **Head** (trainable): Linear or MLP classifier on top
3. **Export**: Head-only to ONNX/Core ML — tiny (~5KB-50KB)
4. **Mobile**: Core ML updatable layers enable on-device personalization

## Training kit

A `.kit.zip` bundle contains everything needed for deployment:
- Model (ONNX and/or Core ML)
- Label map
- Tokenizer reference
- On-device personalization recipe
- Training metadata and eval scores

## Consumes edgepacks

TinyTrainer reads [edgepacks](https://github.com/mcp-tool-shop-org/edgepacks) task packs directly. Any edgepacks classification pack works as training data.

## Security

TinyTrainer runs locally. It touches training data (text + labels), model files, and configuration JSON — all written to the user-specified `--output` directory. The backbone model is downloaded from Hugging Face Hub on first use. No other network egress. No telemetry. No secrets handling. See [SECURITY.md](SECURITY.md) for the full policy.

## License

MIT

Built by [MCP Tool Shop](https://mcp-tool-shop.github.io/)
