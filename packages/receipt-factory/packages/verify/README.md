<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" />
</p>

# @receipt-factory/verify

Receipt verification — schema validation, hash checking, link verification, and policy enforcement.

Part of [receipt-factory](https://github.com/mcp-tool-shop-org/receipt-factory).

## Install

```bash
npm install @receipt-factory/verify
```

## Usage

```ts
import { verifyReceipt, verifyAndFormat } from "@receipt-factory/verify";

// Quick verify
const result = await verifyReceipt(receipt, { strict: true });
console.log(result.pass); // true | false

// Verify with formatted output
const formatted = await verifyAndFormat(receipt, { strict: true, policy });
console.log(formatted); // human-readable verification report
```

## Checks

| Check | Description |
|-------|-------------|
| `checkSchema` | Validate receipt against Zod schema |
| `checkHash` | Verify SHA-256 content-addressed hash |
| `checkLinks` | HEAD-request all evidence URLs |
| `checkLint` | Enforce policy lint rules |
| `checkReferences` | Validate receipt-to-receipt references |
| `checkPolicyIntegrity` | Verify policy file hash |

## License

MIT
