"""Emotion plan builder — convert parsed EmotionSpan list to SpeechPlan.

Each span becomes a SpeechChunk with its own voice and speed resolved
from the emotion mapping table. This bypasses process_text() which
assumes a single voice for the entire utterance.
"""

from __future__ import annotations

import uuid

from voice_soundboard_plugin.speech.emotion.mapping import resolve_emotion
from voice_soundboard_plugin.speech.emotion.types import EmotionSpan
from voice_soundboard_plugin.speech.types import SpeechChunk, SpeechPlan, SpeechWarning

# Warn when span count gets high
MANY_SPANS_THRESHOLD = 30


def build_emotion_plan(
    spans: list[EmotionSpan],
    *,
    base_voice: str | None = None,
    base_speed: float = 1.0,
    mode: str = "speak",
    context: str = "",
) -> SpeechPlan:
    """Convert emotion spans to a SpeechPlan with per-span voice/speed.

    Args:
        spans: Parsed EmotionSpan objects.
        base_voice: If set, overrides the preset voice for all spans.
        base_speed: Base speed multiplied by each emotion's speed_multiplier.
        mode: SpeechPlan mode (default "speak").
        context: Optional context string.

    Returns:
        SpeechPlan with one chunk per non-empty span.
    """
    chunks: list[SpeechChunk] = []
    warnings: list[SpeechWarning] = []
    trace_id = uuid.uuid4().hex[:12]

    if len(spans) > MANY_SPANS_THRESHOLD:
        warnings.append(SpeechWarning(
            code="many_spans",
            message=f"Emotion plan has {len(spans)} spans (>{MANY_SPANS_THRESHOLD}), synthesis may be slow",
            original=len(spans),
            resolved=MANY_SPANS_THRESHOLD,
        ))

    # Collect source text for the plan
    source_text = "".join(s.text for s in spans)

    for span in spans:
        text = span.text.strip()
        if not text:
            continue

        voice_id, speed, resolve_warnings = resolve_emotion(
            span.emotion,
            base_voice=base_voice,
            base_speed=base_speed,
        )
        warnings.extend(resolve_warnings)

        chunks.append(SpeechChunk(
            text=text,
            voice=voice_id,
            speed=speed,
            emotion=span.emotion,
            context=context or f"emotion:{span.emotion}",
        ))

    return SpeechPlan(
        chunks=chunks,
        warnings=warnings,
        trace_id=trace_id,
        source_text=source_text[:200],
        mode=mode,
    )
