import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { detectContext } from "../context.js";

describe("detectContext", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    // Clear GitHub env vars
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITHUB_RUN_ID;
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.GITHUB_SHA;
    delete process.env.GITHUB_REF;
    delete process.env.GITHUB_ACTOR;
    delete process.env.GITHUB_WORKFLOW;
    delete process.env.GITHUB_SERVER_URL;
  });

  afterEach(() => {
    // Restore
    Object.assign(process.env, origEnv);
  });

  it("detects non-Actions environment", () => {
    const ctx = detectContext();
    expect(ctx.isActions).toBe(false);
    expect(ctx.runId).toBeUndefined();
    expect(ctx.serverUrl).toBe("https://github.com");
  });

  it("detects Actions environment", () => {
    process.env.GITHUB_ACTIONS = "true";
    process.env.GITHUB_RUN_ID = "12345";
    process.env.GITHUB_REPOSITORY = "org/repo";
    process.env.GITHUB_SHA = "abc123";
    process.env.GITHUB_REF = "refs/heads/main";
    process.env.GITHUB_ACTOR = "developer";
    process.env.GITHUB_WORKFLOW = "CI";

    const ctx = detectContext();
    expect(ctx.isActions).toBe(true);
    expect(ctx.runId).toBe("12345");
    expect(ctx.repository).toBe("org/repo");
    expect(ctx.sha).toBe("abc123");
    expect(ctx.ref).toBe("refs/heads/main");
    expect(ctx.actor).toBe("developer");
    expect(ctx.workflow).toBe("CI");
  });
});
