import { Invoice } from '@/hooks/use-invoices'
import { Receipt, Download, ExternalLink } from 'lucide-react'
import { useBillingPortal } from '@/hooks/use-billing-portal'
import { StripeRedirectOverlay } from './stripe-redirect-overlay'

export function InvoiceHistory({ invoices, isLoading }: { invoices: Invoice[], isLoading: boolean }) {
  const { mutate: openPortal, isPending: portalLoading } = useBillingPortal()

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-6">Invoice History</h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <StripeRedirectOverlay isOpen={portalLoading} />
      <div className="bg-[#0d1117]/80 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-white">Invoice History</h2>
          {invoices.length > 0 && (
            <button
              onClick={() => openPortal()}
              disabled={portalLoading}
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              View all in Stripe <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {invoices.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Receipt className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-white font-medium mb-1">No invoices yet</h3>
            <p className="text-gray-400 text-sm max-w-sm">
              Invoices will appear here after your first payment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase text-gray-500">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Invoice #</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 12).map((invoice) => (
                  <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-4 text-sm text-white">
                      {new Date(invoice.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 text-sm text-gray-400">
                      {invoice.number || '—'}
                    </td>
                    <td className="py-4 text-sm text-white font-medium">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        invoice.status === 'paid' ? 'bg-green-500/10 text-green-400' :
                        invoice.status === 'open' ? 'bg-amber-500/10 text-amber-400' :
                        invoice.status === 'void' ? 'bg-gray-500/10 text-gray-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {invoice.status === 'paid' ? 'Paid' :
                         invoice.status === 'open' ? 'Due' :
                         invoice.status === 'void' ? 'Void' : 'Failed'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {invoice.pdfUrl && (
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        {invoice.hostedUrl && (
                          <a
                            href={invoice.hostedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition-colors"
                            title="View Invoice"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
