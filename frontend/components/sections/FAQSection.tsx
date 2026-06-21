"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What platforms does Spotbot support?",
    a: "Spotbot currently supports Instagram and YouTube. TikTok and Twitter/X are on the roadmap for later this year.",
  },
  {
    q: "How accurate is the fraud score?",
    a: "The fraud score is built on four independent signals benchmarked against a database of verified accounts. It is a probabilistic model, not a binary verdict — it tells you the risk level and the specific signals that triggered it.",
  },
  {
    q: "Do I need to create an account to use Spotbot?",
    a: "Your first scan is completely free with no account required. Saving reports, running bulk uploads, and accessing the team dashboard require an account.",
  },
  {
    q: "Can I use the reports in client decks?",
    a: "Yes. PDF reports are designed specifically for this — clean, white-label formatting that drops straight into an agency presentation or approval workflow.",
  },
  {
    q: "How is this different from looking at follower count manually?",
    a: "Follower count tells you nothing about authenticity. Spotbot looks at growth velocity, engagement benchmarks against verified peers, comment language patterns, and sudden spike anomalies — none of which are visible through manual inspection.",
  },
  {
    q: "What does a score above 60 mean?",
    a: "A score above 60 indicates high fraud risk. We recommend either avoiding the creator or negotiating a performance-based deal structure that protects your client's budget.",
  },
  {
    q: "Is there a free plan?",
    a: "Every new user gets one free scan. After that, you can buy individual report credits at $4 each, or subscribe to the monthly plan for unlimited scans.",
  },
  {
    q: "How long does a scan take?",
    a: "Typically under 60 seconds from handle to full report. Complex accounts with longer follower histories may take slightly longer.",
  },
  {
    q: "Can I run scans in bulk?",
    a: "Yes — the monthly plan includes bulk CSV upload so you can scan an entire creator shortlist in one go without entering handles individually.",
  },
  {
    q: "Is my client data private?",
    a: "Spotbot only analyzes publicly available data from the creator's profile. No client data is required for a scan and we do not store client information.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 md:py-12">
      <div className="max-w-5xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold text-center"
        >
          Common Questions
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-muted text-center mt-3 max-w-md mx-auto"
        >
          Everything agencies ask before they run their first scan.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mx-auto mt-12 space-y-3"
        >
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="border border-white/8 rounded-xl overflow-hidden hover:border-cyan-500/20 transition-all"
              >
                <div
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex justify-between items-center px-6 py-5 cursor-pointer"
                >
                  <span className="font-[family-name:var(--font-space-grotesk)] font-semibold text-white text-base">
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 text-muted shrink-0" />
                  </motion.span>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-5 text-muted text-sm leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
