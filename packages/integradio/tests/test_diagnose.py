"""Tests for integradio.diagnose module."""

from unittest.mock import MagicMock, patch

from integradio.diagnose import CheckResult, DiagnoseReport, _check_core_deps, diagnose


def test_diagnose_returns_report():
    """diagnose() returns a DiagnoseReport with version and checks."""
    report = diagnose()
    assert isinstance(report, DiagnoseReport)
    assert report.version == "1.0.1"
    assert report.python  # non-empty


def test_report_to_dict():
    """to_dict() produces a JSON-serializable dict."""
    report = diagnose()
    d = report.to_dict()
    assert d["version"] == "1.0.1"
    assert isinstance(d["checks"], list)
    assert isinstance(d["ok"], bool)


def test_report_str():
    """__str__() produces human-readable output."""
    report = diagnose()
    text = str(report)
    assert "integradio 1.0.1" in text
    assert "Overall:" in text


def test_check_result_to_dict():
    """CheckResult.to_dict() returns expected keys."""
    cr = CheckResult("test", "ok", "all good")
    d = cr.to_dict()
    assert d == {"name": "test", "status": "ok", "detail": "all good"}


def test_report_ok_all_pass():
    """Report.ok is True when no checks have 'fail' status."""
    report = DiagnoseReport(version="1.0.0", python="3.12.0")
    report.checks = [
        CheckResult("a", "ok", "fine"),
        CheckResult("b", "warn", "optional missing"),
    ]
    assert report.ok is True


def test_report_ok_with_failure():
    """Report.ok is False when any check has 'fail' status."""
    report = DiagnoseReport(version="1.0.0", python="3.12.0")
    report.checks = [
        CheckResult("a", "ok", "fine"),
        CheckResult("b", "fail", "missing"),
    ]
    assert report.ok is False


def test_core_deps_detected():
    """Core deps (gradio, numpy, httpx, pandas) are checked."""
    results = _check_core_deps()
    names = [r.name for r in results]
    assert "gradio" in names
    assert "numpy" in names
    assert "httpx" in names
    assert "pandas" in names


def test_ollama_unreachable():
    """When Ollama is not running, check returns warn status."""
    import httpx as _httpx

    with patch.object(_httpx, "get", side_effect=ConnectionError("refused")):
        report = diagnose()
        ollama_checks = [c for c in report.checks if c.name == "ollama"]
        assert len(ollama_checks) == 1
        assert ollama_checks[0].status == "warn"


def test_ollama_with_embed_models():
    """When Ollama has embed models, check returns ok."""
    import httpx as _httpx

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "models": [
            {"name": "nomic-embed-text:latest"},
            {"name": "llama3.2:latest"},
        ]
    }
    with patch.object(_httpx, "get", return_value=mock_resp):
        report = diagnose()
        ollama_checks = [c for c in report.checks if c.name == "ollama"]
        assert ollama_checks[0].status == "ok"
        assert "nomic-embed-text" in ollama_checks[0].detail
