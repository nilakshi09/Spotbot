"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0b0d] flex flex-col items-center justify-center relative overflow-hidden p-6">
      {/* Ambient blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />

      {/* Logo */}
      <Link href="/" className="flex items-center gap-1 mb-8 relative z-10">
        <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-2xl">
          Spotbot
        </span>
        <span className="relative flex items-center justify-center">
          <span className="absolute w-4 h-4 rounded-full bg-cyan-400/30 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="glass border border-white/10 rounded-2xl p-8 max-w-md w-full relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
