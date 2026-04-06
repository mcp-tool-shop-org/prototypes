import { Priority, Interjection, stableHash, nowIso } from "./inbox.js";

export type GuardrailsConfig = {
  enabled: boolean;
  defaultTtlSeconds: number;
  maxTtlSeconds: number;
  dedupeWindowSeconds: number;
  rateLimitWindowSeconds: number;
  rateLimitMax: Record<Priority, number>;
  notifyAtOrAbove: Priority;
};

export const DEFAULT_CONFIG: GuardrailsConfig = {
  enabled: true,
  defaultTtlSeconds: 10 * 60,
  maxTtlSeconds: 60 * 60,
  dedupeWindowSeconds: 5 * 60,
  rateLimitWindowSeconds: 60,
  rateLimitMax: { low: 6, med: 3, high: 1 },
  notifyAtOrAbove: "high",
};

type PushAttempt = {
  atMs: number;
  priority: Priority;
  hash: string;
};

export type GuardrailDecision =
  | { ok: true; normalized: Omit<Interjection, "id" | "createdAt">; notify: boolean }
  | { ok: false; code: string; message: string };

export type GuardrailStats = {
  accepted: number;
  rejected: number;
  deduped: number;
  rateLimited: number;
  emptyText: number;
};

export class Guardrails {
  private config: GuardrailsConfig = { ...DEFAULT_CONFIG };
  private history: PushAttempt[] = [];
  private _stats: GuardrailStats = { accepted: 0, rejected: 0, deduped: 0, rateLimited: 0, emptyText: 0 };

  configure(patch: Partial<GuardrailsConfig>) {
    this.config = { ...this.config, ...patch };
  }

  getConfig() {
    return this.config;
  }

  decidePush(input: Omit<Interjection, "id" | "createdAt">): GuardrailDecision {
    if (!this.config.enabled) {
      return { ok: true, normalized: input, notify: true };
    }

    const now = Date.now();
    this.history = this.history.filter((h) => now - h.atMs <= this.config.dedupeWindowSeconds * 1000);

    const priority: Priority = input.priority ?? "med";
    const text = (input.text ?? "").trim();
    if (!text) {
      this._stats.emptyText++;
      this._stats.rejected++;
      return { ok: false, code: "INBOX.TEXT.EMPTY", message: "Interjection text is empty." };
    }

    // TTL normalize
    let expiresAt = input.expiresAt;
    const ttl = expiresAt ? Math.floor((Date.parse(expiresAt) - now) / 1000) : this.config.defaultTtlSeconds;
    const capped = Math.max(1, Math.min(ttl, this.config.maxTtlSeconds));
    expiresAt = new Date(now + capped * 1000).toISOString();

    // Dedupe
    const hash = stableHash(`${priority}:${text}:${input.reason ?? ""}`);
    const dedupeCutoff = now - this.config.dedupeWindowSeconds * 1000;
    const isDup = this.history.some((h) => h.hash === hash && h.atMs >= dedupeCutoff);
    if (isDup) {
      this._stats.deduped++;
      this._stats.rejected++;
      return { ok: false, code: "INBOX.DEDUPED", message: "Duplicate interjection suppressed (dedupe window)." };
    }

    // Rate limit by priority
    const rateCutoff = now - this.config.rateLimitWindowSeconds * 1000;
    const recent = this.history.filter((h) => h.atMs >= rateCutoff);
    const count = recent.filter((h) => h.priority === priority).length;
    if (count >= this.config.rateLimitMax[priority]) {
      this._stats.rateLimited++;
      this._stats.rejected++;
      return { ok: false, code: "INBOX.RATELIMIT", message: `Rate limit exceeded for priority '${priority}'.` };
    }

    this.history.push({ atMs: now, priority, hash });

    const normalized: Omit<Interjection, "id" | "createdAt"> = {
      ...input,
      text,
      priority,
      expiresAt,
      meta: {
        ...(input.meta ?? {}),
        dedupeHash: hash,
        normalizedAt: nowIso(),
      },
    };

    const notify = priorityRank(priority) >= priorityRank(this.config.notifyAtOrAbove);
    this._stats.accepted++;
    return { ok: true, normalized, notify };
  }

  getStats(): GuardrailStats {
    return { ...this._stats };
  }
}

function priorityRank(p: Priority) {
  return p === "low" ? 0 : p === "med" ? 1 : 2;
}
