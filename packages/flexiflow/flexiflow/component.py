from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .event_manager import AsyncEventManager
from .state_machine import StateMachine


@dataclass
class AsyncComponent:
    name: str
    rules: List[dict] = field(default_factory=list)
    state_machine: StateMachine = field(default_factory=lambda: StateMachine.from_name("InitialState"))
    logger: Any = None  # logging.Logger-like
    event_bus: Optional[AsyncEventManager] = None

    async def add_rule(self, rule: dict) -> None:
        self.rules.append(rule)

    async def update_rules(self, new_rules: List[dict]) -> None:
        self.rules.extend(new_rules)

    async def handle_message(self, message: Dict[str, Any]) -> None:
        # Capture state before handling for observability
        from_state = self.state_machine.current_state.__class__.__name__

        # Emit message received event (fire-and-forget, never blocks core logic)
        if self.event_bus:
            await self.event_bus.publish(
                "component.message.received",
                {"component": self.name, "message": message},
            )

        proceeded = await self.state_machine.handle_message(message, self)

        if proceeded:
            to_state = self.state_machine.current_state.__class__.__name__

            if self.logger:
                self.logger.info(
                    "%s transitioned to %s",
                    self.name,
                    to_state,
                )

            # Emit state changed event with from/to states
            if self.event_bus:
                await self.event_bus.publish(
                    "state.changed",
                    {"component": self.name, "from_state": from_state, "to_state": to_state},
                )
