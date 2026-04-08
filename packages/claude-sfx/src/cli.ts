#!/usr/bin/env node

/**
 * claude-sfx CLI
 * Procedural audio feedback for Claude Code.
 */

import {
  ALL_VERBS,
  VERB_LABELS,
  VERB_DESCRIPTIONS,
  generateVerb,
  generateSessionStart,
  generateSessionEnd,
  generateSessionEndWithOutcome,
  generateAmbientResolve,
  type Verb,
  type Status,
  type Scope,
  type Direction,
  type PlayOptions,
} from "./verbs.js";
import { concatBuffers, applyVolume } from "./synth.js";
import { playSync, saveWav } from "./player.js";
import {
  resolveProfile,
  listBuiltinProfiles,
  type Profile,
} from "./profiles.js";
import {
  loadConfig,
  saveConfig,
  setMuted,
  setVolume,
  setProfile,
  setQuietHours,
  clearQuietHours,
  resolveProfileName,
  volumeToGain,
  CONFIG_FILE,
} from "./config.js";
import { guardPlay, resetLedger } from "./guard.js";
import {
  startAmbient,
  resolveAmbient,
  stopAmbient,
  isAmbientRunning,
} from "./ambient.js";
import { installHooks, uninstallHooks } from "./hooks.js";
import { handleHook } from "./hook-handler.js";
import { SfxError, handleError, EXIT_USER, EXIT_RUNTIME } from "./errors.js";
import { getSessionOutcome } from "./streak.js";
import { mkdirSync, existsSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// --- Argument parsing (zero-dep) ---

/** Boolean flags that don't take a value. */
const BOOLEAN_FLAGS = new Set(["force", "debug", "version"]);

function parseArgs(argv: string[]): {
  command: string;
  positional: string[];
  flags: Record<string, string>;
} {
  const args = argv.slice(2);
  const command = args[0] ?? "help";
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const name = arg.slice(2);
      if (BOOLEAN_FLAGS.has(name)) {
        flags[name] = "true";
      } else if (i + 1 < args.length) {
        flags[name] = args[++i];
      }
    } else {
      positional.push(arg);
    }
  }

  // Top-level flags that act as commands
  if (args[0] === "--version" || args[0] === "-V") {
    flags.version = "true";
  }
  if (args[0] === "--debug") {
    flags.debug = "true";
  }

  return { command, positional, flags };
}

