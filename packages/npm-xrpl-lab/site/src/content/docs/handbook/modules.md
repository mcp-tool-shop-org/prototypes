---
title: Modules
description: All 12 XRPL Lab modules across Beginner, Intermediate, and Advanced tracks.
sidebar:
  order: 2
---

XRPL Lab ships 12 hands-on modules organized into three progressive tracks. Each module teaches one skill and produces one verifiable artifact.

## Beginner Track

The beginner track builds foundational ledger literacy. You will learn to read transaction receipts, understand why transactions fail, and work with trust lines.

| Module | What you learn |
|--------|---------------|
| **Receipt Literacy** | Read and interpret XRPL transaction receipts. Understand metadata fields, delivered amounts, and result codes. |
| **Failure Literacy** | Understand why transactions fail. Diagnose `tec`, `tef`, `tel`, and `tem` result codes. |
| **Trust Lines 101** | Create and manage trust lines. Understand limits, balances, and authorization. |
| **Debugging Trust Lines** | Diagnose trust line issues. Trace rippling, frozen lines, and authorization failures. |

## Intermediate Track

The intermediate track introduces the DEX, account reserves, and operational hygiene.

| Module | What you learn |
|--------|---------------|
| **DEX Literacy** | Navigate the decentralized exchange. Read the order book, place offers, and understand crossing. |
| **Reserves 101** | Understand account reserves. Calculate owner reserves, track reserve changes, and avoid underfunded errors. |
| **Account Hygiene** | Clean up and secure accounts. Remove stale trust lines, cancel expired offers, and review settings. |
| **Receipt Audit** | Batch verify transaction history. Audit multiple transactions against ledger state for integrity. |

## Advanced Track

The advanced track covers automated market makers, market making, and risk analysis.

| Module | What you learn |
|--------|---------------|
| **AMM Liquidity 101** | Automated market maker basics. Deposit, withdraw, and understand LP token mechanics. |
| **DEX Market Making 101** | Place and manage DEX offers. Understand spread, inventory, and order management. |
| **Inventory Guardrails** | Protect against inventory risk. Set limits, monitor exposure, and automate rebalancing. |
| **DEX vs AMM Risk Literacy** | Compare trading venue risks. Understand impermanent loss, slippage, and liquidity depth trade-offs. |

## Running modules

```bash
# List all modules with their track and status
npx @mcptoolshop/xrpl-lab list

# Run a specific module
npx @mcptoolshop/xrpl-lab run <module-name>

# Run in offline/dry-run mode (required for AMM modules)
npx @mcptoolshop/xrpl-lab run <module-name> --dry-run
```
