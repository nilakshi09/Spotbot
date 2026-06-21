"use client";

import { Settings } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto pt-10">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white">
            Settings
          </h1>
          <p className="text-muted text-sm">Manage your profile and workspace</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0d1117] border border-white/10 rounded-2xl p-16 text-center"
      >
        <Settings className="w-12 h-12 text-muted/30 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-white mb-2">Coming Soon</h2>
        <p className="text-muted text-sm">Workspace settings are under construction.</p>
      </motion.div>
    </div>
  );
}
