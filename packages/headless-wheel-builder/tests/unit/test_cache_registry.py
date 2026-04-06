"""Tests for wheel registry client."""

from __future__ import annotations

import hashlib
from pathlib import Path  # noqa: TC003
from unittest.mock import AsyncMock, MagicMock

import pytest

from headless_wheel_builder.cache.models import RegistryConfig
from headless_wheel_builder.cache.registry import RegistryEntry, WheelRegistry


@pytest.fixture
def config() -> RegistryConfig:
    return RegistryConfig(url="https://registry.example.com")


@pytest.fixture
def registry(config: RegistryConfig) -> WheelRegistry:
    return WheelRegistry(config)


class TestRegistryEntry:
    """Test RegistryEntry model."""

    def test_to_dict(self) -> None:
        entry = RegistryEntry(
            package="mypackage",
            version="1.0.0",
            wheel_name="mypackage-1.0.0-py3-none-any.whl",
            sha256="abc123",
            url="https://registry.example.com/simple/mypackage/mypackage-1.0.0-py3-none-any.whl",
            size_bytes=1024,
            requires_python=">=3.10",
        )
        d = entry.to_dict()
        assert d["package"] == "mypackage"
        assert d["version"] == "1.0.0"
        assert d["sha256"] == "abc123"
        assert d["size_bytes"] == 1024
        assert d["requires_python"] == ">=3.10"
        assert d["metadata"] == {}

    def test_to_dict_with_metadata(self) -> None:
        entry = RegistryEntry(
            package="pkg",
            version="1.0",
            wheel_name="pkg-1.0.whl",
            sha256="abc",
            url="https://example.com",
            metadata={"build_id": "42"},
        )
        d = entry.to_dict()
        assert d["metadata"] == {"build_id": "42"}


class TestWheelRegistryClient:
    """Test WheelRegistry HTTP client."""

    @pytest.mark.asyncio
    async def test_get_client_creates_client(self, registry: WheelRegistry) -> None:
        client = await registry._get_client()
        assert client is not None
        await registry.close()

    @pytest.mark.asyncio
    async def test_close_clears_client(self, registry: WheelRegistry) -> None:
        await registry._get_client()
        await registry.close()
        assert registry._client is None

    @pytest.mark.asyncio
    async def test_close_without_client(self, registry: WheelRegistry) -> None:
        # Should not raise
        await registry.close()

    @pytest.mark.asyncio
    async def test_list_packages_json_api(self, registry: WheelRegistry) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "application/json"}
        mock_response.json.return_value = {"projects": [{"name": "alpha"}, {"name": "beta"}]}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        registry._client = mock_client

        packages = await registry.list_packages()
        assert packages == ["alpha", "beta"]

    @pytest.mark.asyncio
    async def test_list_packages_html_fallback(self, registry: WheelRegistry) -> None:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {"content-type": "text/html"}
        mock_response.text = """
        <html><body>
        <a href="alpha/">alpha</a>
        <a href="beta/">beta</a>
        </body></html>
        """
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        registry._client = mock_client

        packages = await registry.list_packages()
        assert "alpha" in packages
        assert "beta" in packages

    @pytest.mark.asyncio
    async def test_list_versions_json(self, registry: WheelRegistry) -> None:
        mock_response = MagicMock()
        mock_response.headers = {"content-type": "application/json"}
        mock_response.json.return_value = {
            "files": [
                {
                    "filename": "pkg-1.0.0-py3-none-any.whl",
                    "hashes": {"sha256": "abc123"},
                    "url": "https://example.com/pkg-1.0.0.whl",
                    "size": 2048,
                    "requires-python": ">=3.10",
                },
                {
                    "filename": "pkg-1.0.0.tar.gz",  # Should be skipped (not .whl)
                },
            ]
        }
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        registry._client = mock_client

        entries = await registry.list_versions("pkg")
        assert len(entries) == 1
        assert entries[0].version == "1.0.0"
        assert entries[0].sha256 == "abc123"
        assert entries[0].size_bytes == 2048

    @pytest.mark.asyncio
    async def test_list_versions_html(self, registry: WheelRegistry) -> None:
        mock_response = MagicMock()
        mock_response.headers = {"content-type": "text/html"}
        mock_response.text = """
        <a href="pkg-1.0.0-py3-none-any.whl#sha256=abc123">pkg-1.0.0-py3-none-any.whl</a>
        <a href="pkg-2.0.0-py3-none-any.whl#sha256=def456">pkg-2.0.0-py3-none-any.whl</a>
        """
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        registry._client = mock_client

        entries = await registry.list_versions("pkg")
        assert len(entries) == 2
        assert entries[0].sha256 == "abc123"
        assert entries[1].version == "2.0.0"

    @pytest.mark.asyncio
    async def test_check_exists_true(self, registry: WheelRegistry) -> None:
        mock_response = MagicMock()
        mock_response.headers = {"content-type": "application/json"}
        mock_response.json.return_value = {
            "files": [
                {"filename": "pkg-1.0.0-py3-none-any.whl", "hashes": {}, "url": ""},
            ]
        }
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        registry._client = mock_client

        assert await registry.check_exists("pkg", "1.0.0") is True

    @pytest.mark.asyncio
    async def test_check_exists_false(self, registry: WheelRegistry) -> None:
        mock_response = MagicMock()
        mock_response.headers = {"content-type": "application/json"}
        mock_response.json.return_value = {"files": []}
        mock_response.raise_for_status = MagicMock()

        mock_client = AsyncMock()
        mock_client.get = AsyncMock(return_value=mock_response)
        registry._client = mock_client

        assert await registry.check_exists("pkg", "9.9.9") is False

    def test_to_cache_entry(self, registry: WheelRegistry, tmp_path: Path) -> None:
        wheel = tmp_path / "pkg-1.0.0-py3-none-any.whl"
        wheel.write_bytes(b"fake wheel content")

        reg_entry = RegistryEntry(
            package="pkg",
            version="1.0.0",
            wheel_name="pkg-1.0.0-py3-none-any.whl",
            sha256="abc",
            url="https://example.com/pkg.whl",
        )

        cache_entry = registry.to_cache_entry(reg_entry, wheel)
        assert cache_entry.package == "pkg"
        assert cache_entry.version == "1.0.0"
        assert cache_entry.source == "registry"
        assert cache_entry.metadata["registry_url"] == "https://registry.example.com"

    @pytest.mark.asyncio
    async def test_download_and_verify(self, registry: WheelRegistry, tmp_path: Path) -> None:
        content = b"wheel file content here"
        expected_hash = hashlib.sha256(content).hexdigest()

        # Mock streaming response with proper async iteration
        mock_response = AsyncMock()
        mock_response.raise_for_status = MagicMock()

        async def _aiter_bytes():
            yield content

        mock_response.aiter_bytes = _aiter_bytes
        mock_response.__aenter__ = AsyncMock(return_value=mock_response)
        mock_response.__aexit__ = AsyncMock(return_value=False)

        mock_client = AsyncMock()
        mock_client.stream = MagicMock(return_value=mock_response)
        registry._client = mock_client

        entry = RegistryEntry(
            package="pkg",
            version="1.0.0",
            wheel_name="pkg-1.0.0-py3-none-any.whl",
            sha256=expected_hash,
            url="https://example.com/pkg.whl",
        )

        result = await registry.download(entry, tmp_path)
        assert result.exists()
        assert result.read_bytes() == content
