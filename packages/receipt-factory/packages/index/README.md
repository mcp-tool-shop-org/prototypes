<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" />
</p>

# @receipt-factory/index

Receipt index — scan, index, and search receipt directories.

Part of [receipt-factory](https://github.com/mcp-tool-shop-org/receipt-factory).

## Install

```bash
npm install @receipt-factory/index
```

## Usage

```ts
import { buildIndex, searchIndex } from "@receipt-factory/index";

// Build an index from a receipts directory
const index = await buildIndex("receipts/", { recursive: true });

// Search by kind, subject, or date range
const results = searchIndex(index, {
  kind: "ci_run",
  subject: "my-app",
});
```

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `buildIndex` | function | Scan a directory and build a receipt index |
| `searchIndex` | function | Filter indexed receipts by kind/subject/date |
| `ReceiptIndex` | type | The full index structure |
| `SearchFilter` | type | Search filter options |

## License

MIT
