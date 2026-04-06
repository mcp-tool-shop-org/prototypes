<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" />
</p>

# @receipt-factory/policy

Policy packs — portable, versioned lint configuration for receipts.

Part of [receipt-factory](https://github.com/mcp-tool-shop-org/receipt-factory).

## Install

```bash
npm install @receipt-factory/policy
```

## Usage

```ts
import { loadPolicy, computePolicyHash, DEFAULT_POLICY } from "@receipt-factory/policy";

// Load a policy from disk
const policy = await loadPolicy("policy.json");

// Compute policy hash for integrity verification
const hash = computePolicyHash(policy);

// Use the built-in default policy
console.log(DEFAULT_POLICY.rules);
```

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `loadPolicy` | function | Load and validate a policy file |
| `computePolicyHash` | function | SHA-256 hash of canonical policy |
| `DEFAULT_POLICY` | object | Built-in default policy pack |
| `DEFAULT_RULES` | object | Default lint rules |
| `PolicyPack` | type | Policy pack shape |
| `PolicyRules` | type | Lint rules shape |

## License

MIT
