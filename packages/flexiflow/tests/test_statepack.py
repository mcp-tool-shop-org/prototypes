"""Tests for StatePack protocol and types."""

from __future__ import annotations

from flexiflow.statepack import MappingPack, StateSpec, StatePack, TransitionSpec


class DummyState:
    """Fake state class for testing."""

    pass


class AnotherState:
    """Another fake state class for testing."""

    pass


class TestStateSpec:
    """Tests for StateSpec dataclass."""

    def test_create_minimal(self):
        """StateSpec with just state_class."""
        spec = StateSpec(state_class=DummyState)
        assert spec.state_class is DummyState
        assert spec.description is None

    def test_create_with_description(self):
        """StateSpec with description."""
        spec = StateSpec(state_class=DummyState, description="A test state")
        assert spec.state_class is DummyState
        assert spec.description == "A test state"

    def test_frozen(self):
        """StateSpec is immutable."""
        spec = StateSpec(state_class=DummyState)
        try:
            spec.description = "changed"  # type: ignore
            assert False, "Should have raised"
        except AttributeError:
            pass

    def test_equality(self):
        """StateSpec equality based on fields."""
        spec1 = StateSpec(DummyState, "desc")
        spec2 = StateSpec(DummyState, "desc")
        spec3 = StateSpec(DummyState, "other")

        assert spec1 == spec2
        assert spec1 != spec3

    def test_repr_minimal(self):
        """StateSpec repr without description."""
        spec = StateSpec(DummyState)
        assert "StateSpec" in repr(spec)
        assert "DummyState" in repr(spec)

    def test_repr_with_description(self):
        """StateSpec repr with description."""
        spec = StateSpec(DummyState, "A test state")
        r = repr(spec)
        assert "StateSpec" in r
        assert "DummyState" in r
        assert "A test state" in r


class TestTransitionSpec:
    """Tests for TransitionSpec dataclass."""

    def test_create_minimal(self):
        """TransitionSpec with required fields only."""
        spec = TransitionSpec(from_state="Idle", on_message="start", to_state="Active")
        assert spec.from_state == "Idle"
        assert spec.on_message == "start"
        assert spec.to_state == "Active"
        assert spec.guard is None
        assert spec.description is None

    def test_create_full(self):
        """TransitionSpec with all fields."""
        spec = TransitionSpec(
            from_state="Idle",
            on_message="start",
            to_state="Active",
            guard="is_authenticated",
            description="Start processing when authenticated",
        )
        assert spec.from_state == "Idle"
        assert spec.on_message == "start"
        assert spec.to_state == "Active"
        assert spec.guard == "is_authenticated"
        assert spec.description == "Start processing when authenticated"

    def test_frozen(self):
        """TransitionSpec is immutable."""
        spec = TransitionSpec("Idle", "start", "Active")
        try:
            spec.to_state = "Error"  # type: ignore
            assert False, "Should have raised"
        except AttributeError:
            pass

    def test_equality(self):
        """TransitionSpec equality based on fields."""
        spec1 = TransitionSpec("Idle", "start", "Active")
        spec2 = TransitionSpec("Idle", "start", "Active")
        spec3 = TransitionSpec("Idle", "stop", "Active")

        assert spec1 == spec2
        assert spec1 != spec3

    def test_repr_minimal(self):
        """TransitionSpec repr without guard."""
        spec = TransitionSpec("Idle", "start", "Active")
        r = repr(spec)
        assert "TransitionSpec" in r
        assert "Idle" in r
        assert "start" in r
        assert "Active" in r

    def test_repr_with_guard(self):
        """TransitionSpec repr with guard."""
        spec = TransitionSpec("Idle", "start", "Active", guard="is_ready")
        r = repr(spec)
        assert "is_ready" in r


