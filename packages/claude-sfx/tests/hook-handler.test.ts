import { describe, it, expect } from "vitest";
import {
  mapToolToVerb,
  mapBashVerb,
  type StdinPayload,
} from "../src/hook-handler.js";

function payload(overrides: Partial<StdinPayload> = {}): StdinPayload {
  return {
    session_id: "test",
    ...overrides,
  };
}

describe("mapToolToVerb — exact tool matches", () => {
  it("Read → intake", () => {
    const result = mapToolToVerb("Read", payload());
    expect(result).toEqual({ verb: "intake" });
  });

  it("Edit → transform", () => {
    const result = mapToolToVerb("Edit", payload());
    expect(result).toEqual({ verb: "transform" });
  });

  it("Write → commit", () => {
    const result = mapToolToVerb("Write", payload());
    expect(result).toEqual({ verb: "commit" });
  });

  it("NotebookEdit → commit", () => {
    const result = mapToolToVerb("NotebookEdit", payload());
    expect(result).toEqual({ verb: "commit" });
  });

  it("Grep → navigate", () => {
    const result = mapToolToVerb("Grep", payload());
    expect(result).toEqual({ verb: "navigate" });
  });

  it("Glob → navigate", () => {
    const result = mapToolToVerb("Glob", payload());
    expect(result).toEqual({ verb: "navigate" });
  });

  it("WebFetch → intake (remote)", () => {
    const result = mapToolToVerb("WebFetch", payload());
    expect(result).toEqual({ verb: "intake", options: { scope: "remote" } });
  });

  it("WebSearch → intake (remote)", () => {
    const result = mapToolToVerb("WebSearch", payload());
    expect(result).toEqual({ verb: "intake", options: { scope: "remote" } });
  });

  it("TodoWrite → commit", () => {
    const result = mapToolToVerb("TodoWrite", payload());
    expect(result).toEqual({ verb: "commit" });
  });

  it("Task → commit (remote)", () => {
    const result = mapToolToVerb("Task", payload());
    expect(result).toEqual({ verb: "commit", options: { scope: "remote" } });
  });
});

describe("mapToolToVerb — MCP tools", () => {
  it("mcp__* → intake (remote)", () => {
    const result = mapToolToVerb("mcp__polyglot__translate", payload());
    expect(result).toEqual({ verb: "intake", options: { scope: "remote" } });
  });

  it("mcp__Claude_in_Chrome__screenshot → intake (remote)", () => {
    const result = mapToolToVerb("mcp__Claude_in_Chrome__screenshot", payload());
    expect(result).toEqual({ verb: "intake", options: { scope: "remote" } });
  });
});

describe("mapToolToVerb — unknown tools", () => {
  it("returns null for unknown tool names", () => {
    expect(mapToolToVerb("SomeNewTool", payload())).toBeNull();
    expect(mapToolToVerb("FooBar", payload())).toBeNull();
  });
});

describe("mapToolToVerb — Bash delegation", () => {
  it("Bash delegates to mapBashVerb", () => {
    const result = mapToolToVerb("Bash", payload({ tool_input: "ls -la", exit_code: 0 }));
    expect(result).toBeDefined();
    expect(result!.verb).toBe("execute");
  });
});

describe("mapBashVerb — git commands", () => {
  it("git push → sync up (ok)", () => {
    const result = mapBashVerb(payload({ tool_input: "git push origin main", exit_code: 0 }));
    expect(result.verb).toBe("sync");
    expect(result.options?.direction).toBe("up");
    expect(result.options?.status).toBe("ok");
  });

  it("git push (failure) → sync up (err)", () => {
    const result = mapBashVerb(payload({ tool_input: "git push", exit_code: 1 }));
    expect(result.verb).toBe("sync");
    expect(result.options?.direction).toBe("up");
    expect(result.options?.status).toBe("err");
  });

  it("git pull → sync down (ok)", () => {
    const result = mapBashVerb(payload({ tool_input: "git pull", exit_code: 0 }));
    expect(result.verb).toBe("sync");
    expect(result.options?.direction).toBe("down");
    expect(result.options?.status).toBe("ok");
  });

  it("git fetch → sync down", () => {
    const result = mapBashVerb(payload({ tool_input: "git fetch origin", exit_code: 0 }));
    expect(result.verb).toBe("sync");
    expect(result.options?.direction).toBe("down");
  });

  it("git commit → commit", () => {
    const result = mapBashVerb(payload({ tool_input: 'git commit -m "msg"', exit_code: 0 }));
    expect(result.verb).toBe("commit");
    expect(result.options?.status).toBe("ok");
  });

  it("git commit (failure) → commit (err)", () => {
    const result = mapBashVerb(payload({ tool_input: 'git commit -m "msg"', exit_code: 1 }));
    expect(result.verb).toBe("commit");
    expect(result.options?.status).toBe("err");
  });
});

