"""Tests for generation stage with mocked Ollama."""

from unittest.mock import MagicMock

from edgepacks.foundry.generate import GenerateStage, generate_examples
from edgepacks.schema.pack import PackSpec


class TestGenerate:
    def test_generate_with_mock(self, sample_pack: PackSpec, mock_ollama: MagicMock):
        results = generate_examples(sample_pack, count=5, client=mock_ollama)
        assert len(results) == 5
        assert all(r.source == "synthetic" for r in results)

    def test_generate_returns_empty_without_seeds(self, sample_pack: PackSpec):
        pack = sample_pack.model_copy(update={"examples": []})
        mock = MagicMock()
        mock.health.return_value = True
        results = generate_examples(pack, count=5, client=mock)
        assert results == []

    def test_generate_handles_bad_responses(self, sample_pack: PackSpec):
        mock = MagicMock()
        mock.health.return_value = True
        mock.generate.return_value = "not json at all"
        results = generate_examples(sample_pack, count=3, client=mock)
        assert len(results) == 0

    def test_generate_handles_ollama_down(self, sample_pack: PackSpec):
        mock = MagicMock()
        mock.health.return_value = False
        results = generate_examples(sample_pack, count=5, client=mock)
        assert results == []


class TestGenerateStage:
    def test_stage_adds_examples(self, sample_pack: PackSpec, mock_ollama: MagicMock):
        stage = GenerateStage()
        original_count = len(sample_pack.examples)

        # Patch the OllamaClient constructor
        import edgepacks.foundry.generate as gen_mod

        original_client_cls = gen_mod.OllamaClient
        gen_mod.OllamaClient = lambda **kwargs: mock_ollama  # type: ignore[assignment]

        try:
            result = stage(sample_pack, config={"count": 3})
            assert len(result.examples) > original_count
        finally:
            gen_mod.OllamaClient = original_client_cls
