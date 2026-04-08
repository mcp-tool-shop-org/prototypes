---
title: MCP Tools
description: The 7 tools and the three-step workflow.
sidebar:
  order: 2
---

NullOut exposes 7 MCP tools — 6 read-only and 1 destructive.

## Tool reference

| Tool | Type | Purpose |
|------|------|---------|
| `list_allowed_roots` | read-only | Show configured scan roots |
| `scan_reserved_names` | read-only | Find hazardous entries in a root |
| `get_finding` | read-only | Get full details for a finding |
| `plan_cleanup` | read-only | Generate deletion plan with confirmation tokens |
| `delete_entry` | destructive | Delete a file or empty directory (requires token) |
| `who_is_using` | read-only | Identify processes locking a file (Restart Manager) |
| `get_server_info` | read-only | Server metadata, policies, and capabilities |

## Typical workflow

### Step 1: List roots

```json
list_allowed_roots({})
```

Returns the directories NullOut is configured to scan with their root IDs. If a directory isn't listed, it's off-limits.

### Step 2: Scan

```json
scan_reserved_names({
  "rootId": "root_0",
  "recursive": true,
  "includeDirs": true
})
```

Pass a `rootId` returned from step 1 (not a raw path). Optional `maxDepth` (default 50) limits recursion. Returns a list of findings -- files with reserved device names, trailing dots/spaces, or overlong paths. Each finding gets a unique finding ID.

### Step 3: Inspect

```json
get_finding({ "findingId": "fnd_..." })
```

Returns full details: filename, path, hazard codes, file identity (volume serial + file ID), and evidence.

### Step 4: Plan

```json
plan_cleanup({
  "findingIds": ["fnd_...", "fnd_..."],
  "requestedActions": ["DELETE"]
})
```

Generates an HMAC-signed confirmation token for each finding. Tokens expire after 5 minutes (300 seconds) and are bound to the file's volume serial number and file ID -- if the file changes between plan and delete, the token is rejected.

### Step 5: Delete

```json
delete_entry({
  "findingId": "fnd_...",
  "confirmToken": "..."
})
```

Re-verifies the file identity against the token, then removes it via the `\\?\` extended path namespace. Refuses to delete non-empty directories. If the file is locked, returns `E_IN_USE` with a suggestion to call `who_is_using`.

## Process attribution

```json
who_is_using({ "findingId": "fnd_..." })
```

Takes a finding ID (not a raw path) and uses the Windows Restart Manager to identify which processes have a lock on the file. Performs the same safety checks as `delete_entry` (root confinement, reparse policy, identity verification) before querying. This is read-only -- NullOut never kills processes.

For files with trailing dots or spaces, Restart Manager may not find all lockers due to Win32 path normalization. NullOut automatically attempts a normalized-path fallback query in these cases.

## Server info

```json
get_server_info({})
```

Returns server metadata including version, platform, Python version, active policies (reparse policy, delete policy, token TTL, strategy), and capabilities (whether Restart Manager is available).
