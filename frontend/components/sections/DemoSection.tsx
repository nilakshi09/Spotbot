"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Scan, Loader2, AlertTriangle, Download, ArrowRight } from "lucide-react";
import { mockReport } from "@/lib/mockScanData";

const loadingSteps = [
  "Fetching follower timeline...",
  "Benchmarking engagement rate...",
  "Analyzing comment patterns...",
  "Calculating fraud score...",
];

export default function DemoSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runScan = () => {
    setIsLoading(true);
    setShowResult(false);
    setStepIndex(0);

    intervalRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= loadingSteps.length - 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsLoading(false);
      setShowResult(true);
    }, 2400);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const circumference = 2 * Math.PI * 50;
  const scoreOffset = circumference - (mockReport.fraudScore / 100) * circumference;

  return (
    <section id="demo" className="py-24 md:py-12 text-center">
      <div className="max-w-5xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold"
        >
          See It Work. Right Now.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-muted text-lg mt-3 max-w-lg mx-auto"
        >
          Enter any handle below. We&apos;ll show you exactly what Spotbot returns.
        </motion.p>

        {/* Input card */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl mx-auto mt-12 bg-[#0d1117] border border-cyan-500/25 rounded-2xl p-8 glow-teal"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="@creator_handle"
              className="w-full bg-[#0a0b0d] border border-cyan-500/20 rounded-xl px-4 py-3.5 pl-10 text-white font-[family-name:var(--font-jetbrains-mono)] text-sm placeholder-muted focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10 transition"
              onKeyDown={(e) => e.key === "Enter" && !isLoading && !showResult && runScan()}
            />
          </div>

          {!isLoading && !showResult && (
            <div className="mt-4 relative overflow-hidden">
              <button
                onClick={runScan}
                className="w-full bg-cyan-500 text-black font-bold py-3.5 rounded-xl hover:bg-cyan-400 transition flex items-center justify-center gap-2 relative"
              >
                <Scan className="w-4 h-4" />
                Run Fraud Scan
              </button>
              <span className="absolute inset-0 rounded-xl border-2 border-cyan-500/40 animate-ping pointer-events-none" />
            </div>
          )}

          {isLoading && (
            <div className="mt-4">
              <div className="w-full h-1 bg-cyan-500/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.4, ease: "linear" }}
                />
              </div>
              <p className="font-[family-name:var(--font-jetbrains-mono)] text-cyan-400 text-sm mt-4 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {loadingSteps[stepIndex]}
              </p>
            </div>
          )}

          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {/* Top row */}
                <div className="flex justify-between items-start mb-6 mt-6">
                  <div className="text-left">
                    <p className="font-[family-name:var(--font-space-grotesk)] font-bold text-white">
                      Fraud Analysis Report
                    </p>
                    <p className="font-[family-name:var(--font-jetbrains-mono)] text-muted text-sm mt-0.5">
                      {mockReport.handle}
                    </p>
                  </div>
                  <span className="bg-danger/15 border border-danger/40 text-danger text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    HIGH RISK
                  </span>
                </div>

                {/* Score section */}
                <div className="flex items-center gap-8 py-6 border-y border-white/8 mb-6">
                  <svg
                    width="112"
                    height="112"
                    viewBox="0 0 120 120"
                    className="shrink-0"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#1a2030"
                      strokeWidth="10"
                      fill="none"
                    />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      stroke="#ff4757"
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset: scoreOffset }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      transform="rotate(-90deg)"
                      style={{ transformOrigin: "center" }}
                    />
                    <text
                      x="60"
                      y="55"
                      textAnchor="middle"
                      fill="#ff4757"
                      fontSize="28"
                      fontWeight="700"
                      fontFamily="var(--font-jetbrains-mono), monospace"
                    >
                      74
                    </text>
                    <text
                      x="60"
                      y="72"
                      textAnchor="middle"
                      fill="#8899aa"
                      fontSize="11"
                      fontFamily="var(--font-jetbrains-mono), monospace"
                    >
                      / 100
                    </text>
                  </svg>

                  <div className="flex-1 min-w-0">
                    <p className="text-muted text-xs font-[family-name:var(--font-jetbrains-mono)] uppercase tracking-widest">
                      Fraud Score
                    </p>
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] font-[family-name:var(--font-jetbrains-mono)] text-muted">
                        <span>CLEAN</span>
                        <span>MODERATE</span>
                        <span>HIGH RISK</span>
                      </div>
                      <div className="relative w-full h-2 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 mt-1">
                        <span
                          className="absolute w-3 h-3 rounded-full bg-white border-2 border-danger -top-0.5"
                          style={{ left: "calc(74% - 6px)" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signal rows */}
                <div className="space-y-3 mb-6">
                  {mockReport.signals.map((signal, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-white/5 pb-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            signal.risk === "high" ? "bg-danger" : "bg-warning"
                          }`}
                        />
                        <span className="text-sm text-muted font-medium">
                          {signal.label}
                        </span>
                      </div>
                      <span
                        className={`font-[family-name:var(--font-jetbrains-mono)] text-sm ${
                          signal.risk === "high"
                            ? "text-danger"
                            : "text-yellow-400"
                        }`}
                      >
                        {signal.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Real reach row */}
                <div className="mt-4 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between">
                  <span className="text-sm text-muted">
                    Estimated Real Reach
                  </span>
                  <span className="font-[family-name:var(--font-jetbrains-mono)] font-bold text-cyan-400 text-base">
                    ~156,000{" "}
                    <span className="text-muted text-xs ml-1">of 412,000</span>
                  </span>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex gap-3">
                  <button className="flex-1 border border-cyan-500/30 text-cyan-400 font-semibold py-3 rounded-xl hover:bg-cyan-500/10 transition text-sm flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Report PDF
                  </button>
                  <a
                    href="#pricing"
                    className="flex-1 bg-cyan-500 text-black font-bold py-3 rounded-xl hover:bg-cyan-400 transition text-sm flex items-center justify-center gap-2"
                  >
                    Start Free Plan
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>

                <p className="mt-4 text-muted text-xs text-center">
                  This is a sample report. Real scans run on live data.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
