# Microsoft Store Listing Content

This document contains all text and metadata needed for Microsoft Store submission.

## App Identity

- **App Name:** Training Studio
- **Publisher Display Name:** MCP Tool Shop
- **Category:** Developer Tools > Development
- **Age Rating:** PEGI 3 / Everyone

## Short Description (1 sentence, max 100 chars)

Train TensorFlow.js models in-browser with zero-code execution security.

## Description (max 10,000 chars)

**Training Studio** is a secure, privacy-first machine learning tool that lets you train TensorFlow.js models directly in your browser with complete transparency and zero data collection.

### Key Features

🔒 **Security-First Design**
- All training happens locally in your browser - your data never leaves your device
- Zero code execution vulnerabilities - no eval(), no dynamic imports
- SHA-256 hash verification ensures model integrity
- Open-source and auditable codebase

📊 **Real-Time Training Visualization**
- Live loss and accuracy charts during training
- Per-epoch metrics tracking
- Memory and tensor monitoring
- Early stopping support

🎯 **Easy Model Configuration**
- Pre-built neural network presets (MLP, CNN, RNN)
- Adjustable hyperparameters (epochs, batch size, learning rate)
- Multiple optimizer options (Adam, SGD, RMSprop)
- Automatic train/validation split

📦 **Portable Bundle Format**
- Export complete training bundles as ZIP files
- Includes model topology, weights, metrics, and configuration
- JSON manifest with cryptographic hashes
- Compatible with TensorFlow.js inference

🖥️ **Desktop Performance**
- WebGPU acceleration when available
- Automatic fallback to WebGL
- Native Windows integration via MAUI
- Responsive, accessible interface

### Privacy Commitment

Training Studio collects **zero** user data. No telemetry, no analytics, no cloud services. Your datasets, models, and training runs remain completely private on your device.

### Open Source

Training Studio is fully open source under the MIT license. View the source code, report issues, or contribute at:
https://github.com/mcp-tool-shop-org/training-studio

## What's New (Release Notes)

### Version 1.0.0

- Initial Microsoft Store release
- TensorFlow.js 4.22 with WebGPU/WebGL support
- Bundle validation with SHA-256 verification
- Real-time training charts
- Export to ZIP bundle format
- Accessibility improvements for screen readers
- High contrast and reduced motion support

## Keywords (comma-separated, max 7)

machine learning, tensorflow, neural network, AI, training, validation, developer tools

## Support URL

https://github.com/mcp-tool-shop-org/training-studio/issues

## Privacy Policy URL

https://github.com/mcp-tool-shop-org/training-studio/blob/main/PRIVACY.md

## License

MIT License - https://github.com/mcp-tool-shop-org/training-studio/blob/main/LICENSE

## Screenshot Requirements

For Microsoft Store submission, provide the following screenshots:

1. **Dataset Tab** (1920x1080): Show CSV file loaded with data preview table
2. **Model Tab** (1920x1080): Show model configuration with hyperparameters
3. **Training Tab** (1920x1080): Show training in progress with charts
4. **Export Tab** (1920x1080): Show successful bundle export

## Icon Requirements

- 150x150 PNG for Store listing
- 50x50 PNG for small tile
- 300x300 PNG for large tile
- Transparent background recommended

## System Requirements

- **OS:** Windows 10 version 1809 (build 17763) or higher
- **Architecture:** x64, ARM64
- **Graphics:** WebGL 2.0 or WebGPU capable GPU recommended
- **Memory:** 4 GB RAM minimum, 8 GB recommended for large models

## Content Ratings

- No violence, gambling, or mature content
- Educational/developer tool category
- Suitable for all ages (PEGI 3 / Everyone)
