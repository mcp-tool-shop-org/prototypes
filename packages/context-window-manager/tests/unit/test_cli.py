"""Tests for __main__.py CLI flags."""

import sys
from unittest.mock import patch


class TestVersionFlag:
    """Test --version / -V flag."""

    def test_version_returns_zero(self):
        from context_window_manager.__main__ import main

        with patch.object(sys, "argv", ["cwm", "--version"]):
            assert main() == 0

    def test_version_short_flag(self):
        from context_window_manager.__main__ import main

        with patch.object(sys, "argv", ["cwm", "-V"]):
            assert main() == 0

    def test_version_prints_output(self, capsys):
        from context_window_manager.__main__ import main

        with patch.object(sys, "argv", ["cwm", "--version"]):
            main()
        captured = capsys.readouterr()
        assert "cwm v" in captured.out
        assert captured.out.strip().startswith("cwm v")


class TestDiagnoseFlag:
    """Test --diagnose flag."""

    def test_diagnose_returns_zero(self):
        from context_window_manager.__main__ import main

        with patch.object(sys, "argv", ["cwm", "--diagnose"]):
            assert main() == 0

    def test_diagnose_prints_version(self, capsys):
        from context_window_manager.__main__ import main

        with patch.object(sys, "argv", ["cwm", "--diagnose"]):
            main()
        captured = capsys.readouterr()
        assert "cwm v" in captured.out

    def test_diagnose_prints_python_info(self, capsys):
        from context_window_manager.__main__ import main

        with patch.object(sys, "argv", ["cwm", "--diagnose"]):
            main()
        captured = capsys.readouterr()
        assert "Python" in captured.out

    def test_diagnose_prints_storage_info(self, capsys):
        from context_window_manager.__main__ import main

        with patch.object(sys, "argv", ["cwm", "--diagnose"]):
            main()
        captured = capsys.readouterr()
        assert "Storage" in captured.out


class TestHelpFlag:
    """Test --help flag."""

    def test_help_returns_zero(self):
        from context_window_manager.__main__ import main

        with patch.object(sys, "argv", ["cwm", "--help"]):
            assert main() == 0

    def test_help_prints_usage(self, capsys):
        from context_window_manager.__main__ import main

        with patch.object(sys, "argv", ["cwm", "--help"]):
            main()
        captured = capsys.readouterr()
        assert "cwm" in captured.out
        assert "--version" in captured.out
        assert "--diagnose" in captured.out
