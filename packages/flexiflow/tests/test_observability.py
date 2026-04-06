"""Tests for observability events."""

from __future__ import annotations

import pytest

from flexiflow.component import AsyncComponent
from flexiflow.engine import FlexiFlowEngine
from flexiflow.event_manager import AsyncEventManager
from flexiflow.state_machine import StateMachine


async def test_message_received_fires():
    """component.message.received fires when a message is handled."""
    bus = AsyncEventManager()
    events = []

    async def capture(data):
        events.append(data)

    await bus.subscribe("component.message.received", "observer", capture)

    component = AsyncComponent(
        name="test_comp",
        state_machine=StateMachine.from_name("InitialState"),
        event_bus=bus,
    )

    await component.handle_message({"type": "start"})

    assert len(events) == 1
    assert events[0]["component"] == "test_comp"
    assert events[0]["message"] == {"type": "start"}


async def test_state_changed_fires_with_from_to():
    """state.changed fires with correct from_state and to_state."""
    bus = AsyncEventManager()
    events = []

    async def capture(data):
        events.append(data)

    await bus.subscribe("state.changed", "observer", capture)

    component = AsyncComponent(
        name="test_comp",
        state_machine=StateMachine.from_name("InitialState"),
        event_bus=bus,
    )

    # This should transition from InitialState to AwaitingConfirmation
    await component.handle_message({"type": "start"})

    assert len(events) == 1
    assert events[0]["component"] == "test_comp"
    assert events[0]["from_state"] == "InitialState"
    assert events[0]["to_state"] == "AwaitingConfirmation"


async def test_state_changed_not_fired_on_no_transition():
    """state.changed does NOT fire when message doesn't cause transition."""
    bus = AsyncEventManager()
    events = []

    async def capture(data):
        events.append(data)

    await bus.subscribe("state.changed", "observer", capture)

    component = AsyncComponent(
        name="test_comp",
        state_machine=StateMachine.from_name("InitialState"),
        event_bus=bus,
    )

    # "confirm" from InitialState should not transition
    await component.handle_message({"type": "confirm"})

    assert len(events) == 0


async def test_handler_failed_fires_on_exception_continue_mode():
    """event.handler.failed fires when handler raises in continue mode."""
    bus = AsyncEventManager()
    failed_events = []

    async def bad_handler(_):
        raise RuntimeError("boom")

    async def capture_failed(data):
        failed_events.append(data)

    await bus.subscribe("test.event", "bad_component", bad_handler)
    await bus.subscribe("event.handler.failed", "observer", capture_failed)

    # Should not raise, but should emit handler.failed
    await bus.publish("test.event", {"foo": "bar"}, on_error="continue")

    assert len(failed_events) == 1
    assert failed_events[0]["event_name"] == "test.event"
    assert failed_events[0]["component_name"] == "bad_component"
    assert "RuntimeError" in failed_events[0]["exception"]
    assert "boom" in failed_events[0]["exception"]


async def test_handler_failed_not_fired_on_raise_mode():
    """event.handler.failed does NOT fire when on_error='raise'."""
    bus = AsyncEventManager()
    failed_events = []

    async def bad_handler(_):
        raise RuntimeError("boom")

    async def capture_failed(data):
        failed_events.append(data)

    await bus.subscribe("test.event", "bad_component", bad_handler)
    await bus.subscribe("event.handler.failed", "observer", capture_failed)

    with pytest.raises(RuntimeError):
        await bus.publish("test.event", on_error="raise")

    # handler.failed should NOT have been emitted
    assert len(failed_events) == 0


async def test_handler_failed_no_recursion():
    """event.handler.failed handlers that fail don't cause infinite recursion."""
    bus = AsyncEventManager()
    call_count = {"n": 0}

    async def bad_handler(_):
        call_count["n"] += 1
        raise RuntimeError("boom")

    # Subscribe a failing handler to the failure event itself
    await bus.subscribe("event.handler.failed", "meta_bad", bad_handler)
    await bus.subscribe("test.event", "trigger", bad_handler)

    # Should not hang or recurse infinitely
    await bus.publish("test.event", on_error="continue")

    # test.event handler called once, handler.failed handler called once (then swallowed)
    assert call_count["n"] == 2


async def test_handler_failed_concurrent_mode():
    """event.handler.failed fires for each failing handler in concurrent mode."""
    bus = AsyncEventManager()
    failed_events = []

    async def bad1(_):
        raise ValueError("bad1")

    async def bad2(_):
        raise TypeError("bad2")

    async def capture_failed(data):
        failed_events.append(data)

    await bus.subscribe("test.event", "comp1", bad1, priority=1)
    await bus.subscribe("test.event", "comp2", bad2, priority=2)
    await bus.subscribe("event.handler.failed", "observer", capture_failed)

    await bus.publish("test.event", delivery="concurrent", on_error="continue")

    assert len(failed_events) == 2
    event_names = [e["event_name"] for e in failed_events]
    component_names = [e["component_name"] for e in failed_events]
    assert all(n == "test.event" for n in event_names)
    assert "comp1" in component_names
    assert "comp2" in component_names
