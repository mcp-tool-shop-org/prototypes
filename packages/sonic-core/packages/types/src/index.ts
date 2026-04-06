// ── Source Models ──

export interface AssetSource {
  kind: "asset";
  /** CID URI, file URI, or registered asset reference */
  asset_ref: string;
}

export interface SynthesisSource {
  kind: "synthesis";
  engine: string;
  voice: string;
  text: string;
  speed?: number;
}

export type Source = AssetSource | SynthesisSource;

// ── Play Options ──

export type InterruptMode = "replace" | "mix" | "reject";

export interface PlayOptions {
  loop?: boolean;
  delay_start_ms?: number;
  fade_in_ms?: number;
  fade_out_ms?: number;
  crossfade_ms?: number;
  initial_volume?: number;
  initial_pan?: number;
  output_device_id?: string;
  owner_lease_ms?: number;
  interrupt_mode?: InterruptMode;
}

// ── Playback State ──

export type PlaybackStatus =
  | "playing"
  | "paused"
  | "stopping"
  | "stopped"
  | "expired";

export interface PlaybackState {
  playback_id: string;
  status: PlaybackStatus;
  source_kind: Source["kind"];
  loop: boolean;
  position_ms: number;
  duration_ms: number | null;
  volume: number;
  pan: number;
  output_device_id: string;
  lease_expires_at: string | null;
}

// ── Device Info ──

export type DeviceKind = "output";

export interface DeviceInfo {
  device_id: string;
  name: string;
  kind: DeviceKind;
  is_default: boolean;
  channels: number;
  sample_rates: number[];
}

// ── Audio Format ──

export interface AudioFormat {
  container: "wav";
  encoding: "pcm_s16le";
  sample_rate: number;
  channels: number;
  bit_depth: number;
}

export interface SynthesisResult {
  handle: string;
  duration_ms: number | null;
  sample_rate: number | null;
  channels: number | null;
}

// ── Runtime Result Types ──

export interface HealthResult {
  status: string;
  uptime_ms: number;
  active_handles: number;
  model_loaded: boolean;
  voices_loaded: number;
  espeak_available: boolean;
}

export interface CapabilitiesResult {
  engines: string[];
  features: string[];
  protocol: string;
  synthesis_format?: AudioFormat;
  playback_formats?: string[];
}

export interface VoiceInfo {
  id: string;
  language: string;
  gender: string;
}

export interface ModelStatusResult {
  loaded: boolean;
  path?: string;
  load_time_ms: number;
  inference_count: number;
}

export interface PreloadResult {
  loaded: boolean;
  load_time_ms: number;
}

export interface AssetCheckResult {
  available: boolean;
  path?: string;
  error?: string;
  hint?: string;
}

export interface VoiceAssetResult {
  available: boolean;
  path?: string;
  count: number;
  voices?: string[];
  error?: string;
  hint?: string;
}

export interface ValidateAssetsResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  model: AssetCheckResult;
  voices: VoiceAssetResult;
  espeak: AssetCheckResult;
  onnx_runtime: AssetCheckResult;
  asset_root?: string;
}

export interface PositionResult {
  position_ms: number;
}

export interface DurationResult {
  duration_ms: number | null;
}

// ── Errors ──

/** Error codes from C# runtime over the wire */
export type RuntimeErrorCode =
  | "invalid_source"
  | "unsupported_format"
  | "playback_not_found"
  | "seek_unsupported"
  | "device_unavailable"
  | "synthesis_validation_failed"
  | "synthesis_voice_not_found"
  | "synthesis_inference_failed"
  | "synthesis_not_configured"
  | "synthesis_model_missing"
  | "synthesis_model_load_failed"
  | "method_not_found"
  | "invalid_params";

/** Error codes from SidecarBackend transport layer */
export type SidecarErrorCode =
  | "runtime_disposed"
  | "runtime_exited"
  | "runtime_spawn_failed"
  | "runtime_not_running"
  | "runtime_suspect"
  | "restart_limit_exceeded"
  | "request_timeout"
  | "protocol_mismatch"
  | "handle_not_found";

/** Error codes from SonicEngine (TypeScript-only) */
export type EngineErrorCode =
  | "seek_unsupported"
  | "engine_busy"
  | "lease_expired"
  | "permission_denied";

/** All known error codes across the platform */
export type ErrorCode = RuntimeErrorCode | SidecarErrorCode | EngineErrorCode;

export interface SonicError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

// ── Runtime Event Payloads ──

export interface PlaybackEndedData {
  handle: string;
  reason: "completed" | "stopped";
}

export interface SynthesisStartedData {
  handle: string;
  engine: string;
  voice: string;
}

export interface SynthesisCompletedData {
  handle: string;
  duration_ms: number | null;
  inference_ms: number | null;
}

export interface SynthesisFailedData {
  handle: string;
  code: string;
  message: string;
}

export type RuntimeEvent =
  | { event: "playback_ended"; data: PlaybackEndedData }
  | { event: "synthesis_started"; data: SynthesisStartedData }
  | { event: "synthesis_completed"; data: SynthesisCompletedData }
  | { event: "synthesis_failed"; data: SynthesisFailedData };

export type RuntimeEventType = RuntimeEvent["event"];

// ── Protocol Message Envelopes ──

/** Outbound request from sidecar to runtime */
export interface RuntimeRequestMessage {
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

/** Error payload nested inside a RuntimeErrorResponse */
export interface RuntimeWireError {
  code: string;
  message: string;
  retryable: boolean;
}

/** Successful response from runtime */
export interface RuntimeSuccessResponse {
  id: number;
  result: unknown;
}

/** Error response from runtime */
export interface RuntimeErrorResponse {
  id: number;
  error: RuntimeWireError;
}

/** Any correlated response (success or error) */
export type RuntimeResponseMessage =
  | RuntimeSuccessResponse
  | RuntimeErrorResponse;

/** Unsolicited event from runtime (no id) */
export interface RuntimeEventMessage {
  event: string;
  data?: Record<string, unknown>;
}

/** Any message that can arrive on stdout from the runtime */
export type RuntimeProtocolMessage =
  | RuntimeResponseMessage
  | RuntimeEventMessage;

// ── Command Interfaces ──

export interface SonicCommands {
  play(source: Source, options?: PlayOptions): Promise<string>;
  pause(playback_id: string, fade_out_ms?: number): Promise<void>;
  resume(playback_id: string, fade_in_ms?: number): Promise<void>;
  stop(playback_id: string, fade_out_ms?: number): Promise<void>;
  seek(playback_id: string, position_ms: number): Promise<void>;
  set_volume(target: string, level: number, fade_ms?: number): Promise<void>;
  set_pan(target: string, value: number, ramp_ms?: number): Promise<void>;
  set_spatial_position(
    target: string,
    x: number,
    y: number,
    z: number,
    ramp_ms?: number,
  ): Promise<void>;
  get_devices(): Promise<DeviceInfo[]>;
  set_output_device(device_id: string): Promise<void>;
  renew_lease(playback_id: string, lease_ms: number): Promise<void>;
  get_playback_state(playback_id: string): Promise<PlaybackState>;
  replace_playback(
    target_playback_id: string,
    source: Source,
    options?: PlayOptions,
  ): Promise<string>;
}
