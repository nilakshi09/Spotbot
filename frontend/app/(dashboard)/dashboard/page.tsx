"use client";

import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";
import { Search, Activity, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { TrialNudgeBanner } from "@/components/billing/trial-nudge-banner";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  
  if (!user) return null;

  const dateStr = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric' 
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <motion.h1 
          {...fadeUp}
          className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold text-white mb-2"
        >
          Welcome back, {user.name.split(' ')[0]}
        </motion.h1>
        <motion.p 
          {...fadeUp} transition={{ delay: 0.1, ...fadeUp.transition }}
          className="text-muted"
        >
          {dateStr}
        </motion.p>
      </div>

      {stats?.trial && (
        <TrialNudgeBanner trial={stats.trial} />
      )}

      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        initial="initial"
        animate="animate"
        variants={{
          animate: { transition: { staggerChildren: 0.1 } }
        }}
      >
        <motion.div variants={fadeUp} className="bg-[#0d1117] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/5 text-cyan-500 flex items-center justify-center opacity-50">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-muted">Total Scans</h3>
          </div>
          <p className="text-3xl font-bold text-white/30">—</p>
          <p className="text-xs text-muted/50 mt-2">No data yet</p>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-[#0d1117] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-cyan-500/5 text-cyan-500 flex items-center justify-center opacity-50">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-muted">Avg Fraud Score</h3>
          </div>
          <p className="text-3xl font-bold text-white/30">—</p>
          <p className="text-xs text-muted/50 mt-2">No data yet</p>
        </motion.div>

        <motion.div variants={fadeUp} className="bg-[#0d1117] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-danger/5 text-danger flex items-center justify-center opacity-50">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-muted">High-Risk Count</h3>
          </div>
          <p className="text-3xl font-bold text-white/30">—</p>
          <p className="text-xs text-muted/50 mt-2">No data yet</p>
        </motion.div>
      </motion.div>

      <motion.div 
        {...fadeUp} transition={{ delay: 0.3, ...fadeUp.transition }}
        className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center bg-[#0d1117]/30"
      >
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 text-muted/30">
          <Search className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">
          You haven't run any scans yet
        </h2>
        <p className="text-muted text-sm max-w-md mx-auto mb-8">
          Run your first scan to instantly analyze an Instagram or YouTube handle's audience authenticity.
        </p>
        <Link 
          href="/scan"
          className="inline-flex items-center gap-2 bg-cyan-500 text-black font-bold text-sm px-6 py-3 rounded-xl hover:bg-cyan-400 hover:scale-105 transition-all glow-teal"
        >
          <Search className="w-4 h-4" />
          Run Your First Scan
        </Link>
      </motion.div>
    </div>
  );
}