class TestStatePackProtocol:
    """Tests for StatePack protocol conformance."""

    def test_minimal_pack_conformance(self):
        """A minimal class can conform to StatePack."""

        class MinimalPack:
            @property
            def name(self) -> str:
                return "minimal"

            def provides(self) -> dict[str, StateSpec]:
                return {}

            def transitions(self) -> list[TransitionSpec]:
                return []

            def depends_on(self) -> set[str]:
                return set()

        pack = MinimalPack()
        assert pack.name == "minimal"
        assert pack.provides() == {}
        assert pack.transitions() == []
        assert pack.depends_on() == set()

    def test_full_pack_conformance(self):
        """A full pack implementation works correctly."""

        class FullPack:
            @property
            def name(self) -> str:
                return "session"

            def provides(self) -> dict[str, StateSpec]:
                return {
                    "Idle": StateSpec(DummyState, "Waiting state"),
                    "Active": StateSpec(AnotherState, "Working state"),
                }

            def transitions(self) -> list[TransitionSpec]:
                return [
                    TransitionSpec("Idle", "start", "Active"),
                    TransitionSpec("Active", "complete", "Idle"),
                    TransitionSpec("Active", "error", "Idle", guard="is_recoverable"),
                ]

            def depends_on(self) -> set[str]:
                return {"ErrorState"}

        pack = FullPack()

        assert pack.name == "session"

        provides = pack.provides()
        assert len(provides) == 2
        assert "Idle" in provides
        assert "Active" in provides
        assert provides["Idle"].state_class is DummyState
        assert provides["Active"].description == "Working state"

        transitions = pack.transitions()
        assert len(transitions) == 3
        assert transitions[0].from_state == "Idle"
        assert transitions[0].on_message == "start"
        assert transitions[2].guard == "is_recoverable"

        deps = pack.depends_on()
        assert "ErrorState" in deps

    def test_pack_with_no_transitions(self):
        """Pack can have states but no transition manifest."""

        class NoTransitionsPack:
            @property
            def name(self) -> str:
                return "simple"

            def provides(self) -> dict[str, StateSpec]:
                return {"Only": StateSpec(DummyState)}

            def transitions(self) -> list[TransitionSpec]:
                return []  # Valid - transitions not always declarative

            def depends_on(self) -> set[str]:
                return set()

        pack = NoTransitionsPack()
        assert len(pack.provides()) == 1
        assert pack.transitions() == []


class TestImportStability:
    """Tests for import stability."""

    def test_imports_from_statepack_module(self):
        """Types are importable from statepack module."""
        from flexiflow.statepack import StateSpec, StatePack, TransitionSpec

        assert StateSpec is not None
        assert TransitionSpec is not None
        assert StatePack is not None

    def test_statespec_is_dataclass(self):
        """StateSpec behaves like a dataclass."""
        from dataclasses import fields

        from flexiflow.statepack import StateSpec

        field_names = [f.name for f in fields(StateSpec)]
        assert "state_class" in field_names
        assert "description" in field_names

    def test_transitionspec_is_dataclass(self):
        """TransitionSpec behaves like a dataclass."""
        from dataclasses import fields

        from flexiflow.statepack import TransitionSpec

        field_names = [f.name for f in fields(TransitionSpec)]
        assert "from_state" in field_names
        assert "on_message" in field_names
        assert "to_state" in field_names
        assert "guard" in field_names


class TestMappingPack:
    """Tests for MappingPack adapter."""

    def test_create_empty(self):
        """MappingPack can be created with empty dict."""
        pack = MappingPack({})
        assert pack.name == "mapping"
        assert pack.provides() == {}
        assert pack.transitions() == []
        assert pack.depends_on() == set()

    def test_create_with_states(self):
        """MappingPack wraps states dict correctly."""
        mapping = {"Idle": DummyState, "Active": AnotherState}
        pack = MappingPack(mapping)

        assert pack.name == "mapping"

        provides = pack.provides()
        assert len(provides) == 2
        assert "Idle" in provides
        assert "Active" in provides
        assert provides["Idle"].state_class is DummyState
        assert provides["Active"].state_class is AnotherState

    def test_provides_returns_statespecs(self):
        """MappingPack.provides() returns StateSpec objects."""
        pack = MappingPack({"Test": DummyState})

        provides = pack.provides()
        spec = provides["Test"]

        assert isinstance(spec, StateSpec)
        assert spec.state_class is DummyState
        assert spec.description is None  # No description in mapping format

    def test_transitions_always_empty(self):
        """MappingPack.transitions() always returns empty list."""
        pack = MappingPack({"Idle": DummyState, "Active": AnotherState})
        assert pack.transitions() == []

    def test_depends_on_always_empty(self):
        """MappingPack.depends_on() always returns empty set."""
        pack = MappingPack({"Idle": DummyState})
        assert pack.depends_on() == set()

    def test_conforms_to_statepack_interface(self):
        """MappingPack has all StatePack methods."""
        pack = MappingPack({"Test": DummyState})

        # Verify all protocol methods exist and work
        assert hasattr(pack, "name")
        assert hasattr(pack, "provides")
        assert hasattr(pack, "transitions")
        assert hasattr(pack, "depends_on")

        assert isinstance(pack.name, str)
        assert isinstance(pack.provides(), dict)
        assert isinstance(pack.transitions(), list)
        assert isinstance(pack.depends_on(), set)

    def test_provides_is_fresh_dict(self):
        """MappingPack.provides() returns fresh dict each call."""
        pack = MappingPack({"Test": DummyState})

        provides1 = pack.provides()
        provides2 = pack.provides()

        assert provides1 == provides2
        assert provides1 is not provides2  # Fresh dict each time

    def test_provides_keys_sorted(self):
        """MappingPack.provides() returns keys in sorted order."""
        # Insert in non-sorted order
        pack = MappingPack({"Zebra": DummyState, "Alpha": AnotherState, "Middle": DummyState})

        provides = pack.provides()
        keys = list(provides.keys())

        assert keys == ["Alpha", "Middle", "Zebra"]
