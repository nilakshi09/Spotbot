import * as Dialog from '@radix-ui/react-dialog'
import { PlanConfig } from '@/lib/plans'
import { Check, X } from 'lucide-react'

export function CheckoutConfirmModal({
  plan,
  open,
  onOpenChange,
  onConfirm,
  isLoading
}: {
  plan: PlanConfig | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading: boolean
}) {
  if (!plan) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 p-6">
          
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-xl font-bold text-white">
              Upgrade to {plan.name}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mb-6">
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl font-bold text-white">
                ${plan.price}
              </span>
              <span className="text-gray-400">/ month</span>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">What you get:</p>
            <ul className="space-y-3 mb-6 bg-white/5 rounded-lg p-4 border border-white/5">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <Check className="w-5 h-5 text-indigo-400 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Billed monthly. Cancel anytime.</p>
              <p>You&apos;ll be redirected to Stripe&apos;s secure checkout.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Dialog.Close asChild>
              <button 
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-white font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />}
              {isLoading ? 'Redirecting...' : 'Continue to Payment →'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
