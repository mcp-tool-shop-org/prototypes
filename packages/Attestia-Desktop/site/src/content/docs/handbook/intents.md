---
title: Intent Lifecycle
description: Declare, approve, execute, and verify financial intents.
sidebar:
  order: 2
---

Attestia flips the traditional blockchain audit model: verify intent **before** it hits the chain, not after.

## The lifecycle

1. **Declare** — create a typed financial intent with structured parameters (status: `Declared`)
2. **Approve** — authorize the intent (status: `Approved`) or **Reject** it (status: `Rejected`)
3. **Execute** — record the on-chain transaction hash and chain ID (status: `Executing` then `Executed`)
4. **Verify** — confirm the chain result matches the declared intent (status: `Verified` or `Failed`)

All seven statuses: `Declared`, `Approved`, `Rejected`, `Executing`, `Executed`, `Verified`, `Failed`.

## Code example

```csharp
using Attestia.Client;

var client = new AttestiaClient(http);

// Declare — Id, Kind, Description, and Params are all required
var intent = await client.Intents.DeclareAsync(new DeclareIntentRequest
{
    Id = Guid.NewGuid().ToString(),
    Kind = "transfer",
    Description = "Send 1,000 USDC to treasury",
    Params = new() { ["amount"] = "1000", ["currency"] = "USDC" },
});

// Approve (with optional reason)
await client.Intents.ApproveAsync(intent.Id);

// Or reject with a required reason
// await client.Intents.RejectAsync(intent.Id, reason: "Insufficient documentation");

// Execute on-chain
await client.Intents.ExecuteAsync(intent.Id, chainId: "eip155:1", txHash: "0xabc...");

// Verify — matched: true if chain result matches intent
await client.Intents.VerifyAsync(intent.Id, matched: true);
```

## Listing and filtering intents

```csharp
// List all intents (paginated, cursor-based)
var page = await client.Intents.ListAsync(limit: 20);

// Filter by status
var declared = await client.Intents.ListAsync(status: "declared");

// Fetch a single intent by ID
var single = await client.Intents.GetAsync("intent-id-here");
```

## Validation

The `Intent` model enforces field-level constraints: `Id` max 128 chars, `Kind` max 64 chars, `Description` max 2000 chars, `DeclaredBy` max 256 chars, and a maximum of 50 parameters. Call `intent.Validate()` to get a list of validation errors.

## Event sourcing

Every state change is an immutable, hash-chained domain event with full causation tracking. Events include metadata such as `eventId`, `timestamp`, `actor`, `causationId`, `correlationId`, and `source` (Vault, Treasury, Registrum, or Observer). The event stream provides a tamper-evident audit trail of every action taken on every intent.
