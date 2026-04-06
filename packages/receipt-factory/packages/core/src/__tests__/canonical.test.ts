import { describe, it, expect } from "vitest";
import { canonicalize } from "../canonical.js";

describe("canonicalize", () => {
  it("sorts object keys alphabetically", () => {
    const result = canonicalize({ z: 1, a: 2, m: 3 });
    expect(result).toBe('{"a":2,"m":3,"z":1}');
  });

  it("sorts nested object keys recursively", () => {
    const result = canonicalize({ b: { d: 1, c: 2 }, a: 3 });
    expect(result).toBe('{"a":3,"b":{"c":2,"d":1}}');
  });

  it("preserves array order", () => {
    const result = canonicalize({ items: [3, 1, 2] });
    expect(result).toBe('{"items":[3,1,2]}');
  });

  it("handles null values", () => {
    const result = canonicalize({ a: null, b: 1 });
    expect(result).toBe('{"a":null,"b":1}');
  });

  it("omits undefined values", () => {
    const result = canonicalize({ a: undefined, b: 1 });
    expect(result).toBe('{"b":1}');
  });

  it("produces deterministic output for same input", () => {
    const obj = { kind: "ci_run", subject: { name: "test", type: "repo" }, intent: "test" };
    const a = canonicalize(obj);
    const b = canonicalize(obj);
    expect(a).toBe(b);
  });

  it("produces same output regardless of key insertion order", () => {
    const a = canonicalize({ x: 1, y: 2 });
    const b = canonicalize({ y: 2, x: 1 });
    expect(a).toBe(b);
  });

  it("handles empty objects", () => {
    expect(canonicalize({})).toBe("{}");
  });

  it("handles empty arrays", () => {
    expect(canonicalize([])).toBe("[]");
  });

  it("handles strings", () => {
    expect(canonicalize("hello")).toBe('"hello"');
  });

  it("handles arrays of objects with sorted keys", () => {
    const result = canonicalize([{ b: 2, a: 1 }, { d: 4, c: 3 }]);
    expect(result).toBe('[{"a":1,"b":2},{"c":3,"d":4}]');
  });
});
