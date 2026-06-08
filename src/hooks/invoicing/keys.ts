export const invoicingKeys = {
  all: ['invoicing'] as const,
  invoices: (type?: string) => [...invoicingKeys.all, 'invoices', type ?? 'all'] as const,
  invoice: (id: string) => [...invoicingKeys.all, 'invoice', id] as const,
  invoiceLines: (invoiceId: string) => [...invoicingKeys.all, 'invoice-lines', invoiceId] as const,
  payments: () => [...invoicingKeys.all, 'payments'] as const,
} as const;