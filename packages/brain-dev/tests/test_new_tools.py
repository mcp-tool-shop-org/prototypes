"""
Tests for docs_generate, security_audit, and smart_tests_generate tools.
"""

import pytest
import json
import tempfile
import os
from unittest.mock import MagicMock, patch

from mcp.types import TextContent, CallToolRequest

from dev_brain.server import create_server


# Helper to call tools (same pattern as test_server.py)
async def call_tool(server, name: str, arguments: dict) -> list[TextContent]:
    """Call a tool on the server."""
    handler = server.request_handlers[CallToolRequest]
    request = MagicMock()
    request.params = MagicMock()
    request.params.name = name
    request.params.arguments = arguments
    result = await handler(request)
    return result.root.content


class TestDocsGenerateTool:
    """Tests for docs_generate tool."""

    @pytest.fixture
    def server(self):
        return create_server()

    @pytest.mark.asyncio
    async def test_docs_generate_finds_missing(self, server):
        """Test that docs_generate finds missing docstrings."""
        result = await call_tool(server, "docs_generate", {
            "symbols": [
                {
                    "name": "my_function",
                    "symbol_type": "function",
                    "docstring": "",
                    "file_path": "test.py",
                    "line": 10,
                }
            ],
            "doc_style": "google",
        })

        assert len(result) == 1
        data = json.loads(result[0].text)
        assert data["total_found"] == 1
        assert len(data["suggestions"]) == 1
        assert data["suggestions"][0]["doc_type"] == "missing"
        assert data["doc_style"] == "google"

    @pytest.mark.asyncio
    async def test_docs_generate_empty_symbols(self, server):
        """Test docs_generate with empty symbols."""
        result = await call_tool(server, "docs_generate", {
            "symbols": [],
        })

        data = json.loads(result[0].text)
        assert data["total_found"] == 0
        assert data["suggestions"] == []

    @pytest.mark.asyncio
    async def test_docs_generate_incomplete(self, server):
        """Test docs_generate finds incomplete docs."""
        result = await call_tool(server, "docs_generate", {
            "symbols": [
                {
                    "name": "short_doc",
                    "symbol_type": "function",
                    "docstring": "Too short.",
                    "file_path": "test.py",
                    "line": 1,
                }
            ],
        })

        data = json.loads(result[0].text)
        assert data["total_found"] == 1
        assert data["suggestions"][0]["doc_type"] == "incomplete"

    @pytest.mark.asyncio
    async def test_docs_generate_default_style(self, server):
        """Test docs_generate uses default style."""
        result = await call_tool(server, "docs_generate", {
            "symbols": [
                {
                    "name": "func",
                    "symbol_type": "function",
                    "docstring": "",
                    "file_path": "test.py",
                    "line": 1,
                }
            ],
            # No doc_style specified, should default to google
        })

        data = json.loads(result[0].text)
        assert data["doc_style"] == "google"


