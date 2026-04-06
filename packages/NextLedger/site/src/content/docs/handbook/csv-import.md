---
title: CSV Import & Reconciliation
description: Import bank statements and reconcile transactions in NextLedger.
sidebar:
  order: 3
---

NextLedger can import transactions from CSV files exported by your bank.

## Importing CSV

1. Export a CSV from your bank's website
2. Open the **Import** page in NextLedger
3. Select the target account and load your CSV file
4. NextLedger previews all rows before anything is committed

### Automatic column detection

NextLedger reads your CSV headers and automatically maps columns. It recognizes common header names:

- **Date**: "Date", "Transaction Date", "Posted Date"
- **Payee**: "Payee", "Description", "Name", "Merchant"
- **Amount**: "Amount" (single column) or split into "Deposit"/"Credit" and "Withdrawal"/"Debit"
- **Memo**: "Memo", "Notes", "Details" (optional)

If your CSV has no header row, NextLedger falls back to positional mapping: columns 1 = Date, 2 = Payee, 3 = Amount.

### Duplicate detection

Each imported row is fingerprinted using a SHA256 hash of the account, date, amount, payee, and memo. If a row matches an existing transaction, it is flagged as a duplicate in the preview. Only new rows are imported when you commit.

### Preview before commit

The import preview shows each row with its status:

- **New** — will be imported
- **Duplicate** — matches an existing transaction, skipped by default
- **Invalid** — could not parse the date or amount, skipped with an error message

Review the preview carefully before committing. Once committed, transactions appear in your account like any manually entered transaction.

## Reconciliation

Reconciliation ensures your NextLedger records match your bank statements.

1. Open the **Reconciliation** page and select an account
2. Enter the ending statement balance from your bank
3. Mark individual transactions as cleared as you verify them against the statement
4. NextLedger compares cleared transactions against the statement balance
5. When the cleared balance matches the statement balance, mark the account as reconciled

Reconciled transactions are locked and cannot be edited or deleted. This protects the integrity of your verified records.

## Transaction states

Every transaction moves through a lifecycle:

- **Uncleared** — entered but not yet verified against a bank statement
- **Cleared** — verified against a bank statement during reconciliation
- **Reconciled** — locked after the account reconciliation is finalized

## Multiple accounts

Track checking, savings, credit cards, cash, lines of credit, and investment accounts in one place. Each account maintains its own balance, split into cleared and uncleared amounts. Transfers between accounts are tracked as linked transaction pairs.

Accounts can be set as on-budget or off-budget. Off-budget accounts (like investment accounts) are tracked for net worth but do not participate in envelope allocation.
