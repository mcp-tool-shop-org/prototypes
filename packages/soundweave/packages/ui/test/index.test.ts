import { describe, it, expect } from "vitest";
import { PACKAGE } from "../src/index.js";

describe("@soundweave/ui", () => {
  it("exports package identifier", () => {
    expect(PACKAGE).toBe("@soundweave/ui");
  });
});
