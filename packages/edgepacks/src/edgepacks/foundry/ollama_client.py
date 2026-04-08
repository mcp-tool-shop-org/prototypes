"""Thin Ollama HTTP client — no SDK dependency."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from edgepacks.errors import OllamaError

logger = logging.getLogger(__name__)

DEFAULT_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "qwen2.5:7b"
DEFAULT_TIMEOUT = 120.0
MAX_RETRIES = 3
RETRY_DELAY = 2.0


class OllamaClient:
    """Minimal HTTP client for Ollama's generate and chat endpoints."""

    def __init__(
        self,
        base_url: str = DEFAULT_BASE_URL,
        model: str = DEFAULT_MODEL,
        timeout: float = DEFAULT_TIMEOUT,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout

    def health(self) -> bool:
        """Check if Ollama is reachable."""
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except httpx.HTTPError:
            return False

    def generate(
        self,
        prompt: str,
        system: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> str:
        """Call /api/generate and return the response text."""
        payload: dict[str, Any] = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if system:
            payload["system"] = system
        if json_mode:
            payload["format"] = "json"

        return self._post("/api/generate", payload)["response"]

    def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
        json_mode: bool = False,
    ) -> str:
        """Call /api/chat and return the assistant's response text."""
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if json_mode:
            payload["format"] = "json"

        result = self._post("/api/chat", payload)
        return result["message"]["content"]

    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        """POST with retry logic."""
        url = f"{self.base_url}{path}"
        last_error: Exception | None = None

        for attempt in range(MAX_RETRIES):
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    resp = client.post(url, json=payload)
                    resp.raise_for_status()
                    return resp.json()
            except (httpx.HTTPError, httpx.TimeoutException) as e:
                last_error = e
                if attempt < MAX_RETRIES - 1:
                    delay = RETRY_DELAY * (attempt + 1)
                    logger.warning(
                        "Ollama request failed (attempt %d/%d): %s. Retrying in %.1fs",
                        attempt + 1,
                        MAX_RETRIES,
                        e,
                        delay,
                    )
                    time.sleep(delay)

        raise OllamaError(
            f"Ollama request failed after {MAX_RETRIES} attempts",
            cause=last_error,
        ) from last_error
