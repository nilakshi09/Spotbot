import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

export function StripeRedirectOverlay({ isOpen }: { isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-[#0a0b0d]/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-[#0d1117] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center"
          >
            {/* Spotbot Logo / Icon */}
            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 relative">
              <span className="absolute inset-0 rounded-2xl border border-cyan-500/20" />
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0d1117] rounded-full flex items-center justify-center">
                <span className="w-4 h-4 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Redirecting to Stripe...</h3>
            <p className="text-gray-400 text-sm mb-6">
              You&apos;re being sent to our secure payment partner to complete your request.
            </p>

            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-widest">
              <span>Secured by</span>
              <span className="text-indigo-400 font-bold lowercase tracking-normal text-sm">stripe</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
