"""Pack registry — discover and load available packs."""

from __future__ import annotations

from edgepacks.packs._base import BasePack


def discover_packs() -> dict[str, BasePack]:
    """Return a dict of pack_name → BasePack instance for all built-in packs."""
    packs: dict[str, BasePack] = {}

    from edgepacks.packs.tool_routing import ToolRoutingPack

    packs["tool-routing"] = ToolRoutingPack()

    from edgepacks.packs.structured_extraction import StructuredExtractionPack

    packs["structured-extraction"] = StructuredExtractionPack()

    from edgepacks.packs.error_triage import ErrorTriagePack

    packs["error-triage"] = ErrorTriagePack()

    return packs


__all__ = ["BasePack", "discover_packs"]
