import { createInvoice, sendInvoice } from "./billing/index.js";

export function handleCreate(id: string, amount: number): string {
  const result = createInvoice(id, amount);
  return result.success ? `Created ${id}` : "Failed";
}

export function handleSend(id: string): string {
  const result = sendInvoice({ id, amount: 100, status: "draft" });
  return result.success ? `Sent ${id}` : "Failed";
}
