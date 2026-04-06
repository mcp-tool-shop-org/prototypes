---
title: FAQ
description: Honest answers to every question and worry a beginner might have.
sidebar:
  order: 4
---

## Before you start

### Will I spend real money?

**No.** XRPL Camp runs entirely on the XRP Ledger Testnet. Testnet XRP has no monetary value — it is play money that the faucet dispenses for free. You will not connect a real wallet, enter payment info, or risk any funds.

### Do I need to own cryptocurrency?

**No.** You do not need to own, buy, or even know anything about cryptocurrency. The training creates a temporary Testnet wallet for you and funds it automatically.

### Do I need Python installed?

**No.** The npm wrapper downloads a self-contained binary. You need Node.js 18+ (for `npx`) and an internet connection for the first run. That is the entire prerequisite list.

### Is this safe to run on my computer?

Yes. The binary is:

- Downloaded from a [known GitHub repository](https://github.com/mcp-tool-shop-org/xrpl-camp/releases)
- Verified against a SHA256 checksum before it runs — if the file has been tampered with, the launcher refuses to execute it
- Cached locally at `~/.cache/mcptoolshop/xrpl-camp/` so you can inspect it
- Open source — you can read every line of the [launcher code](https://github.com/mcp-tool-shop-org/npm-xrpl-camp/blob/main/bin/xrpl-camp.js) (it is 15 lines)

No telemetry, no analytics, no phone-home behavior.

### How long does it take?

About **10 minutes** for all four modules. The first run adds 1–2 minutes for the binary download (~20 MB). Subsequent runs start instantly from cache.

### Can I pause and come back later?

The training is designed for a single sitting, but you can check your progress with `npx @mcptoolshop/xrpl-camp status` to see what you have already completed.

---

## During training

### What is a "faucet" and why is it giving me free money?

The Testnet faucet is a service run by the XRPL community that gives test XRP to anyone who asks. It exists specifically so people can learn and build without risk. The test XRP it dispenses has zero real-world value.

### My wallet has a "reserve" — did I lose some XRP?

No. The XRPL requires every wallet to hold a small base reserve (1 XRP, reduced from 10 in late 2024) to prevent spam. Think of it as a refundable deposit — your wallet exists on the ledger, and the reserve proves you are serious. Each object you own on the ledger (trust lines, offers) costs an additional 0.2 XRP owner reserve. During training, this all comes from free faucet funds, so you lose nothing.

### The transaction says "tesSUCCESS" — what does that mean?

`tesSUCCESS` is the XRPL's way of saying "this transaction was applied to the ledger successfully." You will see it paired with `"validated": true`, which means the network has permanently agreed on the result. It is final — no one can reverse it.

### What if I make a mistake during training?

You cannot break anything. The Testnet is a sandbox. If your transaction fails, the training will explain why and let you try again. If something goes really wrong, run `self-check`:

```bash
npx @mcptoolshop/xrpl-camp self-check
```

---

## After training

### Is my certificate "real"?

Your certificate references real transactions on the XRPL Testnet. Anyone can look up the transaction hashes on a Testnet explorer and verify that you actually performed the operations. It is proof of practice, not an academic credential.

### Does the Testnet reset?

Yes — the XRPL Testnet resets periodically (roughly every few months). When it resets, your training transactions and wallet are wiped. Your certificate file still proves you did the work, but the on-ledger verification will eventually expire. This is normal for testnets.

### Can I use these skills on the real XRP Ledger?

Absolutely. Everything you learned — creating wallets, sending payments, verifying transactions — works identically on the Mainnet. The only differences are that real XRP costs real money, and you should guard your secret key carefully. XRPL Camp builds the muscle memory so the real thing feels familiar.

### I liked this. What should I learn next?

See [After Camp](/npm-xrpl-camp/handbook/after-camp/) for concrete next steps — developer resources, community links, and project ideas.

---

## Troubleshooting

### The download failed or is very slow

The binary is hosted on GitHub Releases. If your network blocks GitHub or you are behind a strict firewall, try from a different network. You can also verify the cache path:

```bash
npx @mcptoolshop/xrpl-camp --print-cache-path
```

### "Checksum mismatch" error

This means the downloaded file does not match the expected SHA256 hash. This is the launcher protecting you — it will not run a binary it cannot verify. Try clearing the cache and downloading again:

```bash
npx @mcptoolshop/xrpl-camp --clear-cache
npx @mcptoolshop/xrpl-camp start
```

If the error persists, [open an issue](https://github.com/mcp-tool-shop-org/npm-xrpl-camp/issues).

### Something else went wrong

Generate a support bundle and include it in your bug report:

```bash
npx @mcptoolshop/xrpl-camp support-bundle
```

This creates a zip file with diagnostic information (no secrets or personal data).
