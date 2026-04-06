"""Hardening tests: adversarial inputs, edge cases, and robustness checks."""

import zipfile

from zip_meta_map.builder import build, validate_index

# ── Path traversal in ZIPs ──


def test_zip_with_path_traversal_flagged(tmp_path):
    """Files with ../  in path should get path_traversal risk flag."""
    zip_path = tmp_path / "evil.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("normal.py", "print('hello')")
        zf.writestr("../escape.py", "print('escaped')")

    _, index = build(zip_path)
    validate_index(index)

    traversal_files = [f for f in index["files"] if "path_traversal" in f.get("risk_flags", [])]
    assert len(traversal_files) >= 1

    # Should also generate a warning
    warnings = index.get("warnings", [])
    assert any("traversal" in w.lower() for w in warnings)


def test_zip_with_deeply_nested_traversal(tmp_path):
    """Deep path traversal like ../../etc/passwd should be flagged."""
    zip_path = tmp_path / "deep_evil.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("safe/readme.md", "# Hello")
        zf.writestr("safe/../../etc/passwd", "root:x:0:0")

    _, index = build(zip_path)
    validate_index(index)

    flagged = [f for f in index["files"] if "path_traversal" in f.get("risk_flags", [])]
    assert len(flagged) >= 1


# ── Binary masquerading ──


def test_zip_binary_masquerade_detected(tmp_path):
    """A .py file with binary content should get binary_masquerade flag."""
    zip_path = tmp_path / "masq.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("normal.py", "print('ok')")
        # Write binary data with null bytes to a .py file
        zf.writestr("evil.py", b"print('ok')\x00\x00\x00BINARY_PAYLOAD".decode("latin-1"))

    _, index = build(zip_path)
    validate_index(index)

    masq = [f for f in index["files"] if "binary_masquerade" in f.get("risk_flags", [])]
    assert len(masq) >= 1


def test_zip_binary_executable_flagged(tmp_path):
    """Known binary extensions (.exe, .dll) should be flagged."""
    zip_path = tmp_path / "bins.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("readme.md", "# App")
        zf.writestr("app.exe", b"\x4d\x5a\x90\x00".decode("latin-1"))  # MZ header
        zf.writestr("helper.dll", b"\x4d\x5a\x90\x00".decode("latin-1"))

    _, index = build(zip_path)
    validate_index(index)

    bins = [f for f in index["files"] if "binary_executable" in f.get("risk_flags", [])]
    assert len(bins) == 2


# ── Secrets detection ──


def test_zip_secrets_detected(tmp_path):
    """Files with secret-like patterns should be flagged."""
    zip_path = tmp_path / "secrets.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("config.py", 'API_KEY = "sk-abc123def456ghi789jkl012mno345"')
        zf.writestr("safe.py", "print('no secrets here')")

    _, index = build(zip_path)
    validate_index(index)

    secrets = [f for f in index["files"] if "secrets_like" in f.get("risk_flags", [])]
    assert len(secrets) >= 1

    warnings = index.get("warnings", [])
    assert any("secrets" in w.lower() or "credentials" in w.lower() for w in warnings)


# ── Empty and minimal ZIPs ──


def test_empty_zip(tmp_path):
    """An empty ZIP should produce a valid but empty index."""
    zip_path = tmp_path / "empty.zip"
    with zipfile.ZipFile(zip_path, "w"):
        pass

    _, index = build(zip_path)
    validate_index(index)
    assert index["files"] == []
    assert index["start_here"] == []


def test_single_file_zip(tmp_path):
    """A ZIP with one file should still produce a valid index."""
    zip_path = tmp_path / "single.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("hello.txt", "world")

    _, index = build(zip_path)
    validate_index(index)
    assert len(index["files"]) == 1
    assert index["files"][0]["path"] == "hello.txt"


# ── Weird encodings ──


