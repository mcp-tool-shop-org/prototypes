"""Speech orchestrator — synthesizes a SpeechPlan via the engine."""

from __future__ import annotations

import asyncio
import functools
import logging
import time
from pathlib import Path
from typing import Any

from voice_soundboard_plugin.speech.debug import format_plan_debug
from voice_soundboard_plugin.speech.types import SpeechPlan, SpeechWarning

logger = logging.getLogger(__name__)


async def _speak_in_thread(engine: Any, text: str, **params: Any) -> Any:
    """Run engine.speak() in a worker thread so we don't block the event loop."""
    return await asyncio.to_thread(functools.partial(engine.speak, text, **params))


async def synthesize_plan(
    plan: SpeechPlan,
    engine: Any,
    player: Any | None = None,
    concat: bool = False,
    concat_silence_ms: int | None = None,
) -> dict:
    """Synthesize all chunks in a SpeechPlan and return a unified result dict.

    Args:
        plan: The SpeechPlan to synthesize.
        engine: VoiceEngine instance.
        player: Optional _AudioPlayer — if provided, plays audio after synthesis.
        concat: If True, suppress per-chunk playback (caller handles merged file).

    Returns:
        Result dict with audio_path, duration_ms, voice, speed, latency_ms, etc.
        Multi-chunk plans add: audio_paths, chunk_count, chunks_synthesized,
        interrupted, total_duration_ms, per_chunk_timings.
    """
    logger.debug("[speech:%s] plan: %s", plan.trace_id, format_plan_debug(plan))
    start_time = time.time()

    # Clear interrupt flag at the start of synthesis
    if player and hasattr(player, "interrupted"):
        player.interrupted.clear()

    audio_paths: list[str] = []
    per_chunk_timings: list[dict] = []
    total_duration_ms = 0.0
    interrupted = False
    last_result = None

    for i, chunk in enumerate(plan.chunks):
        # Check for interrupt between chunks
        if i > 0 and player and hasattr(player, "interrupted") and player.interrupted.is_set():
            interrupted = True
            logger.info(
                "[speech:%s] interrupted after chunk %d/%d",
                plan.trace_id, i, len(plan.chunks),
            )
            break

        chunk_start = time.time()

        params: dict[str, Any] = {"voice": chunk.voice}
        if chunk.speed != 1.0:
            params["speed"] = chunk.speed
        if chunk.emotion:
            params["emotion"] = chunk.emotion

        result = await _speak_in_thread(engine, chunk.text, **params)
        chunk_latency = (time.time() - chunk_start) * 1000

        audio_path = str(result.audio_path) if result.audio_path else None
        duration_ms = round(result.duration_seconds * 1000, 2)
        total_duration_ms += duration_ms

        # Validate WAV output
        if audio_path:
            from voice_soundboard_plugin.security.wav_validator import validate_wav
            from voice_soundboard_plugin.security.guardrails import MAX_RESPONSE_SIZE_BYTES
            valid, reason = validate_wav(audio_path)
            if not valid:
                logger.warning("[speech:%s] chunk %d invalid WAV: %s", plan.trace_id, i, reason)
                plan.warnings.append(SpeechWarning(
                    code="invalid_wav",
                    message=f"Chunk {i} WAV validation failed: {reason}",
                ))
                audio_path = None
            else:
                file_size = Path(audio_path).stat().st_size
                if file_size > MAX_RESPONSE_SIZE_BYTES:
                    logger.warning("[speech:%s] chunk %d too large: %d bytes", plan.trace_id, i, file_size)
                    plan.warnings.append(SpeechWarning(
                        code="response_too_large",
                        message=f"Chunk {i} WAV {file_size} bytes exceeds {MAX_RESPONSE_SIZE_BYTES} limit",
                    ))
                    audio_path = None

        if audio_path:
            audio_paths.append(audio_path)

        per_chunk_timings.append({
            "chunk_index": i,
            "latency_ms": round(chunk_latency, 2),
            "duration_ms": duration_ms,
            "chars": len(chunk.text),
        })

        # Play each chunk as it finishes (unless concat mode)
        if not concat and player is not None and audio_path:
            player.play(audio_path, context=f"{plan.mode}:{plan.trace_id}:chunk{i}")

        last_result = result

    total_latency_ms = (time.time() - start_time) * 1000
    chunks_synthesized = len(audio_paths)

    logger.info(
        "[speech:%s] done chunks=%d/%d latency=%.0fms%s",
        plan.trace_id, chunks_synthesized, len(plan.chunks),
        total_latency_ms, " (interrupted)" if interrupted else "",
    )

    # Build result dict — backward compatible for single-chunk plans
    out: dict[str, Any] = {
        "audio_path": audio_paths[0] if audio_paths else None,
        "duration_ms": per_chunk_timings[0]["duration_ms"] if per_chunk_timings else 0,
        "text": plan.source_text,
        "voice": plan.chunks[0].voice if plan.chunks else "",
        "speed": plan.chunks[0].speed if plan.chunks else 1.0,
        "emotion": plan.chunks[0].emotion if plan.chunks else None,
        "latency_ms": round(total_latency_ms, 2),
        "mode": plan.mode,
        "trace_id": plan.trace_id,
        "warnings": [{"code": w.code, "message": w.message} for w in plan.warnings],
    }

    # Multi-chunk extensions (always present, but meaningful for >1 chunk)
    if len(plan.chunks) > 1:
        out["audio_paths"] = audio_paths
        out["chunk_count"] = len(plan.chunks)
        out["chunks_synthesized"] = chunks_synthesized
        out["interrupted"] = interrupted
        out["total_duration_ms"] = round(total_duration_ms, 2)
        out["per_chunk_timings"] = per_chunk_timings

    # Optional WAV concatenation for multi-chunk plans
    if concat and len(audio_paths) > 1:
        from voice_soundboard_plugin.speech.concat import concatenate_wavs

        concat_kwargs: dict[str, Any] = {}
        if concat_silence_ms is not None:
            concat_kwargs["silence_ms"] = concat_silence_ms
        concat_path, concat_warnings = concatenate_wavs(audio_paths, **concat_kwargs)
        out["warnings"].extend(
            {"code": w.code, "message": w.message} for w in concat_warnings
        )
        if concat_path:
            out["audio_path"] = concat_path
            out["concat_path"] = concat_path
            # Play the merged file
            if player is not None:
                player.play(concat_path, context=f"{plan.mode}:{plan.trace_id}:merged")
        else:
            # Concat failed — fall back to playing chunks sequentially
            out["concat_path"] = None
            if player is not None:
                for path in audio_paths:
                    if player and hasattr(player, "interrupted") and player.interrupted.is_set():
                        break
                    player.play(path, context=f"{plan.mode}:{plan.trace_id}:fallback")

    return out