describe("mapBashVerb — package managers", () => {
  it("npm install → intake remote", () => {
    const result = mapBashVerb(payload({ tool_input: "npm install", exit_code: 0 }));
    expect(result.verb).toBe("intake");
    expect(result.options?.scope).toBe("remote");
    expect(result.options?.status).toBe("ok");
  });

  it("yarn install → intake remote", () => {
    const result = mapBashVerb(payload({ tool_input: "yarn install", exit_code: 0 }));
    expect(result.verb).toBe("intake");
    expect(result.options?.scope).toBe("remote");
  });

  it("pnpm install → intake remote", () => {
    const result = mapBashVerb(payload({ tool_input: "pnpm install", exit_code: 0 }));
    expect(result.verb).toBe("intake");
    expect(result.options?.scope).toBe("remote");
  });

  it("bun install → intake remote", () => {
    const result = mapBashVerb(payload({ tool_input: "bun install", exit_code: 0 }));
    expect(result.verb).toBe("intake");
    expect(result.options?.scope).toBe("remote");
  });
});

describe("mapBashVerb — test commands", () => {
  it("npm test → execute", () => {
    const result = mapBashVerb(payload({ tool_input: "npm test", exit_code: 0 }));
    expect(result.verb).toBe("execute");
    expect(result.options?.status).toBe("ok");
  });

  it("pytest → execute", () => {
    const result = mapBashVerb(payload({ tool_input: "pytest tests/", exit_code: 0 }));
    expect(result.verb).toBe("execute");
  });

  it("vitest → execute", () => {
    const result = mapBashVerb(payload({ tool_input: "vitest run", exit_code: 0 }));
    expect(result.verb).toBe("execute");
  });

  it("jest → execute", () => {
    const result = mapBashVerb(payload({ tool_input: "jest --coverage", exit_code: 1 }));
    expect(result.verb).toBe("execute");
    expect(result.options?.status).toBe("err");
  });
});

describe("mapBashVerb — build commands", () => {
  it("tsc → execute", () => {
    const result = mapBashVerb(payload({ tool_input: "tsc", exit_code: 0 }));
    expect(result.verb).toBe("execute");
    expect(result.options?.status).toBe("ok");
  });

  it("npm run build → execute", () => {
    const result = mapBashVerb(payload({ tool_input: "npm run build", exit_code: 0 }));
    expect(result.verb).toBe("execute");
  });

  it("cargo build → execute", () => {
    const result = mapBashVerb(payload({ tool_input: "cargo build", exit_code: 0 }));
    expect(result.verb).toBe("execute");
  });

  it("make → execute", () => {
    const result = mapBashVerb(payload({ tool_input: "make all", exit_code: 0 }));
    expect(result.verb).toBe("execute");
  });
});

describe("mapBashVerb — file operations", () => {
  it("mv → move", () => {
    const result = mapBashVerb(payload({ tool_input: "mv old.txt new.txt", exit_code: 0 }));
    expect(result.verb).toBe("move");
  });

  it("cp → move", () => {
    const result = mapBashVerb(payload({ tool_input: "cp file.txt backup/", exit_code: 0 }));
    expect(result.verb).toBe("move");
  });

  it("rm → move (warn)", () => {
    const result = mapBashVerb(payload({ tool_input: "rm -rf node_modules", exit_code: 0 }));
    expect(result.verb).toBe("move");
    expect(result.options?.status).toBe("warn");
  });

  it("rmdir → move (warn)", () => {
    const result = mapBashVerb(payload({ tool_input: "rmdir empty/", exit_code: 0 }));
    expect(result.verb).toBe("move");
    expect(result.options?.status).toBe("warn");
  });
});

describe("mapBashVerb — default fallback", () => {
  it("unknown command → execute", () => {
    const result = mapBashVerb(payload({ tool_input: "echo hello", exit_code: 0 }));
    expect(result.verb).toBe("execute");
    expect(result.options?.status).toBe("ok");
  });

  it("unknown command failure → execute (err)", () => {
    const result = mapBashVerb(payload({ tool_input: "some-weird-command", exit_code: 127 }));
    expect(result.verb).toBe("execute");
    expect(result.options?.status).toBe("err");
  });

  it("handles undefined tool_input", () => {
    const result = mapBashVerb(payload({ tool_input: undefined, exit_code: 0 }));
    expect(result.verb).toBe("execute");
  });

  it("handles object tool_input", () => {
    const result = mapBashVerb(payload({
      tool_input: { command: "git push" },
      exit_code: 0,
    }));
    expect(result.verb).toBe("sync");
    expect(result.options?.direction).toBe("up");
  });

  it("handles null exit_code (defaults to 0)", () => {
    const result = mapBashVerb(payload({ tool_input: "npm test" }));
    expect(result.options?.status).toBe("ok");
  });
});
