"""Split configuration and results."""

from pydantic import BaseModel, Field, model_validator

from edgepacks.schema.example import Example


class SplitConfig(BaseModel):
    """How to partition examples into train/val/test."""

    train_ratio: float = Field(default=0.8, ge=0.0, le=1.0)
    val_ratio: float = Field(default=0.1, ge=0.0, le=1.0)
    test_ratio: float = Field(default=0.1, ge=0.0, le=1.0)
    seed: int = 42
    stratify_by: str | None = None

    @model_validator(mode="after")
    def ratios_sum_to_one(self) -> "SplitConfig":
        total = self.train_ratio + self.val_ratio + self.test_ratio
        if not (0.99 <= total <= 1.01):
            msg = f"Split ratios must sum to 1.0, got {total:.3f}"
            raise ValueError(msg)
        return self


class SplitResult(BaseModel):
    """The output of splitting a pack into train/val/test."""

    train: list[Example] = Field(default_factory=list)
    val: list[Example] = Field(default_factory=list)
    test: list[Example] = Field(default_factory=list)
    leaks_removed: int = 0
