import type { Invoice, InvoiceId } from "./types.js";

const invoices = new Map<InvoiceId, Invoice>();

export function saveInvoice(invoice: Invoice): void {
  invoices.set(invoice.id, invoice);
}

export function getInvoice(id: InvoiceId): Invoice | undefined {
  return invoices.get(id);
}

export function getAllInvoices(): Invoice[] {
  return Array.from(invoices.values());
}
