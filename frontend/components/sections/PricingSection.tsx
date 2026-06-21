"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const staggerParent = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.08 } } as const,
  viewport: { once: true, margin: "-80px" } as const,
};

const staggerChild = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
};

const payPerFeatures = [
  "Full fraud score (0–100)",
  "Real reach estimate",
  "Downloadable PDF report",
  "Instagram + YouTube",
  "No subscription",
  "Buy credits as needed",
];

const monthlyFeatures = [
  "Unlimited scans",
  "Team dashboard",
  "Bulk creator upload (CSV)",
  "White-label PDF reports",
  "Priority support",
  "Everything in Pay Per Report",
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 md:py-12 text-center">
      <div className="max-w-5xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold"
        >
          Simple Pricing. No Sales Call Required.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-muted mt-3 max-w-md mx-auto"
        >
          Start free. Scale when you&apos;re ready. Cancel anytime.
        </motion.p>

        <motion.div
          {...staggerParent}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-14"
        >
          {/* Pay Per Report */}
          <motion.div
            {...staggerChild}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#0d1117] border border-white/10 rounded-2xl p-8 text-left hover:border-cyan-500/25 transition-all duration-300 hover:scale-[1.01]"
          >
            <p className="text-muted text-xs font-[family-name:var(--font-jetbrains-mono)] tracking-widest">
              PAY PER REPORT
            </p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-5xl font-semibold text-white">
                $4
              </span>
              <span className="text-muted text-base">/ report</span>
            </div>
            <p className="text-muted text-sm mt-2">
              Perfect for occasional evaluations or testing the waters.
            </p>

            <div className="my-6 border-t border-white/8" />

            <div className="space-y-3">
              {payPerFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-muted">{f}</span>
                </div>
              ))}
            </div>

            <button className="mt-8 w-full border border-cyan-500/35 text-cyan-400 font-bold py-3.5 rounded-xl hover:bg-cyan-500/10 transition">
              Buy Credits
            </button>
          </motion.div>

          {/* Monthly Plan */}
          <motion.div
            {...staggerChild}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-[#0d1117] border-2 border-cyan-500/50 rounded-2xl p-8 text-left glow-teal hover:scale-[1.01] transition-all duration-300"
          >
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cyan-500 text-black text-xs font-bold px-5 py-1.5 rounded-full whitespace-nowrap">
              Most Popular
            </span>
            <p className="text-cyan-400 text-xs font-[family-name:var(--font-jetbrains-mono)] tracking-widest">
              MONTHLY PLAN
            </p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-[family-name:var(--font-jetbrains-mono)] text-5xl font-semibold text-white">
                $49
              </span>
              <span className="text-muted text-base">/ seat / month</span>
            </div>
            <p className="text-muted text-sm mt-2">
              For agencies evaluating creators on every deal.
            </p>

            <div className="my-6 border-t border-cyan-500/15" />

            <div className="space-y-3">
              {monthlyFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-muted">{f}</span>
                </div>
              ))}
            </div>

            <button className="mt-8 w-full bg-cyan-500 text-black font-bold py-3.5 rounded-xl hover:bg-cyan-400 hover:scale-[1.02] transition glow-teal">
              Start Free Trial
            </button>
          </motion.div>
        </motion.div>

        <p className="mt-8 text-muted text-sm">
          All plans include a free first scan. No credit card to start.
        </p>
      </div>
    </section>
  );
}
