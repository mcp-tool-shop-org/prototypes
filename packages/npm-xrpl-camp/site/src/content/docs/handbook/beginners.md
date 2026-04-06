---
title: For Beginners
description: New to XRPL Camp? Start here for a gentle introduction.
sidebar:
  order: 99
---

## What is this tool?

XRPL Camp is a guided training program that teaches you the XRP Ledger (a blockchain payment network) in about 10 minutes. You run one command, and it walks you through creating a wallet, sending a payment, verifying a transaction, and earning a certificate — all on a test network, so no real money is involved.

The npm package is a wrapper that downloads and runs a prebuilt binary. You do not need Python, pip, or any blockchain tools installed.

## Who is this for?

- **Complete blockchain beginners** who want to understand what the XRP Ledger is through hands-on practice
- **Developers** who want to add XRPL integration to their apps and need a quick primer
- **Students** studying fintech, distributed systems, or cryptocurrency fundamentals
- **Anyone curious** about how blockchain payments actually work at a technical level

## Prerequisites

- **Node.js 18 or later** — check with `node --version`
- **npm** or **npx** — comes with Node.js
- **Internet connection** — needed for the initial binary download (~20 MB) and for Testnet transactions
- No blockchain knowledge required. No Python required. No API keys or accounts needed.

## Your first 5 minutes

### 1. Run the training

```bash
npx @mcptoolshop/xrpl-camp start
```

On first run, this downloads a platform-specific binary (~20 MB), verifies its SHA256 checksum, caches it locally, and launches the training. Subsequent runs start instantly.

### 2. Follow the guided modules

The training walks you through a series of modules:
- **Wallet** — create an XRPL Testnet wallet
- **Payment** — send your first XRP payment
- **Verification** — verify the transaction on the ledger
- **Certificate** — earn a completion certificate

Each module has clear instructions. Just follow the prompts.

### 3. Check your progress

```bash
npx @mcptoolshop/xrpl-camp status
```

This shows which modules you have completed and what comes next.

### 4. Verify your certificate

After completing all modules, your certificate can be independently verified. See the [Verification](/npm-xrpl-camp/handbook/verification/) page for details.

### 5. Explore what's next

Once you have finished the training, the [After Camp](/npm-xrpl-camp/handbook/after-camp/) page has suggestions for continuing your XRPL learning.

## Common mistakes

1. **Running without internet on first launch.** The first run downloads a binary from GitHub. After that, everything is cached locally and subsequent runs work offline (except for the Testnet transactions themselves).

2. **Worrying about real money.** All transactions happen on the XRPL Testnet, which uses free test XRP. No real cryptocurrency is involved. You cannot lose money.

3. **Trying to use Python directly.** The npm package handles everything. You do not need to install Python, set up virtual environments, or manage dependencies. If you specifically want the Python version, use `pipx install xrpl-camp` instead.

4. **Binary download failing behind a corporate proxy.** The binary is downloaded from GitHub Releases. If your network blocks GitHub, use `npx @mcptoolshop/xrpl-camp self-check` to diagnose the issue or `--clear-cache` to retry.

5. **Not knowing what XRPL is.** That is exactly what this tool teaches. Start with the [What Is the XRP Ledger?](/npm-xrpl-camp/handbook/what-is-xrpl/) page if you want background before jumping in, or just run `start` and learn by doing.

## Next steps

- [What Is the XRP Ledger?](/npm-xrpl-camp/handbook/what-is-xrpl/) — blockchain primer for complete beginners
- [Getting Started](/npm-xrpl-camp/handbook/getting-started/) — install details and first run
- [Training Modules](/npm-xrpl-camp/handbook/modules/) — what each module covers

## Glossary

- **XRP Ledger (XRPL)** — An open-source blockchain designed for fast, low-cost payments. XRP is its native currency.
- **Testnet** — A test version of the XRP Ledger used for development and learning. Test XRP has no real value.
- **Wallet** — A cryptographic key pair (public address + secret key) that holds XRP and signs transactions.
- **Transaction** — A signed instruction sent to the ledger (e.g., "send 10 XRP from wallet A to wallet B").
- **Binary wrapper** — The npm package downloads and runs a prebuilt executable so you do not need Python installed.
- **SHA256 checksum** — A hash used to verify the downloaded binary has not been tampered with.
- **npx** — A Node.js tool that downloads and runs npm packages without installing them globally.
