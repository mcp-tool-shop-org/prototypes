/**
 * In-Memory Container Runtime
 *
 * Mock container runtime for testing and local development.
 * Simulates container lifecycle without requiring Docker/Podman.
 */

import type {
  ContainerRuntime,
  ContainerSpec,
  ContainerStatus,
  ContainerState,
  ContainerInfo,
  ExecResult,
} from "./types.js";

interface MockContainer {
  id: string;
  spec: ContainerSpec;
  state: ContainerState;
  startedAt?: string;
  stoppedAt?: string;
  error?: string;
  /** Registered command handlers for exec simulation */
  execHandlers: Map<string, (args: string[]) => ExecResult>;
}

let idCounter = 0;

export class InMemoryContainerRuntime implements ContainerRuntime {
  private readonly containers = new Map<string, MockContainer>();

  /** Register a handler for command execution inside containers */
  onExec(
    containerId: string,
    command: string,
    handler: (args: string[]) => ExecResult,
  ): void {
    const container = this.containers.get(containerId);
    if (container) {
      container.execHandlers.set(command, handler);
    }
  }

  async create(spec: ContainerSpec): Promise<string> {
    const id = `mock-${++idCounter}-${Date.now()}`;
    this.containers.set(id, {
      id,
      spec,
      state: "running",
      startedAt: new Date().toISOString(),
      execHandlers: new Map(),
    });
    return id;
  }

  async stop(containerId: string): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    if (container.state !== "running") throw new Error(`Container ${containerId} is not running`);
    container.state = "stopped";
    container.stoppedAt = new Date().toISOString();
  }

  async remove(containerId: string): Promise<void> {
    const container = this.containers.get(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    if (container.state === "running") {
      container.state = "stopped";
      container.stoppedAt = new Date().toISOString();
    }
    container.state = "removed";
    this.containers.delete(containerId);
  }

  async exec(containerId: string, command: string[]): Promise<ExecResult> {
    const container = this.containers.get(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    if (container.state !== "running") throw new Error(`Container ${containerId} is not running`);

    const cmd = command[0];
    const handler = container.execHandlers.get(cmd);
    if (handler) {
      return handler(command.slice(1));
    }

    // Default: echo the command
    return {
      exitCode: 0,
      stdout: command.join(" "),
      stderr: "",
    };
  }

  async status(containerId: string): Promise<ContainerStatus> {
    const container = this.containers.get(containerId);
    if (!container) {
      return { id: containerId, state: "removed" };
    }
    return {
      id: container.id,
      state: container.state,
      startedAt: container.startedAt,
      stoppedAt: container.stoppedAt,
      error: container.error,
    };
  }

  async list(): Promise<ContainerInfo[]> {
    return [...this.containers.values()].map((c) => ({
      id: c.id,
      name: c.spec.name ?? c.id,
      image: c.spec.image,
      state: c.state,
      labels: c.spec.labels ?? {},
    }));
  }

  /** Reset all containers (for testing) */
  reset(): void {
    this.containers.clear();
    idCounter = 0;
  }
}
