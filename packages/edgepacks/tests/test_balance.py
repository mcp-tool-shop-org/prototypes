"""Tests for balance analysis."""

from edgepacks.foundry.balance import BalanceStage, analyze_balance
from edgepacks.schema.pack import PackSpec


class TestAnalyzeBalance:
    def test_reports_counts(self, sample_pack: PackSpec):
        report = analyze_balance(sample_pack)
        assert report.total == len(sample_pack.examples)
        assert sum(report.label_counts.values()) > 0

    def test_no_label_space(self, sample_pack: PackSpec):
        pack = sample_pack.model_copy(update={"label_space": None})
        report = analyze_balance(pack)
        assert report.label_counts == {}

    def test_balance_ratio(self, sample_pack: PackSpec):
        report = analyze_balance(sample_pack)
        assert 0.0 <= report.balance_ratio <= 1.0


class TestBalanceStage:
    def test_stage_runs(self, sample_pack: PackSpec):
        stage = BalanceStage()
        result = stage(sample_pack)
        assert "_balance_report" in result.generation_config
