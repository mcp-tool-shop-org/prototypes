import type { Invoice, InvoiceResult } from "./types.js";
import { saveInvoice, getInvoice } from "./store.js";

/**
 * Create a new invoice with the given amount and currency.
 * Validates input and persists to the store.
 */
export function createInvoice(
  id: string,
  amount: number,
  currency: string
): InvoiceResult {
  if (amount <= 0) {
    return {
      invoice: { id, amount, currency, status: "draft" },
      success: false,
      error: "Amount must be positive",
    };
  }

  const invoice: Invoice = { id, amount, currency, status: "draft" };
  saveInvoice(invoice);
  return { invoice, success: true };
}

/**
 * Send an invoice by updating its status.
 */
export function sendInvoice(id: string): InvoiceResult {
  const invoice = getInvoice(id);
  if (!invoice) {
    return {
      invoice: { id, amount: 0, currency: "", status: "draft" },
      success: false,
      error: "Invoice not found",
    };
  }

  const updated: Invoice = { ...invoice, status: "sent" };
  saveInvoice(updated);
  return { invoice: updated, success: true };
}

export function formatInvoice(invoice: Invoice): string {
  return `Invoice ${invoice.id}: ${invoice.amount} ${invoice.currency} [${invoice.status}]`;
}
