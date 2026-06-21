"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, User, AlertTriangle, Zap } from "lucide-react";
import Link from "next/link";

const floatingNums = [
  { val: "0.38", top: "8%", left: "5%", dur: 9, delay: 0 },
  { val: "74", top: "15%", left: "80%", dur: 11, delay: 2 },
  { val: "1.2%", top: "45%", left: "10%", dur: 10, delay: 4 },
  { val: "89K", top: "70%", left: "88%", dur: 13, delay: 1 },
  { val: "412K", top: "25%", left: "92%", dur: 8, delay: 3 },
  { val: "0.02", top: "60%", left: "3%", dur: 12, delay: 5 },
  { val: "HIGH", top: "80%", left: "15%", dur: 14, delay: 6 },
  { val: "38%", top: "35%", left: "70%", dur: 9, delay: 1.5 },
  { val: "3.8%", top: "55%", left: "60%", dur: 11, delay: 3.5 },
  { val: "156K", top: "90%", left: "45%", dur: 10, delay: 2.5 },
];

const fadeUp = {
  initial: { opacity: 0, y: 28 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: "-80px" } as const,
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } as const,
};

export default function HeroSection() {
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowResult(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      id="hero"
      className="min-h-screen flex items-center relative overflow-hidden"
    >
      {/* Radial gradient blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      {/* Floating numbers */}
      {floatingNums.map((n, i) => (
        <motion.span
          key={i}
          className="absolute font-[family-name:var(--font-jetbrains-mono)] text-xs text-cyan-400 opacity-[0.05] pointer-events-none"
          style={{ top: n.top, left: n.left }}
          animate={{ y: [0, -100] }}
          transition={{
            duration: n.dur,
            delay: n.delay,
            repeat: Infinity,
            repeatType: "loop",
            ease: "linear",
          }}
        >
          {n.val}
        </motion.span>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto px-6 pt-24 pb-16 w-full">
        {/* LEFT COLUMN */}
        <div>
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/8 text-cyan-400 text-xs font-medium mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Fraud Detection for Marketing Agencies
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="font-[family-name:var(--font-space-grotesk)] text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.05] tracking-tight"
          >
            Know If The
            <br />
            <span className="shimmer-text">Audience</span>
            <br />
            Is Real.
          </motion.h1>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
            className="inline-flex items-center gap-2 text-sm mt-4 mb-6"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-muted font-medium">
              Scan any handle in under 60 seconds
            </span>
          </motion.div>

          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
            className="text-muted text-lg max-w-lg leading-relaxed"
          >
            Spotbot runs a multi-signal fraud scan on any Instagram or YouTube
            handle and returns a fraud score before you sign the deal. No
            onboarding. No sales call. Just the truth.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4 items-center"
          >
            <Link
              href="/signup"
              className="bg-cyan-500 text-black font-bold text-base px-8 py-3.5 rounded-full hover:bg-cyan-400 hover:scale-105 transition-all duration-200 glow-teal flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Get Started Free
            </Link>
            <a
              href="#demo"
              className="border border-cyan-500/35 text-cyan-400 font-semibold text-base px-8 py-3.5 rounded-full hover:bg-cyan-500/10 transition-all duration-200"
            >
              See Sample Report →
            </a>
          </motion.div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="relative flex items-center justify-center">
          {/* Main profile card */}
          <div className="relative w-80 rounded-2xl border border-cyan-500/20 bg-[#0d1117] p-6 overflow-hidden mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-600/30 border border-white/10 flex items-center justify-center shrink-0">
                <User className="w-6 h-6 text-white/30" />
              </div>
              <div className="min-w-0">
                <p className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-white font-semibold truncate">
                  @influen_cer__
                </p>
                <p className="text-muted text-xs mt-0.5">412K followers</p>
                <div className="flex gap-1 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted">
                    Instagram
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted">
                    YouTube
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center mt-2">
              <div>
                <p className="text-white text-sm font-[family-name:var(--font-jetbrains-mono)] font-semibold">
                  412K
                </p>
                <p className="text-muted text-[10px] mt-0.5">Followers</p>
              </div>
              <div>
                <p className="text-white text-sm font-[family-name:var(--font-jetbrains-mono)] font-semibold">
                  847
                </p>
                <p className="text-muted text-[10px] mt-0.5">Posts</p>
              </div>
              <div>
                <p className="text-white text-sm font-[family-name:var(--font-jetbrains-mono)] font-semibold">
                  1.2%
                </p>
                <p className="text-muted text-[10px] mt-0.5">Eng. Rate</p>
              </div>
            </div>

            <div className="scan-line" />

            {showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute inset-0 bg-danger/5 pointer-events-none rounded-2xl" />

                <div className="absolute top-3 right-3 bg-danger/15 border border-danger/40 text-danger text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  BOT RISK: HIGH
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {["38% fake followers", "Engagement anomaly", "+89K spike"].map(
                    (chip, i) => (
                      <span
                        key={i}
                        className="font-[family-name:var(--font-jetbrains-mono)] text-[10px] bg-danger/8 border border-danger/25 text-danger/80 px-2 py-0.5 rounded"
                      >
                        {chip}
                      </span>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Context card 1 - Fraud Score */}
          <motion.div
            className="absolute -top-0 -right-4 rounded-xl glass border border-cyan-500/20 p-3 w-40"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <p className="text-muted text-[10px] font-[family-name:var(--font-jetbrains-mono)]">
              Fraud Score
            </p>
            <p className="text-danger font-[family-name:var(--font-jetbrains-mono)] font-bold text-lg">
              74 / 100
            </p>
            <div className="w-full h-1 bg-danger/20 rounded mt-1">
              <div className="w-[74%] bg-danger rounded h-full" />
            </div>
          </motion.div>

          {/* Context card 2 - Real Reach */}
          <motion.div
            className="absolute bottom-0 -left-4 rounded-xl glass border border-cyan-500/20 p-3 w-44"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 4,
              delay: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <p className="text-muted text-[10px] font-[family-name:var(--font-jetbrains-mono)]">
              Real Reach
            </p>
            <p className="text-cyan-400 font-[family-name:var(--font-jetbrains-mono)] font-bold text-base">
              ~156,000
            </p>
            <p className="text-muted text-[10px] mt-0.5">of 412,000 total</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
