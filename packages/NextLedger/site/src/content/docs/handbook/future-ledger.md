---
title: Future Ledger Roadmap
description: NextLedger's evolution toward an authoritative system of financial truth.
sidebar:
  order: 4
---

NextLedger is evolving toward a **future ledger** — an authoritative system of financial truth with explicit human agency at every boundary.

## Architecture layers

| Layer | Status | Description |
|-------|--------|-------------|
| Observation | Complete | Local balances, transactions, accounts, XRPL address tracking |
| Interpretation | Complete | Envelope budgeting, spending analysis, XRPL balance change explanation |
| Intent Declaration | Planned | Budget goals, allocation rules |
| Constraint Enforcement | Planned | Budget limits, overspend protection |
| User-Approved Execution | Future | Web3 execution with explicit human approval |

## Current state

The Observation and Interpretation layers are fully implemented. NextLedger tracks all local account activity and provides envelope-based budgeting with spending analysis. XRPL external ledger accounts can be tracked as read-only observations.

## XRPL observation (shipped)

NextLedger can track XRP Ledger addresses as external accounts. This is strictly non-custodial and read-only — NextLedger observes on-chain state but never holds private keys or executes transactions.

What works today:

- **Track an XRPL address** — add any public r-address (mainnet or testnet) as an external account
- **Balance sync** — fetch the current XRP balance from the ledger, including reserve calculations
- **Transaction history** — view recent on-chain transactions for the tracked address
- **Balance change explanation** — understand what changed between syncs
- **Reconciliation** — compare NextLedger's cached balance against the on-chain truth

External XRPL accounts are off-budget by default and appear in net worth calculations but do not participate in envelope allocation.

## What is next

**Intent Declaration** will let you define budget goals and allocation rules that express your financial intentions explicitly.

**Constraint Enforcement** will add hard limits — envelope caps, overspend alerts, and automated guardrails that prevent budget violations.

**User-Approved Execution** is a long-term vision for non-custodial Web3 integration where every financial action requires explicit human approval. The key constraint: NextLedger will never move money without a deliberate user action.

## Design principles

- Every layer builds on the one below it
- Human agency is explicit at every boundary
- No action is taken without user approval
- The ledger is the authoritative source of financial truth
- External accounts are observation-only — NextLedger never holds keys
