import crypto from "node:crypto";

export type Priority = "low" | "med" | "high";

export type Interjection = {
  id: string;
  text: string;
  priority: Priority;
  reason?: string;
  tags?: string[];
  createdAt: string;
  expiresAt?: string; // ISO
  source?: string;    // "timer" | "watcher" | "tool" | etc.
  meta?: Record<string, unknown>;
};

export const INBOX_URI = "interject://inbox";

export function nowIso() {
  return new Date().toISOString();
}

export function isExpired(item: Interjection, now = Date.now()) {
  if (!item.expiresAt) return false;
  const t = Date.parse(item.expiresAt);
  return Number.isFinite(t) && t <= now;
}

export function stableHash(text: string) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
}

export class Inbox {
  private items: Interjection[] = [];

  list(): Interjection[] {
    // newest first, filtering expired
    const now = Date.now();
    this.items = this.items.filter((x) => !isExpired(x, now));
    return [...this.items];
  }

  clear() {
    this.items = [];
  }

  push(input: Omit<Interjection, "id" | "createdAt">): Interjection {
    const createdAt = nowIso();
    const id = crypto.randomUUID();
    const item: Interjection = { id, createdAt, ...input };
    this.items = this.items.filter((x) => !isExpired(x));
    this.items.unshift(item);
    return item;
  }
}
