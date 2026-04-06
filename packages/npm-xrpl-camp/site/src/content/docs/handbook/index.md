---
title: Handbook
description: Everything you need to know about XRPL Camp.
sidebar:
  order: 0
---

Welcome to the XRPL Camp handbook. Whether you have never touched blockchain or you are a developer looking to add XRPL to your toolkit, this guide has you covered.

## What's inside

- **[What Is the XRP Ledger?](/npm-xrpl-camp/handbook/what-is-xrpl/)** -- A plain-language primer for complete beginners
- **[Getting Started](/npm-xrpl-camp/handbook/getting-started/)** -- Install with npx and run your first module
- **[Training Modules](/npm-xrpl-camp/handbook/modules/)** -- What you will learn in each module
- **[Verification](/npm-xrpl-camp/handbook/verification/)** -- Certificate verification and XRPL receipts
- **[FAQ](/npm-xrpl-camp/handbook/faq/)** -- Every question and worry you might have, answered honestly
- **[After Camp](/npm-xrpl-camp/handbook/after-camp/)** -- What to do next with your new skills
- **[For Beginners](/npm-xrpl-camp/handbook/beginners/)** -- New to XRPL Camp? Start here

## What is XRPL Camp?

XRPL Camp is a guided training program that teaches you the XRP Ledger in one sitting. You will create a wallet, send a payment, verify a transaction, and earn a certificate -- all on the XRPL Testnet, all in about 10 minutes.

The npm package is a binary wrapper powered by [@mcptoolshop/npm-launcher](https://github.com/mcp-tool-shop-org/npm-launcher). It downloads a prebuilt Python binary for your platform, verifies its SHA256 checksum, and launches the training. No Python installation required.

## Why a binary wrapper?

XRPL Camp is written in Python, but not everyone has Python installed. The npm wrapper removes that barrier entirely. One command, zero prerequisites:

```bash
npx @mcptoolshop/xrpl-camp start
```

The binary is cached locally after first download, so subsequent runs launch instantly.

[Back to landing page](/npm-xrpl-camp/)
