import type { Invoice, InvoiceResult } from "./types.js";

export function sendInvoice(invoice: Invoice): InvoiceResult {
  return { invoice: { ...invoice, status: "sent" }, success: true };
}
