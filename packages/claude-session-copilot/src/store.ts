/** Persistent JSON storage engine. */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { CopilotStore } from "./types.js";

const EMPTY_STORE: CopilotStore = {
  version: 1,
  projectPath: "",
  sessions: {},
  currentSessionId: null,
  decisions: [],
  timeline: [],
  snapshots: [],
  patterns: [],
};

export class Store {
  private data: CopilotStore;
  private filePath: string;

  constructor(overridePath?: string) {
    this.filePath = overridePath ?? this.resolveStorePath();
    this.data = this.load();
  }

  private resolveStorePath(): string {
    // 1. Explicit env var
    if (process.env.COPILOT_STORE_PATH) return process.env.COPILOT_STORE_PATH;

    // 2. Project-local: <cwd>/.claude/copilot/store.json
    const claudeDir = path.join(process.cwd(), ".claude");
    if (fs.existsSync(claudeDir)) {
      const projectDir = path.join(claudeDir, "copilot");
      fs.mkdirSync(projectDir, { recursive: true });
      return path.join(projectDir, "store.json");
    }

    // 3. Global fallback: ~/.claude/copilot/store.json
    const home = process.env.HOME ?? process.env.USERPROFILE ?? ".";
    const globalDir = path.join(home, ".claude", "copilot");
    fs.mkdirSync(globalDir, { recursive: true });
    return path.join(globalDir, "store.json");
  }

  private load(): CopilotStore {
    try {
      const raw = fs.readFileSync(this.filePath, "utf-8");
      return JSON.parse(raw) as CopilotStore;
    } catch {
      return {
        ...EMPTY_STORE,
        projectPath: process.cwd(),
        sessions: {},
        decisions: [],
        timeline: [],
        snapshots: [],
        patterns: [],
      };
    }
  }

  private save(): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  get(): Readonly<CopilotStore> {
    return this.data;
  }

  getPath(): string {
    return this.filePath;
  }

  mutate(fn: (data: CopilotStore) => void): void {
    fn(this.data);
    this.save();
  }

  newId(): string {
    return crypto.randomUUID().slice(0, 8);
  }

  /** Ensure a current session exists, creating one if needed. */
  ensureSession(): string {
    if (this.data.currentSessionId) return this.data.currentSessionId;

    const id = this.newId();
    this.mutate((d) => {
      d.currentSessionId = id;
      d.sessions[id] = { startedAt: new Date().toISOString() };
    });
    return id;
  }
}
