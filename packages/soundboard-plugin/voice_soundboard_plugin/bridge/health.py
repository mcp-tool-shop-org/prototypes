"""
Health check and graceful degradation for the voice engine.

If the engine cannot start (missing models, GPU unavailable, package not
installed), returns None instead of crashing. The bridge returns descriptive
error messages for each tool call when the engine is unavailable.
"""

from __future__ import annotations

import logging
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from voice_soundboard.adapters import VoiceEngine

logger = logging.getLogger(__name__)


def try_create_engine() -> Optional["VoiceEngine"]:
    """
    Attempt to create a VoiceEngine. Returns None on failure.

    Handles three failure modes:
    - ImportError: voice-soundboard package not installed
    - RuntimeError: models not downloaded or GPU unavailable
    - Any other exception: unexpected initialization failure
    """
    import os
    from pathlib import Path

    env_models = os.environ.get("VOICE_SOUNDBOARD_MODELS")
    logger.info("VOICE_SOUNDBOARD_MODELS env: %s", env_models)
    logger.info("CWD: %s", os.getcwd())

    try:
        from voice_soundboard import VoiceEngine, Config

        cfg = Config()
        logger.info("Config model_dir: %s (exists: %s)", cfg.model_dir, cfg.model_dir.exists())

        onnx_path = cfg.model_dir / "kokoro-v1.0.onnx"
        logger.info("Kokoro ONNX path: %s (exists: %s)", onnx_path, onnx_path.exists())

        engine = VoiceEngine(cfg)
        logger.info("Voice engine initialized successfully (backend: %s)", getattr(engine, '_backend_name', 'unknown'))
        return engine
    except ImportError as exc:
        logger.warning("voice-soundboard not installed: %s", exc, exc_info=True)
        return None
    except RuntimeError as exc:
        logger.warning("Voice engine runtime error (models missing?): %s", exc, exc_info=True)
        return None
    except Exception as exc:
        logger.warning("Voice engine failed to start: %s", exc, exc_info=True)
        return None


def engine_unavailable_error() -> dict:
    """Standard error response when engine is not available."""
    return {
        "error": (
            "Voice engine is not available. "
            "Ensure voice-soundboard is installed and configured:\n"
            "  pip install voice-soundboard[kokoro]\n"
            "Or check that PYTHONPATH includes the voice-soundboard directory."
        ),
        "healthy": False,
    }
