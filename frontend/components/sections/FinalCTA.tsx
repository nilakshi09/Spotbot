"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const particles = Array.from({ length: 12 }, (_, i) => ({
  top: `${10 + (i * 7) % 90}%`,
  left: `${5 + (i * 11) % 90}%`,
  dur: 9 + (i % 7),
  delay: i * 0.75,
}));

export default function FinalCTA() {
  return (
    <section id="cta" className="py-40 md:py-24 text-center relative overflow-hidden">
      {/* Ambient particles */}
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400 opacity-[0.07]"
          style={{ top: p.top, left: p.left }}
          animate={{ y: [0, -120] }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none" />

      <motion.h2
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="font-[family-name:var(--font-space-grotesk)] text-4xl md:text-5xl lg:text-6xl font-bold max-w-3xl mx-auto leading-tight"
      >
        The next influencer deal you close —
        <br />
        know the audience is real.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="text-muted text-lg mt-5 max-w-md mx-auto"
      >
        Join agencies already using Spotbot to protect their clients&apos; budgets
        before contracts are signed.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mt-12 max-w-sm mx-auto flex flex-col sm:flex-row gap-3"
      >
        <input
          type="email"
          placeholder="your@agency.com"
          className="flex-1 bg-[#0d1117] border border-cyan-500/25 rounded-xl px-4 py-3.5 text-white text-sm placeholder-muted focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition"
        />
        <Link href="/signup" className="bg-cyan-500 text-black font-bold px-7 py-3.5 rounded-xl hover:bg-cyan-400 transition glow-teal flex items-center justify-center whitespace-nowrap hover:scale-105">
          Get Started Free
        </Link>
      </motion.div>

      <p className="mt-5 text-muted text-sm">
        Free to start. No credit card. Results in 60 seconds.
      </p>
    </section>
  );
}
