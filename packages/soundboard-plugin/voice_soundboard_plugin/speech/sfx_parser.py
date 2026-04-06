"""SFX tag parser — tokenize text into speech segments and SFX markers.

Known SFX tags: [ding], [chime], [success], [fail], [click], [tick].
Unknown [xyz] tags are kept as literal text + warning.
Max SFX per request: MAX_SFX_PER_REQUEST (excess kept as literal + warning).
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from voice_soundboard_plugin.audio.sfx import MAX_SFX_PER_REQUEST, SFX_CATALOG
from voice_soundboard_plugin.speech.types import SpeechWarning

# Matches [tag] patterns
_SFX_TAG = re.compile(r"\[(\w+)\]")

# Known SFX tag names
_KNOWN_TAGS = frozenset(SFX_CATALOG.keys())

# Quick detection pattern
_HAS_SFX = re.compile(r"\[\w+\]")


@dataclass
class TextSegment:
    """A segment of regular text to be synthesized."""

    text: str


@dataclass
class SfxMarker:
    """An SFX event to play between speech segments."""

    tag: str


SfxToken = TextSegment | SfxMarker


def has_sfx_tags(text: str) -> bool:
    """Quick check: does text contain any [tag] patterns?"""
    return bool(_HAS_SFX.search(text))


def parse_sfx_tags(text: str) -> tuple[list[SfxToken], list[SpeechWarning]]:
    """Tokenize text into TextSegment and SfxMarker objects.

    Returns:
        (tokens, warnings). Unknown tags become literal text + warning.
        Excess SFX beyond limit become literal text + warning.
    """
    if not text:
        return [TextSegment(text="")], []

    tokens: list[SfxToken] = []
    warnings: list[SpeechWarning] = []
    sfx_count = 0
    pos = 0

    for match in _SFX_TAG.finditer(text):
        tag_name = match.group(1).lower()
        start, end = match.start(), match.end()

        # Add text before this tag
        if start > pos:
            before = text[pos:start]
            if before.strip():
                tokens.append(TextSegment(text=before))

        if tag_name not in _KNOWN_TAGS:
            # Unknown tag → literal text + warning
            warnings.append(SpeechWarning(
                code="sfx_unknown_tag",
                message=f"Unknown SFX tag '[{match.group(1)}]', kept as literal text",
                original=match.group(0),
                resolved="literal",
            ))
            tokens.append(TextSegment(text=match.group(0)))
        elif sfx_count >= MAX_SFX_PER_REQUEST:
            # Over limit → literal text + warning
            warnings.append(SpeechWarning(
                code="sfx_limit",
                message=f"SFX count exceeded {MAX_SFX_PER_REQUEST}, '[{tag_name}]' kept as literal",
                original=match.group(0),
                resolved="literal",
            ))
            tokens.append(TextSegment(text=match.group(0)))
        else:
            tokens.append(SfxMarker(tag=tag_name))
            sfx_count += 1

        pos = end

    # Add remaining text after last tag
    if pos < len(text):
        remaining = text[pos:]
        if remaining.strip():
            tokens.append(TextSegment(text=remaining))

    # If no tags were found, return the whole text as one segment
    if not tokens:
        tokens.append(TextSegment(text=text))

    return tokens, warnings
