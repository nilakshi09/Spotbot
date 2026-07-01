export interface ContactSalesInput {
  companyName: string
  contactName: string
  contactEmail: string
  teamSize?: string
  estimatedScansPerMonth?: string
  message?: string
}

export interface ContactSalesResponse {
  id: string
  message: string
}

export interface Invoice {
  id: string
  number: string | null
  status: string
  amount: number
  currency: string
  date: string
  pdfUrl: string | null
  hostedUrl: string | null
}

export interface InvoicesResponse {
  invoices: Invoice[]
  stripeConfigured: boolean
}
