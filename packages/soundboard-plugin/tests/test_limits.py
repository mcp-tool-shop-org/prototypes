"""Tests for speech.limits pure functions."""

from __future__ import annotations

from voice_soundboard_plugin.speech.limits import (
    MAX_TEXT_LENGTH,
    SPEED_MAX,
    SPEED_MIN,
    clamp_speed,
    truncate_text,
)


def test_clamp_speed_below_min():
    speed, warning = clamp_speed(0.3)
    assert speed == SPEED_MIN
    assert warning is not None
    assert warning.code == "speed_clamped"
    assert warning.original == 0.3
    assert warning.resolved == SPEED_MIN


def test_clamp_speed_above_max():
    speed, warning = clamp_speed(3.0)
    assert speed == SPEED_MAX
    assert warning is not None
    assert warning.original == 3.0


def test_clamp_speed_normal():
    speed, warning = clamp_speed(1.0)
    assert speed == 1.0
    assert warning is None


def test_clamp_speed_at_boundaries():
    speed_lo, w_lo = clamp_speed(SPEED_MIN)
    assert speed_lo == SPEED_MIN
    assert w_lo is None

    speed_hi, w_hi = clamp_speed(SPEED_MAX)
    assert speed_hi == SPEED_MAX
    assert w_hi is None


def test_truncate_text_short():
    text, warning = truncate_text("short")
    assert text == "short"
    assert warning is None


def test_truncate_text_at_limit():
    text, warning = truncate_text("x" * MAX_TEXT_LENGTH)
    assert len(text) == MAX_TEXT_LENGTH
    assert warning is None


def test_truncate_text_over_limit():
    text, warning = truncate_text("x" * 20_000)
    assert len(text) == MAX_TEXT_LENGTH
    assert warning is not None
    assert warning.code == "text_truncated"
    assert warning.original == 20_000
    assert warning.resolved == MAX_TEXT_LENGTH
