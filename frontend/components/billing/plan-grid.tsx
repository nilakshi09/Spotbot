import { PLANS } from '@/lib/plans'
import { Check } from 'lucide-react'
import { useCheckout } from '@/hooks/use-checkout'
import { motion } from 'framer-motion'
import { StripeRedirectOverlay } from './stripe-redirect-overlay'
import { ContactSalesModal } from './contact-sales-modal'
import { useState } from 'react'

export function PlanGrid({ currentPlan, isLoading }: { currentPlan: string, isLoading: boolean }) {
  const [showContactModal, setShowContactModal] = useState(false)
  const { mutate: checkout, isPending } = useCheckout()
  const upgradeablePlans = PLANS.filter(p => p.id !== 'free')

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 h-96 animate-pulse" />
        ))}
      </div>
    )
  }

  if (currentPlan === 'pro' || currentPlan === 'enterprise') {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
        <h2 className="text-lg font-medium text-white mb-2">You&apos;re on our highest self-serve plan.</h2>
        <p className="text-gray-400 mb-4">Need more? Contact us about Enterprise.</p>
        <button 
          onClick={() => setShowContactModal(true)}
          className="inline-flex px-4 py-2 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
        >
          Contact Sales →
        </button>
      </div>
    )
  }

  return (
    <>
      <StripeRedirectOverlay isOpen={isPending} />
      <div id="plan-grid">
        <h2 className="text-xl font-bold text-white mb-6">Upgrade Your Plan</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {upgradeablePlans.map((plan, index) => {
          const isCurrent = plan.id === currentPlan
          const isHighlighted = plan.highlighted

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-white/5 backdrop-blur border rounded-xl p-6 flex flex-col ${
                isHighlighted 
                  ? 'border-indigo-500 bg-indigo-500/5 md:scale-[1.02] shadow-xl shadow-indigo-500/10 z-10' 
                  : 'border-white/10'
              } ${isCurrent ? 'opacity-50 grayscale' : ''}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                  {plan.badge}
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {plan.price === null ? 'Custom' : `$${plan.price}`}
                  </span>
                  {plan.price !== null && <span className="text-gray-400 text-sm">/ month</span>}
                </div>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-5 h-5 text-green-400 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-2.5 text-center rounded-lg border border-white/10 bg-white/5 text-gray-500 font-medium">
                  Current Plan
                </div>
              ) : plan.id === 'enterprise' ? (
                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full block text-center py-2.5 rounded-lg border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
                >
                  Contact Sales →
                </button>
              ) : (
                <button
                  onClick={() => plan.priceId && checkout(plan.priceId)}
                  disabled={isPending}
                  className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                    isHighlighted
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400'
                      : 'border border-white/20 text-white hover:bg-white/5'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isPending ? 'Redirecting...' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </motion.div>
          )
        })}
      </div>
      <ContactSalesModal
        open={showContactModal}
        onOpenChange={setShowContactModal}
      />
    </div>
    </>
  )
}
