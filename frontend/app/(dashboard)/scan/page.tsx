"use client";

import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { ScanForm } from "@/components/scan/scan-form";
import Link from "next/link";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

export default function NewScanPage() {
  const { data: stats } = useDashboardStats();
  const isPaidPlan = stats?.planName && stats.planName !== 'free';

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
        
        {isPaidPlan && (
          <div className="text-center mt-6">
            <p className="text-gray-500 text-sm">
              Need to scan multiple accounts?{' '}
              <Link
                href="/scan/bulk"
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Use Bulk Scan →
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
