"""
Unit tests for vLLM client.

Tests HTTP communication, retry logic, and response parsing.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import aiohttp
import pytest

from context_window_manager.config import VLLMConfig
from context_window_manager.core.vllm_client import (
    CacheStats,
    ChatMessage,
    ChatResponse,
    GenerateResponse,
    ModelInfo,
    VLLMClient,
)
from context_window_manager.errors import VLLMConnectionError, VLLMTimeoutError


class TestGenerateResponse:
    """Tests for GenerateResponse dataclass."""

    def test_from_dict(self):
        """Should parse vLLM API response."""
        data = {
            "id": "cmpl-123",
            "choices": [
                {
                    "text": "Hello, world!",
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 5,
                "total_tokens": 15,
            },
            "model": "llama-3.1-8b",
        }

        response = GenerateResponse.from_dict(data)

        assert response.text == "Hello, world!"
        assert response.prompt_tokens == 10
        assert response.completion_tokens == 5
        assert response.total_tokens == 15
        assert response.finish_reason == "stop"
        assert response.model == "llama-3.1-8b"

    def test_from_dict_missing_usage(self):
        """Should handle missing usage field."""
        data = {
            "choices": [{"text": "test", "finish_reason": "length"}],
        }

        response = GenerateResponse.from_dict(data)

        assert response.text == "test"
        assert response.prompt_tokens == 0
        assert response.completion_tokens == 0

    def test_from_dict_missing_text(self):
        """Should handle missing text field."""
        data = {
            "choices": [{"finish_reason": "stop"}],
        }

        response = GenerateResponse.from_dict(data)
        assert response.text == ""


class TestChatMessage:
    """Tests for ChatMessage dataclass."""

    def test_basic_creation(self):
        """Should create chat message."""
        msg = ChatMessage(role="user", content="Hello")
        assert msg.role == "user"
        assert msg.content == "Hello"


class TestChatResponse:
    """Tests for ChatResponse dataclass."""

    def test_from_dict(self):
        """Should parse chat completion response."""
        data = {
            "id": "chat-123",
            "choices": [
                {
                    "message": {
                        "role": "assistant",
                        "content": "Hello! How can I help?",
                    },
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": 20,
                "completion_tokens": 10,
                "total_tokens": 30,
            },
            "model": "llama-3.1-8b",
        }

        response = ChatResponse.from_dict(data)

        assert response.message.role == "assistant"
        assert response.message.content == "Hello! How can I help?"
        assert response.prompt_tokens == 20
        assert response.finish_reason == "stop"

    def test_from_dict_missing_message(self):
        """Should handle missing message field."""
        data = {
            "choices": [{"finish_reason": "stop"}],
        }

        response = ChatResponse.from_dict(data)
        assert response.message.content == ""
        assert response.message.role == "assistant"


class TestCacheStats:
    """Tests for CacheStats dataclass."""

    def test_from_metrics_full(self):
        """Should parse Prometheus metrics."""
        metrics = """
# HELP vllm_prefix_cache_hit_rate Prefix cache hit rate
# TYPE vllm_prefix_cache_hit_rate gauge
vllm_prefix_cache_hit_rate 0.85
# HELP vllm_prefix_cache_num_cached_tokens Number of cached tokens
# TYPE vllm_prefix_cache_num_cached_tokens gauge
vllm_prefix_cache_num_cached_tokens 50000
"""
        stats = CacheStats.from_metrics(metrics)

        assert stats.hit_rate == 0.85
        assert stats.num_cached_tokens == 50000

    def test_from_metrics_empty(self):
        """Should handle empty metrics."""
        stats = CacheStats.from_metrics("")
        assert stats.hit_rate == 0.0
        assert stats.num_cached_tokens == 0

    def test_from_metrics_malformed(self):
        """Should handle malformed metrics."""
        metrics = """
