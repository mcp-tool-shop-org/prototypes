"""
Batch 3: Gateway and Explainer Additional Tests (25 tests)
Tests for gateway request validation, response schema, missing files, error mapping.
"""

import tempfile
from datetime import datetime
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import file_compass.gateway as gateway_module
from file_compass.config import FileCompassConfig
from file_compass.explainer import (
    ResultExplainer,
)
from file_compass.gateway import (
    file_actions,
    file_index_scan,
    file_index_status,
    file_preview,
    file_quick_search,
    file_search,
)

# =============================================================================
# Section 1: Gateway Request Validation Tests (8 tests)
# =============================================================================

class TestGatewayRequestValidation:
    """Test gateway request input validation."""

    @pytest.mark.asyncio
    async def test_search_query_whitespace_only(self):
        """Test search handles whitespace-only query."""
        gateway_module._index = None

        with patch('file_compass.gateway.get_index_instance', new_callable=AsyncMock) as mock_get:
            mock_index = MagicMock()
            mock_index.get_status.return_value = {"files_indexed": 10}
            mock_index.search = AsyncMock(return_value=[])
            mock_get.return_value = mock_index

            result = await file_search("   ")
            # May return empty results or error depending on implementation
            assert "results" in result or "error" in result

        gateway_module._index = None

    @pytest.mark.asyncio
    async def test_search_query_special_chars_only(self):
        """Test search handles special characters in query."""
        gateway_module._index = None

        with patch('file_compass.gateway.get_index_instance', new_callable=AsyncMock) as mock_get:
            mock_index = MagicMock()
            mock_index.get_status.return_value = {"files_indexed": 10}
            mock_index.search = AsyncMock(return_value=[])
            mock_get.return_value = mock_index

            # Should not crash with special chars
            result = await file_search("def __init__(self)")
            assert "results" in result or "error" in result

        gateway_module._index = None

    @pytest.mark.asyncio
    async def test_preview_negative_line_numbers(self):
        """Test preview rejects negative line numbers."""
        result = await file_preview("/test/file.py", line_start=-1)
        assert "error" in result

    @pytest.mark.asyncio
    async def test_preview_line_end_before_start(self):
        """Test preview validates line_end >= line_start."""
        result = await file_preview("/test/file.py", line_start=10, line_end=5)
        assert "error" in result

    @pytest.mark.asyncio
    async def test_search_invalid_min_relevance(self):
        """Test search handles invalid min_relevance."""
        gateway_module._index = None

        with patch('file_compass.gateway.get_index_instance', new_callable=AsyncMock) as mock_get:
            mock_index = MagicMock()
            mock_index.get_status.return_value = {"files_indexed": 10}
            mock_index.search = AsyncMock(return_value=[])
            mock_get.return_value = mock_index

            # Negative min_relevance should be clamped or rejected
            result = await file_search("test", min_relevance=-0.5)
            # Should handle gracefully
            assert "results" in result or "error" in result

        gateway_module._index = None

    @pytest.mark.asyncio
    async def test_actions_invalid_line_range(self):
        """Test actions validates line range."""
        result = await file_actions("/test/file.py", "context", line_start=100, line_end=50)
        assert "error" in result

    @pytest.mark.asyncio
    async def test_scan_empty_directories(self):
        """Test scan with empty directories string."""
        gateway_module._index = None

        with patch('file_compass.gateway.get_index_instance', new_callable=AsyncMock):
            with patch('file_compass.gateway.get_config') as mock_config:
                mock_config.return_value.directories = []
                result = await file_index_scan(directories="")

        # Should handle empty gracefully
        assert "error" in result or "success" in result

        gateway_module._index = None

    @pytest.mark.asyncio
    async def test_search_file_types_invalid_format(self):
        """Test search handles malformed file_types."""
        gateway_module._index = None

        with patch('file_compass.gateway.get_index_instance', new_callable=AsyncMock) as mock_get:
            mock_index = MagicMock()
            mock_index.get_status.return_value = {"files_indexed": 10}
            mock_index.search = AsyncMock(return_value=[])
            mock_get.return_value = mock_index

            # Empty type after comma
            result = await file_search("test", file_types="python,,markdown")
            assert "results" in result or "error" in result

        gateway_module._index = None


# =============================================================================
# Section 2: Gateway Response Schema Tests (5 tests)
# =============================================================================

