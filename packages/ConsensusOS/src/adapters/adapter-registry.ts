/**
 * Adapter Registry
 *
 * Centralized registry for chain adapters. Allows runtime discovery
 * and management of adapters for multiple chains. Plugins register
 * adapter factories; the registry instantiates and manages them.
 */

import type {
  ChainAdapter,
  ChainAdapterFactory,
  ChainConfig,
  ChainFamily,
} from "./chain-adapter.js";

export class AdapterRegistry {
  private readonly factories = new Map<ChainFamily, ChainAdapterFactory>();
  private readonly instances = new Map<string, ChainAdapter>();

  /** Register an adapter factory for a chain family */
  registerFactory(family: ChainFamily, factory: ChainAdapterFactory): void {
    if (this.factories.has(family)) {
      throw new Error(`Adapter factory for "${family}" already registered`);
    }
    this.factories.set(family, factory);
  }

  /** Create and connect an adapter instance */
  async create(config: ChainConfig): Promise<ChainAdapter> {
    const factory = this.factories.get(config.family);
    if (!factory) {
      throw new Error(`No adapter factory registered for chain family "${config.family}"`);
    }

    const key = `${config.family}:${config.networkId}`;
    if (this.instances.has(key)) {
      throw new Error(`Adapter "${key}" already exists. Disconnect first.`);
    }

    const adapter = factory(config);
    await adapter.connect(config);
    this.instances.set(key, adapter);
    return adapter;
  }

  /** Get an existing adapter instance */
  get(family: ChainFamily, networkId: string): ChainAdapter | undefined {
    return this.instances.get(`${family}:${networkId}`);
  }

  /** Disconnect and remove an adapter instance */
  async disconnect(family: ChainFamily, networkId: string): Promise<void> {
    const key = `${family}:${networkId}`;
    const adapter = this.instances.get(key);
    if (!adapter) throw new Error(`Adapter "${key}" not found`);

    await adapter.disconnect();
    this.instances.delete(key);
  }

  /** Disconnect all adapters */
  async disconnectAll(): Promise<void> {
    for (const [key, adapter] of this.instances) {
      try {
        await adapter.disconnect();
      } catch {
        // Continue cleanup
      }
    }
    this.instances.clear();
  }

  /** List registered chain families */
  registeredFamilies(): ChainFamily[] {
    return [...this.factories.keys()];
  }

  /** List active adapter instances */
  activeAdapters(): Array<{ family: ChainFamily; networkId: string; status: string }> {
    return [...this.instances.entries()].map(([key, adapter]) => {
      const [family, networkId] = key.split(":");
      return { family, networkId, status: adapter.status };
    });
  }

  /** Health check all active adapters */
  async healthCheckAll(): Promise<
    Array<{ family: string; networkId: string; healthy: boolean; latencyMs: number }>
  > {
    const results = [];
    for (const [key, adapter] of this.instances) {
      const [family, networkId] = key.split(":");
      try {
        const health = await adapter.healthCheck();
        results.push({ family, networkId, ...health });
      } catch {
        results.push({ family, networkId, healthy: false, latencyMs: -1 });
      }
    }
    return results;
  }

  /** Clear factories and instances (for testing) */
  clear(): void {
    this.instances.clear();
    this.factories.clear();
  }
}
