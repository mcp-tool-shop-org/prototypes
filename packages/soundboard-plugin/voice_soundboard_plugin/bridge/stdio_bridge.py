"""
Stdio MCP bridge for voice-soundboard.

Wraps the voice-soundboard VoiceEngine in an MCP stdio server compatible
with Claude Code's plugin system. Delegates to the existing tool
implementations from voice_soundboard.mcp.tools and adds two plugin-exclusive
tools: voice.narrate and voice.workflow_notify.

Includes bridge-side audio playback so MCP/stdio clients (like Claude Code)
that cannot play audio themselves will hear speech through the speakers.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import sys
import uuid as _uuid
from pathlib import Path
from typing import Any

from mcp.server import InitializationOptions, Server
from mcp.server.stdio import stdio_server
from mcp.types import ServerCapabilities, TextContent, Tool, ToolsCapability

from voice_soundboard_plugin.bridge.health import (
    engine_unavailable_error,
    try_create_engine,
)
from voice_soundboard_plugin.speech import VoiceRejectedError, process_text
from voice_soundboard_plugin.speech.emotion import (
    has_emotion_spans,
    parse_emotion_spans,
)
from voice_soundboard_plugin.speech.emotion.plan_builder import build_emotion_plan
from voice_soundboard_plugin.speech.sfx_parser import (
    SfxMarker,
    TextSegment,
    has_sfx_tags,
    parse_sfx_tags,
)
from voice_soundboard_plugin.audio.sfx import get_sfx_path, is_sfx_enabled
from voice_soundboard_plugin.speech.dialogue import (
    CastingError,
    DialogueParseError,
    calculate_speed_from_directions,
    parse_dialogue,
    resolve_cast,
    validate_cast_dict,
    DIALOGUE_DEFAULT_VOICE,
)
from voice_soundboard_plugin.speech.limits import clamp_speed
from voice_soundboard_plugin.speech.orchestrator import synthesize_plan
from voice_soundboard_plugin.speech.roster import (
    APPROVED_VOICES,
    DEFAULT_VOICE,
    PRESETS,
    _APPROVED_SET,
    validate_voice,
    voice_rejected_error,
)
from voice_soundboard_plugin.speech.types import SpeechChunk, SpeechPlan, SpeechWarning
from voice_soundboard_plugin.ambient import AmbientConfig, InnerMonologue
from voice_soundboard_plugin.playback import PlaybackWorker
from voice_soundboard_plugin.security.guardrails import (
    ALL_LIMITS,
    ConcurrencyGate,
    ErrorCode,
    RateLimiter,
    SYNTHESIS_TOOLS,
    make_error,
)

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Event-type → emotion mapping for workflow notifications
# (only uses approved voices)
# ---------------------------------------------------------------------------
WORKFLOW_EMOTIONS = {
    "build_success": {"emotion": "joy",      "voice": "am_eric",    "speed": 1.2},
    "build_fail":    {"emotion": "sadness",   "voice": "am_fenrir",  "speed": 0.95},
    "tests_pass":    {"emotion": "joy",      "voice": "am_eric",    "speed": 1.2},
    "tests_fail":    {"emotion": "anger",    "voice": "am_fenrir",  "speed": 0.95},
    "commit":        {"emotion": "neutral",  "voice": "am_fenrir",  "speed": 1.0},
    "pr_merged":     {"emotion": "joy",      "voice": "am_liam",    "speed": 1.1},
    "deploy":        {"emotion": "surprise", "voice": "am_eric",    "speed": 1.2},
}

# ---------------------------------------------------------------------------
# Eager initialisation (runs at import / startup, BEFORE the event loop)
# ---------------------------------------------------------------------------

_TOOL_DESCRIPTORS: list[Tool] = []
_TOOL_IMPLS: dict = {}
_ENGINE = None
_PLAYER: PlaybackWorker | None = None
_MONOLOGUE: InnerMonologue | None = None
_CONCURRENCY_GATE: ConcurrencyGate | None = None
_RATE_LIMITER: RateLimiter | None = None


def _init_all():
    """Eagerly import and initialise engine + tools + player + monologue at startup."""
    global _ENGINE, _TOOL_IMPLS, _PLAYER, _MONOLOGUE, _CONCURRENCY_GATE, _RATE_LIMITER

    # Audio player (single-thread queue-based worker)
    _PLAYER = PlaybackWorker()
    logger.info("Audio playback: enabled=%s, mode=%s", _PLAYER.enabled, _PLAYER.mode.value)

    # Security guardrails
    _CONCURRENCY_GATE = ConcurrencyGate()
    _RATE_LIMITER = RateLimiter()

    # Startup WAV retention cleanup (scoped to output root)
    from voice_soundboard_plugin.playback.retention import cleanup_old_wavs
    from voice_soundboard_plugin.security.fs_sandbox import get_output_root
    output_root = get_output_root()
    cleaned = cleanup_old_wavs(output_root)
    if cleaned:
        logger.info("Startup retention: cleaned %d old WAVs from %s", cleaned, output_root)

    # Inner monologue (ambient)
    ambient_config = AmbientConfig.from_env()
    if ambient_config.enabled:
        _MONOLOGUE = InnerMonologue(ambient_config)
        logger.info(
            "Inner monologue: enabled, autospeak=%s, cooldown=%dms",
            ambient_config.autospeak, ambient_config.cooldown_ms,
        )
    else:
        logger.info("Inner monologue: disabled")

    # Engine
    _ENGINE = try_create_engine()

    # Tool implementations from voice-soundboard
    try:
        from voice_soundboard.mcp.tools import create_default_tools

        for tool in create_default_tools():
            _TOOL_IMPLS[tool.name] = tool
            _TOOL_DESCRIPTORS.append(
                Tool(
                    name=tool.name,
                    description=tool.description,
                    inputSchema=tool.input_schema,
                )
            )
        logger.info("Loaded %d engine tools", len(_TOOL_IMPLS))

        # Extend voice.speak schema with Phase 2 parameters
        for desc in _TOOL_DESCRIPTORS:
            if desc.name == "voice.speak":
                props = desc.inputSchema.get("properties", {})
                props["format"] = {
                    "type": "string",
                    "description": "Input format: 'plain' (default) or 'ssml'",
                    "enum": ["plain", "ssml"],
                }
                props["chunking"] = {
                    "type": "string",
                    "description": "Chunking strategy: 'auto' (default) splits long text, 'off' keeps as single chunk",
                    "enum": ["auto", "off"],
                }
                props["concat"] = {
                    "type": "boolean",
                    "description": "If true, concatenate multi-chunk audio into a single WAV file (default: false)",
                }
                break

    except ImportError:
        logger.warning("Could not import voice_soundboard.mcp.tools")

    # Plugin-exclusive tools
    _TOOL_DESCRIPTORS.append(
        Tool(
            name="voice.narrate",
            description=(
                "Narrate a code walkthrough with adaptive pacing and "
                "natural pronunciation. Designed for spoken code reviews "
                "and explanations."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": (
                            "The narration script to speak. Should be a "
                            "plain-language walkthrough of code, NOT raw code."
                        ),
                    },
                    "voice": {
                        "type": "string",
                        "description": f"Voice identifier (default: {DEFAULT_VOICE})",
                        "enum": APPROVED_VOICES,
                    },
                    "speed": {
                        "type": "number",
                        "description": "Speed multiplier (default: 0.95 for narrator pace)",
                        "minimum": 0.5,
                        "maximum": 2.0,
                    },
                },
                "required": ["text"],
            },
        )
    )

    _TOOL_DESCRIPTORS.append(
        Tool(
            name="voice.workflow_notify",
            description=(
                "Speak a short workflow notification with context-aware "
                "emotion. Use for build results, test outcomes, deployments."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "event_type": {
                        "type": "string",
                        "description": "Type of workflow event",
                        "enum": list(WORKFLOW_EMOTIONS.keys()),
                    },
                    "message": {
                        "type": "string",
                        "description": (
                            "Short message to speak (e.g., 'All 47 tests passed')"
                        ),
                    },
                },
                "required": ["event_type", "message"],
            },
        )
    )

    _TOOL_DESCRIPTORS.append(
        Tool(
            name="voice.dialogue",
            description=(
                "Synthesize multi-speaker dialogue from a script. "
                "Each speaker is auto-cast to a distinct approved voice, "
                "or explicitly assigned via the cast parameter. "
                "Script syntax: 'Speaker: text' per line, with optional "
                "[pause 350ms] directives between lines."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "script": {
                        "type": "string",
                        "description": (
                            "Dialogue script with 'Speaker: text' lines. "
                            "Supports [pause Xms] directives, # comments, "
                            "and blank lines."
                        ),
                    },
                    "cast": {
                        "type": "object",
                        "additionalProperties": {"type": "string"},
                        "description": (
                            "Optional speaker→voice mapping. Keys are speaker "
                            "names, values are voice IDs or preset names. "
                            "Uncast speakers use auto-casting."
                        ),
                    },
                    "speed": {
                        "type": "number",
                        "description": "Base speed multiplier for all lines (default: 1.0)",
                        "minimum": 0.5,
                        "maximum": 2.0,
                    },
                    "concat": {
                        "type": "boolean",
                        "description": (
                            "If true, concatenate all line audio into a single "
                            "WAV file (default: true)"
                        ),
                    },
                    "debug": {
                        "type": "boolean",
                        "description": (
                            "If true, include cue_sheet and parse_warnings "
                            "in response (default: false)"
                        ),
                    },
                },
                "required": ["script"],
            },
        )
    )

    _TOOL_DESCRIPTORS.append(
        Tool(
            name="voice.inner_monologue",
            description=(
                "Submit an ephemeral inner-monologue micro-utterance. "
                "Rate-limited, redacted, volatile. Returns the accepted "
                "entry or a rejection reason. Requires VOICE_SOUNDBOARD_AMBIENT_ENABLED=1."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": (
                            "The monologue text (max 500 chars). "
                            "Sensitive content is auto-redacted."
                        ),
                    },
                    "category": {
                        "type": "string",
                        "description": "Category tag (default: 'general')",
                        "enum": ["general", "thinking", "observation", "debug"],
                    },
                },
                "required": ["text"],
            },
        )
    )

    _TOOL_DESCRIPTORS.append(
        Tool(
            name="voice.playback_diagnose",
            description=(
                "Diagnose playback system: device info, playback mode, "
                "env toggles, and optional test beep. Use when audio "
                "is silent or misconfigured."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "play_test_beep": {
                        "type": "boolean",
                        "description": "Play a short test chime (default: true)",
                    },
                },
            },
        )
    )

    _TOOL_DESCRIPTORS.append(
        Tool(
            name="voice.ambient_enable",
            description=(
                "Enable or disable the inner monologue (ambient) system "
                "at runtime. Does not require restart."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "enabled": {
                        "type": "boolean",
                        "description": "True to enable, False to disable",
                    },
                },
                "required": ["enabled"],
            },
        )
    )

    _TOOL_DESCRIPTORS.append(
        Tool(
            name="voice.ambient_mute",
            description=(
                "Temporarily mute the inner monologue for a given number "
                "of minutes. The system remains enabled but suppresses output."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "minutes": {
                        "type": "integer",
                        "description": "Minutes to mute (default: 10)",
                        "minimum": 1,
                        "maximum": 1440,
                    },
                },
            },
        )
    )

    logger.info("Total tools registered: %d", len(_TOOL_DESCRIPTORS))
    logger.info("Approved voices: %d, default: %s", len(APPROVED_VOICES), DEFAULT_VOICE)


# ---------------------------------------------------------------------------
# Async offload — keep blocking tool.execute() off the MCP event loop
# ---------------------------------------------------------------------------

async def _execute_tool_in_thread(tool: Any, engine: Any, arguments: dict) -> dict:
    """Run an async tool.execute() off the event loop via a fresh loop in a thread."""
    def _run():
        return asyncio.run(tool.execute(engine, arguments))
    return await asyncio.to_thread(_run)


# ---------------------------------------------------------------------------
# Playback helper — extracts audio_path from any tool result and plays it
# ---------------------------------------------------------------------------

def _maybe_play(result: dict, context: str = ""):
    """If result contains an audio_path, play it."""
    if _PLAYER is None:
        return
    audio_path = result.get("audio_path") or result.get("audioFile") or result.get("path")
    if audio_path:
        _PLAYER.play(str(audio_path), context=context)


# ---------------------------------------------------------------------------
# MCP Server definition
# ---------------------------------------------------------------------------
app = Server("voice-soundboard")


@app.list_tools()
async def list_tools():
    """Return pre-built tool descriptors (no imports, no blocking)."""
    return _TOOL_DESCRIPTORS


@app.call_tool()
async def call_tool(name: str, arguments: dict):
    """Dispatch tool calls to the engine or plugin handlers."""
    trace_id = _uuid.uuid4().hex[:12]

    if _ENGINE is None:
        result = make_error(ErrorCode.ENGINE_UNAVAILABLE, "Voice engine not available", trace_id)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    # Rate limiting
    if _RATE_LIMITER:
        allowed, wait_ms = _RATE_LIMITER.check(name)
        if not allowed:
            result = make_error(ErrorCode.RATE_LIMITED, f"Rate limited, retry in {wait_ms}ms", trace_id)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

    # Concurrency gate (synthesis tools only)
    acquired = False
    if _CONCURRENCY_GATE:
        acquired = await _CONCURRENCY_GATE.acquire(name)
        if not acquired:
            result = make_error(ErrorCode.BUSY, "Synthesis busy, try again", trace_id)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

    try:
        logger.info("[dispatch] %s trace=%s", name, trace_id)

        # --- voice.status: enhanced with roster info ---
        if name == "voice.status":
            tool = _TOOL_IMPLS.get(name)
            if tool:
                result = await tool.execute(_ENGINE, arguments)
            else:
                result = {"healthy": _ENGINE is not None}
            # Enrich with roster info
            result["default_voice"] = DEFAULT_VOICE
            result["approved_voices"] = APPROVED_VOICES
            result["approved_count"] = len(APPROVED_VOICES)
            result["presets"] = {k: v["description"] for k, v in PRESETS.items()}
            # Emotion support
            from voice_soundboard_plugin.speech.emotion.types import EMOTION_NAMES
            from voice_soundboard_plugin.speech.emotion.mapping import EMOTION_MAP
            result["supported_emotions"] = sorted(EMOTION_NAMES)
            result["emotion_map"] = {
                name: {
                    "voice": m.voice_fallback,
                    "speed": m.speed_multiplier,
                    "preset": m.preset,
                }
                for name, m in EMOTION_MAP.items()
            }
            # Playback info
            if _PLAYER:
                result["playback_mode"] = _PLAYER.mode.value
                result["playback_backend"] = _PLAYER._backend
                result["playback_busy"] = _PLAYER.is_busy
            # Security limits manifest
            result["limits"] = ALL_LIMITS
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        # --- voice.list_voices: filter to approved only ---
        if name == "voice.list_voices":
            tool = _TOOL_IMPLS.get(name)
            if tool:
                result = await tool.execute(_ENGINE, arguments)
                # Filter the voice list
                if isinstance(result, dict) and "voices" in result:
                    result["voices"] = [
                        v for v in result["voices"]
                        if v.get("id") in _APPROVED_SET
                    ]
                    result["count"] = len(result["voices"])
            else:
                result = {"voices": APPROVED_VOICES, "count": len(APPROVED_VOICES)}
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        # --- voice.interrupt: bridge-side stop + engine delegate ---
        if name == "voice.interrupt":
            bridge_stopped = False
            if _PLAYER is not None:
                bridge_stopped = _PLAYER.stop()
            # Also delegate to engine's interrupt tool
            tool = _TOOL_IMPLS.get(name)
            if tool:
                result = await tool.execute(_ENGINE, arguments)
            else:
                result = {}
            result["bridge_playback_stopped"] = bridge_stopped
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        # --- voice.speak: unified pipeline (orchestrator handles playback) ---
        if name == "voice.speak":
            text = arguments.get("text", "")
            try:
                # SFX path: [ding], [chime] etc. split text into segments
                if is_sfx_enabled() and has_sfx_tags(text):
                    result = await _handle_speak_with_sfx(_ENGINE, text, arguments)
                # Emotion span path: {joy}text{/joy} markup detected
                elif has_emotion_spans(text):
                    result = await _handle_speak_emotion(_ENGINE, text, arguments)
                else:
                    # Standard path: process_text handles SSML, chunking, etc.
                    result = await _handle_speak_standard(_ENGINE, text, arguments)
            except VoiceRejectedError as exc:
                result = voice_rejected_error(exc.voice)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        # --- voice.dialogue: multi-speaker dialogue ---
        if name == "voice.dialogue":
            result = await _handle_dialogue(_ENGINE, arguments)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        # --- voice.narrate: unified pipeline (orchestrator handles playback) ---
        if name == "voice.narrate":
            result = await _handle_narrate(_ENGINE, arguments)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        # --- voice.workflow_notify: unified pipeline (orchestrator handles playback) ---
        if name == "voice.workflow_notify":
            result = await _handle_workflow_notify(_ENGINE, arguments)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        # --- voice.inner_monologue: ephemeral micro-utterance ---
        if name == "voice.inner_monologue":
            result = await _handle_inner_monologue(_ENGINE, arguments)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        # --- voice.playback_diagnose: playback diagnostics ---
        if name == "voice.playback_diagnose":
            result = _handle_playback_diagnose(arguments)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        # --- voice.ambient_enable: runtime toggle ---
        if name == "voice.ambient_enable":
            result = _handle_ambient_enable(arguments)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        # --- voice.ambient_mute: temporary mute ---
        if name == "voice.ambient_mute":
            result = _handle_ambient_mute(arguments)
            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        # --- all other tools pass through ---
        tool = _TOOL_IMPLS.get(name)
        if tool is None:
            result = {"error": f"Unknown tool: {name}"}
        else:
            result = await _execute_tool_in_thread(tool, _ENGINE, arguments)

        # Play audio if the tool produced any
        if isinstance(result, dict):
            _maybe_play(result, context=f"tool={name}")

        # Record rate limiter timestamp on success
        if _RATE_LIMITER:
            _RATE_LIMITER.record(name)

        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    except Exception as exc:
        logger.error("Tool %s failed: %s", name, exc, exc_info=True)
        from voice_soundboard_plugin.security.redact import redact_sensitive
        safe_message = redact_sensitive(str(exc))
        result = make_error(ErrorCode.INTERNAL_ERROR, safe_message, trace_id)
        return [TextContent(type="text", text=json.dumps(result, indent=2))]

    finally:
        if acquired and _CONCURRENCY_GATE:
            _CONCURRENCY_GATE.release(name)


# ---------------------------------------------------------------------------
# Plugin-exclusive tool handlers
# ---------------------------------------------------------------------------


async def _handle_speak_standard(engine: Any, text: str, arguments: dict) -> dict:
    """Standard voice.speak path — process_text handles SSML, chunking, etc."""
    plan = process_text(
        text,
        voice=arguments.get("voice"),
        speed=float(arguments.get("speed", 1.0)),
        emotion=arguments.get("emotion"),
        style=arguments.get("style"),
        mode="speak",
        format=arguments.get("format", "plain"),
        chunking=arguments.get("chunking", "auto"),
    )
    use_concat = arguments.get("concat", False)
    return await synthesize_plan(plan, engine, _PLAYER, concat=bool(use_concat))


async def _handle_speak_emotion(engine: Any, text: str, arguments: dict) -> dict:
    """Emotion span path — {joy}text{/joy} markup routes to per-span voices."""
    spans, parse_warnings = parse_emotion_spans(text)
    plan = build_emotion_plan(
        spans,
        base_voice=arguments.get("voice"),
        base_speed=float(arguments.get("speed", 1.0)),
        mode="speak",
        context="emotion_spans",
    )
    plan.warnings.extend(parse_warnings)
    use_concat = arguments.get("concat", True)
    result = await synthesize_plan(
        plan, engine, _PLAYER,
        concat=bool(use_concat),
        concat_silence_ms=30,
    )
    result["emotion_spans"] = len(spans)
    return result


async def _handle_speak_with_sfx(engine: Any, text: str, arguments: dict) -> dict:
    """SFX path — tokenize into speech segments and SFX markers, process each."""
    tokens, sfx_warnings = parse_sfx_tags(text)
    all_warnings = [{"code": w.code, "message": w.message} for w in sfx_warnings]
    sfx_count = 0
    segment_count = 0

    for token in tokens:
        if isinstance(token, SfxMarker):
            sfx_path = get_sfx_path(token.tag)
            if sfx_path and _PLAYER:
                _PLAYER.play(str(sfx_path), context=f"sfx:{token.tag}")
            sfx_count += 1
        elif isinstance(token, TextSegment) and token.text.strip():
            segment_count += 1
            # Each text segment may contain emotion spans
            if has_emotion_spans(token.text):
                await _handle_speak_emotion(engine, token.text, arguments)
            else:
                await _handle_speak_standard(engine, token.text, arguments)

    return {
        "text": text[:200],
        "sfx_count": sfx_count,
        "segment_count": segment_count,
        "sfx_enabled": True,
        "warnings": all_warnings,
        "mode": "speak",
    }


async def _handle_dialogue(engine: Any, arguments: dict[str, Any]) -> dict:
    """Multi-speaker dialogue — parse, cast, build per-line SpeechPlan, synthesize."""
    script_text = arguments.get("script", "")
    cast_dict = arguments.get("cast")
    base_speed = float(arguments.get("speed", 1.0))
    use_concat = arguments.get("concat", True)
    debug = arguments.get("debug", False)

    # Pre-validate cast dict if provided
    if cast_dict:
        errors = validate_cast_dict(cast_dict)
        if errors:
            return {
                "error": "Invalid cast",
                "details": errors,
                "approved_voices": APPROVED_VOICES,
            }

    # Parse dialogue script
    try:
        script = parse_dialogue(script_text)
    except DialogueParseError as exc:
        return {
            "error": "Dialogue parse error",
            "message": str(exc),
            "line_number": exc.line_number,
        }

    # Resolve speaker→voice cast
    try:
        cast = resolve_cast(script.lines, cast=cast_dict)
    except CastingError as exc:
        return {
            "error": "Casting error",
            "speaker": exc.speaker,
            "attempted_voice": exc.attempted_voice,
            "approved_voices": APPROVED_VOICES,
        }

    # Clamp base speed
    base_speed, speed_warning = clamp_speed(base_speed)
    warnings = []
    if speed_warning:
        warnings.append(speed_warning)

    # Build SpeechPlan with one chunk per dialogue line, each with its own voice
    trace_id = __import__("uuid").uuid4().hex[:12]
    chunks: list[SpeechChunk] = []
    cue_sheet: list[dict] = []

    # Interleave lines and pauses by line_index for cue sheet
    pause_map: dict[int, int] = {p.line_index: p.duration_ms for p in script.pauses}

    for line in script.lines:
        voice_id = cast[line.speaker]

        # Apply stage direction speed modifiers
        line_speed = base_speed
        if line.directions:
            line_speed, dir_warnings = calculate_speed_from_directions(
                line.directions, base_speed,
            )
            for dw in dir_warnings:
                warnings.append(SpeechWarning(
                    code="direction_speed_clamped",
                    message=dw,
                ))

        chunks.append(SpeechChunk(
            text=line.text,
            voice=voice_id,
            speed=line_speed,
            context=f"dialogue:{line.speaker}",
        ))

        # Cue sheet: pause before this line (if any)
        if line.line_index in pause_map:
            cue_sheet.append({
                "line_index": line.line_index,
                "event_type": "pause",
                "duration_ms": pause_map[line.line_index],
            })

        # Cue sheet: the line itself
        cue_entry: dict[str, Any] = {
            "line_index": line.line_index,
            "event_type": "line",
            "speaker": line.speaker,
            "voice": voice_id,
            "text_preview": line.text[:80],
        }
        if line.directions:
            cue_entry["directions"] = line.directions
            cue_entry["speed"] = line_speed
        cue_sheet.append(cue_entry)

    plan = SpeechPlan(
        chunks=chunks,
        warnings=warnings,
        trace_id=trace_id,
        source_text=script_text[:200],
        mode="dialogue",
    )

    # Synthesize
    result = await synthesize_plan(plan, engine, _PLAYER, concat=bool(use_concat))

    # Enrich result with dialogue metadata
    result["speaker_count"] = len(cast)
    result["line_count"] = len(script.lines)
    result["pause_count"] = len(script.pauses)
    result["cast"] = cast

    if debug:
        result["cue_sheet"] = cue_sheet
        if script.warnings:
            result["parse_warnings"] = script.warnings

    return result


def _apply_intelligence(text: str) -> str:
    """Apply AdaptivePacer + SmartSilence if available. Returns processed text."""
    try:
        from voice_soundboard.intelligence.pacing import AdaptivePacer
        from voice_soundboard.intelligence.silence import SmartSilence

        pacer = AdaptivePacer()
        silence = SmartSilence()
        text = pacer.apply(text)
        text = silence.apply(text)
    except (ImportError, Exception) as exc:
        logger.debug("Intelligence modules unavailable, using raw text: %s", exc)
    return text


async def _handle_narrate(engine: Any, arguments: dict[str, Any]) -> dict:
    """Code narration with adaptive pacing — routed through speech pipeline."""
    text = arguments["text"]
    raw_voice = arguments.get("voice")
    speed = arguments.get("speed", 0.95)

    processed_text = _apply_intelligence(text)

    try:
        plan = process_text(
            processed_text, voice=raw_voice, speed=speed,
            mode="narrate", context="narrate", chunking="auto",
        )
        result = await synthesize_plan(plan, engine, _PLAYER)
    except VoiceRejectedError as exc:
        return voice_rejected_error(exc.voice)

    # Enrich with narrate-specific fields
    result["text_length"] = len(text)
    result["enhanced_pacing"] = processed_text != text
    return result


async def _handle_workflow_notify(engine: Any, arguments: dict[str, Any]) -> dict:
    """Speak a workflow notification — routed through speech pipeline."""
    event_type = arguments["event_type"]
    message = arguments["message"]

    config = WORKFLOW_EMOTIONS.get(
        event_type,
        {"emotion": "neutral", "voice": DEFAULT_VOICE, "speed": 1.0},
    )

    try:
        plan = process_text(
            message, voice=config["voice"], speed=config["speed"],
            emotion=config["emotion"], mode="notification",
            context=f"workflow:{event_type}",
        )
        result = await synthesize_plan(plan, engine, _PLAYER)
    except VoiceRejectedError as exc:
        return voice_rejected_error(exc.voice)

    # Enrich with workflow-specific fields
    result["event_type"] = event_type
    result["message"] = message
    return result


async def _handle_inner_monologue(engine: Any, arguments: dict[str, Any]) -> dict:
    """Inner monologue — submit ephemeral micro-utterance, optionally autospeak."""
    if _MONOLOGUE is None:
        return {
            "error": "Inner monologue disabled",
            "hint": "Set VOICE_SOUNDBOARD_AMBIENT_ENABLED=1 to enable",
        }

    text = arguments.get("text", "")
    category = arguments.get("category", "general")

    entry = _MONOLOGUE.submit(text, category=category)

    if entry is None:
        return {
            "accepted": False,
            "reason": "Rate-limited or empty text",
            "cooldown_ms": _MONOLOGUE.config.cooldown_ms,
        }

    result: dict[str, Any] = {
        "accepted": True,
        "text": entry.text,
        "category": entry.category,
        "ttl_ms": entry.ttl_ms,
    }

    # Autospeak if enabled
    if _MONOLOGUE.config.autospeak and engine is not None:
        try:
            plan = process_text(
                entry.text,
                voice="am_onyx",
                speed=0.92,
                mode="monologue",
                context=f"monologue:{category}",
            )
            synth_result = await synthesize_plan(plan, engine, _PLAYER)
            entry.spoken = True
            result["spoken"] = True
            result["audio_path"] = synth_result.get("audio_path")
        except Exception as exc:
            logger.warning("Monologue autospeak failed: %s", exc)
            result["spoken"] = False
            result["speak_error"] = str(exc)
    else:
        result["spoken"] = False

    return result


def _handle_playback_diagnose(arguments: dict[str, Any]) -> dict:
    """Diagnose playback: device info, mode, env vars, optional test beep."""
    result: dict[str, Any] = {
        "playback_enabled": _PLAYER.enabled if _PLAYER else False,
        "backend": _PLAYER._backend if _PLAYER else None,
        "playback_mode": _PLAYER.mode.value if _PLAYER else None,
        "max_play_seconds": _PLAYER._max_play_seconds if _PLAYER else None,
        "is_busy": _PLAYER.is_busy if _PLAYER else False,
        "env": {
            "VOICE_SOUNDBOARD_DISABLE_PLAYBACK": os.environ.get("VOICE_SOUNDBOARD_DISABLE_PLAYBACK", "0"),
            "VOICE_SOUNDBOARD_PLAYBACK_MODE": os.environ.get("VOICE_SOUNDBOARD_PLAYBACK_MODE", "replace"),
            "VOICE_SOUNDBOARD_BLOCKING_PLAYBACK": os.environ.get("VOICE_SOUNDBOARD_BLOCKING_PLAYBACK", "0"),
            "VOICE_SOUNDBOARD_MAX_PLAY_SECONDS": os.environ.get("VOICE_SOUNDBOARD_MAX_PLAY_SECONDS", "30"),
            "VOICE_SOUNDBOARD_OUTPUT_DEVICE": os.environ.get("VOICE_SOUNDBOARD_OUTPUT_DEVICE", ""),
            "VOICE_SOUNDBOARD_OUTPUT_DEVICE_INDEX": os.environ.get("VOICE_SOUNDBOARD_OUTPUT_DEVICE_INDEX", ""),
            "VOICE_SOUNDBOARD_LOG_DEVICES": os.environ.get("VOICE_SOUNDBOARD_LOG_DEVICES", "0"),
            "VOICE_SOUNDBOARD_PLAYBACK_BACKEND": os.environ.get("VOICE_SOUNDBOARD_PLAYBACK_BACKEND", ""),
        },
        "devices": None,
    }

    # Device info (sounddevice only)
    try:
        import sounddevice as sd
        devices = sd.query_devices()
        output_devices = [
            {"index": i, "name": d.get("name", "?"), "channels": d.get("max_output_channels", 0)}
            for i, d in enumerate(devices) if d.get("max_output_channels", 0) > 0
        ]
        result["devices"] = output_devices
        result["default_output"] = str(sd.query_devices(kind="output").get("name", "?"))
    except Exception as exc:
        result["devices"] = f"unavailable: {exc}"

    # Test beep
    if arguments.get("play_test_beep", True) and _PLAYER and _PLAYER.enabled:
        beep_path = get_sfx_path("chime")
        if beep_path:
            _PLAYER.play(str(beep_path), context="diagnose:test_beep")
            result["test_beep"] = "played"
        else:
            result["test_beep"] = "sfx_unavailable"
    else:
        result["test_beep"] = "skipped"

    return result


def _handle_ambient_enable(arguments: dict[str, Any]) -> dict:
    """Enable or disable ambient/monologue at runtime."""
    global _MONOLOGUE
    enabled = arguments.get("enabled", True)

    if enabled:
        if _MONOLOGUE is None:
            _MONOLOGUE = InnerMonologue(AmbientConfig(enabled=True))
        else:
            was = _MONOLOGUE.config.enabled
            _MONOLOGUE.config.enabled = True
            return {"enabled": True, "was": was}
        return {"enabled": True, "was": False}
    else:
        if _MONOLOGUE is not None:
            was = _MONOLOGUE.config.enabled
            _MONOLOGUE.config.enabled = False
            return {"enabled": False, "was": was}
        return {"enabled": False, "was": False}


def _handle_ambient_mute(arguments: dict[str, Any]) -> dict:
    """Temporarily mute ambient for N minutes."""
    import time as _time

    minutes = arguments.get("minutes", 10)
    if _MONOLOGUE is None:
        return {"error": "Inner monologue not initialized", "hint": "Call voice.ambient_enable first"}

    _MONOLOGUE._muted_until = _time.time() + minutes * 60
    return {"muted_for_minutes": minutes}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


async def main():
    """Run the stdio MCP bridge."""
    logging.basicConfig(level=logging.INFO, stream=sys.stderr)
    logger.info("Starting voice-soundboard stdio bridge")

    _init_all()

    init_options = InitializationOptions(
        server_name="voice-soundboard",
        server_version="1.0.0",
        capabilities=ServerCapabilities(
            tools=ToolsCapability(),
        ),
    )

    try:
        async with stdio_server() as (read_stream, write_stream):
            await app.run(read_stream, write_stream, init_options)
    finally:
        if _PLAYER is not None:
            _PLAYER.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
