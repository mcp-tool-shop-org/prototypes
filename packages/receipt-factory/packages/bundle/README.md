<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" />
</p>

# @receipt-factory/bundle

Receipt bundles — portable, self-verifying truth capsules.

Part of [receipt-factory](https://github.com/mcp-tool-shop-org/receipt-factory).

## Install

```bash
npm install @receipt-factory/bundle
```

## Usage

```ts
import { createBundle, verifyBundle, inspectBundle } from "@receipt-factory/bundle";

// Create a bundle from a receipt (follows evidence + policy refs)
const result = await createBundle("receipt.json", {
  follow: true,
  policy: "policy.json",
});

// Verify bundle integrity (hashes, receipts, signatures)
const verification = await verifyBundle("bundle.zip");
console.log(verification.pass);

// Quick inspection
const manifest = await inspectBundle("bundle.zip");
```

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `createBundle` | function | Package receipts + evidence into a zip capsule |
| `verifyBundle` | function | Verify all hashes, receipts, and signatures in a bundle |
| `inspectBundle` | function | Read bundle manifest without full verification |

## License

MIT
