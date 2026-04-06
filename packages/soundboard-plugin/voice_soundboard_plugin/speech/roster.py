"""Voice roster — single source of truth for approved voices, presets, validation.

Extracted from stdio_bridge.py to avoid circular imports between speech/ and bridge/.
Both pipeline.py and stdio_bridge.py import from here.
"""

from __future__ import annotations

DEFAULT_VOICE = "am_fenrir"

APPROVED_VOICES = [
    # American Female
    "af_aoede",     # Aoede — musical
    "af_jessica",   # Jessica — professional
    "af_sky",       # Sky — airy
    # American Male
    "am_eric",      # Eric — confident
    "am_fenrir",    # Fenrir — powerful (DEFAULT)
    "am_liam",      # Liam — friendly
    "am_onyx",      # Onyx — smooth
    # British Female
    "bf_alice",     # Alice — proper
    "bf_emma",      # Emma — refined
    "bf_isabella",  # Isabella — warm
    # British Male
    "bm_george",    # George — authoritative
    "bm_lewis",     # Lewis — friendly
]

_APPROVED_SET = frozenset(APPROVED_VOICES)

# Curated presets using only approved voices
PRESETS = {
    "default":     {"voice": "am_fenrir",    "speed": 1.0,  "description": "Powerful, commanding (Fenrir)"},
    "narrator":    {"voice": "am_fenrir",    "speed": 0.95, "description": "Calm, powerful pace (Fenrir)"},
    "storyteller": {"voice": "bf_emma",      "speed": 0.9,  "description": "Refined, expressive (Emma)"},
    "announcer":   {"voice": "am_eric",      "speed": 1.1,  "description": "Confident, bold (Eric)"},
    "friendly":    {"voice": "am_liam",      "speed": 1.0,  "description": "Warm, approachable (Liam)"},
    "professional":{"voice": "af_jessica",   "speed": 1.0,  "description": "Clear, business-ready (Jessica)"},
}


def validate_voice(voice: str | None) -> str | None:
    """Resolve and validate a voice ID.

    Returns approved voice, DEFAULT_VOICE (if None), or None (if rejected).
    """
    if voice is None:
        return DEFAULT_VOICE
    voice = voice.strip()
    if voice in PRESETS:
        return PRESETS[voice]["voice"]
    if voice in _APPROVED_SET:
        return voice
    return None


def voice_rejected_error(voice: str) -> dict:
    """Error response dict for a voice not in the approved roster."""
    return {
        "error": f"Voice '{voice}' is not in the approved roster.",
        "approved_voices": APPROVED_VOICES,
        "default_voice": DEFAULT_VOICE,
        "presets": list(PRESETS.keys()),
    }
