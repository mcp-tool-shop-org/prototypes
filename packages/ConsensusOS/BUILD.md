# Reproducible Build Instructions

## Prerequisites

- Node.js ≥ 18 (recommended: latest LTS)
- npm (ships with Node.js)
- Git

## Steps

```bash
# 1. Clone at the exact tagged commit
git clone --branch v1.0.0 https://github.com/mcp-tool-shop-org/ConsensusOS.git
cd ConsensusOS

# 2. Install dependencies (locked)
npm ci

# 3. Build
npx tsc --noEmit

# 4. Run all tests
npx vitest run

# Expected output: "295 passed (295)" or higher
```

## Verification

```bash
# Verify the tag
git verify-tag v1.0.0 2>/dev/null || echo "Tag is annotated (not GPG-signed)"

# Verify package version matches tag
node -e "const p = require('./package.json'); console.log('v' + p.version)"
# Expected: v1.0.0

# Verify zero production dependencies
node -e "const p = require('./package.json'); console.log(Object.keys(p.dependencies || {}).length)"
# Expected: 0

# Verify architecture tests pass
npx vitest run tests/architecture.test.ts
# Expected: 16 passed

# Verify security tests pass
npx vitest run tests/security-audit.test.ts
# Expected: 27 passed
```

## Checksum

After cloning and running `npm ci`, generate a checksum of the source:

```bash
# Source files checksum (excluding node_modules, dist)
find src tests -name "*.ts" -exec sha256sum {} + | sort | sha256sum
```

## CI Matrix

| Node.js | OS | Status |
|---------|-----|--------|
| 18.x | Ubuntu | Supported |
| 20.x | Ubuntu | Supported |
| 22.x | Ubuntu | Supported |
| 18.x | Windows | Supported |
| 18.x | macOS | Supported |
