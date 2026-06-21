"use client";

import { motion } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 28 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } as const,
};

const staggerParent = {
  initial: {},
  whileInView: {
    transition: { staggerChildren: 0.08 },
  } as const,
  viewport: { once: true, margin: "-80px" } as const,
};

const staggerChild = {
  initial: { opacity: 0, y: 20 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
};

const stats = [
  {
    number: "49%",
    watermark: "49",
    label: "of influencer accounts have measurably inflated follower counts",
  },
  {
    number: "$1.3B",
    watermark: "1.3",
    label: "lost annually by brands to influencer fraud worldwide",
  },
  {
    number: "72hrs",
    watermark: "72",
    label: "average time agencies spend manually vetting a single creator",
  },
];

export default function ProblemSection() {
  return (
    <section id="problem" className="py-24 md:py-12 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500 opacity-[0.03] blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6">
        <motion.h2
          {...fadeUp}
          className="font-[family-name:var(--font-space-grotesk)] text-4xl lg:text-5xl font-bold text-center max-w-2xl mx-auto"
        >
          You&apos;re buying reach.
          <br />
          You might be buying ghosts.
        </motion.h2>

        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.08 }}
          className="text-muted text-lg text-center mt-4 max-w-xl mx-auto"
        >
          The influencer marketing industry loses over a billion dollars a year
          to fake audiences. Agencies have no fast way to verify authenticity
          before the contract is signed.
        </motion.p>

        <motion.div
          {...staggerParent}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              {...staggerChild}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#0d1117] border border-white/8 rounded-2xl p-8 text-center relative overflow-hidden hover:border-cyan-500/30 hover:scale-[1.02] hover:glow-teal transition-all duration-300"
            >
              <span className="absolute bottom-2 right-3 font-[family-name:var(--font-jetbrains-mono)] text-[80px] font-semibold text-white/[0.02]">
                {stat.watermark}
              </span>
              <p className="font-[family-name:var(--font-jetbrains-mono)] text-6xl font-semibold text-cyan-400">
                {stat.number}
              </p>
              <p className="text-muted text-sm mt-3 leading-relaxed max-w-[180px] mx-auto">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.3 }}
          className="mt-14 text-muted text-base text-center max-w-2xl mx-auto leading-relaxed"
        >
          Agencies rely on gut feel, manual spot-checks, or enterprise platforms
          that need a sales call just to get a quote. By then the budget is
          committed and the campaign is already at risk. There is no fast,
          affordable, self-serve way to know the truth before the deal is signed.
        </motion.p>
      </div>
    </section>
  );
}
