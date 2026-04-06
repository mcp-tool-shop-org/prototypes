<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" />
</p>

# @receipt-factory/core

Receipt schema, canonicalization, and content-addressed hashing.

Part of [receipt-factory](https://github.com/mcp-tool-shop-org/receipt-factory).

## Install

```bash
npm install @receipt-factory/core
```

## Usage

```ts
import { ReceiptBuilder, computeIntegrity, verifyIntegrity } from "@receipt-factory/core";

const receipt = new ReceiptBuilder()
  .kind("ci_run")
  .subject({ name: "my-app", url: "https://github.com/org/my-app" })
  .output("pass", "All 42 tests passed")
  .evidence({ type: "ci_log", url: "https://...", description: "Build log" })
  .build();

// Content-addressed hashing
const integrity = computeIntegrity(receipt);
const valid = verifyIntegrity(receipt);
```

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `ReceiptBuilder` | class | Fluent builder for creating receipts |
| `canonicalize` | function | Deterministic JSON canonicalization |
| `computeDigest` | function | SHA-256 hash of canonical receipt |
| `computeIntegrity` | function | Compute full integrity object |
| `verifyIntegrity` | function | Verify receipt hash integrity |
| `RfError` | class | Structured error (code/message/hint/cause) |
| `receiptSchema` | Zod | Full receipt validation schema |

## License

MIT
