"""StatePack protocol and supporting types.

StatePacks provide metadata about state collections for introspection,
validation, and documentation. They do not change runtime behavior.

This module defines the contract that state packs must follow:
- What states they provide
- What transitions exist between states
- What dependencies they require

Example:
    class SessionPack:
        @property
        def name(self) -> str:
            return "session"

        def provides(self) -> dict[str, StateSpec]:
            return {
                "Idle": StateSpec(IdleState, "Waiting for user action"),
                "Active": StateSpec(ActiveState, "Processing user request"),
            }

        def transitions(self) -> list[TransitionSpec]:
            return [
                TransitionSpec("Idle", "start", "Active"),
                TransitionSpec("Active", "complete", "Idle"),
            ]

        def depends_on(self) -> set[str]:
            return set()  # No external dependencies
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Protocol, Set

if TYPE_CHECKING:
    pass  # Future: State type hint if needed


@dataclass(frozen=True)
class StateSpec:
    """Specification for a single state in a pack.

    Attributes:
        state_class: The State subclass for this state.
        description: Optional human-readable description.
    """

    state_class: type
    description: Optional[str] = None

    def __repr__(self) -> str:
        cls_name = getattr(self.state_class, "__name__", str(self.state_class))
        if self.description:
            return f"StateSpec({cls_name}, {self.description!r})"
        return f"StateSpec({cls_name})"


@dataclass(frozen=True)
class TransitionSpec:
    """Specification for a state transition.

    Describes a possible transition from one state to another,
    triggered by a specific message type. This is introspection-only;
    it does not affect runtime behavior.

    Attributes:
        from_state: Source state name.
        on_message: Message type that triggers this transition.
        to_state: Destination state name.
        guard: Optional name of a guard condition (introspection label only).
        description: Optional human-readable description.
    """

    from_state: str
    on_message: str
    to_state: str
    guard: Optional[str] = None
    description: Optional[str] = None

    def __repr__(self) -> str:
        base = f"TransitionSpec({self.from_state!r} --[{self.on_message}]--> {self.to_state!r})"
        if self.guard:
            base = base[:-1] + f", guard={self.guard!r})"
        return base


class StatePack(Protocol):
    """Protocol for state packs.

    A StatePack provides metadata about a collection of related states.
    It describes what states are available, how they transition, and
    what dependencies they require.

    This is an introspection protocol - implementing it does not change
    how states behave at runtime. It enables:
    - explain() to show pack attribution
    - Collision detection between packs
    - Dependency validation
    - Documentation generation

    Example:
        class MyPack:
            @property
            def name(self) -> str:
                return "my_pack"

            def provides(self) -> dict[str, StateSpec]:
                return {"MyState": StateSpec(MyState)}

            def transitions(self) -> list[TransitionSpec]:
                return []

            def depends_on(self) -> set[str]:
                return set()
    """

    @property
    def name(self) -> str:
        """Pack identifier.

        Should be a short, descriptive name like 'session', 'cache', or 'auth'.
        Used for attribution in explain() output and error messages.
        """
        ...

    def provides(self) -> Dict[str, StateSpec]:
        """States this pack provides.

        Returns a mapping from state registry keys to StateSpec objects.
        Keys are the names used to look up states in the registry.

        Example:
            {"Idle": StateSpec(IdleState), "Active": StateSpec(ActiveState)}
        """
        ...

    def transitions(self) -> List[TransitionSpec]:
        """Transitions between states in this pack.

        Returns a list of TransitionSpec objects describing possible
        state transitions. This is introspection-only; it does not
        affect runtime behavior.

        Return an empty list if transitions are not declaratively defined.
        """
        ...

    def depends_on(self) -> Set[str]:
        """State keys this pack requires but doesn't provide.

        Returns a set of state names that must be provided by other packs
        or builtins. Used for dependency validation.

        Return an empty set if this pack has no external dependencies.
        """
        ...


class MappingPack:
    """StatePack adapter for states: mapping configs.

    Wraps a dict[str, type] (state key -> state class) into the StatePack
    interface. Used internally to provide backward compatibility with
    v0.3.x states: config format.

    This pack:
    - Has name "mapping" (anonymous pack)
    - provides() returns specs derived from the dict
    - transitions() returns empty (not declaratively defined)
    - depends_on() returns empty (no dependency tracking for legacy format)

    Example:
        mapping = {"Idle": IdleState, "Active": ActiveState}
        pack = MappingPack(mapping)

        pack.name  # "mapping"
        pack.provides()  # {"Idle": StateSpec(IdleState), ...}
        pack.transitions()  # []
        pack.depends_on()  # set()
    """

    def __init__(self, states: Dict[str, type]) -> None:
        """Create a MappingPack from a state key -> class mapping.

        Args:
            states: Mapping from state registry keys to State subclasses.
        """
        self._states = states

    @property
    def name(self) -> str:
        """Pack identifier - always 'mapping' for legacy configs."""
        return "mapping"

    def provides(self) -> Dict[str, StateSpec]:
        """States this pack provides, derived from the mapping.

        Returns keys in sorted order for deterministic output.
        """
        return {key: StateSpec(self._states[key]) for key in sorted(self._states)}

    def transitions(self) -> List[TransitionSpec]:
        """Empty - transitions not declaratively defined in mapping format."""
        return []

    def depends_on(self) -> Set[str]:
        """Empty - no dependency tracking for legacy format."""
        return set()
