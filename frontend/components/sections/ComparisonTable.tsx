"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

type CellValue = { type: "text"; value: string } | { type: "check" } | { type: "cross" } | { type: "spotbot-check" } | { type: "spotbot-text"; value: string };

interface FeatureRow {
  feature: string;
  manual: CellValue;
  enterprise: CellValue;
  spotbot: CellValue;
}

const rows: FeatureRow[] = [
  { feature: "Time to result", manual: { type: "text", value: "1–3 days" }, enterprise: { type: "text", value: "24–48 hrs" }, spotbot: { type: "spotbot-text", value: "Under 60 seconds" } },
  { feature: "Requires sales call", manual: { type: "cross" }, enterprise: { type: "check" }, spotbot: { type: "spotbot-check" } },
  { feature: "Self-serve access", manual: { type: "cross" }, enterprise: { type: "cross" }, spotbot: { type: "spotbot-check" } },
  { feature: "Fraud score output", manual: { type: "cross" }, enterprise: { type: "check" }, spotbot: { type: "spotbot-check" } },
  { feature: "Shareable PDF report", manual: { type: "cross" }, enterprise: { type: "check" }, spotbot: { type: "spotbot-check" } },
  { feature: "Per-report pricing", manual: { type: "text", value: "N/A" }, enterprise: { type: "cross" }, spotbot: { type: "spotbot-check" } },
  { feature: "Engagement benchmark", manual: { type: "text", value: "✗ Manual" }, enterprise: { type: "check" }, spotbot: { type: "spotbot-check" } },
  { feature: "Setup required", manual: { type: "text", value: "None" }, enterprise: { type: "text", value: "Onboarding" }, spotbot: { type: "spotbot-text", value: "None" } },
];

function CellRenderer({ cell, isLast }: { cell: CellValue; isLast: boolean }) {
  const isSpotbot = cell.type.startsWith("spotbot");
  const baseClass = isSpotbot
    ? "bg-cyan-500/5 border-l border-r border-cyan-500/15" + (isLast ? " rounded-b-xl border-b border-cyan-500/15" : "")
    : "";

  const inner = () => {
    switch (cell.type) {
      case "check":
        return <Check className="w-4 h-4 text-muted mx-auto" />;
      case "cross":
        return <X className="w-4 h-4 text-muted mx-auto" />;
      case "spotbot-check":
        return <Check className="w-4 h-4 text-cyan-400 font-bold mx-auto" />;
      case "text":
        return <span className="text-muted">{cell.value}</span>;
      case "spotbot-text":
        return <span className="text-cyan-400 font-semibold">{cell.value}</span>;
    }
  };

  return (
    <td className={`px-6 py-4 text-sm text-center ${baseClass}`}>
      {inner()}
    </td>
  );
}

export default function ComparisonTable() {
  return (
    <section className="py-24 md:py-12 bg-[#0d1117]/30">
      <div className="max-w-5xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold text-center"
        >
          Spotbot vs. The Alternatives
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="text-muted text-center mt-3 max-w-lg mx-auto"
        >
          See how Spotbot stacks up against how agencies currently solve this problem.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-x-auto mt-14"
        >
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-[#0d1117]">
                <th className="px-6 py-4 text-left text-sm font-medium text-white" />
                <th className="px-6 py-4 text-center text-sm font-medium text-muted">
                  Manual Vetting
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-muted">
                  Enterprise Tools
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-cyan-400 bg-cyan-500/5 rounded-t-xl border-l border-r border-cyan-500/15">
                  Spotbot
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? "bg-white/[0.01]" : ""}
                >
                  <td className="px-6 py-4 text-sm font-medium text-white text-left">
                    {row.feature}
                  </td>
                  <CellRenderer cell={row.manual} isLast={false} />
                  <CellRenderer cell={row.enterprise} isLast={false} />
                  <CellRenderer cell={row.spotbot} isLast={i === rows.length - 1} />
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <p className="text-muted text-sm mt-6 text-center">
          Enterprise tools include platforms like GRIN, AspireIQ, and Traackr.
          Pricing typically starts at $1,500+/month with required onboarding.
        </p>
      </div>
    </section>
  );
}
