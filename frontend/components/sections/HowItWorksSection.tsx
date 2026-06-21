"use client";

import { motion } from "framer-motion";
import { Search, Cpu, FileCheck } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Search,
    title: "Input",
    body: "Paste any Instagram or YouTube creator handle into Spotbot. No account creation required to run your first scan.",
  },
  {
    num: "02",
    icon: Cpu,
    title: "Scan",
    body: "Four fraud signals run simultaneously — follower growth velocity, engagement benchmarks, comment patterns, and spike detection.",
  },
  {
    num: "03",
    icon: FileCheck,
    title: "Report",
    body: "Get a fraud score from 0–100, an estimated real reach figure, and a shareable PDF report built for client decks and approval workflows.",
  },
];

const staggerParent = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } } as const,
  viewport: { once: true, margin: "-80px" } as const,
};

const staggerChild = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
};

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-12 text-center">
      <div className="max-w-5xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold"
        >
          From Handle to Report in Under 60 Seconds
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-muted mt-3 max-w-lg mx-auto"
        >
          Three steps. No setup. No waiting.
        </motion.p>

        <motion.div
          {...staggerParent}
          className="grid grid-cols-1 md:grid-cols-3 gap-0 relative mt-16 max-w-4xl mx-auto"
        >
          {/* Dotted line between steps */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px border-t-2 border-dashed border-cyan-500/20" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              {...staggerChild}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center px-8"
            >
              <div className="w-14 h-14 rounded-full bg-[#0d1117] border-2 border-cyan-500/30 flex items-center justify-center font-[family-name:var(--font-jetbrains-mono)] font-bold text-cyan-400 text-lg relative z-10">
                {step.num}
              </div>
              <div className="mt-6 rounded-xl bg-cyan-500/10 border border-cyan-500/15 p-3 w-12 h-12 flex items-center justify-center text-cyan-400 mx-auto">
                <step.icon className="w-5 h-5" />
              </div>
              <h3 className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-xl mt-5">
                {step.title}
              </h3>
              <p className="text-muted text-sm mt-2 leading-relaxed max-w-xs mx-auto">
                {step.body}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
