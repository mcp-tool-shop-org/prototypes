"""Tests for notification sender module."""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from headless_wheel_builder.notify.models import (
    NotificationConfig,
    NotificationEvent,
    NotificationResult,
    NotificationType,
    ProviderType,
)
from headless_wheel_builder.notify.sender import NotificationSender


def _make_channel(
    name: str = "test", events: list[NotificationType] | None = None
) -> NotificationConfig:
    """Create a test notification channel config."""
    return NotificationConfig(
        name=name,
        provider=ProviderType.WEBHOOK,
        webhook_url="https://example.com/hook",
        events=events or [NotificationType.BUILD_SUCCESS, NotificationType.BUILD_FAILURE],
    )


class TestNotificationSender:
    """Test NotificationSender core logic."""

    def test_empty_channels(self) -> None:
        sender = NotificationSender()
        assert sender.channels == []

    def test_add_channel(self) -> None:
        sender = NotificationSender()
        channel = _make_channel("slack")
        sender.add_channel(channel)
        assert len(sender.channels) == 1
        assert sender.channels[0].name == "slack"

    def test_add_channel_replaces_same_name(self) -> None:
        sender = NotificationSender()
        sender.add_channel(_make_channel("slack"))
        sender.add_channel(_make_channel("slack"))
        assert len(sender.channels) == 1

    def test_add_multiple_channels(self) -> None:
        sender = NotificationSender()
        sender.add_channel(_make_channel("slack"))
        sender.add_channel(_make_channel("discord"))
        assert len(sender.channels) == 2

    def test_remove_channel(self) -> None:
        sender = NotificationSender()
        sender.add_channel(_make_channel("slack"))
        assert sender.remove_channel("slack") is True
        assert len(sender.channels) == 0

    def test_remove_nonexistent(self) -> None:
        sender = NotificationSender()
        assert sender.remove_channel("nonexistent") is False

    @pytest.mark.asyncio
    async def test_send_no_applicable_channels(self) -> None:
        sender = NotificationSender()
        event = NotificationEvent(
            type=NotificationType.BUILD_SUCCESS,
            title="Build OK",
            message="test",
        )
        results = await sender.send(event)
        assert results == []

    @pytest.mark.asyncio
    async def test_send_with_provider(self) -> None:
        channel = _make_channel("test", events=[NotificationType.BUILD_SUCCESS])
        sender = NotificationSender(channels=[channel])

        mock_result = NotificationResult(config=channel, success=True)
        mock_provider = AsyncMock()
        mock_provider.send = AsyncMock(return_value=mock_result)

        event = NotificationEvent(
            type=NotificationType.BUILD_SUCCESS,
            title="Build OK",
            message="Built successfully",
        )

        with patch("headless_wheel_builder.notify.sender.get_provider", return_value=mock_provider):
            results = await sender.send(event)

        assert len(results) == 1
        assert results[0].success is True

    @pytest.mark.asyncio
    async def test_send_handles_provider_exception(self) -> None:
        channel = _make_channel("test", events=[NotificationType.BUILD_SUCCESS])
        sender = NotificationSender(channels=[channel])

        mock_provider = AsyncMock()
        mock_provider.send = AsyncMock(side_effect=RuntimeError("Connection refused"))

        event = NotificationEvent(
            type=NotificationType.BUILD_SUCCESS,
            title="Build OK",
            message="test",
        )

        with patch("headless_wheel_builder.notify.sender.get_provider", return_value=mock_provider):
            results = await sender.send(event)

        assert len(results) == 1
        assert results[0].success is False
        assert "Connection refused" in results[0].error


