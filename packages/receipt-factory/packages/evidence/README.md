<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/receipt-factory/readme.png" width="400" />
</p>

# @receipt-factory/evidence

Evidence packs — portable, content-addressed bundles for offline receipt assembly.

Part of [receipt-factory](https://github.com/mcp-tool-shop-org/receipt-factory).

## Install

```bash
npm install @receipt-factory/evidence
```

## Usage

```ts
import { writeEvidencePack, readEvidencePack } from "@receipt-factory/evidence";

// Write an evidence pack to disk
await writeEvidencePack("evidence/ci/run-123/", {
  kind: "ci_run",
  files: [{ name: "build.log", content: logBuffer }],
  metadata: { runId: "123" },
});

// Read it back for offline receipt assembly
const pack = await readEvidencePack("evidence/ci/run-123/");
```

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `writeEvidencePack` | function | Write evidence files + manifest to a directory |
| `readEvidencePack` | function | Read and validate an evidence pack |
| `PackManifest` | type | Evidence pack manifest shape |
| `PackFileEntry` | type | Individual file entry in a pack |

## License

MIT
