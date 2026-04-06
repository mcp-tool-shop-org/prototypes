import { createInvoice, sendInvoice, formatInvoice } from "./billing.js";
import { getAllInvoices } from "./store.js";

export function handleCreateInvoice(
  id: string,
  amount: number,
  currency: string
): string {
  const result = createInvoice(id, amount, currency);
  if (!result.success) {
    return `Error: ${result.error}`;
  }
  return formatInvoice(result.invoice);
}

export function handleSendInvoice(id: string): string {
  const result = sendInvoice(id);
  if (!result.success) {
    return `Error: ${result.error}`;
  }
  return `Sent: ${formatInvoice(result.invoice)}`;
}

export function handleListInvoices(): string {
  const invoices = getAllInvoices();
  return invoices.map(formatInvoice).join("\n");
}
