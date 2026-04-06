export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid";
}

export interface InvoiceResult {
  invoice: Invoice;
  success: boolean;
  error?: string;
}

export type InvoiceId = string;