def test_zip_with_non_utf8_content(tmp_path):
    """Files that can't be decoded as UTF-8 should still be indexed (without content flags)."""
    zip_path = tmp_path / "encoding.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("readme.md", "# OK")
        # Write Latin-1 encoded content
        zf.writestr("data.bin", bytes(range(128, 256)))

    _, index = build(zip_path)
    validate_index(index)
    assert len(index["files"]) == 2


def test_zip_with_very_long_filename(tmp_path):
    """Files with very long names should still be indexed."""
    zip_path = tmp_path / "longnames.zip"
    long_name = "a" * 200 + ".py"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr(long_name, "print('long name')")

    _, index = build(zip_path)
    validate_index(index)
    assert len(index["files"]) == 1


# ── Large file handling ──


def test_zip_large_text_gets_chunked(tmp_path):
    """Files > 32KB should get chunk maps."""
    zip_path = tmp_path / "large.zip"
    large_content = "\n".join(f"# Line {i}\nprint('hello {i}')" for i in range(2000))
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("big.py", large_content)

    _, index = build(zip_path)
    validate_index(index)

    big_file = index["files"][0]
    assert "chunks" in big_file, "Large file should have chunks"
    assert len(big_file["chunks"]) >= 1
    assert "capabilities" in index
    assert "chunks" in index["capabilities"]


# ── Empty directory in ZIP ──


def test_zip_with_only_directories(tmp_path):
    """A ZIP with only directory entries should produce an empty file list."""
    zip_path = tmp_path / "dirs_only.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        # Add directory entries
        zf.mkdir("src/")
        zf.mkdir("tests/")

    _, index = build(zip_path)
    validate_index(index)
    assert index["files"] == []


# ── Duplicate paths in ZIP ──


def test_zip_with_duplicate_entries(tmp_path):
    """Duplicate filenames in ZIP should be handled gracefully."""
    zip_path = tmp_path / "dupes.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("readme.md", "# Version 1")
        zf.writestr("readme.md", "# Version 2")

    # Should not crash
    _, index = build(zip_path)
    validate_index(index)


# ── Mixed risk flags ──


def test_zip_multiple_risk_flags_per_file(tmp_path):
    """A single file can have multiple risk flags."""
    zip_path = tmp_path / "multi_risk.zip"
    content = """
import subprocess
import requests

API_KEY = "sk-test1234567890abcdef1234567890"

def run():
    subprocess.run(["ls"])
    requests.get("https://evil.com")
"""
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("risky.py", content)

    _, index = build(zip_path)
    validate_index(index)

    risky = index["files"][0]
    flags = risky.get("risk_flags", [])
    assert "exec_shell" in flags
    assert "secrets_like" in flags
    assert "network_io" in flags


# ── Schema strictness ──


def test_all_generated_indices_validate(tmp_path):
    """Build with every profile and verify schema validates."""
    from zip_meta_map.profiles import ALL_PROFILES

    for profile_name in ALL_PROFILES:
        zip_path = tmp_path / f"{profile_name}.zip"
        with zipfile.ZipFile(zip_path, "w") as zf:
            zf.writestr("readme.md", f"# Test {profile_name}")
            zf.writestr("main.py", "print('test')")

        _, index = build(zip_path, profile_name=profile_name)
        validate_index(index)
        assert index["profile"] == profile_name


# ── Capabilities correctness ──


def test_capabilities_only_advertised_when_present(tmp_path):
    """Capabilities should only list features that actually appear."""
    zip_path = tmp_path / "minimal.zip"
    with zipfile.ZipFile(zip_path, "w") as zf:
        zf.writestr("x.txt", "hello")

    _, index = build(zip_path)
    validate_index(index)

    caps = index.get("capabilities", [])

    # Verify each advertised capability is actually present
    if "chunks" in caps:
        assert any(f.get("chunks") for f in index["files"])
    if "excerpts" in caps:
        assert any(f.get("excerpt") for f in index["files"])
    if "modules" in caps:
        assert len(index.get("modules", [])) > 0
    if "risk_flags" in caps:
        assert any(f.get("risk_flags") for f in index["files"])
    if "warnings" in caps:
        assert len(index.get("warnings", [])) > 0