vllm_prefix_cache_hit_rate not_a_number
vllm_prefix_cache_num_cached_tokens also_not_number
"""
        stats = CacheStats.from_metrics(metrics)
        assert stats.hit_rate == 0.0


class TestModelInfo:
    """Tests for ModelInfo dataclass."""

    def test_basic_creation(self):
        """Should create model info."""
        info = ModelInfo(
            id="llama-3.1-8b",
            owned_by="meta",
            max_context_length=8192,
        )
        assert info.id == "llama-3.1-8b"
        assert info.max_context_length == 8192


class TestVLLMClient:
    """Tests for VLLMClient."""

    @pytest.fixture
    def config(self):
        """Create test config."""
        return VLLMConfig(
            url="http://localhost:8000",
            timeout=30.0,
            max_connections=10,
        )

    @pytest.fixture
    def client(self, config):
        """Create client instance."""
        return VLLMClient(config)

    async def test_context_manager(self, client):
        """Should work as async context manager."""
        async with client as c:
            assert c._session is not None
        assert c._closed is True

    async def test_close_session(self, client):
        """Should close HTTP session."""
        await client._ensure_session()
        assert client._session is not None

        await client.close()
        assert client._closed is True

    async def test_health_check_failure(self, client):
        """Should return False when unhealthy."""
        with patch.object(client, "_request", side_effect=aiohttp.ClientError()):
            result = await client.health()
            assert result is False

    async def test_model_available(self, client):
        """Should check model availability."""
        with patch.object(client, "list_models") as mock_list:
            mock_list.return_value = [
                ModelInfo("llama-3.1-8b", "meta", 8192),
            ]

            assert await client.model_available("llama-3.1-8b") is True
            assert await client.model_available("nonexistent") is False

    async def test_get_cache_stats_failure(self, client):
        """Should return empty stats on failure."""
        with patch.object(client, "_request", side_effect=Exception("Error")):
            stats = await client.get_cache_stats()
            assert stats.hit_rate == 0.0


class TestVLLMClientWithMockedRequest:
    """Tests for VLLMClient that mock the _request method directly."""

    @pytest.fixture
    def config(self):
        """Create test config."""
        return VLLMConfig(
            url="http://localhost:8000",
            timeout=30.0,
            max_connections=10,
        )

    @pytest.fixture
    def client(self, config):
        """Create client instance."""
        return VLLMClient(config)

    async def test_health_check_success(self, client):
        """Should return True when healthy."""
        with patch.object(client, "_request", return_value={"status": "ok"}):
            result = await client.health()
            assert result is True

    async def test_list_models(self, client):
        """Should parse models response."""
        mock_response = {
            "data": [
                {"id": "llama-3.1-8b", "owned_by": "meta", "max_model_len": 8192},
                {"id": "llama-3.1-70b", "owned_by": "meta", "max_model_len": 8192},
            ]
        }

        with patch.object(client, "_request", return_value=mock_response):
            models = await client.list_models()

            assert len(models) == 2
            assert models[0].id == "llama-3.1-8b"
            assert models[0].max_context_length == 8192

    async def test_generate_basic(self, client):
        """Should generate completion."""
        mock_response = {
            "choices": [{"text": "Hello!", "finish_reason": "stop"}],
            "usage": {
                "prompt_tokens": 5,
                "completion_tokens": 2,
                "total_tokens": 7,
            },
            "model": "llama-3.1-8b",
        }

        with patch.object(client, "_request", return_value=mock_response):
            result = await client.generate(
                "Test prompt",
                "llama-3.1-8b",
                max_tokens=10,
            )

            assert result.text == "Hello!"
            assert result.prompt_tokens == 5

    async def test_generate_with_cache_salt(self, client):
        """Should include cache_salt in request."""
        mock_response = {
            "choices": [{"text": "test", "finish_reason": "stop"}],
            "model": "llama-3.1-8b",
        }

        with patch.object(client, "_request", return_value=mock_response) as mock_req:
            await client.generate(
                "Test",
                "llama-3.1-8b",
                cache_salt="session-abc123",
            )

            # Verify the request included extra_body with cache_salt
            call_args = mock_req.call_args
            json_body = call_args.kwargs.get("json", call_args[1].get("json", {}))
            assert json_body.get("extra_body", {}).get("cache_salt") == "session-abc123"

    async def test_chat_completion(self, client):
        """Should handle chat completion."""
        mock_response = {
            "choices": [
                {
                    "message": {"role": "assistant", "content": "Hi there!"},
                    "finish_reason": "stop",
                }
            ],
            "usage": {"prompt_tokens": 10, "completion_tokens": 3, "total_tokens": 13},
            "model": "llama-3.1-8b",
        }

        with patch.object(client, "_request", return_value=mock_response):
            messages = [
                ChatMessage("system", "You are helpful."),
                ChatMessage("user", "Hello!"),
            ]

            result = await client.chat(messages, "llama-3.1-8b")

            assert result.message.content == "Hi there!"
            assert result.prompt_tokens == 10

    async def test_get_cache_stats(self, client):
        """Should parse metrics endpoint."""
        metrics_text = """
