"""Deduplication — exact hash and optional fuzzy MinHash."""

from __future__ import annotations

import hashlib
import json
import logging
from dataclasses import dataclass
from typing import Any

from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec

logger = logging.getLogger(__name__)


@dataclass
class DedupReport:
    """Stats from deduplication."""

    before: int = 0
    after: int = 0
    exact_removed: int = 0
    fuzzy_removed: int = 0


def _canonical_hash(example: Example) -> str:
    """SHA-256 of canonical JSON representation of (input, output)."""
    payload = json.dumps(
        {"input": example.input, "output": example.output},
        sort_keys=True,
        ensure_ascii=True,
    )
    return hashlib.sha256(payload.encode()).hexdigest()


def _tokenize(text: str) -> list[str]:
    """Simple whitespace + lowercased tokenization for fuzzy matching."""
    return text.lower().split()


def _ngram_jaccard(a: list[str], b: list[str], n: int = 3) -> float:
    """Approximate Jaccard similarity using character n-grams. Pure Python fallback."""
    def ngrams(tokens: list[str]) -> set[str]:
        text = " ".join(tokens)
        return {text[i : i + n] for i in range(len(text) - n + 1)} if len(text) >= n else {text}

    set_a = ngrams(a)
    set_b = ngrams(b)
    if not set_a and not set_b:
        return 1.0
    intersection = len(set_a & set_b)
    union = len(set_a | set_b)
    return intersection / union if union > 0 else 0.0


def _example_text(example: Example) -> str:
    """Flatten example input into a text string for fuzzy comparison."""
    parts = []
    for v in example.input.values():
        if isinstance(v, str):
            parts.append(v)
        elif isinstance(v, list):
            parts.extend(str(item) for item in v)
    return " ".join(parts)


def dedup_exact(examples: list[Example]) -> tuple[list[Example], int]:
    """Remove exact duplicates by content hash."""
    seen: set[str] = set()
    kept: list[Example] = []
    removed = 0

    for ex in examples:
        h = _canonical_hash(ex)
        if h in seen:
            removed += 1
        else:
            seen.add(h)
            kept.append(ex)

    return kept, removed


def dedup_fuzzy(
    examples: list[Example], threshold: float = 0.85
) -> tuple[list[Example], int]:
    """Remove near-duplicates using n-gram Jaccard similarity.

    This is the pure-Python fallback. Install edgepacks[fuzzy] for MinHash.
    O(n^2) but fine for <10k examples.
    """
    try:
        import datasketch  # noqa: F401

        return _dedup_fuzzy_minhash(examples, threshold)
    except ImportError:
        pass

    kept: list[Example] = []
    removed = 0
    kept_tokens: list[list[str]] = []

    for ex in examples:
        tokens = _tokenize(_example_text(ex))
        is_dup = False
        for existing in kept_tokens:
            if _ngram_jaccard(tokens, existing) >= threshold:
                is_dup = True
                break
        if is_dup:
            removed += 1
        else:
            kept.append(ex)
            kept_tokens.append(tokens)

    return kept, removed


def _dedup_fuzzy_minhash(
    examples: list[Example], threshold: float = 0.85
) -> tuple[list[Example], int]:
    """MinHash LSH deduplication (requires datasketch)."""
    from datasketch import MinHash, MinHashLSH

    num_perm = 128
    lsh = MinHashLSH(threshold=threshold, num_perm=num_perm)
    minhashes: list[MinHash] = []

    for i, ex in enumerate(examples):
        m = MinHash(num_perm=num_perm)
        for token in _tokenize(_example_text(ex)):
            m.update(token.encode("utf-8"))
        minhashes.append(m)
        try:
            lsh.insert(str(i), m)
        except ValueError:
            pass  # Duplicate detected by LSH

    kept: list[Example] = []
    seen_buckets: set[str] = set()
    removed = 0

    for i, ex in enumerate(examples):
        result = lsh.query(minhashes[i])
        bucket_key = min(result)
        if bucket_key in seen_buckets and bucket_key != str(i):
            removed += 1
        else:
            seen_buckets.add(str(i))
            kept.append(ex)

    return kept, removed


class DeduplicateStage:
    """Foundry stage: remove duplicate examples."""

    name = "deduplicate"

    def __call__(self, pack: PackSpec, config: dict[str, Any] | None = None) -> PackSpec:
        config = config or {}
        fuzzy_threshold = config.get("fuzzy_threshold", 0.85)
        skip_fuzzy = config.get("skip_fuzzy", False)

        report = DedupReport(before=len(pack.examples))

        examples, exact_removed = dedup_exact(pack.examples)
        report.exact_removed = exact_removed

        if not skip_fuzzy and len(examples) > 1:
            examples, fuzzy_removed = dedup_fuzzy(examples, fuzzy_threshold)
            report.fuzzy_removed = fuzzy_removed

        report.after = len(examples)

        logger.info(
            "Dedup: %d → %d (-%d exact, -%d fuzzy)",
            report.before,
            report.after,
            report.exact_removed,
            report.fuzzy_removed,
        )

        return pack.model_copy(update={"examples": examples})
