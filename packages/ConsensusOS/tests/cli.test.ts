import { describe, it, expect, beforeEach } from "vitest";
import { dispatch, registeredCommands, getVersion } from "../src/cli/cli.js";
import { CoreLoader } from "../src/core/loader.js";
import { createHealthSentinel } from "../src/modules/health/health-sentinel.js";
import { createReleaseVerifier } from "../src/modules/verifier/release-verifier.js";
import { createConfigGuardian } from "../src/modules/config/config-guardian.js";
import { createXrplAdapter } from "../src/adapters/xrpl/xrpl-adapter.js";
import type { CliContext } from "../src/cli/cli.js";

/** Build a test CLI context with captured output */
function createTestCtx(args: string[], configs?: Record<string, Record<string, unknown>>): {
  ctx: CliContext;
  stdout: string[];
  stderr: string[];
} {
  const stdout: string[] = [];
  const stderr: string[] = [];

  const loader = new CoreLoader({ configs });

  return {
    ctx: {
      loader,
      args,
      stdout: (msg) => stdout.push(msg),
      stderr: (msg) => stderr.push(msg),
    },
    stdout,
    stderr,
  };
}

describe("CLI Dispatcher", () => {
  it("has all expected commands registered", () => {
    const cmds = registeredCommands();
    expect(cmds).toContain("doctor");
    expect(cmds).toContain("verify");
    expect(cmds).toContain("config");
    expect(cmds).toContain("status");
    expect(cmds).toContain("plugins");
    expect(cmds).toContain("adapters");
    expect(cmds).toContain("help");
  });

  it("dispatches help for no args", async () => {
    const { ctx, stdout } = createTestCtx([]);
    const result = await dispatch(ctx);
    expect(result.exitCode).toBe(0);
    expect(stdout.join("")).toContain("Commands:");
  });

  it("dispatches help for --help", async () => {
    const { ctx, stdout } = createTestCtx(["--help"]);
    const result = await dispatch(ctx);
    expect(result.exitCode).toBe(0);
    expect(stdout.join("")).toContain("doctor");
  });

  it("returns error for unknown command", async () => {
    const { ctx, stderr } = createTestCtx(["nonexistent"]);
    const result = await dispatch(ctx);
    expect(result.exitCode).toBe(1);
    expect(stderr.join("")).toContain("Unknown command");
  });

  it("--version outputs version and exits 0", async () => {
    const { ctx, stdout } = createTestCtx(["--version"]);
    const result = await dispatch(ctx);
    expect(result.exitCode).toBe(0);
    expect(stdout.join("")).toMatch(/consensusos \d+\.\d+\.\d+/);
  });

  it("-V outputs version and exits 0", async () => {
    const { ctx, stdout } = createTestCtx(["-V"]);
    const result = await dispatch(ctx);
    expect(result.exitCode).toBe(0);
    expect(stdout.join("")).toMatch(/consensusos \d+\.\d+\.\d+/);
  });

  it("getVersion returns a semver string", () => {
    const version = getVersion();
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("help output includes --version flag", async () => {
    const { ctx, stdout } = createTestCtx(["help"]);
    await dispatch(ctx);
    expect(stdout.join("")).toContain("--version");
  });
});

describe("CLI Commands with Loader", () => {
  let loader: CoreLoader;

  beforeEach(async () => {
    loader = new CoreLoader({
      configs: {
        "health-sentinel": {
          nodes: [{ id: "test-node", url: "http://test:80" }],
          probe: async () => ({ reachable: true, latencyMs: 10 }),
        },
        "release-verifier": {
          artifacts: [{ path: "/bin/test", expectedHash: "abc" }],
          hashFn: async () => "abc",
        },
        "config-guardian": {
          requiredKeys: ["port"],
        },
        "xrpl-adapter": {
          nodes: ["wss://test.xrpl"],
          rpcCall: async () => ({ info: { server_state: "full" } }),
        },
      },
    });

    loader.register(createHealthSentinel());
    loader.register(createReleaseVerifier());
    loader.register(createConfigGuardian());
    loader.register(createXrplAdapter());

    await loader.boot();
  });

  it("doctor command runs health check", async () => {
    const stdout: string[] = [];
    const result = await dispatch({
      loader,
      args: ["doctor"],
      stdout: (msg) => stdout.push(msg),
      stderr: () => {},
    });

    const output = stdout.join("");
    expect(output).toContain("Health Check");
    expect(output).toContain("test-node");
    expect(result.exitCode).toBe(0);
  });

  it("verify command checks artifacts", async () => {
    const stdout: string[] = [];
    const result = await dispatch({
      loader,
      args: ["verify"],
      stdout: (msg) => stdout.push(msg),
      stderr: () => {},
    });

    const output = stdout.join("");
    expect(output).toContain("Artifact Verification");
    expect(output).toContain("PASS");
    expect(result.exitCode).toBe(0);
  });

  it("status command shows system overview", async () => {
    const stdout: string[] = [];
    const result = await dispatch({
      loader,
      args: ["status"],
      stdout: (msg) => stdout.push(msg),
      stderr: () => {},
    });

    const output = stdout.join("");
    expect(output).toContain("Plugins loaded: 4");
    expect(output).toContain("health-sentinel");
    expect(output).toContain("release-verifier");
    expect(output).toContain("config-guardian");
    expect(output).toContain("xrpl-adapter");
    expect(result.exitCode).toBe(0);
  });

  it("plugins list shows all plugins", async () => {
    const stdout: string[] = [];
    const result = await dispatch({
      loader,
      args: ["plugins", "list"],
      stdout: (msg) => stdout.push(msg),
      stderr: () => {},
    });

    const output = stdout.join("");
    expect(output).toContain("health-sentinel");
    expect(output).toContain("started");
    expect(result.exitCode).toBe(0);
  });

  it("adapters list shows xrpl adapter", async () => {
    const stdout: string[] = [];
    const result = await dispatch({
      loader,
      args: ["adapters", "list"],
      stdout: (msg) => stdout.push(msg),
      stderr: () => {},
    });

    const output = stdout.join("");
    expect(output).toContain("xrpl-adapter");
    expect(result.exitCode).toBe(0);
  });

  it("config validate runs validation", async () => {
    const stdout: string[] = [];
    const result = await dispatch({
      loader,
      args: ["config", "validate"],
      stdout: (msg) => stdout.push(msg),
      stderr: () => {},
    });

    const output = stdout.join("");
    expect(output).toContain("Config");
    expect(result.exitCode).toBeDefined();
  });

  it("config version shows version", async () => {
    const stdout: string[] = [];
    const result = await dispatch({
      loader,
      args: ["config", "version"],
      stdout: (msg) => stdout.push(msg),
      stderr: () => {},
    });

    const output = stdout.join("");
    expect(output).toContain("Config version");
    expect(result.exitCode).toBe(0);
  });
});
