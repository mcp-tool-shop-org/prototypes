import type { Invoice, InvoiceResult } from "./types.js";

export function createInvoice(id: string, amount: number): InvoiceResult {
  const invoice: Invoice = { id, amount, status: "draft" };
  return { invoice, success: amount > 0 };
}