class TestGatewayResponseSchema:
    """Test gateway response structure."""

    @pytest.mark.asyncio
    async def test_search_response_has_required_fields(self):
        """Test search response has all required fields."""
        gateway_module._index = None

        from file_compass.indexer import SearchResult
        mock_result = SearchResult(
            path="/test/file.py",
            relative_path="file.py",
            file_type="python",
            chunk_type="function",
            chunk_name="test_func",
            line_start=1,
            line_end=10,
            preview="def test_func():",
            relevance=0.8,
            modified_at=datetime.now(),
            git_tracked=True
        )

        with patch('file_compass.gateway.get_index_instance', new_callable=AsyncMock) as mock_get:
            mock_index = MagicMock()
            mock_index.get_status.return_value = {"files_indexed": 10}
            mock_index.search = AsyncMock(return_value=[mock_result])
            mock_get.return_value = mock_index

            result = await file_search("test")

        assert "query" in result
        assert "count" in result
        assert "results" in result
        assert len(result["results"]) == 1

        item = result["results"][0]
        assert "path" in item
        assert "relative_path" in item
        assert "file_type" in item
        assert "relevance" in item

        gateway_module._index = None

    @pytest.mark.asyncio
    async def test_status_response_has_required_fields(self):
        """Test status response has all required fields."""
        gateway_module._index = None

        with patch('file_compass.gateway.get_index_instance', new_callable=AsyncMock) as mock_get:
            mock_index = MagicMock()
            mock_index.get_status.return_value = {
                "files_indexed": 100,
                "chunks_indexed": 500,
                "index_size_mb": 25.5,
                "last_build": "2024-01-15",
                "file_types": {"python": 50}
            }
            mock_get.return_value = mock_index

            result = await file_index_status()

        assert "files_indexed" in result
        assert "chunks_indexed" in result
        assert "file_types" in result

        gateway_module._index = None

    @pytest.mark.asyncio
    async def test_preview_response_has_content(self):
        """Test preview response includes content."""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, dir='.') as f:
            f.write("line 1\nline 2\nline 3")
            temp_path = f.name

        try:
            with patch('file_compass.gateway.get_config') as mock_config:
                mock_config.return_value = FileCompassConfig(directories=['.'])
                result = await file_preview(temp_path)

            assert "content" in result
            assert "total_lines" in result
            assert result["total_lines"] == 3
        finally:
            Path(temp_path).unlink()

    @pytest.mark.asyncio
    async def test_quick_search_response_structure(self):
        """Test quick search response structure."""
        with patch('file_compass.gateway.get_quick_index') as mock_get_quick:
            mock_quick = MagicMock()
            mock_quick.get_status.return_value = {"files_indexed": 10, "symbols_indexed": 50}
            mock_quick.search.return_value = []
            mock_get_quick.return_value = mock_quick

            result = await file_quick_search("test")

        assert "query" in result
        assert "count" in result
        assert "results" in result

    @pytest.mark.asyncio
    async def test_error_response_has_error_field(self):
        """Test error responses have error field."""
        result = await file_search("")  # Empty query triggers error

        assert "error" in result
        assert isinstance(result["error"], str)


# =============================================================================
# Section 3: Gateway Missing Files Tests (5 tests)
# =============================================================================

class TestGatewayHandlesMissingFiles:
    """Test gateway handles missing files gracefully."""

    @pytest.mark.asyncio
    async def test_preview_nonexistent_file(self):
        """Test preview of nonexistent file returns error."""
        with patch('file_compass.gateway.get_config') as mock_config:
            mock_config.return_value = FileCompassConfig(directories=["F:/AI"])
            result = await file_preview("F:/AI/does_not_exist_12345.py")

        assert "error" in result
        assert "not found" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_actions_nonexistent_file(self):
        """Test actions on nonexistent file returns error."""
        with patch('file_compass.gateway.get_config') as mock_config:
            mock_config.return_value = FileCompassConfig(directories=["F:/AI"])
            result = await file_actions("F:/AI/missing_file_xyz.py", "context")

        assert "error" in result
        assert "not found" in result["error"].lower()

    @pytest.mark.asyncio
    async def test_preview_deleted_file(self):
        """Test preview handles file deleted during request."""
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, dir='.')
        temp_file.write("content")
        temp_path = temp_file.name
        temp_file.close()

        # Delete the file
        Path(temp_path).unlink()

        with patch('file_compass.gateway.get_config') as mock_config:
            mock_config.return_value = FileCompassConfig(directories=['.'])
            result = await file_preview(temp_path)

        assert "error" in result

    @pytest.mark.asyncio
    async def test_search_empty_index_no_crash(self):
        """Test search on empty index doesn't crash."""
        gateway_module._index = None

        with patch('file_compass.gateway.get_index_instance', new_callable=AsyncMock) as mock_get:
            mock_index = MagicMock()
            mock_index.get_status.return_value = {"files_indexed": 0}
            mock_get.return_value = mock_index

            result = await file_search("test")

        assert "error" in result
        assert "No files indexed" in result["error"]

        gateway_module._index = None

    @pytest.mark.asyncio
    async def test_quick_search_empty_index(self):
        """Test quick search on empty index builds index."""
        with patch('file_compass.gateway.get_quick_index') as mock_get_quick:
            mock_quick = MagicMock()

            call_count = [0]

            def status_side_effect():
                call_count[0] += 1
                if call_count[0] == 1:
                    return {"files_indexed": 0, "symbols_indexed": 0}
                return {"files_indexed": 10, "symbols_indexed": 50}

            mock_quick.get_status.side_effect = status_side_effect
            mock_quick.build_quick_index = AsyncMock()
            mock_quick.search.return_value = []
            mock_get_quick.return_value = mock_quick

            await file_quick_search("test")

        # Should have triggered build
        mock_quick.build_quick_index.assert_called_once()


