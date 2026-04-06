---
title: Beginners
description: New to XRPL? Start here for a gentle introduction to blockchain literacy with XRPL Lab.
sidebar:
  order: 99
---

New to blockchain? This page covers everything you need to know before running your first XRPL Lab module. No prior blockchain experience required.

## What is XRPL?

The XRP Ledger (XRPL) is a decentralized, open-source blockchain designed for fast, low-cost payments and token management. Unlike proof-of-work blockchains, XRPL uses a consensus protocol that settles transactions in 3-5 seconds without mining. Key features include a built-in decentralized exchange (DEX), native support for issued currencies via trust lines, and an automated market maker (AMM) for liquidity pools.

XRPL Lab uses the XRPL **testnet** -- a free sandbox environment with test XRP. Nothing you do in XRPL Lab costs real money or affects the live network.

## What is XRPL Lab?

XRPL Lab is a hands-on training workbook that teaches blockchain literacy through verifiable artifacts. Rather than reading documentation and hoping you understood it, each module walks you through a real task and produces proof that you completed it correctly.

The workbook contains 12 modules across three tracks:

- **Beginner** -- Read transaction receipts, understand failures, work with trust lines
- **Intermediate** -- Navigate the DEX, understand reserves, audit transactions
- **Advanced** -- Automated market makers, market making, and risk analysis

Every module produces an artifact: a transaction ID, audit pack, or proof pack with SHA-256 integrity that proves you completed the work.

## Prerequisites

You need exactly one thing installed: **Node.js 18 or later**. That's it.

Check if you have it:

```bash
node --version
```

If you see `v18.x.x` or higher, you are ready. If not, install Node.js from [nodejs.org](https://nodejs.org/).

No Python, no wallets, no testnet faucet accounts -- XRPL Lab handles all of that for you.

## Installation

Run the workbook directly with npx (no global install needed):

```bash
npx @mcptoolshop/xrpl-lab start
```

On first run, this downloads a platform-specific binary (~25 MB), verifies its SHA256 checksum, and caches it locally. Subsequent runs start instantly from cache.

If you prefer not to touch the testnet while learning, use offline mode:

```bash
npx @mcptoolshop/xrpl-lab start --dry-run
```

This runs all modules with simulated transactions -- perfect for understanding the workflow first.

## Key Concepts

Before diving into modules, here are the core concepts you will encounter:

**Transactions** -- Every action on the XRPL (sending XRP, creating a trust line, placing an offer) is a transaction. Each transaction produces a receipt with a result code and metadata.

**Result codes** -- Transactions succeed (`tesSUCCESS`) or fail with specific codes like `tecUNFUNDED_PAYMENT` (insufficient balance) or `tecNO_LINE` (missing trust line). Learning to read these codes is the foundation of XRPL literacy.

**Trust lines** -- To hold any token other than XRP, an account must first create a trust line to the token issuer. Trust lines define what tokens you accept and your maximum exposure.

**Reserves** -- Every XRPL account must hold a minimum amount of XRP (the base reserve) plus additional XRP for each object it owns on the ledger (trust lines, offers, etc.). Understanding reserves prevents "insufficient balance" surprises.

**The DEX** -- The XRPL has a built-in decentralized exchange where anyone can place offers to trade any pair of tokens. No intermediary required.

**Artifacts** -- XRPL Lab's proof system. Every module produces a verifiable artifact (transaction ID, audit pack, or proof pack) that proves you completed the work correctly.

## Your First Module

Start with **Receipt Literacy** -- it teaches you to read and interpret XRPL transaction receipts:

```bash
npx @mcptoolshop/xrpl-lab run receipt-literacy
```

Or use the guided launcher which walks you through module selection:

```bash
npx @mcptoolshop/xrpl-lab start
```

After completing the module, verify your artifact:

```bash
npx @mcptoolshop/xrpl-lab audit
```

Check your overall progress at any time:

```bash
npx @mcptoolshop/xrpl-lab status
```

## FAQ

**Does this cost anything?**
No. XRPL Lab uses the testnet, which provides free test XRP. The npm package and binary are also free and open source.

**Do I need a wallet or account?**
No. XRPL Lab creates and manages testnet accounts for you automatically.

**Can I break anything?**
No. The testnet is a sandbox -- it resets periodically and has no connection to the live XRPL network. Nothing you do here affects real funds.

**What if a module fails or I get stuck?**
Run `npx @mcptoolshop/xrpl-lab doctor` to diagnose your environment. If you need to report a problem, run `npx @mcptoolshop/xrpl-lab feedback` to generate an issue-ready markdown report.

**What is dry-run mode?**
Dry-run mode simulates all transactions locally without connecting to the testnet. It is required for AMM modules (until testnet enables the AMM amendment) and useful for learning the workflow before working with real test transactions.

**Can I skip ahead to advanced modules?**
Yes, modules are self-contained. However, the Beginner track teaches foundational concepts (receipts, failures, trust lines) that the later tracks build on. Starting in order is recommended.

**Where are my artifacts stored?**
Artifacts are stored locally alongside the cached binary. Run `npx @mcptoolshop/xrpl-lab --print-cache-path` to see the exact location on your system.
