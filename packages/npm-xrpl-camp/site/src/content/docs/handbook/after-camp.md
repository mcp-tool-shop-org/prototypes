---
title: After Camp
description: What to do next with your XRPL knowledge — developer resources, project ideas, and community.
sidebar:
  order: 5
---

You finished XRPL Camp. You have created a wallet, sent a payment, verified a transaction, and earned a certificate. Now what?

This page collects concrete next steps depending on what interests you. Pick one, skip the rest — there is no required path.

## If you want to build something

### Learn the XRPL developer tools

The XRP Ledger has official SDKs in several languages:

- **JavaScript/TypeScript:** [xrpl.js](https://js.xrpl.org/) — the most popular XRPL library
- **Python:** [xrpl-py](https://xrpl-py.readthedocs.io/) — the language XRPL Camp is built with
- **Java:** [xrpl4j](https://github.com/XRPLF/xrpl4j)
- **C#:** available via community libraries

The official [XRPL.org developer documentation](https://xrpl.org/docs) is the definitive reference. The [XRPL Learning Portal](https://learn.xrpl.org/) has guided courses that pick up right where Camp leaves off.

### Project ideas for beginners

These are small, buildable projects that use the skills you just practiced:

| Project | What you will learn |
|---------|-------------------|
| **Balance watcher** | Poll an address every minute and print when the balance changes. Teaches you the `account_info` RPC call |
| **Payment bot** | Send a payment to a friend's Testnet wallet from a script. Teaches you signing and submitting programmatically |
| **Transaction feed** | Subscribe to a Testnet account and print every incoming transaction in real time. Teaches you WebSocket subscriptions |
| **Multi-sig wallet** | Create a wallet that requires two signatures to send. Teaches you XRPL's native multi-signing |

All of these run safely on the Testnet.

## If you want to understand the bigger picture

### What is XRPL used for in the real world?

The XRP Ledger powers real financial infrastructure:

- **Cross-border payments** — Ripple's On-Demand Liquidity uses XRP to settle international payments in seconds. Major institutions (SBI Holdings, Santander) process billions through the network
- **Tokenization** — Companies issue stablecoins (RLUSD, USDC), CBDCs, and asset-backed tokens on the XRPL. Tokenized value reached ~$395M by late 2025
- **Decentralized exchange (DEX)** — The XRPL has a built-in order book plus AMM pools where any two tokens can be traded directly, without a centralized exchange — and without the front-running problems that plague Ethereum DEXes
- **NFTs** — The XRPL supports native NFTs (XLS-20) with lower minting costs than Ethereum

### How XRPL compares to other chains

| | XRP Ledger | Bitcoin | Ethereum |
|--|-----------|---------|----------|
| **Settlement time** | 3–5 seconds | ~10 minutes | ~12 seconds |
| **Transaction cost** | ~$0.0005 | $1–50+ | $0.50–50+ |
| **Energy model** | Consensus (low energy) | Proof of Work (high energy) | Proof of Stake (moderate) |
| **Built for** | Payments + tokenization | Store of value | Smart contracts |
| **Smart contracts** | Hooks (emerging) | No | Yes (Solidity) |

No chain is "better" — they solve different problems. Knowing one makes learning others easier.

## If you want to connect with the community

- **[XRPL.org](https://xrpl.org/)** — Official docs, tutorials, and ecosystem directory
- **[XRPL Learning Portal](https://learn.xrpl.org/)** — Guided courses that build on what you learned in Camp
- **[XRPL Grants](https://xrplgrants.org/)** — Funding for open-source XRPL projects (grants up to $100K+)
- **[XRPL Commons](https://www.xrpl-commons.org/)** — Education programs, hackathons, and the Core Dev Bootcamp
- **[XRPL Job Board](https://jobs.xrpl.org/)** — Career opportunities in the XRPL ecosystem

## If you just want to move on

That is fine. You learned how a blockchain works by using one. You can read a public ledger, you understand wallets and keys, and you can tell fact from hype. That knowledge does not expire.

Your certificate is at whatever path XRPL Camp printed when you finished. Keep it if you want, or do not. The transactions on the Testnet are proof enough.
