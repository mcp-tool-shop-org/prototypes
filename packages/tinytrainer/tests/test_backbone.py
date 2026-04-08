"""Tests for backbone embedder (using mock)."""


class TestMockEmbedder:
    def test_embed_shape(self, mock_embedder):
        result = mock_embedder.embed(["hello", "world"])
        assert result.shape == (2, 16)

    def test_embed_single(self, mock_embedder):
        result = mock_embedder.embed_single("hello")
        assert result.shape == (16,)

    def test_embedding_dim(self, mock_embedder):
        assert mock_embedder.embedding_dim == 16

    def test_tokenizer_ref(self, mock_embedder):
        ref = mock_embedder.tokenizer_ref()
        assert ref.model_name == "mock-embedder"
        assert ref.embedding_dim == 16
