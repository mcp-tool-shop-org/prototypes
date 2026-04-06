"""File system and ZIP archive scanning."""

from __future__ import annotations

import hashlib
import json
import os
import zipfile
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from fnmatch import fnmatch
from pathlib import Path, PurePosixPath


@dataclass
class ScannedFile:
    path: str
    size_bytes: int
    sha256: str
    content: bytes | None = None


def _should_ignore(path: str, ignore_globs: list[str]) -> bool:
    """Check if a path matches any ignore glob."""
    posix = PurePosixPath(path)
    path_str = str(posix)
    for glob in ignore_globs:
        if fnmatch(path_str, glob):
            return True
        # For directory globs like "__pycache__/**", check if any path
        # component matches the directory name. Only applies to simple
        # globs without ** prefix (those are handled by fnmatch above).
        if glob.endswith("/**") and not glob.startswith("**/"):
            dir_name = glob.split("/")[0]
            for part in posix.parts:
                if fnmatch(part, dir_name):
                    return True
        # For **/dir/** patterns, check if any component matches the dir name
        if glob.startswith("**/") and glob.endswith("/**"):
            dir_name = glob.split("/")[1]
            for part in posix.parts[:-1]:  # skip the filename itself
                if fnmatch(part, dir_name):
                    return True
    return False


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def scan_directory(
    root: Path,
    ignore_globs: list[str],
    retain_content: bool = False,
) -> list[ScannedFile]:
    """Scan a directory and return a list of ScannedFile entries.

    Args:
        root: Directory to scan.
        ignore_globs: Patterns to exclude.
        retain_content: If True, keep file bytes in ScannedFile.content.
    """
    files: list[ScannedFile] = []
    root = root.resolve()

    for fpath in sorted(root.rglob("*")):
        if not fpath.is_file():
            continue
        rel = fpath.relative_to(root).as_posix()
        if _should_ignore(rel, ignore_globs):
            continue
        data = fpath.read_bytes()
        files.append(
            ScannedFile(
                path=rel,
                size_bytes=len(data),
                sha256=_sha256(data),
                content=data if retain_content else None,
            )
        )

    return files


def scan_directory_parallel(
    root: Path,
    ignore_globs: list[str],
    retain_content: bool = False,
    max_workers: int | None = None,
) -> list[ScannedFile]:
    """Scan a directory using parallel I/O for large repos.

    Uses a thread pool for file reading and hashing.
    Falls back to sequential scan for small directories (<100 files).
    """
    root = root.resolve()

    # Collect paths first (sequential — fast)
    paths: list[Path] = []
    for fpath in sorted(root.rglob("*")):
        if not fpath.is_file():
            continue
        rel = fpath.relative_to(root).as_posix()
        if _should_ignore(rel, ignore_globs):
            continue
        paths.append(fpath)

    # For small dirs, just use sequential scan
    if len(paths) < 100:
        return scan_directory(root, ignore_globs, retain_content)

    def _process_file(fpath: Path) -> ScannedFile:
        rel = fpath.relative_to(root).as_posix()
        data = fpath.read_bytes()
        return ScannedFile(
            path=rel,
            size_bytes=len(data),
            sha256=_sha256(data),
            content=data if retain_content else None,
        )

    workers = max_workers or min(os.cpu_count() or 4, 8)
    with ThreadPoolExecutor(max_workers=workers) as pool:
        results = list(pool.map(_process_file, paths))

    # Sort by path for deterministic output
    results.sort(key=lambda f: f.path)
    return results


def scan_zip(
    zip_path: Path,
    ignore_globs: list[str],
    retain_content: bool = False,
) -> list[ScannedFile]:
    """Scan a ZIP archive and return a list of ScannedFile entries."""
    files: list[ScannedFile] = []

    with zipfile.ZipFile(zip_path, "r") as zf:
        for info in sorted(zf.infolist(), key=lambda i: i.filename):
            if info.is_dir():
                continue
            rel = info.filename
            if _should_ignore(rel, ignore_globs):
                continue
            data = zf.read(info.filename)
            files.append(
                ScannedFile(
                    path=rel,
                    size_bytes=info.file_size,
                    sha256=_sha256(data),
                    content=data if retain_content else None,
                )
            )

    return files


# ── Incremental cache ──

_CACHE_VERSION = 1


def load_hash_cache(cache_path: Path) -> dict[str, dict]:
    """Load cached file hashes. Returns {path: {sha256, size, mtime}}."""
    if not cache_path.exists():
        return {}
    try:
        data = json.loads(cache_path.read_text(encoding="utf-8"))
        if data.get("version") != _CACHE_VERSION:
            return {}
        return data.get("entries", {})
    except (json.JSONDecodeError, KeyError):
        return {}


def save_hash_cache(cache_path: Path, entries: dict[str, dict]) -> None:
    """Save file hash cache."""
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    data = {"version": _CACHE_VERSION, "entries": entries}
    cache_path.write_text(json.dumps(data), encoding="utf-8")


def scan_directory_incremental(
    root: Path,
    ignore_globs: list[str],
    cache_path: Path,
    retain_content: bool = False,
) -> list[ScannedFile]:
    """Scan a directory using cached hashes for unchanged files.

    Files are considered unchanged when path + size + mtime match the cache.
    Changed files are re-hashed. The cache is updated after scanning.
    """
    cache = load_hash_cache(cache_path)
    files: list[ScannedFile] = []
    new_cache: dict[str, dict] = {}
    root = root.resolve()

    for fpath in sorted(root.rglob("*")):
        if not fpath.is_file():
            continue
        rel = fpath.relative_to(root).as_posix()
        if _should_ignore(rel, ignore_globs):
            continue

        stat = fpath.stat()
        size = stat.st_size
        mtime = stat.st_mtime

        cached = cache.get(rel)
        if cached and cached.get("size") == size and cached.get("mtime") == mtime:
            # Cache hit — use cached hash
            sha = cached["sha256"]
            content = fpath.read_bytes() if retain_content else None
        else:
            # Cache miss — hash the file
            data = fpath.read_bytes()
            sha = _sha256(data)
            content = data if retain_content else None

        new_cache[rel] = {"sha256": sha, "size": size, "mtime": mtime}
        files.append(ScannedFile(path=rel, size_bytes=size, sha256=sha, content=content))

    save_hash_cache(cache_path, new_cache)
    return files
