---
title: Beginner's Guide
description: A complete walkthrough for first-time NextLedger users — from installation to your first reconciled month.
sidebar:
  order: 99
---

This guide walks you through everything you need to go from zero to a fully working budget in NextLedger.

## 1. Installation

NextLedger is a portable Windows app. No installer, no admin rights, no account creation.

1. Visit the [latest release page](https://github.com/mcp-tool-shop-org/NextLedger/releases/latest)
2. Download the ZIP file
3. Extract the ZIP to any folder (your Desktop, Documents, or a dedicated Apps folder)
4. Double-click `NextLedger.App.exe` to launch

**System requirements**: Windows 10 version 1809 or later, or Windows 11. No internet connection required after download.

**Where is your data?** NextLedger creates a local SQLite database at `%LOCALAPPDATA%\NextLedger\NextLedger.db`. To back up your finances, copy this single file somewhere safe. To move to a new computer, copy the file to the same location on the new machine.

## 2. Core concepts

NextLedger uses **envelope budgeting**, a method where every dollar of income is assigned a specific purpose before you spend it.

**Accounts** represent where your money lives — your checking account, savings account, credit card, cash in your wallet. NextLedger supports checking, savings, credit card, cash, line of credit, investment, and XRPL external accounts.

**Envelopes** represent what your money is for — Rent, Groceries, Gas, Fun Money, Emergency Fund. Each envelope holds a specific amount that you have allocated for that purpose.

**Transactions** record money moving. An inflow adds money (paycheck, refund). An outflow removes money (grocery purchase, bill payment). A transfer moves money between two of your own accounts.

**Ready-to-Assign** is unallocated income waiting for a job. When you receive income, it lands here. Your goal is to distribute it all to envelopes so Ready-to-Assign reaches zero.

**Budget periods** are monthly. Each month has its own allocation, spending totals, and carry-forward balance.

## 3. Setting up your accounts

When you first open NextLedger, you need to tell it where your money lives.

1. Create an account for each real-world financial account you want to track
2. Choose the correct account type (checking, savings, credit card, etc.)
3. Enter the current balance as the starting balance
4. Decide whether the account is "on-budget" — on-budget accounts participate in envelope allocation, while off-budget accounts (like investments) track net worth only

**Tip**: Start with just your main checking account and one credit card. You can always add more accounts later.

**On-budget vs off-budget**: Your everyday spending accounts (checking, credit card) should be on-budget. Long-term accounts you do not spend from regularly (investments, retirement) can be off-budget.

## 4. Creating your first envelopes

Envelopes are categories for your spending. Think about where your money goes each month.

**Essential envelopes to start with:**
- Rent or Mortgage
- Groceries
- Utilities (electric, water, internet)
- Transportation (gas, transit, car payment)
- Insurance

**Helpful additions:**
- Fun Money (dining out, entertainment)
- Clothing
- Savings or Emergency Fund
- Subscriptions

**Organizing with groups**: You can assign envelopes to groups like "Housing", "Food", or "Transportation" to keep your budget page tidy. Groups are optional but helpful once you have more than a handful of envelopes.

**Colors**: Each envelope can have a custom color for visual identification on the budget page.

**Savings goals**: If you are saving toward a specific amount (e.g., $1,000 emergency fund), set a goal on the envelope. NextLedger tracks your progress and can auto-assign money toward envelopes with active goals.

## 5. Logging transactions

Every time money enters or leaves your accounts, log it in NextLedger.

**Inflows** (money coming in):
- Open the Transactions page
- Create a new inflow for the account that received money
- Enter the date, amount, payee (e.g., "Employer - Paycheck"), and optionally a memo
- The money appears in Ready-to-Assign, waiting to be allocated to envelopes

**Outflows** (money going out):
- Create a new outflow for the account the money left
- Assign it to the envelope it should draw from (e.g., a grocery purchase goes to the "Groceries" envelope)
- The envelope balance decreases by that amount

**Transfers** (money moving between your own accounts):
- Create a transfer specifying the source and destination accounts
- NextLedger creates a linked pair of transactions automatically
- Transfers do not affect envelope balances — they just move money between accounts

**Split transactions**: If a single purchase spans multiple categories (e.g., a store receipt with groceries and household items), use a split transaction. Each split line assigns a portion of the total to a different envelope.

## 6. Importing bank statements

Instead of logging every transaction by hand, import them from your bank.

1. Log into your bank's website and export recent transactions as a CSV file
2. Open the **Import** page in NextLedger
3. Select the account the transactions belong to
4. Load the CSV file

NextLedger automatically detects common column names (Date, Description, Amount, Deposit, Withdrawal, Memo). If your bank uses unusual headers, the importer still attempts fuzzy matching.

**Preview before committing**: Every import shows a preview first. Each row is marked as:
- **New** — will be imported
- **Duplicate** — matches an existing transaction (detected via fingerprinting), skipped by default
- **Invalid** — could not parse date or amount, shown with an error message

Review the preview, then commit to import only the new rows. After import, you still need to assign each imported transaction to an envelope.

## 7. Reconciling with your bank

Reconciliation is the process of verifying that NextLedger's records match your bank's records. Do this at least once a month (e.g., when your bank statement arrives).

1. Open the **Reconciliation** page and select an account
2. Enter the ending balance from your bank statement
3. Go through each transaction and mark it as **cleared** if it appears on your statement
4. NextLedger shows the difference between your cleared balance and the statement balance
5. When the difference is zero, your records match — finalize the reconciliation

**What happens after reconciliation**: Reconciled transactions are locked. They cannot be edited or deleted. This protects the accuracy of your verified financial history.

**Why reconcile?** It catches mistakes — missed transactions, duplicate entries, or amounts that do not match. If you never reconcile, small errors accumulate and your budget drifts from reality.

**Tip**: If you import CSV files regularly and reconcile monthly, your NextLedger records will stay accurate with minimal manual effort. The import catches transactions you forgot to log, and reconciliation verifies everything matches your bank.
