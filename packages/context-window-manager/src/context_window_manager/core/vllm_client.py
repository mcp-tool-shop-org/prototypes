"""
vLLM client for Context Window Manager.

Provides async HTTP client for communicating with vLLM's OpenAI-compatible API.
Handles connection pooling, retries, cache_salt injection, and error handling.
"""

from __future__ import annotations

import contextlib
from dataclasses import dataclass
from typing import Any

import aiohttp
import structlog
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from context_window_manager.config import VLLMConfig
from context_window_manager.errors import (
    VLLMConnectionError,
    VLLMTimeoutError,
)

logger = structlog.get_logger()


@dataclass
class GenerateResponse:
    """Response from a vLLM generate request."""

    text: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    finish_reason: str
    model: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> GenerateResponse:
        """Create from vLLM API response."""
        choice = data["choices"][0]
        usage = data.get("usage", {})

        return cls(
            text=choice.get("text", ""),
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            finish_reason=choice.get("finish_reason", "unknown"),
            model=data.get("model", "unknown"),
        )


@dataclass
class ChatMessage:
    """A chat message."""

    role: str  # "system", "user", "assistant"
    content: str


@dataclass
class ChatResponse:
    """Response from a vLLM chat completion request."""

    message: ChatMessage
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    finish_reason: str
    model: str

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ChatResponse:
        """Create from vLLM API response."""
        choice = data["choices"][0]
        usage = data.get("usage", {})
        msg = choice.get("message", {})

        return cls(
            message=ChatMessage(
                role=msg.get("role", "assistant"),
                content=msg.get("content", ""),
            ),
            prompt_tokens=usage.get("prompt_tokens", 0),
            completion_tokens=usage.get("completion_tokens", 0),
            total_tokens=usage.get("total_tokens", 0),
            finish_reason=choice.get("finish_reason", "unknown"),
            model=data.get("model", "unknown"),
        )


@dataclass
class CacheStats:
    """KV cache statistics from vLLM."""

    hit_rate: float = 0.0
    num_cached_tokens: int = 0
    cache_size_bytes: int = 0

    @classmethod
    def from_metrics(cls, metrics: str) -> CacheStats:
        """Parse from Prometheus metrics text."""
        stats = cls()

        for line in metrics.split("\n"):
            if line.startswith("#"):
                continue
            if "prefix_cache_hit_rate" in line:
                with contextlib.suppress(ValueError, IndexError):
                    stats.hit_rate = float(line.split()[-1])
            elif "prefix_cache_num_cached_tokens" in line:
                with contextlib.suppress(ValueError, IndexError):
                    stats.num_cached_tokens = int(float(line.split()[-1]))

        return stats


@dataclass
class ModelInfo:
    """Information about a loaded model."""

    id: str
    owned_by: str
    max_context_length: int = 0


