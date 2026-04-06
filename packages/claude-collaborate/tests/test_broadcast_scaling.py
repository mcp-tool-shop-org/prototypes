from __future__ import annotations

import ws_bridge


class DummyClient:
    def __init__(self, closed: bool = False):
        self.closed = closed
        self.sent = 0

    async def send_json(self, message):
        self.sent += 1
        return None


async def test_broadcast_skips_closed_clients(monkeypatch):
    c1 = DummyClient(closed=False)
    c2 = DummyClient(closed=True)
    c3 = DummyClient(closed=False)

    clients = {c1, c2, c3}
    monkeypatch.setattr(ws_bridge, "connected_clients", clients)
    await ws_bridge.broadcast_to_clients({"type": "x"})

    assert c1.sent == 1
    assert c2.sent == 0
    assert c3.sent == 1


class FailingClient:
    """A client whose send_json raises, simulating a dropped connection."""
    def __init__(self):
        self.closed = False

    async def send_json(self, message):
        raise ConnectionResetError("gone")


async def test_broadcast_removes_failed_client(monkeypatch):
    """After broadcast, a client that errored during send is discarded from the set."""
    good = DummyClient(closed=False)
    bad = FailingClient()

    clients = {good, bad}
    monkeypatch.setattr(ws_bridge, "connected_clients", clients)
    await ws_bridge.broadcast_to_clients({"type": "x"})

    assert good.sent == 1
    assert bad not in ws_bridge.connected_clients
