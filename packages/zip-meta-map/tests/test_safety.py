"""Tests for safety guardrails: risk flags and warnings."""

from zip_meta_map.safety import detect_risk_flags, detect_warnings

# ── Risk flag detection ──


def test_risk_path_traversal():
    flags = detect_risk_flags("../../../etc/passwd", None, 100)
    assert "path_traversal" in flags


def test_risk_no_path_traversal():
    flags = detect_risk_flags("src/main.py", None, 100)
    assert "path_traversal" not in flags


def test_risk_binary_executable():
    flags = detect_risk_flags("payload.exe", None, 1000)
    assert "binary_executable" in flags


def test_risk_binary_masquerade():
    content = b"normal text\x00hidden binary"
    flags = detect_risk_flags("readme.py", content, len(content))
    assert "binary_masquerade" in flags


def test_risk_no_binary_masquerade_for_text():
    content = b"print('hello world')\n"
    flags = detect_risk_flags("main.py", content, len(content))
    assert "binary_masquerade" not in flags


def test_risk_exec_shell():
    content = b"import subprocess\nsubprocess.run(['ls'])\n"
    flags = detect_risk_flags("run.py", content, len(content))
    assert "exec_shell" in flags


def test_risk_secrets_like():
    content = b'API_KEY = "sk-abc123def456ghi789jkl012"\n'
    flags = detect_risk_flags("config.py", content, len(content))
    assert "secrets_like" in flags


def test_risk_network_io():
    content = b"import requests\nrequests.get('https://example.com')\n"
    flags = detect_risk_flags("fetch.py", content, len(content))
    assert "network_io" in flags


def test_risk_no_flags_clean_file():
    content = b"def add(a, b):\n    return a + b\n"
    flags = detect_risk_flags("math.py", content, len(content))
    assert flags == []


def test_risk_non_utf8_skips_content_checks():
    """Binary content that can't decode should not crash."""
    content = bytes(range(256))
    flags = detect_risk_flags("data.py", content, len(content))
    # Should still detect binary_masquerade but not crash on content parsing
    assert "binary_masquerade" in flags


# ── Warning generation ──


def test_warnings_path_traversal():
    entries = [{"path": "../secret.txt", "role": "unknown", "risk_flags": ["path_traversal"]}]
    warnings = detect_warnings(entries, [])
    assert any("traversal" in w.lower() for w in warnings)


def test_warnings_binary_executables():
    entries = [{"path": "bin/tool.exe", "role": "unknown", "risk_flags": ["binary_executable"]}]
    warnings = detect_warnings(entries, [])
    assert any("binary" in w.lower() for w in warnings)


def test_warnings_secrets():
    entries = [{"path": "config.py", "role": "config", "risk_flags": ["secrets_like"]}]
    warnings = detect_warnings(entries, [])
    assert any("secret" in w.lower() for w in warnings)


def test_warnings_critical_dir_ignored():
    warnings = detect_warnings([], ["auth/**"])
    assert any("auth" in w.lower() for w in warnings)


def test_warnings_none_when_clean():
    entries = [{"path": "main.py", "role": "source", "risk_flags": []}]
    warnings = detect_warnings(entries, [])
    assert warnings == []