class TestConvenienceMethods:
    """Test notify_build_success, notify_build_failure, etc."""

    @pytest.fixture
    def sender(self) -> NotificationSender:
        channel = _make_channel(
            "all",
            events=[
                NotificationType.BUILD_SUCCESS,
                NotificationType.BUILD_FAILURE,
                NotificationType.RELEASE_CREATED,
                NotificationType.PIPELINE_START,
                NotificationType.PIPELINE_SUCCESS,
                NotificationType.PIPELINE_FAILURE,
            ],
        )
        return NotificationSender(channels=[channel])

    @pytest.mark.asyncio
    async def test_notify_build_success(self, sender: NotificationSender) -> None:
        mock_provider = AsyncMock()
        mock_provider.send = AsyncMock(
            return_value=NotificationResult(config=sender.channels[0], success=True)
        )

        with patch("headless_wheel_builder.notify.sender.get_provider", return_value=mock_provider):
            results = await sender.notify_build_success("mypackage", "1.0.0", duration=12.5)

        assert len(results) == 1
        # Verify the event data was constructed correctly
        call_args = mock_provider.send.call_args[0][0]
        assert call_args.type == NotificationType.BUILD_SUCCESS
        assert "mypackage" in call_args.title
        assert call_args.data["duration"] == "12.5s"

    @pytest.mark.asyncio
    async def test_notify_build_failure(self, sender: NotificationSender) -> None:
        mock_provider = AsyncMock()
        mock_provider.send = AsyncMock(
            return_value=NotificationResult(config=sender.channels[0], success=True)
        )

        with patch("headless_wheel_builder.notify.sender.get_provider", return_value=mock_provider):
            await sender.notify_build_failure("mypackage", "Compile error", version="2.0.0")

        call_args = mock_provider.send.call_args[0][0]
        assert call_args.type == NotificationType.BUILD_FAILURE
        assert "2.0.0" in call_args.title
        assert call_args.data["error"] == "Compile error"

    @pytest.mark.asyncio
    async def test_notify_release_created(self, sender: NotificationSender) -> None:
        mock_provider = AsyncMock()
        mock_provider.send = AsyncMock(
            return_value=NotificationResult(config=sender.channels[0], success=True)
        )

        with patch("headless_wheel_builder.notify.sender.get_provider", return_value=mock_provider):
            await sender.notify_release_created(
                "pkg", "3.0.0", url="https://pypi.org/project/pkg/3.0.0/", assets=["pkg-3.0.0.whl"]
            )

        call_args = mock_provider.send.call_args[0][0]
        assert call_args.type == NotificationType.RELEASE_CREATED
        assert call_args.url == "https://pypi.org/project/pkg/3.0.0/"

    @pytest.mark.asyncio
    async def test_notify_pipeline_start(self, sender: NotificationSender) -> None:
        mock_provider = AsyncMock()
        mock_provider.send = AsyncMock(
            return_value=NotificationResult(config=sender.channels[0], success=True)
        )

        with patch("headless_wheel_builder.notify.sender.get_provider", return_value=mock_provider):
            await sender.notify_pipeline_start("pkg", stages=["build", "test", "publish"])

        call_args = mock_provider.send.call_args[0][0]
        assert call_args.type == NotificationType.PIPELINE_START
        assert "build" in call_args.data["stages"]

    @pytest.mark.asyncio
    async def test_notify_pipeline_success(self, sender: NotificationSender) -> None:
        mock_provider = AsyncMock()
        mock_provider.send = AsyncMock(
            return_value=NotificationResult(config=sender.channels[0], success=True)
        )

        with patch("headless_wheel_builder.notify.sender.get_provider", return_value=mock_provider):
            await sender.notify_pipeline_success("pkg", "1.0.0", duration=30.0, stages_completed=3)

        call_args = mock_provider.send.call_args[0][0]
        assert call_args.type == NotificationType.PIPELINE_SUCCESS
        assert call_args.data["duration"] == "30.0s"

    @pytest.mark.asyncio
    async def test_notify_pipeline_failure(self, sender: NotificationSender) -> None:
        mock_provider = AsyncMock()
        mock_provider.send = AsyncMock(
            return_value=NotificationResult(config=sender.channels[0], success=True)
        )

        with patch("headless_wheel_builder.notify.sender.get_provider", return_value=mock_provider):
            await sender.notify_pipeline_failure("pkg", "test", "Tests failed")

        call_args = mock_provider.send.call_args[0][0]
        assert call_args.type == NotificationType.PIPELINE_FAILURE
        assert call_args.data["stage"] == "test"

    @pytest.mark.asyncio
    async def test_long_error_truncated(self, sender: NotificationSender) -> None:
        mock_provider = AsyncMock()
        mock_provider.send = AsyncMock(
            return_value=NotificationResult(config=sender.channels[0], success=True)
        )

        long_error = "x" * 1000

        with patch("headless_wheel_builder.notify.sender.get_provider", return_value=mock_provider):
            await sender.notify_build_failure("pkg", long_error)

        call_args = mock_provider.send.call_args[0][0]
        assert len(call_args.data["error"]) == 500
