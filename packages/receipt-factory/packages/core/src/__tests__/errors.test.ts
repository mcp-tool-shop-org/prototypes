import { describe, it, expect } from "vitest";
import { RfError, wrapError } from "../errors.js";

describe("RfError", () => {
  it("creates error with code, message, hint", () => {
    const err = new RfError({
      code: "RF_TEST",
      message: "Something went wrong",
      hint: "Try again",
    });

    expect(err.code).toBe("RF_TEST");
    expect(err.message).toBe("Something went wrong");
    expect(err.hint).toBe("Try again");
    expect(err.retryable).toBe(false);
    expect(err.name).toBe("RfError");
  });

  it("toStructured returns machine-readable output", () => {
    const err = new RfError({ code: "RF_HASH", message: "mismatch", retryable: true });
    const structured = err.toStructured();

    expect(structured).toEqual({
      code: "RF_HASH",
      message: "mismatch",
      hint: undefined,
      retryable: true,
    });
  });

  it("toCliText formats for terminal", () => {
    const err = new RfError({
      code: "RF_IO",
      message: "File not found",
      hint: "Check the path",
    });
    const text = err.toCliText();

    expect(text).toContain("[RF_IO]");
    expect(text).toContain("File not found");
    expect(text).toContain("Hint: Check the path");
  });
});

describe("wrapError", () => {
  it("wraps a plain Error", () => {
    const original = new Error("oops");
    const wrapped = wrapError(original, "RF_WRAP");

    expect(wrapped).toBeInstanceOf(RfError);
    expect(wrapped.code).toBe("RF_WRAP");
    expect(wrapped.message).toBe("oops");
    expect(wrapped.cause).toBe(original);
  });

  it("passes through existing RfError unchanged", () => {
    const original = new RfError({ code: "RF_ORIG", message: "original" });
    const wrapped = wrapError(original, "RF_NEW");

    expect(wrapped).toBe(original);
    expect(wrapped.code).toBe("RF_ORIG");
  });

  it("wraps non-Error values", () => {
    const wrapped = wrapError("string error", "RF_STR");
    expect(wrapped.message).toBe("string error");
  });
});
