/**
 * ConsensusOS — Modular Control Plane
 *
 * Public API surface. This is the only entry point for consumers.
 */

// Core
export { CoreLoader } from "./core/loader.js";
export { CoreEventBus, WILDCARD } from "./core/event-bus.js";
export { CoreInvariantEngine } from "./core/invariant-engine.js";
export { createLogger } from "./core/logger.js";

// Types
export type { EventBus, EventHandler, Unsubscribe } from "./core/event-bus.js";
export type {
  InvariantEngine,
  Invariant,
  InvariantResult,
  TransitionVerdict,
} from "./core/invariant-engine.js";
export type { LoaderOptions, PluginState } from "./core/loader.js";
export {
  ARCHITECTURE_VERSION,
  PLUGIN_API_VERSION,
} from "./plugins/api.js";
export type {
  Plugin,
  PluginManifest,
  PluginContext,
  PluginConfig,
  PluginFactory,
  PluginId,
  Capability,
  SemVer,
  ConsensusEvent,
  LifecycleResult,
  Logger,
} from "./plugins/api.js";

// State
export { CoreStateRegistry } from "./state/registry.js";
export type {
  StateRegistry,
  StateEntry,
  StateTransition,
  StateSnapshot,
} from "./state/registry.js";

// Modules
export { HealthSentinel, createHealthSentinel } from "./modules/health/health-sentinel.js";
export { ReleaseVerifier, createReleaseVerifier } from "./modules/verifier/release-verifier.js";
export { ConfigGuardian, createConfigGuardian } from "./modules/config/config-guardian.js";

// Adapters
export { XrplAdapter, createXrplAdapter } from "./adapters/xrpl/xrpl-adapter.js";

// Sandbox
export { SandboxPlugin, createSandboxPlugin } from "./modules/sandbox/sandbox-plugin.js";
export { SnapshotSerializer } from "./modules/sandbox/snapshot-serializer.js";
export { ReplayEngine } from "./modules/sandbox/replay-engine.js";
export type { ReplayHandler } from "./modules/sandbox/replay-engine.js";
export { AmendmentSimulator } from "./modules/sandbox/amendment-simulator.js";
export type { AmendmentEffect, AmendmentDefinition } from "./modules/sandbox/amendment-simulator.js";
export { InMemoryContainerRuntime } from "./modules/sandbox/in-memory-runtime.js";
export type {
  ContainerRuntime,
  ContainerSpec,
  ContainerStatus,
  ContainerState,
  ContainerInfo,
  ExecResult,
  SandboxSession,
  SandboxState,
  Snapshot,
  AmendmentState,
  AmendmentStatus,
  AmendmentSimulationResult,
  StateDiff,
  ReplayOptions,
  ReplayResult,
} from "./modules/sandbox/types.js";

// CLI
export { dispatch, registeredCommands, main as runCli } from "./cli/cli.js";
export type { CliContext, CommandResult, CommandHandler } from "./cli/cli.js";

// Governor
export { GovernorPlugin, createGovernorPlugin } from "./modules/governor/governor-plugin.js";
export type { GovernorPluginConfig } from "./modules/governor/governor-plugin.js";
export { TokenIssuer } from "./modules/governor/token-issuer.js";
export { PolicyEngine, cpuThresholdRule, memoryThresholdRule, priorityThrottleRule, queueDepthRule } from "./modules/governor/policy-engine.js";
export type { PolicyEvaluation } from "./modules/governor/policy-engine.js";
export { BuildQueue } from "./modules/governor/build-queue.js";
export { AuditLog } from "./modules/governor/audit-log.js";
export type {
  ExecutionToken,
  TokenRequest,
  ResourceLimits,
  ResourceUsage,
  QueuedTask,
  TaskSubmission,
  TaskExecutor,
  TaskStatus,
  PolicyRule,
  PolicyVerdict,
  AuditAction,
  AuditEntry,
} from "./modules/governor/types.js";

// Multi-chain Adapter Framework
export type {
  ChainAdapter,
  ChainAdapterFactory,
  ChainConfig,
  ChainFamily,
  ChainInfo,
  ChainNode,
  ChainQueryResult,
  ConnectionStatus,
} from "./adapters/chain-adapter.js";
export { AdapterRegistry } from "./adapters/adapter-registry.js";
export { EthereumAdapter, createEthereumAdapter } from "./adapters/ethereum/ethereum-adapter.js";
export { CosmosAdapter, createCosmosAdapter } from "./adapters/cosmos/cosmos-adapter.js";

// Plugin SDK
export { BasePlugin, ManifestBuilder, validatePlugin } from "./sdk/plugin-sdk.js";
export type { ValidationResult } from "./sdk/plugin-sdk.js";

// Release Attestation
export { AttestationPipeline } from "./sdk/attestation.js";
export type {
  Attestation,
  AttestationOptions,
  BuildProvenance,
  ArtifactRecord,
} from "./sdk/attestation.js";
