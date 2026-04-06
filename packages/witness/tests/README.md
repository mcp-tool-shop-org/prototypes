# Test Suite

124 tests verifying Witness correctness.

## What the tests guarantee

| Category | Files | What's tested |
|----------|-------|---------------|
| **Canonical JSON** | `test_canon.py` | Serialization matches golden fixtures exactly |
| **Cryptography** | `test_crypto.py` | Signing, verification, digest computation |
| **Storage** | `test_storage.py` | Append-only enforcement, queries, export |
| **Timeline** | `test_timeline.py` | All 4 flag types against golden fixtures |
| **Testimony** | `test_testify.py` | Report generation, exit codes |
| **Schema** | `test_testimony_schema.py` | JSON schema compliance, determinism, `--include-events` |
| **Spike** | `test_internal_stage_identity.py` | Bit-identity, public API surface snapshot |

## Key invariants

### Determinism
- `test_testimony_schema.py::TestDeterministicOutput` — same inputs + timestamp = same bytes

### Byte exactness
- `test_testimony_schema.py::TestIncludeEvents::test_raw_event_bytes_match_store` — decoded Base64 = SQLite bytes

### Public surface snapshot
- `test_internal_stage_identity.py::TestNoNewSurfaceArea::test_public_api_unchanged` — fails if exports change

### Golden fixture authority
- `test_timeline.py::TestGoldenFixtureFlags` — flags match `expected_flags.json`
- `test_crypto.py::TestGoldenFixtureVerification` — all fixtures verify

## Running tests

```bash
# All tests
pytest tests/ -v

# Specific category
pytest tests/test_crypto.py -v

# Quick smoke test
pytest tests/ -q
```

## Golden fixtures

Located in `tests/fixtures/golden/`. Do not hand-edit.

To regenerate (only if schema changes):
```bash
python tools/gen_golden.py
```
