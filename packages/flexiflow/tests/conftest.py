from __future__ import annotations

import sys
import textwrap
from pathlib import Path

import pytest

# Ensure tests directory is on path for fixture_states imports
_tests_dir = Path(__file__).parent
if str(_tests_dir) not in sys.path:
    sys.path.insert(0, str(_tests_dir))


@pytest.fixture
def example_config_yaml(tmp_path: Path) -> Path:
    p = tmp_path / "config.yaml"
    p.write_text(
        textwrap.dedent(
            """\
            name: example_component
            rules:
              - rule1: "..."
            initial_state: "InitialState"
            """
        ),
        encoding="utf-8",
    )
    return p


@pytest.fixture
def example_rules_yaml(tmp_path: Path) -> Path:
    p = tmp_path / "new_rules.yaml"
    p.write_text(
        textwrap.dedent(
            """\
            rules:
              - rule2: "..."
              - rule3: "..."
            """
        ),
        encoding="utf-8",
    )
    return p