class VLLMClient:
    """
    Async client for vLLM OpenAI-compatible API.

    Features:
    - Connection pooling with configurable limits
    - Automatic retry with exponential backoff
    - Cache salt injection for session isolation
    - Health checking
    - Prometheus metrics parsing

    Usage:
        async with VLLMClient(config) as client:
            response = await client.generate("Hello", model="llama-3.1-8b")
    """

    def __init__(self, config: VLLMConfig | None = None):
        """
        Initialize vLLM client.

        Args:
            config: vLLM configuration. Uses defaults if not provided.
        """
        self.config = config or VLLMConfig()
        self.base_url = self.config.url.rstrip("/")
        self._session: aiohttp.ClientSession | None = None
        self._closed = False

    async def __aenter__(self) -> VLLMClient:
        """Async context manager entry."""
        await self._ensure_session()
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        await self.close()

    async def _ensure_session(self) -> aiohttp.ClientSession:
        """Ensure HTTP session exists, creating if needed."""
        if self._session is None or self._session.closed:
            timeout = aiohttp.ClientTimeout(total=self.config.timeout)
            connector = aiohttp.TCPConnector(
                limit=self.config.max_connections,
                keepalive_timeout=30,
                ssl=self.config.verify_ssl if self.config.verify_ssl else False,
            )
            headers = {}
            if self.config.api_key:
                headers["Authorization"] = f"Bearer {self.config.api_key}"

            self._session = aiohttp.ClientSession(
                timeout=timeout,
                connector=connector,
                headers=headers,
            )

        return self._session

    async def close(self) -> None:
        """Close the HTTP session."""
        if self._session and not self._session.closed:
            await self._session.close()
        self._closed = True

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=retry_if_exception_type(VLLMConnectionError),
        reraise=True,
    )
    async def _request(
        self,
        method: str,
        endpoint: str,
        json: dict[str, Any] | None = None,
        timeout: float | None = None,
    ) -> dict[str, Any] | str:
        """
        Make HTTP request to vLLM server.

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (e.g., "/v1/completions")
            json: JSON body for POST requests
            timeout: Override default timeout

        Returns:
            Parsed JSON response or raw text

        Raises:
            VLLMConnectionError: On connection/server errors (retryable)
            VLLMTimeoutError: On timeout
        """
        session = await self._ensure_session()
        url = f"{self.base_url}{endpoint}"

        log = logger.bind(method=method, url=url)

        try:
            request_timeout = aiohttp.ClientTimeout(total=timeout) if timeout else None

            async with session.request(
                method,
                url,
                json=json,
                timeout=request_timeout,
            ) as response:
                if response.status >= 500:
                    error_text = await response.text()
                    log.warning(
                        "vLLM server error",
                        status=response.status,
                        error=error_text[:200],
                    )
                    raise VLLMConnectionError(
                        self.config.url,
                        f"Server error {response.status}: {error_text[:200]}",
                    )

                if response.status >= 400:
                    error_text = await response.text()
                    log.warning(
                        "vLLM client error",
                        status=response.status,
                        error=error_text[:200],
                    )
                    # Client errors are not retryable
                    raise ValueError(f"Client error {response.status}: {error_text}")

                # Check content type
                content_type = response.headers.get("Content-Type", "")
                if "application/json" in content_type:
                    return await response.json()
                else:
                    return await response.text()

        except TimeoutError as e:
            log.warning("vLLM request timeout", timeout=timeout or self.config.timeout)
            raise VLLMTimeoutError(timeout or self.config.timeout) from e

        except aiohttp.ClientError as e:
            log.warning("vLLM connection error", error=str(e))
            raise VLLMConnectionError(self.config.url, str(e)) from e

    async def health(self) -> bool:
        """
        Check if vLLM server is healthy.

        Returns:
            True if server is responding, False otherwise.
        """
        try:
            await self._request("GET", "/health", timeout=5.0)
            return True
        except Exception as e:
            logger.debug("Health check failed", error=str(e))
            return False

    async def list_models(self) -> list[ModelInfo]:
        """
        List available models.

        Returns:
            List of available models.
        """
        response = await self._request("GET", "/v1/models")
        if isinstance(response, str):
            return []

        models = []
        for model_data in response.get("data", []):
            models.append(
                ModelInfo(
                    id=model_data.get("id", ""),
                    owned_by=model_data.get("owned_by", ""),
                    max_context_length=model_data.get("max_model_len", 0),
                )
            )
        return models

    async def model_available(self, model: str) -> bool:
        """
        Check if a specific model is available.

        Args:
            model: Model name to check.

        Returns:
            True if model is loaded, False otherwise.
        """
        try:
            models = await self.list_models()
            return any(m.id == model for m in models)
        except Exception:
            return False

    async def generate(
        self,
        prompt: str,
        model: str,
        *,
        cache_salt: str | None = None,
        max_tokens: int = 100,
        temperature: float = 0.7,
        stop: list[str] | None = None,
        **kwargs: Any,
    ) -> GenerateResponse:
        """
        Generate completion from prompt.

        Args:
            prompt: Input text prompt.
            model: Model to use for generation.
            cache_salt: Salt for KV cache isolation (enables context restoration).
            max_tokens: Maximum tokens to generate.
            temperature: Sampling temperature.
            stop: Stop sequences.
            **kwargs: Additional parameters passed to vLLM.

        Returns:
            GenerateResponse with generated text and usage info.
        """
        payload: dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False,
            **kwargs,
        }

        if stop:
            payload["stop"] = stop

        # Inject cache_salt for session isolation
        if cache_salt:
            payload["extra_body"] = {"cache_salt": cache_salt}

        log = logger.bind(
            model=model,
            prompt_length=len(prompt),
            max_tokens=max_tokens,
            cache_salt=cache_salt[:8] if cache_salt else None,
        )
        log.debug("Sending generate request")

        response = await self._request("POST", "/v1/completions", json=payload)
        if isinstance(response, str):
            raise ValueError(f"Unexpected response: {response}")

        result = GenerateResponse.from_dict(response)
        log.debug(
            "Generate completed",
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
        )

        return result

    async def chat(
        self,
        messages: list[ChatMessage],
        model: str,
        *,
        cache_salt: str | None = None,
        max_tokens: int = 100,
        temperature: float = 0.7,
        stop: list[str] | None = None,
        **kwargs: Any,
    ) -> ChatResponse:
        """
        Generate chat completion.

        Args:
            messages: List of chat messages.
            model: Model to use for generation.
            cache_salt: Salt for KV cache isolation.
            max_tokens: Maximum tokens to generate.
            temperature: Sampling temperature.
            stop: Stop sequences.
            **kwargs: Additional parameters passed to vLLM.

        Returns:
            ChatResponse with assistant message and usage info.
        """
        payload: dict[str, Any] = {
            "model": model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "max_tokens": max_tokens,
            "temperature": temperature,
            "stream": False,
            **kwargs,
        }

        if stop:
            payload["stop"] = stop

        if cache_salt:
            payload["extra_body"] = {"cache_salt": cache_salt}

        log = logger.bind(
            model=model,
            message_count=len(messages),
            max_tokens=max_tokens,
        )
        log.debug("Sending chat request")

        response = await self._request("POST", "/v1/chat/completions", json=payload)
        if isinstance(response, str):
            raise ValueError(f"Unexpected response: {response}")

        result = ChatResponse.from_dict(response)
        log.debug(
            "Chat completed",
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
        )

        return result

    async def get_cache_stats(self) -> CacheStats:
        """
        Get KV cache statistics from vLLM metrics endpoint.

        Returns:
            CacheStats with hit rate and cache info.
        """
        try:
            response = await self._request("GET", "/metrics", timeout=5.0)
            if isinstance(response, str):
                return CacheStats.from_metrics(response)
            return CacheStats()
        except Exception as e:
            logger.debug("Failed to get cache stats", error=str(e))
            return CacheStats()
