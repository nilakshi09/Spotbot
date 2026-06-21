import { AlertTriangle } from 'lucide-react'

export function CancelBanner({
  cancelAtPeriodEnd,
  nextBillingDate,
  onReactivate,
  isLoading
}: {
  cancelAtPeriodEnd: boolean
  nextBillingDate: string | null
  onReactivate: () => void
  isLoading: boolean
}) {
  if (!cancelAtPeriodEnd) return null

  return (
    <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-amber-500 font-medium text-sm">
            Your subscription is set to cancel on {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : 'the next billing date'}
          </p>
          <p className="text-amber-500/70 text-xs mt-1">
            You'll keep access to your current plan until then. After that, your account will be downgraded to the free plan.
          </p>
        </div>
      </div>
      <button
        onClick={onReactivate}
        disabled={isLoading}
        className="shrink-0 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Redirecting...' : 'Reactivate Subscription'}
      </button>
    </div>
  )
}
