import { motion } from 'framer-motion'
import { Zap, ArrowRight } from 'lucide-react'
import { TrialStatus } from '@/types/scan'
import { useCheckout } from '@/hooks/use-checkout'
import { getPlanById } from '@/lib/plans'
import { StripeRedirectOverlay } from './stripe-redirect-overlay'

export function FreePlanBanner({ trial }: { trial: TrialStatus }) {
  const { mutate: checkout, isPending } = useCheckout()
  const starterPlan = getPlanById('starter')

  const handleUpgrade = () => {
    if (starterPlan?.priceId) {
      checkout(starterPlan.priceId)
    }
  }

  const scrollToPlans = () => {
    document.getElementById('plan-grid')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-l-4 border-indigo-500 bg-indigo-500/5 backdrop-blur rounded-r-xl p-6 relative overflow-hidden"
    >
      <StripeRedirectOverlay isOpen={isPending} />
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <Zap className="w-32 h-32 text-indigo-500 transform rotate-12" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white">You&apos;re on the Free Plan</h2>
        </div>

        <p className="text-indigo-200/80 mb-6 max-w-xl">
          {trial.isTrialExpired 
            ? `You've used all ${trial.scanLimit} free scans. Upgrade now to continue analyzing influencer audiences.`
            : `You have ${trial.scansRemaining} free scans remaining. Upgrade to unlock more scans, PDF exports, and team features.`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-black/20 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-400 mb-1">Current Limits</div>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 5 scans/mo</li>
              <li>• 1 seat</li>
              <li>• Web reports only</li>
            </ul>
          </div>
          
          <div className="flex items-center justify-center text-indigo-400/50 hidden md:flex">
            <ArrowRight className="w-8 h-8" />
          </div>

          <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/20">
            <div className="text-sm font-medium text-indigo-300 mb-1">After Upgrading</div>
            <ul className="text-sm text-indigo-100 space-y-1">
              <li>• 100+ scans/mo</li>
              <li>• 3+ seats</li>
              <li>• PDF + sharing</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleUpgrade}
            disabled={isPending || !starterPlan?.priceId}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:from-indigo-400 hover:to-purple-400 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isPending ? 'Redirecting...' : `Upgrade to Starter — $${starterPlan?.price}/mo`}
          </button>
          <button
            onClick={scrollToPlans}
            className="px-6 py-2.5 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            See all plans ↓
          </button>
        </div>
      </div>
    </motion.div>
  )
}
