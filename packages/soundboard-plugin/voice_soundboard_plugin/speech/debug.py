"""Speech pipeline debug utilities — structured plan snapshots for logging."""

from __future__ import annotations

from voice_soundboard_plugin.speech.types import SpeechPlan


def format_plan_debug(plan: SpeechPlan) -> dict:
    """Machine-readable debug snapshot of a SpeechPlan."""
    return {
        "trace_id": plan.trace_id,
        "mode": plan.mode,
        "chunk_count": len(plan.chunks),
        "chunks": [
            {
                "voice": c.voice,
                "speed": c.speed,
                "text_len": len(c.text),
                "context": c.context,
            }
            for c in plan.chunks
        ],
        "warnings": [{"code": w.code, "message": w.message} for w in plan.warnings],
        "source_text_len": len(plan.source_text),
    }
