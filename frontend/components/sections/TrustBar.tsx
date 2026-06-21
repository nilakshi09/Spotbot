"use client";

import { motion } from "framer-motion";
import { Shield, Zap, FileText, Users, Lock } from "lucide-react";

const trustItems = [
  { icon: Shield, label: "Multi-signal fraud detection" },
  { icon: Zap, label: "Results in under 60 seconds" },
  { icon: FileText, label: "Shareable PDF reports" },
  { icon: Users, label: "Built for agencies" },
  { icon: Lock, label: "No onboarding required" },
];

export default function TrustBar() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, delay: 0.4 }}
      className="py-6 border-y border-white/5 bg-[#0d1117]/50"
    >
      <div className="flex flex-wrap gap-8 justify-center items-center max-w-5xl mx-auto px-6">
        {trustItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <item.icon className="w-4 h-4 text-cyan-400" />
            <span className="text-muted text-sm">{item.label}</span>
            {i < trustItems.length - 1 && (
              <span className="hidden md:block w-px h-4 bg-white/10 ml-8" />
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
}
