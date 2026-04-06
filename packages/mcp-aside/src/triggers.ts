import { Inbox } from "./inbox.js";
import { Guardrails } from "./guardrails.js";

export type Notifier = {
  resourceUpdated: (uri: string) => Promise<void>;
  log: (level: "debug" | "info" | "warning" | "error", data: unknown) => Promise<void>;
};

export function startTimerTrigger(inbox: Inbox, guard: Guardrails, notify: Notifier) {
  // fire every 5 minutes (tweak)
  const intervalMs = 5 * 60 * 1000;

  const handle = setInterval(async () => {
    const decision = guard.decidePush({
      priority: "low",
      text: "Periodic check-in: any blockers or decisions to capture before you forget?",
      reason: "timer-trigger",
      source: "timer",
      tags: ["meta", "workflow"],
    });

    if (!decision.ok) return;

    const item = inbox.push(decision.normalized);
    await notify.resourceUpdated("interject://inbox");

    if (decision.notify) {
      await notify.log("info", { event: "interjection-added", id: item.id, source: "timer", priority: item.priority });
    }
  }, intervalMs);

  return () => clearInterval(handle);
}
