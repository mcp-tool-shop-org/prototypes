"""Train/val/test splitting with stratification and leakage detection."""

from __future__ import annotations

import hashlib
import json
import logging
import random
from collections import defaultdict
from typing import Any

from edgepacks.schema.example import Example
from edgepacks.schema.pack import PackSpec
from edgepacks.schema.splits import SplitResult

logger = logging.getLogger(__name__)


def _input_hash(example: Example) -> str:
    """Hash just the input for leakage detection."""
    payload = json.dumps(example.input, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(payload.encode()).hexdigest()


def _get_stratify_value(example: Example, field: str) -> str:
    """Extract stratification value from an example's output."""
    val = example.output.get(field)
    if val is None:
        for v in example.output.values():
            if isinstance(v, str):
                return v
        return "__unknown__"
    return str(val)


def split_examples(
    examples: list[Example],
    train_ratio: float = 0.8,
    val_ratio: float = 0.1,
    seed: int = 42,
    stratify_by: str | None = None,
) -> SplitResult:
    """Partition examples into train/val/test with optional stratification."""
    if not examples:
        return SplitResult()

    rng = random.Random(seed)

    if stratify_by:
        return _stratified_split(examples, train_ratio, val_ratio, stratify_by, rng)

    shuffled = list(examples)
    rng.shuffle(shuffled)

    n = len(shuffled)
    train_end = int(n * train_ratio)
    val_end = train_end + int(n * val_ratio)

    return SplitResult(
        train=shuffled[:train_end],
        val=shuffled[train_end:val_end],
        test=shuffled[val_end:],
    )


def _stratified_split(
    examples: list[Example],
    train_ratio: float,
    val_ratio: float,
    stratify_by: str,
    rng: random.Random,
) -> SplitResult:
    """Split preserving label distribution across splits."""
    buckets: dict[str, list[Example]] = defaultdict(list)
    for ex in examples:
        key = _get_stratify_value(ex, stratify_by)
        buckets[key].append(ex)

    result = SplitResult()
    for _label, group in buckets.items():
        rng.shuffle(group)
        n = len(group)
        t_end = max(1, int(n * train_ratio))
        v_end = t_end + max(0, int(n * val_ratio))
        result.train.extend(group[:t_end])
        result.val.extend(group[t_end:v_end])
        result.test.extend(group[v_end:])

    rng.shuffle(result.train)
    rng.shuffle(result.val)
    rng.shuffle(result.test)
    return result


def check_leakage(split_result: SplitResult) -> tuple[SplitResult, int]:
    """Detect and remove input-level leakage between splits.

    If the same input appears in train AND val/test, remove it from val/test.
    """
    train_hashes = {_input_hash(ex) for ex in split_result.train}
    removed = 0

    clean_val = []
    for ex in split_result.val:
        if _input_hash(ex) in train_hashes:
            removed += 1
        else:
            clean_val.append(ex)

    clean_test = []
    for ex in split_result.test:
        if _input_hash(ex) in train_hashes:
            removed += 1
        else:
            clean_test.append(ex)

    return SplitResult(
        train=split_result.train,
        val=clean_val,
        test=clean_test,
        leaks_removed=removed,
    ), removed


class SplitStage:
    """Foundry stage: split pack into train/val/test and check for leakage."""

    name = "split"

    def __call__(self, pack: PackSpec, config: dict[str, Any] | None = None) -> PackSpec:
        sc = pack.split_config

        result = split_examples(
            pack.examples,
            train_ratio=sc.train_ratio,
            val_ratio=sc.val_ratio,
            seed=sc.seed,
            stratify_by=sc.stratify_by,
        )

        result, leaks = check_leakage(result)
        if leaks > 0:
            logger.warning("Removed %d leaked examples from val/test", leaks)

        logger.info(
            "Split: %d train / %d val / %d test (leaks removed: %d)",
            len(result.train),
            len(result.val),
            len(result.test),
            result.leaks_removed,
        )

        # Store split result in pack metadata via generation_config for now
        # The export layer reads this to write separate files
        all_examples = result.train + result.val + result.test
        return pack.model_copy(
            update={
                "examples": all_examples,
                "generation_config": {
                    **pack.generation_config,
                    "_split_result": {
                        "train_count": len(result.train),
                        "val_count": len(result.val),
                        "test_count": len(result.test),
                        "leaks_removed": result.leaks_removed,
                    },
                },
            }
        )
