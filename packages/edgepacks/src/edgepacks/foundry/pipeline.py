"""Composable pipeline orchestrator for foundry stages."""

from __future__ import annotations

import logging
from typing import Any, Protocol

from edgepacks.schema.pack import PackSpec

logger = logging.getLogger(__name__)


class Stage(Protocol):
    """A single foundry stage that transforms a PackSpec."""

    name: str

    def __call__(self, pack: PackSpec, config: dict[str, Any] | None = None) -> PackSpec: ...


class Pipeline:
    """Chains foundry stages and runs them in sequence.

    Each stage receives the output of the previous stage. A failed stage
    raises without corrupting the original pack.
    """

    def __init__(self) -> None:
        self._stages: list[Stage] = []

    def add(self, stage: Stage) -> Pipeline:
        self._stages.append(stage)
        return self

    def dry_run(self) -> list[str]:
        """Return the names of stages that would run, in order."""
        return [s.name for s in self._stages]

    def run(
        self,
        pack: PackSpec,
        config: dict[str, Any] | None = None,
        on_stage_complete: Any = None,
    ) -> PackSpec:
        """Run all stages in sequence, returning the final PackSpec."""
        current = pack.model_copy(deep=True)
        for stage in self._stages:
            logger.info("Running stage: %s", stage.name)
            try:
                current = stage(current, config)
            except Exception:
                logger.exception("Stage '%s' failed", stage.name)
                raise
            if on_stage_complete:
                on_stage_complete(stage.name, current)
        return current

    def __len__(self) -> int:
        return len(self._stages)

    def __repr__(self) -> str:
        names = " → ".join(s.name for s in self._stages)
        return f"Pipeline({names})"