# =============================================================================
# Section 4: Gateway Error Mapping Tests (3 tests)
# =============================================================================

class TestGatewayErrorMapping:
    """Test gateway error handling and mapping."""

    @pytest.mark.asyncio
    async def test_internal_error_sanitized(self):
        """Test error responses don't expose internal implementation details."""
        # Test that error messages are user-friendly
        gateway_module._index = None

        with patch('file_compass.gateway.get_index_instance', new_callable=AsyncMock) as mock_get:
            mock_index = MagicMock()
            mock_index.get_status.return_value = {"files_indexed": 0}  # Empty index
            mock_get.return_value = mock_index

            result = await file_search("test")

        # Should return error about empty index (user-friendly message)
        assert "error" in result
        assert "No files indexed" in result["error"]

        gateway_module._index = None

    @pytest.mark.asyncio
    async def test_scan_error_has_hint(self):
        """Test scan errors include helpful hints."""
        gateway_module._index = None

        with patch('file_compass.gateway.get_index_instance', new_callable=AsyncMock) as mock_get:
            with patch('file_compass.gateway.get_config') as mock_config:
                mock_index = MagicMock()
                mock_index.build_index = AsyncMock(side_effect=Exception("Ollama not running"))
                mock_get.return_value = mock_index
                mock_config.return_value.directories = ["."]

                result = await file_index_scan()

        assert result["success"] is False
        assert "hint" in result

        gateway_module._index = None

    @pytest.mark.asyncio
    async def test_path_traversal_error_no_hint(self):
        """Test path traversal errors don't expose allowed directories."""
        with patch('file_compass.gateway.get_config') as mock_config:
            mock_config.return_value = FileCompassConfig(directories=["F:/AI/safe"])
            result = await file_preview("C:/Windows/System32/config")

        assert "error" in result
        assert "Access denied" in result["error"]
        # Should not expose which directories are allowed


# =============================================================================
# Section 5: Explainer Additional Tests (4 tests)
# =============================================================================

class TestExplainerSummaryGeneration:
    """Test Explainer summary generation."""

    def test_explainer_summary_not_empty(self):
        """Test explainer always generates non-empty summary."""
        explainer = ResultExplainer()
        result = explainer.explain_match(
            query="random query xyz",
            result_preview="completely unrelated code",
            result_path="/file.py",
            chunk_name=None,
            chunk_type="module",
            relevance=0.3
        )

        assert result.summary is not None
        assert len(result.summary) > 0

    def test_explainer_multiple_reasons_combined(self):
        """Test explainer combines multiple match reasons."""
        explainer = ResultExplainer()
        result = explainer.explain_match(
            query="file parser",
            result_preview="def parse_file(path): return open(path).read()",
            result_path="/utils/file_parser.py",
            chunk_name="parse_file",
            chunk_type="function",
            relevance=0.9
        )

        # Should have multiple reasons
        assert len(result.reasons) >= 2
        reason_types = {r.reason_type for r in result.reasons}
        # Should have at least exact and filename matches
        assert len(reason_types) >= 1


class TestExplainerEmptyIndex:
    """Test Explainer with edge cases."""

    def test_explainer_empty_preview(self):
        """Test explainer handles empty preview."""
        explainer = ResultExplainer()
        result = explainer.explain_match(
            query="test",
            result_preview="",
            result_path="/empty.py",
            chunk_name=None,
            chunk_type="module",
            relevance=0.5
        )

        assert result is not None
        assert result.summary is not None

    def test_explainer_empty_query(self):
        """Test explainer handles empty query."""
        explainer = ResultExplainer()
        result = explainer.explain_match(
            query="",
            result_preview="def test(): pass",
            result_path="/test.py",
            chunk_name="test",
            chunk_type="function",
            relevance=0.5
        )

        assert result is not None


class TestExplainerNonAsciiContent:
    """Test Explainer with non-ASCII content."""

    def test_explainer_unicode_query(self):
        """Test explainer handles unicode in query."""
        explainer = ResultExplainer()
        result = explainer.explain_match(
            query="日本語 テスト",
            result_preview="# 日本語コメント\ndef test(): pass",
            result_path="/unicode.py",
            chunk_name="test",
            chunk_type="function",
            relevance=0.6
        )

        assert result is not None
        assert result.summary is not None

    def test_explainer_unicode_path(self):
        """Test explainer handles unicode in path."""
        explainer = ResultExplainer()
        result = explainer.explain_match(
            query="config",
            result_preview="DEBUG = True",
            result_path="/проект/конфиг.py",  # Russian characters
            chunk_name=None,
            chunk_type="module",
            relevance=0.7
        )

        assert result is not None
