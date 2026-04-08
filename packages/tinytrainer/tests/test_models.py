"""Tests for classifier heads."""

import torch

from tinytrainer.models.classifier import ClassifierHead
from tinytrainer.schema.config import HeadType


class TestClassifierHead:
    def test_linear_forward(self):
        head = ClassifierHead(input_dim=16, num_labels=3, head_type=HeadType.LINEAR)
        x = torch.randn(4, 16)
        out = head(x)
        assert out.shape == (4, 3)

    def test_mlp_forward(self):
        head = ClassifierHead(input_dim=16, num_labels=5, head_type=HeadType.MLP, mlp_hidden=32)
        x = torch.randn(2, 16)
        out = head(x)
        assert out.shape == (2, 5)

    def test_updatable_params(self):
        head = ClassifierHead(input_dim=16, num_labels=3, head_type=HeadType.LINEAR)
        params = head.updatable_param_names
        assert len(params) > 0
        assert all(isinstance(p, str) for p in params)

    def test_mlp_has_more_params(self):
        linear = ClassifierHead(input_dim=16, num_labels=3, head_type=HeadType.LINEAR)
        mlp = ClassifierHead(input_dim=16, num_labels=3, head_type=HeadType.MLP)
        assert len(mlp.updatable_param_names) > len(linear.updatable_param_names)
