"""
===============================================================================
INTERNAL SPIKE ARTIFACT — NOT A PUBLIC API — SUBJECT TO DELETION WITHOUT NOTICE
===============================================================================

Internal stage names for testimony pipeline.

This module exists solely to:
1. Name what already happens in testify()
2. Prove stages can be composed without changing output bytes
3. Inform future pipeline design (Track B, currently PAUSED)

DO NOT:
- Import from this module in production code
- Expose these types in __init__.py
- Document these types publicly
- Depend on any names or structures defined here

This file may be deleted at any time without deprecation.
"""

from enum import Enum, auto


class _Stage(Enum):
    """
    Internal enumeration of testimony pipeline stages.

    These names describe what already exists in testify().
    They do not introduce new behavior.

    Order is fixed and must match current implementation:
    LOAD -> ANALYZE -> BUILD -> RENDER -> EMIT
    """

    LOAD = auto()      # store.iter_events() with filters
    ANALYZE = auto()   # analyze_timeline(events, verify_crypto=True)
    BUILD = auto()     # Create EventReport, KeyInfo, FlagSummary
    RENDER = auto()    # render_json / render_markdown / render_text
    EMIT = auto()      # emit_artifact (optional)


# Stage order is linear and immutable
_STAGE_ORDER = tuple(_Stage)

# Verify order matches enum definition order
assert _STAGE_ORDER == (
    _Stage.LOAD,
    _Stage.ANALYZE,
    _Stage.BUILD,
    _Stage.RENDER,
    _Stage.EMIT,
), "Stage order mismatch"


def _debug_describe_stage(stage: _Stage) -> str:
    """
    DEBUG ONLY: Return a human-readable description of what each stage does.

    Not for production use. May be removed without notice.
    """
    descriptions = {
        _Stage.LOAD: "Load events from store with time/actor/event filters",
        _Stage.ANALYZE: "Run timeline analysis with crypto verification",
        _Stage.BUILD: "Build EventReport, KeyInfo, FlagSummary from analysis",
        _Stage.RENDER: "Render to output format (json/md/text)",
        _Stage.EMIT: "Write artifacts to filesystem with manifest",
    }
    return descriptions[stage]


def _debug_stage_boundaries() -> dict:
    """
    DEBUG ONLY: Document where each stage boundary exists in current code.

    This is purely descriptive - it doesn't execute anything.
    Used for spike analysis only. Not contractual. May be removed.
    """
    return {
        _Stage.LOAD: {
            "function": "build_testimony",
            "lines": "store.iter_events() loop",
            "input": "WitnessStore + filter params",
            "output": "List[event dict], List[event_json str]",
        },
        _Stage.ANALYZE: {
            "function": "build_testimony",
            "lines": "analyze_timeline(events, verify_crypto=True)",
            "input": "List[event dict]",
            "output": "List[EventAnalysis]",
        },
        _Stage.BUILD: {
            "function": "build_testimony",
            "lines": "for event, analysis, event_json_str in zip(...)",
            "input": "events + analyses + raw strings",
            "output": "(List[EventReport], Dict[KeyInfo], List[FlagSummary], int)",
        },
        _Stage.RENDER: {
            "function": "render_json / render_markdown / render_text",
            "lines": "entire function",
            "input": "reports, keys, flags_summary, exit_code, options",
            "output": "str",
        },
        _Stage.EMIT: {
            "function": "emit_artifact",
            "lines": "entire function",
            "input": "out_dir, reports, keys, flags_summary, exit_code, options",
            "output": "List[ManifestArtifact]",
        },
    }
