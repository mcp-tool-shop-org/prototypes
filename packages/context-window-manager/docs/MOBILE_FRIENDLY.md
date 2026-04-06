# Context Window Manager - Mobile & Edge Deployment Guide

> **Purpose**: Architecture considerations and strategies for deploying CWM on mobile devices, edge hardware, and resource-constrained environments.
> **Last Updated**: 2026-01-23

---

## 2026 Best Practices Applied

> **Sources**: [MDPI Edge LLM Survey](https://www.mdpi.com/2673-2688/7/1/15), [ACM Edge LLM Review](https://dl.acm.org/doi/full/10.1145/3719664), [Mobile Edge Intelligence Survey](https://arxiv.org/abs/2407.18921), [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/), [MLC-LLM](https://mlc.ai/mlc-llm/), [llama.cpp](https://github.com/ggerganov/llama.cpp)

This document reflects 2026 edge AI deployment best practices:

1. **Sub-10B Models for Edge**: Current industrial efforts focus on models under 10 billion parameters due to resource constraints. Design for Gemma-2B, Phi-3, StableLM-3B class models.

2. **Quantization is Mandatory**: INT8/INT4 quantization reduces memory and speeds computation. OmniQuant and AWQ enable mobile deployment with minimal accuracy loss.

3. **Pure C++ Over Python**: Frameworks like llama.cpp offer lower overhead, better resource management, and easier cross-compilation than Python-based solutions.

4. **Hybrid Cloud-Edge Architecture**: Mobile Edge Intelligence (MEI) offloads heavy computation to edge servers. Design for graceful degradation between on-device and edge-assisted modes.

5. **Hardware-Specific Acceleration**: Use OpenCL (Android), Metal (iOS), Vulkan (cross-platform). MLC-LLM provides native acceleration across platforms.

6. **Privacy-First On-Device**: Edge processing protects user privacy and reduces latency. Design context restoration to work entirely offline when possible.

7. **Battery-Aware Operation**: Mobile deployment must consider power consumption. Batch operations, use efficient attention, and provide power profiles.

8. **Progressive Loading**: Large KV caches can't load instantly on mobile. Implement streaming restoration with usable partial state.

---

## Vision: Mobile Context Restoration

### The Goal

Enable seamless context restoration on:
- **Smartphones**: iOS (iPhone 13+), Android (Snapdragon 8 Gen 2+)
- **Tablets**: iPad Pro, Android tablets with 8GB+ RAM
- **Edge Devices**: NVIDIA Jetson, Raspberry Pi 5, Intel NUC
- **Automotive**: In-vehicle AI systems (NVIDIA DRIVE AGX)
- **Wearables**: Future AR glasses, smartwatches (limited)

### Use Cases

| Use Case | Device | Context Size | Latency Target |
|----------|--------|--------------|----------------|
| Personal assistant continuity | Phone | 4K tokens | <2s |
| Document analysis resume | Tablet | 8K tokens | <5s |
| In-car conversation memory | Automotive | 16K tokens | <3s |
| Offline coding assistant | Laptop (edge) | 32K tokens | <10s |

---

## Architecture Tiers

### Tier 1: Full-Featured (Server/Desktop)

Standard CWM deployment with vLLM + LMCache.

```
┌─────────────────────────────────────────┐
│  Full CWM                                │
│  - vLLM inference server                 │
│  - LMCache with tiered storage           │
│  - Full 128K context support             │
│  - All tools available                   │
└─────────────────────────────────────────┘
```

**Requirements**: 16GB+ VRAM, 32GB+ RAM, NVMe storage

---

### Tier 2: Edge Server (Edge/Workstation)

Reduced footprint, still server-class inference.

```
┌─────────────────────────────────────────┐
│  Edge CWM                                │
│  - llama.cpp or vLLM (CPU offload)       │
│  - Disk-based KV cache only              │
│  - 32K context limit                     │
│  - Quantized models (INT8)               │
└─────────────────────────────────────────┘
```

**Requirements**: 8GB+ VRAM or 32GB+ RAM, SSD storage

---

### Tier 3: Mobile/Embedded (On-Device)

Lightweight client with optional edge assist.

```
┌─────────────────────────────────────────┐
│  Mobile CWM                              │
│  - MLC-LLM or llama.cpp                  │
│  - Memory-mapped KV cache                │
│  - 8K context limit                      │
│  - INT4 quantized models                 │
│  - Optional edge server offload          │
└─────────────────────────────────────────┘
```

**Requirements**: 6GB+ RAM, A15+ (iOS) or Snapdragon 8 Gen 2+ (Android)

---

### Tier 4: Minimal (Wearables/IoT)

Sync-only, no on-device inference.

```
┌─────────────────────────────────────────┐
│  Sync-Only CWM                           │
│  - Context metadata storage              │
│  - Sync with cloud/edge server           │
│  - No local inference                    │
│  - Quick context switching               │
└─────────────────────────────────────────┘
```

**Requirements**: 1GB+ RAM, network connectivity

---

## Mobile-Specific Components

### Compact KV Cache Format

```python
class MobileKVCache:
    """
    Optimized KV cache format for mobile storage.

    Features:
    - INT8 quantized key/value tensors (4x smaller)
    - LZ4 compression (fast decompression)
    - Memory-mapped file access (no full load required)
    - Chunked format for progressive loading
    """

    CHUNK_SIZE = 512  # tokens per chunk
    COMPRESSION = "lz4"
    QUANTIZATION = "int8"

    def __init__(self, path: Path):
        self.path = path
        self.mmap = None
        self.header = None

    async def load_header(self):
        """Load just the header (fast, <10ms)."""
        async with aiofiles.open(self.path, "rb") as f:
            header_bytes = await f.read(1024)
            self.header = MobileKVHeader.parse(header_bytes)
        return self.header

    async def load_chunk(self, chunk_idx: int) -> KVChunk:
        """Load a single chunk (for progressive restoration)."""
        offset = self.header.chunk_offsets[chunk_idx]
        size = self.header.chunk_sizes[chunk_idx]

        if self.mmap is None:
            self.mmap = mmap.mmap(
                open(self.path, "rb").fileno(),
                0,
                access=mmap.ACCESS_READ
            )

        compressed = self.mmap[offset:offset + size]
        decompressed = lz4.decompress(compressed)
        return KVChunk.deserialize(decompressed)

    async def load_progressive(
        self,
        on_chunk: Callable[[int, int], None] = None
    ) -> AsyncIterator[KVChunk]:
        """
        Load chunks progressively, yielding each as ready.

        Allows UI to show progress and enables partial-state inference.
        """
        await self.load_header()
        total_chunks = len(self.header.chunk_offsets)

        for i in range(total_chunks):
            chunk = await self.load_chunk(i)
            if on_chunk:
                on_chunk(i + 1, total_chunks)
            yield chunk
```

### Mobile Storage Strategy

```python
class MobileStorageManager:
    """
    Storage management optimized for mobile constraints.

    Considerations:
    - Limited storage (manage quota carefully)
    - Flash wear (minimize writes)
    - Background app restrictions (iOS/Android)
    - iCloud/Google Drive sync potential
    """

    DEFAULT_QUOTA_MB = 500  # Conservative mobile default

    def __init__(self, base_path: Path, quota_mb: int = DEFAULT_QUOTA_MB):
        self.base_path = base_path
        self.quota_bytes = quota_mb * 1024 * 1024
        self.index_path = base_path / "index.json"

    async def get_storage_info(self) -> StorageInfo:
        """Get current storage usage and availability."""
        used = sum(f.stat().st_size for f in self.base_path.rglob("*"))
        device_free = shutil.disk_usage(self.base_path).free

        return StorageInfo(
            used_bytes=used,
            quota_bytes=self.quota_bytes,
            device_free_bytes=device_free,
            can_store=used < self.quota_bytes * 0.9
        )

    async def evict_lru(self, needed_bytes: int):
        """Evict least-recently-used windows to free space."""
        windows = await self.list_windows_by_access_time()

        freed = 0
        evicted = []

        for window in windows:
            if freed >= needed_bytes:
                break
            freed += window.size_bytes
            await self.delete_window(window.name)
            evicted.append(window.name)

        return EvictionResult(freed_bytes=freed, evicted_windows=evicted)

    async def optimize_storage(self):
        """
        Periodic storage optimization.

        - Compact fragmented files
        - Re-compress with better ratio
        - Update access times
        """
        pass  # Implementation
```

### Battery-Aware Operations

```python
class BatteryAwareScheduler:
    """
    Schedule operations based on battery state.

    Policies:
    - AGGRESSIVE: Full speed, ignore battery
    - BALANCED: Normal operation, defer non-critical
    - CONSERVATIVE: Minimal operations, preserve battery
    - CRITICAL: Essential only, defer everything possible
    """

    class Policy(Enum):
        AGGRESSIVE = "aggressive"
        BALANCED = "balanced"
        CONSERVATIVE = "conservative"
        CRITICAL = "critical"

    def __init__(self):
        self.policy = self.Policy.BALANCED

    async def get_battery_state(self) -> BatteryState:
        """Get current battery level and charging state."""
        # Platform-specific implementation
        # iOS: UIDevice.current.batteryLevel
        # Android: BatteryManager
        pass

    async def update_policy(self):
        """Update policy based on battery state."""
        state = await self.get_battery_state()

        if state.is_charging:
            self.policy = self.Policy.AGGRESSIVE
        elif state.level > 0.5:
            self.policy = self.Policy.BALANCED
        elif state.level > 0.2:
            self.policy = self.Policy.CONSERVATIVE
        else:
            self.policy = self.Policy.CRITICAL

    async def should_proceed(self, operation: str) -> tuple[bool, str]:
        """Check if operation should proceed given current policy."""
        await self.update_policy()

        # Define operation costs
        HIGH_COST = {"freeze_large", "thaw_large", "full_sync"}
        MEDIUM_COST = {"freeze_small", "thaw_small", "index_update"}
        LOW_COST = {"list", "status", "metadata_read"}

        if operation in LOW_COST:
            return True, "Low-cost operation always allowed"

        if self.policy == self.Policy.CRITICAL:
            return False, f"Battery critical ({self.policy}), deferring {operation}"

        if self.policy == self.Policy.CONSERVATIVE and operation in HIGH_COST:
            return False, f"Battery low ({self.policy}), deferring {operation}"

        return True, f"Proceeding with {operation} under {self.policy} policy"
```

### Progressive Restoration

```python
class ProgressiveThaw:
    """
    Thaw context progressively, enabling partial-state usage.

    Benefits:
    - Faster time-to-first-response
    - Better UX with progress indication
    - Can start generation before full load
    - Graceful handling of interruption
    """

    def __init__(self, window_name: str, inference_engine):
        self.window_name = window_name
        self.engine = inference_engine
        self.loaded_chunks = 0
        self.total_chunks = 0
        self.usable = False

    async def thaw_progressive(
        self,
        on_progress: Callable[[int, int, bool], None] = None
    ) -> ThawResult:
        """
        Thaw with progress callbacks.

        Args:
            on_progress: Callback(loaded, total, is_usable)

        The 'is_usable' flag indicates when enough context is loaded
        to begin generation (typically after system prompt and recent turns).
        """
        cache = MobileKVCache(self.get_cache_path())
        await cache.load_header()

        self.total_chunks = cache.header.chunk_count
        priority_chunks = cache.header.priority_chunks  # System + recent

        # Load priority chunks first
        for chunk_idx in priority_chunks:
            chunk = await cache.load_chunk(chunk_idx)
            await self.engine.inject_kv_chunk(chunk)
            self.loaded_chunks += 1

            # Check if now usable
            if self.loaded_chunks >= len(priority_chunks):
                self.usable = True

            if on_progress:
                on_progress(self.loaded_chunks, self.total_chunks, self.usable)

        # Load remaining chunks (can happen in background)
        remaining = set(range(self.total_chunks)) - set(priority_chunks)
        for chunk_idx in remaining:
            chunk = await cache.load_chunk(chunk_idx)
            await self.engine.inject_kv_chunk(chunk)
            self.loaded_chunks += 1

            if on_progress:
                on_progress(self.loaded_chunks, self.total_chunks, self.usable)

        return ThawResult(
            success=True,
            chunks_loaded=self.loaded_chunks,
            time_to_usable_ms=self.time_to_usable,
            total_time_ms=self.total_time
        )
```

---

## Platform-Specific Considerations

### iOS (Swift/Objective-C Bridge)

```swift
// Swift wrapper for CWM mobile library

import Foundation
import CWMMobile  // Rust/C++ core via FFI

@MainActor
class ContextWindowManager: ObservableObject {
    @Published var windows: [ContextWindow] = []
    @Published var restorationProgress: Double = 0
    @Published var isRestoring: Bool = false

    private let core: CWMCore

    init() {
        // Initialize with app's document directory
        let docsPath = FileManager.default.urls(
            for: .documentDirectory,
            in: .userDomainMask
        ).first!

        core = CWMCore(storagePath: docsPath.appendingPathComponent("cwm"))
    }

    func freezeCurrentSession(name: String) async throws -> ContextWindow {
        // Check storage before freeze
        let storage = try await core.getStorageInfo()
        guard storage.canStore else {
            throw CWMError.insufficientStorage
        }

        return try await core.freeze(sessionId: currentSessionId, windowName: name)
    }

    func thawWindow(name: String) async throws {
        isRestoring = true
        restorationProgress = 0

        do {
            try await core.thawProgressive(windowName: name) { loaded, total, usable in
                Task { @MainActor in
                    self.restorationProgress = Double(loaded) / Double(total)
                    if usable && self.isRestoring {
                        // Can start showing UI for interaction
                        NotificationCenter.default.post(name: .cwmContextUsable, object: nil)
                    }
                }
            }
        } catch {
            isRestoring = false
            throw error
        }

        isRestoring = false
    }
}
```

### Android (Kotlin/JNI Bridge)

```kotlin
// Kotlin wrapper for CWM mobile library

package com.example.cwm

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class ContextWindowManager(private val context: Context) {

    private val core: CWMCore

    private val _windows = MutableStateFlow<List<ContextWindow>>(emptyList())
    val windows: StateFlow<List<ContextWindow>> = _windows

    private val _restorationProgress = MutableStateFlow(0f)
    val restorationProgress: StateFlow<Float> = _restorationProgress

    init {
        // Initialize native library
        System.loadLibrary("cwm_mobile")

        val storagePath = context.filesDir.resolve("cwm")
        core = CWMCore(storagePath.absolutePath)
    }

    suspend fun freezeCurrentSession(name: String): ContextWindow {
        // Check battery before intensive operation
        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        val batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)

        if (batteryLevel < 20 && !isCharging()) {
            throw CWMException.LowBattery("Battery below 20%, please charge before freezing")
        }

        return core.freeze(currentSessionId, name)
    }

    suspend fun thawWindow(name: String) {
        core.thawProgressive(name) { loaded, total, usable ->
            _restorationProgress.value = loaded.toFloat() / total.toFloat()

            if (usable) {
                // Notify UI that context is usable
                // Can start accepting user input
            }
        }
    }

    private fun isCharging(): Boolean {
        val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        return batteryManager.isCharging
    }
}
```

### Cross-Platform (Rust Core)

```rust
// Rust core library compiled for all platforms

use std::path::PathBuf;

#[repr(C)]
pub struct CWMCore {
    storage_path: PathBuf,
    config: CWMConfig,
}

#[repr(C)]
pub struct ProgressCallback {
    pub callback: extern "C" fn(loaded: u32, total: u32, usable: bool, user_data: *mut std::ffi::c_void),
    pub user_data: *mut std::ffi::c_void,
}

impl CWMCore {
    pub fn new(storage_path: &str) -> Self {
        Self {
            storage_path: PathBuf::from(storage_path),
            config: CWMConfig::default_mobile(),
        }
    }

    pub async fn freeze(&self, session_id: &str, window_name: &str) -> Result<ContextWindow, CWMError> {
        // Mobile-optimized freeze implementation
        // - Use INT8 quantization
        // - Apply LZ4 compression
        // - Chunk for progressive loading
        todo!()
    }

    pub async fn thaw_progressive(
        &self,
        window_name: &str,
        progress: ProgressCallback,
    ) -> Result<(), CWMError> {
        let cache = MobileKVCache::open(&self.storage_path.join(window_name))?;
        let header = cache.load_header().await?;

        let total = header.chunk_count;
        let priority = &header.priority_chunks;

        // Load priority chunks first
        for (i, &chunk_idx) in priority.iter().enumerate() {
            let chunk = cache.load_chunk(chunk_idx).await?;
            self.inject_chunk(chunk)?;

            let usable = i + 1 >= priority.len();
            unsafe {
                (progress.callback)(
                    (i + 1) as u32,
                    total,
                    usable,
                    progress.user_data
                );
            }
        }

        // Load remaining in background
        // ...

        Ok(())
    }
}

// C FFI for iOS/Android
#[no_mangle]
pub extern "C" fn cwm_core_new(storage_path: *const std::os::raw::c_char) -> *mut CWMCore {
    let path = unsafe { std::ffi::CStr::from_ptr(storage_path) };
    let core = CWMCore::new(path.to_str().unwrap());
    Box::into_raw(Box::new(core))
}

#[no_mangle]
pub extern "C" fn cwm_core_free(core: *mut CWMCore) {
    if !core.is_null() {
        unsafe { drop(Box::from_raw(core)) };
    }
}
```

---

## Model Recommendations by Platform

### Mobile (Smartphone)

| Model | Size | Quantization | Context | RAM Required |
|-------|------|--------------|---------|--------------|
| Gemma-2B | 2B | INT4 | 8K | 3GB |
| Phi-3-mini | 3.8B | INT4 | 4K | 4GB |
| StableLM-3B | 3B | INT4 | 4K | 4GB |
| TinyLlama-1.1B | 1.1B | INT4 | 2K | 2GB |

### Tablet/Edge

| Model | Size | Quantization | Context | RAM Required |
|-------|------|--------------|---------|--------------|
| Llama-3.2-3B | 3B | INT8 | 8K | 6GB |
| Mistral-7B | 7B | INT4 | 8K | 8GB |
| Phi-3-small | 7B | INT4 | 8K | 8GB |
| Gemma-7B | 7B | INT8 | 16K | 12GB |

### Automotive/Industrial

| Model | Size | Quantization | Context | Hardware |
|-------|------|--------------|---------|----------|
| Llama-3.1-8B | 8B | FP16 | 32K | Jetson AGX Orin |
| Mistral-7B | 7B | FP16 | 32K | Jetson AGX Orin |
| Custom fine-tuned | Varies | INT8 | 16K | NVIDIA DRIVE AGX |

---

## Network Considerations

### Offline-First Design

```python
class OfflineFirstSync:
    """
    Sync strategy that prioritizes offline operation.

    Principles:
    - All core operations work offline
    - Sync is opportunistic, not required
    - Conflict resolution favors local changes
    - Bandwidth-aware sync scheduling
    """

    def __init__(self):
        self.pending_syncs: list[SyncOperation] = []
        self.last_sync: datetime = None

    async def queue_sync(self, operation: SyncOperation):
        """Queue operation for sync when online."""
        self.pending_syncs.append(operation)
        await self.persist_pending()

    async def attempt_sync(self) -> SyncResult:
        """Attempt to sync pending operations."""
        if not await self.is_online():
            return SyncResult(success=False, reason="offline")

        if not await self.is_good_connection():
            # On metered/slow connection, only sync critical ops
            critical = [op for op in self.pending_syncs if op.priority == "critical"]
            return await self.sync_operations(critical)

        return await self.sync_operations(self.pending_syncs)

    async def is_good_connection(self) -> bool:
        """Check if connection is suitable for large syncs."""
        # Platform-specific: check if on WiFi, not metered, good signal
        pass
```

### Bandwidth-Efficient Transfer

```python
class DeltaSync:
    """
    Sync only differences, not full KV caches.

    For a 32K context window:
    - Full sync: ~50MB
    - Delta sync: ~1-5MB (new tokens only)
    """

    async def compute_delta(
        self,
        local_window: ContextWindow,
        remote_window: ContextWindow
    ) -> KVDelta:
        """Compute minimal delta between local and remote."""
        local_hashes = set(local_window.block_hashes)
        remote_hashes = set(remote_window.block_hashes)

        to_upload = local_hashes - remote_hashes
        to_download = remote_hashes - local_hashes

        return KVDelta(
            upload_blocks=list(to_upload),
            download_blocks=list(to_download),
            estimated_upload_bytes=len(to_upload) * AVG_BLOCK_SIZE,
            estimated_download_bytes=len(to_download) * AVG_BLOCK_SIZE
        )
```

---

## Testing on Mobile

### Emulator Testing

```bash
# iOS Simulator
xcrun simctl boot "iPhone 15 Pro"
xcrun simctl install booted ./build/CWMMobile.app
xcrun simctl launch booted com.example.cwm

# Android Emulator
emulator -avd Pixel_7_API_34
adb install ./build/cwm-mobile.apk
adb shell am start -n com.example.cwm/.MainActivity
```

### Real Device Testing

```bash
# iOS (requires signing)
xcodebuild -scheme CWMMobile -destination 'platform=iOS,name=My iPhone' test

# Android
./gradlew connectedAndroidTest
```

### Performance Profiling

| Metric | Target (Phone) | Target (Tablet) | How to Measure |
|--------|----------------|-----------------|----------------|
| Cold start | <3s | <2s | Instruments / Android Profiler |
| Freeze (4K) | <2s | <1s | Custom timing |
| Thaw (4K) | <3s | <2s | Custom timing |
| Memory peak | <500MB | <1GB | Memory profiler |
| Battery (1hr active) | <10% | <8% | Battery stats |

---

## Future Roadmap

### Q2 2026
- [ ] iOS prototype with Gemma-2B
- [ ] Android prototype with Gemma-2B
- [ ] Basic freeze/thaw on mobile

### Q3 2026
- [ ] Progressive loading implementation
- [ ] Battery-aware scheduling
- [ ] Cloud sync integration

### Q4 2026
- [ ] Automotive SDK (NVIDIA DRIVE)
- [ ] Wearable sync-only client
- [ ] Cross-device handoff

### 2027+
- [ ] On-device fine-tuning
- [ ] Federated learning support
- [ ] AR/VR integration

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-23 | Initial mobile deployment documentation |
