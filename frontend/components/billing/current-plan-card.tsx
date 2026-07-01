import { Subscription } from '@/hooks/use-subscription'
import { getPlanById, getPlanBadgeStyle } from '@/lib/plans'
import { ExternalLink } from 'lucide-react'
import { useBillingPortal } from '@/hooks/use-billing-portal'
import { CancelBanner } from './cancel-banner'
import { useState } from 'react'
import { StripeRedirectOverlay } from './stripe-redirect-overlay'

export function CurrentPlanCard({ subscription, isLoading }: { subscription?: Subscription, isLoading: boolean }) {
  const { mutate: openPortal, isPending: portalLoading } = useBillingPortal()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  if (isLoading || !subscription) {
    return <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 h-64 animate-pulse" />
  }

  const plan = getPlanById(subscription.plan)
  const isPaid = subscription.plan !== 'free' && subscription.plan !== 'enterprise'

  const handleCancel = () => {
    if (showCancelConfirm) {
      openPortal()
    } else {
      setShowCancelConfirm(true)
    }
  }

  return (
    <>
      <StripeRedirectOverlay isOpen={portalLoading} />
      <div className="bg-[#0d1117]/80 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6">
        <h2 className="text-lg font-medium text-white mb-6">Current Plan</h2>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            {subscription.plan === 'enterprise' ? (
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-full text-xs font-medium">
                  Enterprise
                </span>
                <span className="text-gray-400 text-sm">
                  Custom pricing
                </span>
              </div>
            ) : (
              <>
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mb-4 ${getPlanBadgeStyle(subscription.plan)}`}>
                  {subscription.planName}
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-white">
                    {plan?.price === 0 ? 'Free' : plan?.price === null ? 'Custom' : `$${plan?.price}`}
                  </span>
                  {plan?.price ? <span className="text-gray-400">/ month</span> : null}
                </div>

                {/* Renewal info */}
                <div className="text-sm mt-2">
                  {!isPaid && subscription.plan !== 'enterprise' && <span className="text-gray-400">No subscription — upgrade to unlock more scans</span>}
                  {isPaid && !subscription.cancelAtPeriodEnd && subscription.nextBillingDate && (
                    <span className="text-gray-400">Renews on {new Date(subscription.nextBillingDate).toLocaleDateString()}</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {subscription?.plan === 'enterprise' ? (
              <div className="text-sm text-gray-400 mt-2">
                Need to make changes? Contact{' '}
                <a href="mailto:sales@spotbot.io" className="text-indigo-400 hover:text-indigo-300">
                  sales@spotbot.io
                </a>
              </div>
            ) : (
              <>
                {isPaid && (
                  <>
                    <button
                      onClick={handleCancel}
                      disabled={portalLoading}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showCancelConfirm ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10'}`}
                    >
                      {showCancelConfirm ? 'Click to confirm cancellation' : 'Cancel Plan'}
                    </button>
                    <button
                      onClick={() => openPortal()}
                      disabled={portalLoading}
                      className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 font-medium hover:bg-cyan-500/20 transition-colors flex items-center gap-2 text-sm"
                    >
                      {portalLoading ? 'Redirecting...' : 'Manage Billing'}
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </>
                )}
                {subscription.plan === 'free' && (
                  <button 
                    onClick={() => document.getElementById('plan-grid')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:from-cyan-400 hover:to-blue-400 transition-colors text-sm"
                  >
                    Upgrade Now →
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {subscription.cancelAtPeriodEnd && (
          <div className="mt-6">
            <CancelBanner 
              cancelAtPeriodEnd={subscription.cancelAtPeriodEnd} 
              nextBillingDate={subscription.nextBillingDate}
              onReactivate={() => openPortal()}
              isLoading={portalLoading}
            />
          </div>
        )}

        <div className="mt-8 border-t border-white/5 pt-8">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-400">Monthly Usage</span>
            <span className="text-white font-medium">{subscription.scansUsed} / {subscription.scanLimit} scans used</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${subscription.scansUsed >= subscription.scanLimit ? 'bg-red-500' : 'bg-cyan-500'}`}
              style={{ width: `${Math.min(100, (subscription.scansUsed / subscription.scanLimit) * 100)}%` }}
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="text-sm font-medium text-gray-400 mb-3">Plan Features</div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {plan?.features.slice(0, 3).map((f, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
    </>
  )
}
