"use client";

import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { ScanForm } from "@/components/scan/scan-form";

export default function NewScanPage() {
  return (
    <div className="max-w-4xl mx-auto pt-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
          <Search className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white">
            New Scan
          </h1>
          <p className="text-muted text-sm">Analyze a new handle for audience fraud</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0d1117] border border-white/10 rounded-2xl p-8 sm:p-16 text-center"
      >
        <ScanForm />
      </motion.div>
    </div>
  );
}
