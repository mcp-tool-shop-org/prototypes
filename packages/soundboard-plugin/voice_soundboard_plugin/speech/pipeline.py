"""Speech pipeline — process_text() builds a SpeechPlan from raw input."""

from __future__ import annotations

import uuid

from voice_soundboard_plugin.speech.chunking import chunk_text
from voice_soundboard_plugin.speech.roster import (
    APPROVED_VOICES,
    DEFAULT_VOICE,
    validate_voice,
)
from voice_soundboard_plugin.speech.limits import clamp_speed, truncate_text
from voice_soundboard_plugin.speech.ssml_lite import nodes_to_plain_text, parse_ssml
from voice_soundboard_plugin.speech.types import (
    SpeechChunk,
    SpeechPlan,
    SpeechWarning,
    VoiceRejectedError,
)


def process_text(
    text: str,
    *,
    voice: str | None = None,
    speed: float = 1.0,
    emotion: str | None = None,
    style: str | None = None,
    mode: str = "speak",
    context: str = "",
    format: str = "plain",
    chunking: str = "auto",
    max_chunk_chars: int = 500,
) -> SpeechPlan:
    """Build a SpeechPlan from raw input.

    Validates voice, clamps speed, truncates text, optionally parses SSML
    and chunks long text into multiple SpeechChunks.

    Args:
        format: "plain" or "ssml". SSML input is parsed and flattened.
        chunking: "auto" or "off". Auto splits long text at natural boundaries.
        max_chunk_chars: Max characters per chunk (default 500).

    Raises:
        VoiceRejectedError: If voice is not in the approved roster.
    """
    trace_id = uuid.uuid4().hex[:12]
    warnings: list[SpeechWarning] = []

    # Truncate text
    text, w = truncate_text(text)
    if w:
        warnings.append(w)

    # SSML parsing — flatten to plain text for engine
    if format == "ssml":
        nodes, ssml_warnings = parse_ssml(text)
        warnings.extend(ssml_warnings)
        text = nodes_to_plain_text(nodes)

    # Validate voice
    resolved_voice = validate_voice(voice)
    if resolved_voice is None:
        raise VoiceRejectedError(
            voice=voice or "",
            approved=APPROVED_VOICES,
            default=DEFAULT_VOICE,
        )

    # Clamp speed
    speed, w = clamp_speed(speed)
    if w:
        warnings.append(w)

    # Chunk text
    if chunking == "auto":
        text_chunks, chunk_warnings = chunk_text(text, max_chunk_chars=max_chunk_chars)
        warnings.extend(chunk_warnings)
    else:
        text_chunks = [text]

    # Build SpeechChunks
    chunks = [
        SpeechChunk(
            text=t,
            voice=resolved_voice,
            speed=speed,
            emotion=emotion,
            style=style,
            context=context or mode,
        )
        for t in text_chunks
    ]

    return SpeechPlan(
        chunks=chunks,
        warnings=warnings,
        trace_id=trace_id,
        source_text=text,
        mode=mode,
    )
