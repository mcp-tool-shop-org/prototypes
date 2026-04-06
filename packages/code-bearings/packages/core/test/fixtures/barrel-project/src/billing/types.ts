export interface Invoice {
  id: string;
  amount: number;
  status: "draft" | "sent" | "paid";
}

export interface InvoiceResult {
  invoice: Invoice;
  success: boolean;
}
