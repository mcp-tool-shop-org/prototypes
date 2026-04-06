<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" />
</p>

# @receipt-factory/sign

Receipt signing via cosign — keyless in CI, key-based for local development.

Part of [receipt-factory](https://github.com/mcp-tool-shop-org/receipt-factory).

## Install

```bash
npm install @receipt-factory/sign
```

## Usage

```ts
import { signReceipt, signBundle, verifySignature, isCosignAvailable } from "@receipt-factory/sign";

// Check cosign availability
const available = await isCosignAvailable();

// Sign a receipt (detached sidecar — original file untouched)
const result = await signReceipt("receipt.json", { keyless: true });

// Sign a bundle
await signBundle("bundle.zip", { keyless: true });

// Verify a signature
const valid = await verifySignature("receipt.json");
```

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `signReceipt` | function | Sign a receipt file with cosign |
| `signPolicy` | function | Sign a policy file with cosign |
| `signBundle` | function | Sign a bundle with cosign |
| `verifySignature` | function | Verify a cosign signature |
| `isCosignAvailable` | function | Check if cosign is installed |

## License

MIT
