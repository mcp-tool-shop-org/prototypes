---
name: API Contract Change
about: Propose a change to the Engine ↔ MAUI API contract
labels: api-contract
---

## Proposed Change

Describe the change to the API contract.

## Affected Endpoints

- [ ] HTTP control plane (`/api/*`)
- [ ] WebSocket data plane (`/stream`)
- [ ] Message envelope format
- [ ] Audio format

## Does this require an API contract update?

- [ ] Yes — update `docs/api-contract.md` and bump contract version
- [ ] No — this is within existing contract scope

## Engine Impact

Does the engine need to change?
- [ ] Yes — create/link engine-side issue
- [ ] No — client-only change

## Backward Compatibility

- [ ] Existing clients continue to work without changes
- [ ] Existing clients need updates (breaking change)