/** Read version from package.json at build time. */
function getVersion(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const pkgPath = join(__dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

/** Resolve the active profile, respecting config + CLI override + repo overrides. */
function getProfile(flags: Record<string, string>): Profile {
  const config = loadConfig();
  const name = flags.profile ?? resolveProfileName(config, process.cwd());
  try {
    return resolveProfile(name);
  } catch (e) {
    console.error(`  Error: ${(e as Error).message}`);
    process.exit(1);
  }
}

// --- Commands ---

function cmdDemo(flags: Record<string, string>): void {
  const profile = getProfile(flags);
  console.log(`  claude-sfx demo  [${profile.name}]\n`);
  console.log(`  ${profile.description}\n`);

  for (const verb of ALL_VERBS) {
    const label = VERB_LABELS[verb].padEnd(10);
    const desc = VERB_DESCRIPTIONS[verb];
    process.stdout.write(`    ${label}  ${desc}`);

    const buffer = generateVerb(profile, verb);
    const result = playSync(buffer);

    if (result.played) {
      console.log(`  (${result.durationMs}ms)`);
    } else {
      console.log("  [no audio output available]");
    }
  }

  console.log("\n  Streak intensity (commit at levels 1-5):\n");

  for (let i = 1; i <= 5; i++) {
    process.stdout.write(`    Level ${i}   `);
    const buf = generateVerb(profile, "commit", { intensity: i });
    const r = playSync(buf);
    console.log(r.played ? `(${r.durationMs}ms)` : "[no audio]");
  }

  console.log("\n  Error escalation (execute at levels 1-5):\n");

  for (let i = 1; i <= 5; i++) {
    process.stdout.write(`    Level ${i}   `);
    const buf = generateVerb(profile, "execute", { status: "err", escalation: i });
    const r = playSync(buf);
    console.log(r.played ? `(${r.durationMs}ms)` : "[no audio]");
  }

  console.log("\n  Session sounds:\n");

  process.stdout.write("    Start     boot chime");
  const startResult = playSync(generateSessionStart(profile));
  console.log(startResult.played ? `  (${startResult.durationMs}ms)` : "  [no audio]");

  process.stdout.write("    End       closure");
  const endResult = playSync(generateSessionEnd(profile));
  console.log(endResult.played ? `  (${endResult.durationMs}ms)` : "  [no audio]");

  process.stdout.write("    Fanfare   great session");
  const fanfareResult = playSync(generateSessionEndWithOutcome(profile, { successRatio: 1, totalPlays: 20 }));
  console.log(fanfareResult.played ? `  (${fanfareResult.durationMs}ms)` : "  [no audio]");

  process.stdout.write("    Muted     rough session");
  const mutedResult = playSync(generateSessionEndWithOutcome(profile, { successRatio: 0.3, totalPlays: 20 }));
  console.log(mutedResult.played ? `  (${mutedResult.durationMs}ms)` : "  [no audio]");

  process.stdout.write("    Resolve   stinger");
  const resolveResult = playSync(generateAmbientResolve(profile));
  console.log(resolveResult.played ? `  (${resolveResult.durationMs}ms)` : "  [no audio]");

  console.log("\n  Done.\n");
}

/**
 * Play a verb sound — the main path called by hooks.
 * Goes through the full guard system (debounce, rate limit, mute, quiet hours).
 */
function cmdPlay(positional: string[], flags: Record<string, string>): void {
  const verbName = positional[0];

  if (!verbName) {
    console.error("  Error: missing verb. Usage: claude-sfx play <verb>");
    console.error(`  Verbs: ${ALL_VERBS.join(", ")}`);
    process.exit(1);
  }

  if (!ALL_VERBS.includes(verbName as Verb)) {
    console.error(`  Error: unknown verb "${verbName}".`);
    console.error(`  Verbs: ${ALL_VERBS.join(", ")}`);
    process.exit(1);
  }

  const verb = verbName as Verb;

  // --- Guard checks (skip with --force) ---
  if (!flags.force) {
    const config = loadConfig();
    const guard = guardPlay(verb, config);
    if (!guard.allowed) {
      // Silent exit — this is intentional, not an error
      process.exit(0);
    }
  }

  const profile = getProfile(flags);
  const config = loadConfig();
  const options: PlayOptions = {};

  if (flags.status) {
    if (!["ok", "err", "warn"].includes(flags.status)) {
      console.error(`  Error: invalid status "${flags.status}". Use: ok, err, warn`);
      process.exit(1);
    }
    options.status = flags.status as Status;
  }

  if (flags.scope) {
    if (!["local", "remote"].includes(flags.scope)) {
      console.error(`  Error: invalid scope "${flags.scope}". Use: local, remote`);
      process.exit(1);
    }
    options.scope = flags.scope as Scope;
  }

  if (flags.direction) {
    if (!["up", "down"].includes(flags.direction)) {
      console.error(`  Error: invalid direction "${flags.direction}". Use: up, down`);
      process.exit(1);
    }
    options.direction = flags.direction as Direction;
  }

  if (flags.intensity) {
    const n = parseInt(flags.intensity, 10);
    if (isNaN(n) || n < 1 || n > 5) {
      console.error(`  Error: invalid intensity "${flags.intensity}". Use: 1-5`);
      process.exit(1);
    }
    options.intensity = n;
  }

  if (flags.escalation) {
    const n = parseInt(flags.escalation, 10);
    if (isNaN(n) || n < 1 || n > 5) {
      console.error(`  Error: invalid escalation "${flags.escalation}". Use: 1-5`);
      process.exit(1);
    }
    options.escalation = n;
  }

  let buffer = generateVerb(profile, verb, options);

  // Apply volume
  const gain = volumeToGain(config.volume);
  if (gain < 1) {
    buffer = applyVolume(buffer, gain);
  }

  playSync(buffer);
}

function cmdPreview(positional: string[]): void {
  const profileName = positional[0];
  if (!profileName) {
    console.log("  Available profiles:\n");
    for (const name of listBuiltinProfiles()) {
      const p = resolveProfile(name);
      console.log(`    ${name.padEnd(12)}  ${p.description}`);
    }
    console.log("\n  Usage: claude-sfx preview <profile>\n");
    return;
  }

  let profile: Profile;
  try {
    profile = resolveProfile(profileName);
  } catch (e) {
    console.error(`  Error: ${(e as Error).message}`);
    process.exit(1);
  }

  console.log(`\n  Profile: ${profile.name}`);
  console.log(`  ${profile.description}\n`);

  const statuses: (Status | undefined)[] = [undefined, "ok", "err", "warn"];

  for (const verb of ALL_VERBS) {
    console.log(`  ${VERB_LABELS[verb]} (${VERB_DESCRIPTIONS[verb]}):`);
    for (const status of statuses) {
      const label = status ? `  --status ${status}` : "  (base)";
      process.stdout.write(`    ${label.padEnd(18)}`);
      const buffer = generateVerb(profile, verb, { status });
      const result = playSync(buffer);
      console.log(result.played ? `(${result.durationMs}ms)` : "[no audio]");
    }
  }

  console.log("\n  Session sounds:");
  process.stdout.write("    Start       ");
  playSync(generateSessionStart(profile));
  console.log("");
  process.stdout.write("    End         ");
  playSync(generateSessionEnd(profile));
  console.log("");
  process.stdout.write("    Resolve     ");
  playSync(generateAmbientResolve(profile));
  console.log("");

  console.log("\n  Done.\n");
}

function cmdSessionStart(flags: Record<string, string>): void {
  const config = loadConfig();
  if (config.muted) return;
  let buffer = generateSessionStart(getProfile(flags));
  const gain = volumeToGain(config.volume);
  if (gain < 1) buffer = applyVolume(buffer, gain);
  playSync(buffer);
}

function cmdSessionEnd(flags: Record<string, string>): void {
  const config = loadConfig();
  if (config.muted) return;
  let buffer = generateSessionEnd(getProfile(flags));
  const gain = volumeToGain(config.volume);
  if (gain < 1) buffer = applyVolume(buffer, gain);
  playSync(buffer);
}

function cmdAmbientStart(flags: Record<string, string>): void {
  const config = loadConfig();
  if (config.muted) {
    console.log("  Muted — ambient drone suppressed.");
    return;
  }
  if (isAmbientRunning()) {
    console.log("  Ambient drone is already running.");
    return;
  }
  const profile = getProfile(flags);
  const result = startAmbient(profile);
  if (result.started) {
    console.log(`  Ambient drone started (pid: ${result.pid})`);
  } else {
    console.error("  Failed to start ambient drone.");
  }
}

function cmdAmbientResolve(flags: Record<string, string>): void {
  const profile = getProfile(flags);
  const result = resolveAmbient(profile);
  if (!result.resolved) {
    console.log("  No ambient drone was running.");
  }
}

function cmdAmbientStop(): void {
  const result = stopAmbient();
  if (result.stopped) {
    console.log("  Ambient drone stopped.");
  } else {
    console.log("  No ambient drone was running.");
  }
}

// --- Config commands ---

function cmdMute(): void {
  setMuted(true);
  resetLedger();
  console.log("  Muted.");
}

function cmdUnmute(): void {
  setMuted(false);
  resetLedger();
  console.log("  Unmuted.");
}

function cmdVolume(positional: string[]): void {
  const val = positional[0];
  if (val === undefined) {
    const config = loadConfig();
    console.log(`  Volume: ${config.volume}`);
    return;
  }
  const num = parseInt(val, 10);
  if (isNaN(num) || num < 0 || num > 100) {
    console.error("  Error: volume must be 0–100.");
    process.exit(1);
  }
  const cfg = setVolume(num);
  console.log(`  Volume: ${cfg.volume}`);
}

function cmdConfig(positional: string[]): void {
  const subcommand = positional[0];

  if (!subcommand) {
    const config = loadConfig();
    console.log(`\n  Config: ${CONFIG_FILE}\n`);
    console.log(`    profile:        ${config.profile}`);
    console.log(`    volume:         ${config.volume}`);
    console.log(`    muted:          ${config.muted}`);
    if (config.quietHours) {
      console.log(`    quiet hours:    ${config.quietHours.start} – ${config.quietHours.end}`);
    } else {
      console.log(`    quiet hours:    off`);
    }
    if (config.disabledVerbs.length > 0) {
      console.log(`    disabled verbs: ${config.disabledVerbs.join(", ")}`);
    }
    const repoCount = Object.keys(config.repoProfiles).length;
    if (repoCount > 0) {
      console.log(`    repo overrides: ${repoCount}`);
      for (const [path, prof] of Object.entries(config.repoProfiles)) {
        console.log(`      ${path} → ${prof}`);
      }
    }
    console.log("");
    return;
  }

  if (subcommand === "set") {
    const key = positional[1];
    const value = positional[2];
    if (!key || value === undefined) {
      console.error("  Usage: claude-sfx config set <key> <value>");
      console.error("  Keys: profile, volume, quiet-start, quiet-end, quiet-off");
      process.exit(1);
    }

    switch (key) {
      case "profile":
        setProfile(value);
        console.log(`  Profile: ${value}`);
        break;
      case "volume": {
        const v = parseInt(value, 10);
        if (isNaN(v)) { console.error("  Volume must be a number."); process.exit(1); }
        setVolume(v);
        console.log(`  Volume: ${v}`);
        break;
      }
      case "quiet-start": {
        const config = loadConfig();
        const end = config.quietHours?.end ?? "07:00";
        setQuietHours(value, end);
        console.log(`  Quiet hours: ${value} – ${end}`);
        break;
      }
      case "quiet-end": {
        const config = loadConfig();
        const start = config.quietHours?.start ?? "22:00";
        setQuietHours(start, value);
        console.log(`  Quiet hours: ${start} – ${value}`);
        break;
      }
      case "quiet-off":
        clearQuietHours();
        console.log("  Quiet hours: off");
        break;
      default:
        console.error(`  Unknown config key: ${key}`);
        process.exit(1);
    }
    return;
  }

  if (subcommand === "reset") {
    saveConfig({
      profile: "minimal",
      volume: 80,
      muted: false,
      quietHours: null,
      disabledVerbs: [],
      repoProfiles: {},
    });
    console.log("  Config reset to defaults.");
    return;
  }

  if (subcommand === "repo") {
    const profileName = positional[1];
    if (!profileName) {
      console.error("  Usage: claude-sfx config repo <profile>  (sets override for cwd)");
      process.exit(1);
    }
    const config = loadConfig();
    if (profileName === "clear") {
      delete config.repoProfiles[process.cwd()];
      saveConfig(config);
      console.log(`  Cleared repo override for ${process.cwd()}`);
    } else {
      config.repoProfiles[process.cwd()] = profileName;
      saveConfig(config);
      console.log(`  ${process.cwd()} → ${profileName}`);
    }
    return;
  }

  console.error(`  Unknown config subcommand: ${subcommand}`);
  console.error("  Subcommands: (none) | set | reset | repo");
  process.exit(1);
}

function cmdDisable(positional: string[]): void {
  const verb = positional[0];
  if (!verb) {
    console.error("  Usage: claude-sfx disable <verb>");
    process.exit(1);
  }
  if (!ALL_VERBS.includes(verb as Verb)) {
    console.error(`  Unknown verb: ${verb}`);
    process.exit(1);
  }
  const config = loadConfig();
  if (!config.disabledVerbs.includes(verb)) {
    config.disabledVerbs.push(verb);
    saveConfig(config);
  }
  console.log(`  Disabled: ${verb}`);
}

function cmdEnable(positional: string[]): void {
  const verb = positional[0];
  if (!verb) {
    console.error("  Usage: claude-sfx enable <verb>");
    process.exit(1);
  }
  const config = loadConfig();
  config.disabledVerbs = config.disabledVerbs.filter((v) => v !== verb);
  saveConfig(config);
  console.log(`  Enabled: ${verb}`);
}

// --- Export ---

function cmdExport(positional: string[], flags: Record<string, string>): void {
  const profile = getProfile(flags);
  const outputDir = positional[0] ?? "./sounds";

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log(`  Exporting [${profile.name}] sounds to ${outputDir}/\n`);

  const statuses: (Status | undefined)[] = [undefined, "ok", "err", "warn"];

  for (const verb of ALL_VERBS) {
    for (const status of statuses) {
      const suffix = status ? `-${status}` : "";
      const filename = `${verb}${suffix}.wav`;
      const buffer = generateVerb(profile, verb, { status });
      saveWav(buffer, join(outputDir, filename));
      console.log(`    ${filename}`);
    }
  }

  for (const verb of ["move", "sync"] as Verb[]) {
    for (const direction of ["up", "down"] as Direction[]) {
      const filename = `${verb}-${direction}.wav`;
      const buffer = generateVerb(profile, verb, { direction });
      saveWav(buffer, join(outputDir, filename));
      console.log(`    ${filename}`);
    }
  }

  // Intensity variants (commit at levels 1-5)
  for (let i = 1; i <= 5; i++) {
    const filename = `commit-intensity-${i}.wav`;
    saveWav(generateVerb(profile, "commit", { intensity: i }), join(outputDir, filename));
    console.log(`    ${filename}`);
  }

  // Escalation variants (execute-err at levels 1-5)
  for (let i = 1; i <= 5; i++) {
    const filename = `execute-err-escalation-${i}.wav`;
    saveWav(generateVerb(profile, "execute", { status: "err", escalation: i }), join(outputDir, filename));
    console.log(`    ${filename}`);
  }

  saveWav(generateSessionStart(profile), join(outputDir, "session-start.wav"));
  console.log("    session-start.wav");
  saveWav(generateSessionEnd(profile), join(outputDir, "session-end.wav"));
  console.log("    session-end.wav");
  saveWav(generateSessionEndWithOutcome(profile, { successRatio: 1, totalPlays: 20 }), join(outputDir, "session-fanfare.wav"));
  console.log("    session-fanfare.wav");
  saveWav(generateSessionEndWithOutcome(profile, { successRatio: 0.3, totalPlays: 20 }), join(outputDir, "session-muted.wav"));
  console.log("    session-muted.wav");
  saveWav(generateAmbientResolve(profile), join(outputDir, "ambient-resolve.wav"));
  console.log("    ambient-resolve.wav");

  const demoBuffers = ALL_VERBS.map((v) => generateVerb(profile, v));
  const demoSequence = concatBuffers(demoBuffers, 0.3);
  saveWav(demoSequence, join(outputDir, "demo-sequence.wav"));
  console.log("    demo-sequence.wav");

  const fileCount = ALL_VERBS.length * statuses.length + 4 + 5 + 5 + 4 + 1;
  console.log(`\n  Exported ${fileCount} files.\n`);
}

// --- Init / Uninstall ---

function cmdInit(): void {
  const cwd = process.cwd();
  const result = installHooks(cwd);
  console.log(`\n  claude-sfx hooks installed.\n`);
  console.log(`  Settings: ${result.settingsPath}`);
  console.log(`  Events:   ${result.eventsAdded.join(", ")}\n`);
  console.log("  Hook mapping:");
  console.log("    Read, WebFetch, WebSearch       → intake");
  console.log("    Edit                            → transform");
  console.log("    Write, NotebookEdit, TodoWrite  → commit");
  console.log("    Grep, Glob                      → navigate");
  console.log("    Bash                            → execute (git → sync)");
  console.log("    Task, MCP tools                 → intake/commit (remote)");
  console.log("    Subagent start/stop             → move/commit (remote)");
  console.log("    Session start/stop              → chimes\n");
  console.log("  Run `claude-sfx uninstall` to remove.\n");
}

function cmdUninstall(): void {
  const cwd = process.cwd();
  const result = uninstallHooks(cwd);
  if (result.removed) {
    console.log(`  claude-sfx hooks removed from ${result.settingsPath}`);
  } else {
    console.log("  No claude-sfx hooks found to remove.");
  }
}

async function cmdHookHandler(positional: string[]): Promise<void> {
  const eventName = positional[0];
  if (!eventName) {
    console.error("  Error: hook-handler requires an event name.");
    process.exit(1);
  }
  await handleHook(eventName);
}

// --- Help ---

function cmdHelp(): void {
  const profiles = listBuiltinProfiles().join(", ");
  console.log(`
  claude-sfx — Procedural audio feedback for Claude Code

  Setup:
    init                            Install hooks into .claude/settings.json
    uninstall                       Remove hooks from .claude/settings.json

  Playback:
    play <verb> [options]           Play a verb sound (goes through guard)
    demo [--profile <name>]         Play all 7 verbs in sequence
    preview [profile]               Audition all sounds in a profile
    session-start [--profile]       Boot chime
    session-end [--profile]         Closure chime

  Ambient (long-running):
    ambient-start [--profile]       Start the thinking drone
    ambient-resolve [--profile]     Stop drone + play resolution stinger
    ambient-stop                    Stop drone silently

  Config:
    mute                            Mute all sounds
    unmute                          Unmute
    volume [0-100]                  Get or set volume
    config                          Print current config
    config set <key> <value>        Set a config value
    config reset                    Reset to defaults
    config repo <profile|clear>     Set profile override for cwd
    disable <verb>                  Disable a specific verb
    enable <verb>                   Re-enable a verb

  Play options:
    --status <ok|err|warn>          Status modifier
    --scope <local|remote>          Scope modifier
    --direction <up|down>           Direction (move/sync verbs)
    --intensity <1-5>               Streak intensity (harmonic layering)
    --escalation <1-5>              Error escalation (urgency level)
    --profile <name|path>           Sound profile (default: minimal)
    --force                         Bypass guard (debounce/rate/mute)
    --debug                         Show stack traces on errors

  Info:
    --version, -V                   Print version and exit
    --help, -h                      Show this help

  Verbs:
    intake      read / open / fetch
    transform   edit / format / refactor
    commit      write / save / apply
    navigate    search / jump / list
    execute     run / test / build
    move        move / rename / relocate
    sync        git push / pull / deploy

  Profiles: ${profiles}
  Config: ~/.claude-sfx/config.json
`);
}

// --- Main ---

const { command, positional, flags } = parseArgs(process.argv);
const debug = flags.debug === "true";

// Handle --version before anything else
if (flags.version === "true") {
  console.log(getVersion());
  process.exit(0);
}

// hook-handler is async (reads stdin), so wrap in an IIFE
const run = async () => {
  switch (command) {
    case "init":          cmdInit(); break;
    case "uninstall":     cmdUninstall(); break;
    case "hook-handler":  await cmdHookHandler(positional); break;
    case "demo":          cmdDemo(flags); break;
    case "play":          cmdPlay(positional, flags); break;
    case "preview":       cmdPreview(positional); break;
    case "session-start": cmdSessionStart(flags); break;
    case "session-end":   cmdSessionEnd(flags); break;
    case "ambient-start": cmdAmbientStart(flags); break;
    case "ambient-resolve": cmdAmbientResolve(flags); break;
    case "ambient-stop":  cmdAmbientStop(); break;
    case "mute":          cmdMute(); break;
    case "unmute":        cmdUnmute(); break;
    case "volume":        cmdVolume(positional); break;
    case "config":        cmdConfig(positional); break;
    case "disable":       cmdDisable(positional); break;
    case "enable":        cmdEnable(positional); break;
    case "export":        cmdExport(positional, flags); break;
    case "help":
    case "--help":
    case "-h":            cmdHelp(); break;
    default:
      console.error(`  Error [INPUT_UNKNOWN_COMMAND]: Unknown command "${command}".`);
      console.error("  Hint: Run claude-sfx --help for available commands.");
      process.exit(EXIT_USER);
  }
};

run().catch((err) => {
  process.exit(handleError(err, debug));
});