class TestSecurityAuditTool:
    """Tests for security_audit tool."""

    @pytest.fixture
    def server(self):
        return create_server()

    @pytest.mark.asyncio
    async def test_security_audit_finds_sql_injection(self, server):
        """Test that security_audit finds SQL injection."""
        result = await call_tool(server, "security_audit", {
            "symbols": [
                {
                    "name": "query",
                    "file_path": "db.py",
                    "line": 10,
                    "source_code": 'cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")',
                }
            ],
        })

        data = json.loads(result[0].text)
        assert data["total_found"] >= 1
        assert any(i["category"] == "sql_injection" for i in data["issues"])

    @pytest.mark.asyncio
    async def test_security_audit_with_threshold(self, server):
        """Test security_audit with severity threshold."""
        result = await call_tool(server, "security_audit", {
            "symbols": [
                {
                    "name": "config",
                    "file_path": "config.py",
                    "line": 1,
                    "source_code": 'hashed = md5(password)',  # medium severity
                }
            ],
            "severity_threshold": "high",
        })

        data = json.loads(result[0].text)
        assert data["severity_threshold"] == "high"

    @pytest.mark.asyncio
    async def test_security_audit_empty_symbols(self, server):
        """Test security_audit with empty symbols."""
        result = await call_tool(server, "security_audit", {
            "symbols": [],
        })

        data = json.loads(result[0].text)
        assert data["total_found"] == 0
        assert data["issues"] == []

    @pytest.mark.asyncio
    async def test_security_audit_multiple_issues(self, server):
        """Test security_audit with multiple vulnerability types."""
        result = await call_tool(server, "security_audit", {
            "symbols": [
                {
                    "name": "bad_code",
                    "file_path": "bad.py",
                    "line": 1,
                    "source_code": '''password = "hardcoded123"
os.system(user_input)
cursor.execute(f"SELECT * FROM t WHERE x = {y}")''',
                }
            ],
        })

        data = json.loads(result[0].text)
        assert data["total_found"] >= 2
        categories = {i["category"] for i in data["issues"]}
        assert len(categories) >= 2

    @pytest.mark.asyncio
    async def test_security_audit_default_threshold(self, server):
        """Test security_audit uses default threshold."""
        result = await call_tool(server, "security_audit", {
            "symbols": [],
            # No severity_threshold, should default to "low"
        })

        data = json.loads(result[0].text)
        assert data["severity_threshold"] == "low"

    @pytest.mark.asyncio
    async def test_security_audit_severity_counts(self, server):
        """Test security_audit includes severity counts."""
        result = await call_tool(server, "security_audit", {
            "symbols": [
                {
                    "name": "bad",
                    "file_path": "bad.py",
                    "line": 1,
                    "source_code": 'os.system(cmd)',
                }
            ],
        })

        data = json.loads(result[0].text)
        assert "severity_counts" in data
        assert isinstance(data["severity_counts"], dict)


class TestSmartTestsGenerateTool:
    """Tests for smart_tests_generate tool."""

    @pytest.fixture
    def server(self):
        return create_server()

    @pytest.mark.asyncio
    async def test_smart_tests_generate_success(self, server):
        """Test smart_tests_generate with a valid file."""
        # Create a temporary Python file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write('''
def hello(name: str) -> str:
    """Say hello."""
    return f"Hello, {name}"
''')
            temp_path = f.name

        try:
            result = await call_tool(server, "smart_tests_generate", {
                "file_path": temp_path,
            })

            data = json.loads(result[0].text)
            assert data["success"] is True
            assert data["file_name"] == os.path.basename(temp_path)
            assert "test_code" in data
            assert "def test_hello" in data["test_code"]
            assert data["lines"] > 0
        finally:
            os.unlink(temp_path)

    @pytest.mark.asyncio
    async def test_smart_tests_generate_file_not_found(self, server):
        """Test smart_tests_generate with non-existent file."""
        result = await call_tool(server, "smart_tests_generate", {
            "file_path": "/nonexistent/path/to/file.py",
        })

        data = json.loads(result[0].text)
        assert data["success"] is False
        assert "error" in data
        assert "not found" in data["error"].lower() or "File not found" in data["error"]

    @pytest.mark.asyncio
    async def test_smart_tests_generate_not_python(self, server):
        """Test smart_tests_generate with non-Python file."""
        # Create a temporary non-Python file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("This is not Python")
            temp_path = f.name

        try:
            result = await call_tool(server, "smart_tests_generate", {
                "file_path": temp_path,
            })

            data = json.loads(result[0].text)
            assert data["success"] is False
            assert "error" in data
            assert ".py" in data["error"]
        finally:
            os.unlink(temp_path)

    @pytest.mark.asyncio
    async def test_smart_tests_generate_exception(self, server):
        """Test smart_tests_generate handles exceptions."""
        # Create a file with invalid Python syntax
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write("def broken(:\n    pass")  # Invalid syntax
            temp_path = f.name

        try:
            result = await call_tool(server, "smart_tests_generate", {
                "file_path": temp_path,
            })

            data = json.loads(result[0].text)
            assert data["success"] is False
            assert "error" in data
            assert data["file_name"] == os.path.basename(temp_path)
        finally:
            os.unlink(temp_path)
