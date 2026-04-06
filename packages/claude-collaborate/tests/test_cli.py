"""Tests for CLI --version and --help flags."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

import server

SERVER_PY = str(Path(__file__).parent.parent / "server.py")


def test_server_version_flag():
    """server.py --version prints the exact __version__ and exits 0."""
    result = subprocess.run(
        [sys.executable, SERVER_PY, "--version"],
        capture_output=True, text=True, timeout=5
    )
    assert result.returncode == 0
    assert "claude-collaborate" in result.stdout
    assert server.__version__ in result.stdout


def test_server_version_short_flag():
    """server.py -V prints version and exits 0."""
    result = subprocess.run(
        [sys.executable, SERVER_PY, "-V"],
        capture_output=True, text=True, timeout=5
    )
    assert result.returncode == 0
    assert "claude-collaborate" in result.stdout


def test_server_help_flag():
    """server.py --help prints usage and exits 0."""
    result = subprocess.run(
        [sys.executable, SERVER_PY, "--help"],
        capture_output=True, text=True, timeout=5
    )
    assert result.returncode == 0
    assert "Usage" in result.stdout
    assert "--version" in result.stdout


def test_server_help_short_flag():
    """server.py -h prints usage and exits 0."""
    result = subprocess.run(
        [sys.executable, SERVER_PY, "-h"],
        capture_output=True, text=True, timeout=5
    )
    assert result.returncode == 0
    assert "Usage" in result.stdout


def test_server_help_mentions_port():
    """server.py --help output references the default port so users know how to connect."""
    result = subprocess.run(
        [sys.executable, SERVER_PY, "--help"],
        capture_output=True, text=True, timeout=5
    )
    assert result.returncode == 0
    assert str(server.PORT) in result.stdout


def test_server_port_flag_invalid_value():
    """server.py --port with a non-integer value exits with error."""
    result = subprocess.run(
        [sys.executable, SERVER_PY, "--port", "abc"],
        capture_output=True, text=True, timeout=5
    )
    assert result.returncode == 1
    assert "Error" in result.stdout


def test_server_port_flag_missing_value():
    """server.py --port without a following value exits with error."""
    result = subprocess.run(
        [sys.executable, SERVER_PY, "--port"],
        capture_output=True, text=True, timeout=5
    )
    assert result.returncode == 1
    assert "Error" in result.stdout
