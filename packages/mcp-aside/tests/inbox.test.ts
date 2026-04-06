import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Inbox, isExpired, stableHash } from "../src/inbox.js";

describe("isExpired()", () => {
  it("returns false when no expiresAt", () => {
    const item = { id: "1", text: "test", priority: "med" as const, createdAt: new Date().toISOString() };
    assert.equal(isExpired(item), false);
  });

  it("returns true when expiresAt is in the past", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const item = { id: "1", text: "test", priority: "med" as const, createdAt: new Date().toISOString(), expiresAt: past };
    assert.equal(isExpired(item), true);
  });

  it("returns false when expiresAt is in the future", () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const item = { id: "1", text: "test", priority: "med" as const, createdAt: new Date().toISOString(), expiresAt: future };
    assert.equal(isExpired(item), false);
  });
});

describe("stableHash()", () => {
  it("produces consistent hashes", () => {
    assert.equal(stableHash("hello"), stableHash("hello"));
  });

  it("produces different hashes for different inputs", () => {
    assert.notEqual(stableHash("hello"), stableHash("world"));
  });

  it("returns a 16-char hex string", () => {
    const h = stableHash("test");
    assert.equal(h.length, 16);
    assert.ok(/^[0-9a-f]{16}$/.test(h));
  });
});

describe("Inbox", () => {
  it("starts empty", () => {
    const inbox = new Inbox();
    assert.equal(inbox.list().length, 0);
  });

  it("push adds an interjection with generated id and timestamp", () => {
    const inbox = new Inbox();
    const item = inbox.push({ text: "test", priority: "med" });
    assert.ok(item.id);
    assert.ok(item.createdAt);
    assert.equal(item.text, "test");
    assert.equal(item.priority, "med");
  });

  it("list returns items newest first", () => {
    const inbox = new Inbox();
    inbox.push({ text: "first", priority: "low" });
    inbox.push({ text: "second", priority: "low" });
    const items = inbox.list();
    assert.equal(items.length, 2);
    assert.equal(items[0]!.text, "second");
  });

  it("list filters expired items", () => {
    const inbox = new Inbox();
    inbox.push({ text: "alive", priority: "low", expiresAt: new Date(Date.now() + 60_000).toISOString() });
    inbox.push({ text: "dead", priority: "low", expiresAt: new Date(Date.now() - 1000).toISOString() });
    const items = inbox.list();
    assert.equal(items.length, 1);
    assert.equal(items[0]!.text, "alive");
  });

  it("clear empties the inbox", () => {
    const inbox = new Inbox();
    inbox.push({ text: "test", priority: "med" });
    assert.equal(inbox.list().length, 1);
    inbox.clear();
    assert.equal(inbox.list().length, 0);
  });

  it("list returns a copy (not internal array)", () => {
    const inbox = new Inbox();
    inbox.push({ text: "test", priority: "med" });
    const list1 = inbox.list();
    const list2 = inbox.list();
    assert.notEqual(list1, list2);
  });
});
