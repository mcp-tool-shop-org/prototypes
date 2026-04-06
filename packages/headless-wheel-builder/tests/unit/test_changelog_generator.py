"""Tests for changelog generator module."""

from __future__ import annotations

import json

from headless_wheel_builder.changelog.generator import (
    Changelog,
    ChangelogConfig,
    ChangelogEntry,
    ChangelogFormat,
)
from headless_wheel_builder.changelog.parser import CommitType, ConventionalCommit


def _commit(
    type: CommitType = CommitType.FEAT,
    description: str = "add feature",
    scope: str | None = None,
    sha: str | None = "abc1234",
    breaking: bool = False,
    breaking_description: str | None = None,
) -> ConventionalCommit:
    # Build a raw message matching what the parser would produce
    prefix = type.value
    if scope:
        prefix += f"({scope})"
    if breaking:
        prefix += "!"
    raw = f"{prefix}: {description}"
    return ConventionalCommit(
        raw=raw,
        type=type,
        description=description,
        scope=scope,
        sha=sha,
        breaking=breaking,
        breaking_description=breaking_description,
    )


class TestChangelogEntry:
    """Test ChangelogEntry formatting."""

    def test_basic(self) -> None:
        entry = ChangelogEntry.from_commit(_commit(description="add login"))
        assert "add login" in entry.formatted
        assert "abc1234" in entry.formatted

    def test_with_scope(self) -> None:
        entry = ChangelogEntry.from_commit(_commit(scope="auth", description="add login"))
        assert "**auth:**" in entry.formatted
        assert "add login" in entry.formatted

    def test_no_sha(self) -> None:
        entry = ChangelogEntry.from_commit(_commit(sha=None), show_sha=True)
        assert "(" not in entry.formatted

    def test_hide_sha(self) -> None:
        entry = ChangelogEntry.from_commit(_commit(), show_sha=False)
        assert "abc1234" not in entry.formatted

    def test_hide_scope(self) -> None:
        entry = ChangelogEntry.from_commit(_commit(scope="auth"), show_scope=False)
        assert "**auth:**" not in entry.formatted


class TestChangelogMarkdown:
    """Test Changelog.to_markdown()."""

    def test_empty(self) -> None:
        config = ChangelogConfig()
        cl = Changelog(config=config, commits=[])
        md = cl.to_markdown()
        assert md == ""

    def test_with_tag(self) -> None:
        config = ChangelogConfig(tag="v1.0.0")
        cl = Changelog(config=config, commits=[_commit()])
        md = cl.to_markdown()
        assert "## v1.0.0" in md

    def test_feat_section(self) -> None:
        config = ChangelogConfig()
        cl = Changelog(config=config, commits=[_commit(description="new endpoint")])
        md = cl.to_markdown()
        assert "Features" in md
        assert "new endpoint" in md

    def test_fix_section(self) -> None:
        config = ChangelogConfig()
        cl = Changelog(
            config=config, commits=[_commit(type=CommitType.FIX, description="crash fix")]
        )
        md = cl.to_markdown()
        assert "Bug Fixes" in md
        assert "crash fix" in md

    def test_breaking_changes_first(self) -> None:
        config = ChangelogConfig()
        commits = [
            _commit(description="add feature"),
            _commit(
                description="remove API", breaking=True, breaking_description="Old API removed"
            ),
        ]
        cl = Changelog(config=config, commits=commits)
        md = cl.to_markdown()
        # Breaking should appear before features
        breaking_pos = md.index("BREAKING")
        features_pos = md.index("Features")
        assert breaking_pos < features_pos

    def test_flat_list_mode(self) -> None:
        config = ChangelogConfig(group_by_type=False)
        cl = Changelog(
            config=config, commits=[_commit(), _commit(type=CommitType.FIX, description="fix bug")]
        )
        md = cl.to_markdown()
        # Should NOT have section headers
        assert "### " not in md or "BREAKING" in md
        assert "- " in md


class TestChangelogPlain:
    """Test Changelog.to_plain()."""

    def test_with_tag(self) -> None:
        config = ChangelogConfig(tag="v2.0.0", format=ChangelogFormat.PLAIN)
        cl = Changelog(config=config, commits=[_commit()])
        text = cl.to_plain()
        assert "Release v2.0.0" in text

    def test_breaking_section(self) -> None:
        config = ChangelogConfig(format=ChangelogFormat.PLAIN)
        cl = Changelog(
            config=config,
            commits=[_commit(breaking=True, breaking_description="Removed old API")],
        )
        text = cl.to_plain()
        assert "BREAKING CHANGES:" in text
        assert "Removed old API" in text


class TestChangelogGitHub:
    """Test Changelog.to_github()."""

    def test_whats_changed_header(self) -> None:
        config = ChangelogConfig(format=ChangelogFormat.GITHUB)
        cl = Changelog(config=config, commits=[_commit()])
        gh = cl.to_github()
        assert "## What's Changed" in gh

    def test_features_and_fixes(self) -> None:
        config = ChangelogConfig()
        commits = [
            _commit(description="new button"),
            _commit(type=CommitType.FIX, description="fix scroll"),
        ]
        cl = Changelog(config=config, commits=commits)
        gh = cl.to_github()
        assert "new button" in gh
        assert "fix scroll" in gh

    def test_other_types_grouped(self) -> None:
        config = ChangelogConfig()
        commits = [
            _commit(type=CommitType.DOCS, description="update readme"),
            _commit(type=CommitType.CHORE, description="bump deps"),
        ]
        cl = Changelog(config=config, commits=commits)
        gh = cl.to_github()
        assert "Other Changes" in gh


class TestChangelogJSON:
    """Test Changelog.to_json()."""

    def test_structure(self) -> None:
        config = ChangelogConfig(tag="v3.0.0")
        commits = [
            _commit(description="add feature"),
            _commit(type=CommitType.FIX, description="fix bug"),
            _commit(description="break things", breaking=True),
        ]
        cl = Changelog(config=config, commits=commits)
        data = cl.to_json()

        assert data["tag"] == "v3.0.0"
        assert data["stats"]["total_commits"] == 3
        assert data["stats"]["features"] == 2  # feat + breaking feat
        assert data["stats"]["fixes"] == 1
        assert data["stats"]["breaking_changes"] == 1
        assert len(data["breaking_changes"]) == 1

    def test_json_serializable(self) -> None:
        config = ChangelogConfig(tag="v1.0.0")
        cl = Changelog(config=config, commits=[_commit()])
        # Should not raise
        json.dumps(cl.to_json())


class TestChangelogRender:
    """Test Changelog.render() dispatch."""

    def test_markdown(self) -> None:
        config = ChangelogConfig(format=ChangelogFormat.MARKDOWN, tag="v1.0")
        cl = Changelog(config=config, commits=[_commit()])
        assert "## v1.0" in cl.render()

    def test_plain(self) -> None:
        config = ChangelogConfig(format=ChangelogFormat.PLAIN, tag="v1.0")
        cl = Changelog(config=config, commits=[_commit()])
        assert "Release v1.0" in cl.render()

    def test_github(self) -> None:
        config = ChangelogConfig(format=ChangelogFormat.GITHUB)
        cl = Changelog(config=config, commits=[_commit()])
        assert "What's Changed" in cl.render()

    def test_json(self) -> None:
        config = ChangelogConfig(format=ChangelogFormat.JSON, tag="v1.0")
        cl = Changelog(config=config, commits=[_commit()])
        data = json.loads(cl.render())
        assert data["tag"] == "v1.0"
