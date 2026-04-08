"""SentenceEmbedder — frozen wrapper around sentence-transformers."""

from __future__ import annotations

import logging

import numpy as np

from tinytrainer.schema.kit import TokenizerRef

logger = logging.getLogger(__name__)


class SentenceEmbedder:
    """Frozen sentence embedding backbone.

    Wraps a sentence-transformers model. All parameters are frozen —
    we never backpropagate through this. Embeddings are computed once
    and cached as numpy arrays.
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2") -> None:
        from sentence_transformers import SentenceTransformer

        self._model_name = model_name
        self._model = SentenceTransformer(model_name)
        self._model.eval()
        for p in self._model.parameters():
            p.requires_grad = False
        logger.info("Loaded backbone: %s (dim=%d)", model_name, self.embedding_dim)

    @property
    def embedding_dim(self) -> int:
        return self._model.get_sentence_embedding_dimension()

    @property
    def max_seq_length(self) -> int:
        return self._model.max_seq_length

    def embed(self, texts: list[str], batch_size: int = 64) -> np.ndarray:
        """Batch embed texts → (N, dim) float32 numpy array."""
        return self._model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=len(texts) > 100,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )

    def embed_single(self, text: str) -> np.ndarray:
        """Embed one text → (dim,) float32 numpy array."""
        return self.embed([text])[0]

    def tokenizer_ref(self) -> TokenizerRef:
        """Return metadata for kit packaging."""
        return TokenizerRef(
            model_name=self._model_name,
            embedding_dim=self.embedding_dim,
            max_seq_length=self.max_seq_length,
        )
