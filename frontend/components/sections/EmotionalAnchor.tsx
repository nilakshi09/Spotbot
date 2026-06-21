"use client";

import { motion } from "framer-motion";

export default function EmotionalAnchor() {
  return (
    <section className="py-40 md:py-24 text-center relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500 opacity-[0.025] blur-[200px] pointer-events-none" />

      <motion.h2
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="font-[family-name:var(--font-space-grotesk)] text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.0] tracking-tight max-w-4xl mx-auto"
      >
        Stop Paying For
        <br />
        Followers That
        <br />
        Don&apos;t Exist.
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 1, delay: 0.4 }}
        className="text-muted text-xl max-w-md mx-auto mt-8 leading-relaxed"
      >
        Every fake follower in a deal is a real dollar leaving your
        client&apos;s budget. Spotbot exists to close that gap.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.65, delay: 0.8 }}
        className="mt-10"
      >
        <a
          href="#demo"
          className="text-cyan-400 font-semibold text-lg hover:text-cyan-300 underline-offset-4 hover:underline transition"
        >
          Check a creator now →
        </a>
      </motion.div>
    </section>
  );
}
