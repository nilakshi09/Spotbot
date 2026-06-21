"use client";

import { motion } from "framer-motion";
import { TrendingUp, BarChart2, MessageSquare, Activity, Shield } from "lucide-react";

const signals = [
  {
    icon: TrendingUp,
    title: "Follower Growth Velocity",
    desc: "We analyze the full follower growth timeline. Sudden spikes of thousands of followers within hours are a primary indicator of purchased followers — organic accounts simply don't grow that way.",
  },
  {
    icon: BarChart2,
    title: "Engagement Rate Benchmark",
    desc: "Every account's engagement rate is compared against verified accounts in the same niche and tier. A 412K account with 1.2% engagement when the niche average is 3.8% signals a problem.",
  },
  {
    icon: MessageSquare,
    title: "Comment Sentiment Analysis",
    desc: "Bot comments follow detectable patterns — templated phrases, recycled language, generic praise. Our NLP layer flags comment sections dominated by non-human language.",
  },
  {
    icon: Activity,
    title: "Spike Anomaly Detection",
    desc: "Sudden follower bursts are cross-referenced against posting activity, virality signals, and historical baselines to distinguish genuine growth from purchased follower packages.",
  },
];

const staggerParent = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.08 } } as const,
  viewport: { once: true, margin: "-80px" } as const,
};

const staggerChild = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
};

export default function HowFraudModelWorks() {
  return (
    <section className="py-24 md:py-12 bg-[#0d1117]/40">
      <div className="max-w-5xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold text-center"
        >
          How Spotbot&apos;s Fraud Model Works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-muted text-center mt-3 max-w-xl mx-auto"
        >
          Four independent signals. One definitive score.
        </motion.p>

        <motion.div
          {...staggerParent}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14"
        >
          {signals.map((s, i) => (
            <motion.div
              key={i}
              {...staggerChild}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#0d1117] border border-white/8 rounded-2xl p-7 hover:border-cyan-500/30 transition-all duration-300"
            >
              <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 w-12 h-12 flex items-center justify-center text-cyan-400">
                <s.icon className="w-5 h-5" />
              </div>
              <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-lg mt-4">
                {s.title}
              </h3>
              <p className="text-muted text-sm mt-2 leading-relaxed">
                {s.desc}
              </p>
              <span className="inline-block text-[10px] font-[family-name:var(--font-jetbrains-mono)] text-cyan-400/70 border border-cyan-500/15 px-2 py-0.5 rounded bg-cyan-500/5 mt-4">
                SIGNAL
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 max-w-2xl mx-auto border border-cyan-500/20 rounded-2xl p-6 glass text-center"
        >
          <Shield className="w-8 h-8 text-cyan-400 mx-auto" />
          <p className="mt-3 text-white font-semibold">One score. Full picture.</p>
          <p className="text-muted text-sm mt-2">
            All four signals are combined into a single fraud score from 0–100.
            Below 30 is clean. Above 60 is high risk. The report tells you
            exactly why.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
