"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiClient.post("/api/auth/forgot-password", { email });
    } catch {
      // Ignore errors to prevent email enumeration
    } finally {
      setIsLoading(false);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white mb-3">
          Check your email
        </h1>
        <p className="text-muted text-sm mb-8 leading-relaxed">
          If an account exists with that email, we&apos;ve sent a password reset link.
        </p>
        <Link
          href="/login"
          className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white">
          Forgot password?
        </h1>
        <p className="text-muted text-sm mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-[#f0f4f8] mb-2 block">
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#111820] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-[#8899aa] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all duration-200"
            placeholder="you@agency.com"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-cyan-500 text-black font-bold rounded-xl py-3.5 mt-2 hover:bg-cyan-400 transition glow-teal flex justify-center items-center disabled:opacity-50 disabled:pointer-events-none hover:scale-105"
        >
          {isLoading ? (
            <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
          ) : (
            "Send Reset Link"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm">
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