vllm_prefix_cache_hit_rate 0.75
vllm_prefix_cache_num_cached_tokens 10000
"""

        with patch.object(client, "_request", return_value=metrics_text):
            stats = await client.get_cache_stats()

            assert stats.hit_rate == 0.75
            assert stats.num_cached_tokens == 10000


class TestVLLMClientErrors:
    """Tests for error handling in VLLMClient."""

    @pytest.fixture
    def client(self):
        """Create client with retry."""
        config = VLLMConfig(url="http://localhost:8000")
        return VLLMClient(config)

    async def test_timeout_raises(self, client):
        """Should raise VLLMTimeoutError on timeout."""
        # Create a mock session
        mock_session = MagicMock()
        mock_cm = MagicMock()
        mock_cm.__aenter__ = AsyncMock(side_effect=TimeoutError())
        mock_cm.__aexit__ = AsyncMock(return_value=None)
        mock_session.request.return_value = mock_cm

        with patch.object(client, "_ensure_session", return_value=mock_session):
            with pytest.raises(VLLMTimeoutError):
                await client._request("GET", "/test")

    async def test_connection_error_raises(self, client):
        """Should raise VLLMConnectionError on connection failure."""
        # Create a mock session
        mock_session = MagicMock()
        mock_cm = MagicMock()
        mock_cm.__aenter__ = AsyncMock(side_effect=aiohttp.ClientError())
        mock_cm.__aexit__ = AsyncMock(return_value=None)
        mock_session.request.return_value = mock_cm

        with patch.object(client, "_ensure_session", return_value=mock_session):
            with pytest.raises(VLLMConnectionError):
                await client._request("GET", "/test")

    async def test_server_error_raises(self, client):
        """Should raise VLLMConnectionError for 5xx errors."""
        # Create a mock response
        mock_response = MagicMock()
        mock_response.status = 500
        mock_response.text = AsyncMock(return_value="Server error")

        # Create a mock session
        mock_session = MagicMock()
        mock_cm = MagicMock()
        mock_cm.__aenter__ = AsyncMock(return_value=mock_response)
        mock_cm.__aexit__ = AsyncMock(return_value=None)
        mock_session.request.return_value = mock_cm

        with patch.object(client, "_ensure_session", return_value=mock_session):
            with pytest.raises(VLLMConnectionError):
                await client._request("GET", "/test")

    async def test_client_error_raises_value_error(self, client):
        """Should raise ValueError for 4xx errors."""
        # Create a mock response
        mock_response = MagicMock()
        mock_response.status = 400
        mock_response.text = AsyncMock(return_value="Bad request")

        # Create a mock session
        mock_session = MagicMock()
        mock_cm = MagicMock()
        mock_cm.__aenter__ = AsyncMock(return_value=mock_response)
        mock_cm.__aexit__ = AsyncMock(return_value=None)
        mock_session.request.return_value = mock_cm

        with patch.object(client, "_ensure_session", return_value=mock_session):
            with pytest.raises(ValueError, match="Client error 400"):
                await client._request("GET", "/test")
