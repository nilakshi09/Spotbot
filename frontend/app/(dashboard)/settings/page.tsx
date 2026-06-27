"use client";

import { Settings, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export default function SettingsPage() {
  const { user } = useAuth();
  
  const handleLinkGoogle = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

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

      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d1117] border border-white/10 rounded-2xl p-16 text-center"
        >
          <Settings className="w-12 h-12 text-muted/30 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">Coming Soon</h2>
          <p className="text-muted text-sm mb-8">Workspace settings are under construction.</p>
          <Link
            href="/settings/team"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500
              text-white font-medium rounded-xl transition-colors text-sm"
          >
            Manage Team
          </Link>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0d1117] border border-white/10 rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-medium text-white">Security</h2>
          </div>
          
          <div className="flex items-center justify-between py-4 border-t border-white/10">
            <div>
              <p className="text-white font-medium mb-1">Google Account</p>
              {user?.hasGoogleAuth ? (
                <p className="text-sm text-muted">✅ Google account linked ({user.email})</p>
              ) : (
                <p className="text-sm text-muted">Link your Google account for faster sign-in</p>
              )}
            </div>
            {!user?.hasGoogleAuth && (
              <button
                onClick={handleLinkGoogle}
                className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-100 transition-colors"
              >
                Link Google Account
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
