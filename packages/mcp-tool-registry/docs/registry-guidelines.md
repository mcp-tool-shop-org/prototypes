# Registry Contribution Guidelines

This document serves as the detailed manual for adding and maintaining tools in the registry.

## 1. Tool Entry Requirements

Every tool entry in `registry.json` must adhere to strict schema rules.

### Required Fields

- **id**: A unique, kebab-case identifier (e.g., `file-compass`).
  - Must match `^[a-z0-9]+(-[a-z0-9]+)*$` (enforced by policy).
  - **Permanence**: Once assigned, an ID should not change to avoid breaking downstream consumers.
- **name**: Human-readable display name.
- **description**: clear, concise summary of capabilities.
  - Recommended: Start with a verb or "A tool for..."
  - Minimum length: 10 characters.
- **repo**: HTTPS URL to the source repository.
- **install**: Instructions for the `mcpt` CLI.
  - `type`: Currently only `git`.
  - `url`: Clone URL (HTTPS).
  - `default_ref`: Stable branch (e.g., `main`) or tag.
- **tags**: Array of lowercase keywords for discovery.

### Recommended Fields

- **ecosystem**: If the tool belongs to a specific sub-ecosystem (e.g., `python`, `node`, `kubernetes`).
- **defaults**: Safe defaults for the tool (e.g., `safe_run: true`).

## 2. Tag Taxonomy

We encourage reusing existing tags to keep the ecosystem searchable.

- **Status**: `experimental`, `beta`, `stable`
- **Domain**: `filesystem`, `search`, `git`, `database`, `web`
- **Purpose**: `utility`, `agent`, `linting`, `testing`

**Creating new tags**:
If no existing tag fits, feel free to add a new one. Ensure it is:

1. Lowecase
2. Single word (or kebab-case)
3. Generally applicable (not too niche)

## 3. Maturity & Quality

- **Experimental**: New tools should be tagged `experimental` until they are proven stable.
- **Quality**: Tools must provide a valid `README.md` in their repo.
- **Security**: Tools must default to least-privilege (no side effects unless explicitly requested).
