"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const error = searchParams.get('error');
    const invited = searchParams.get('invited');
    if (error === 'google_denied') {
      toast.info('Google sign-in was cancelled');
    }
    if (error === 'google_failed') {
      toast.error('Google sign-in failed. Please try again.');
    }
    if (invited === 'true') {
      toast.info('Invitation accepted! Please log in to continue.');
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white">
          Welcome back
        </h1>
        <p className="text-muted text-sm mt-1">Sign in to your account</p>
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

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#f0f4f8]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111820] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-[#8899aa] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all duration-200"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-danger text-sm font-medium animate-[pulse_1s_ease-in-out]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-cyan-500 text-black font-bold rounded-xl py-3.5 mt-2 hover:bg-cyan-400 transition glow-teal flex justify-center items-center disabled:opacity-50 disabled:pointer-events-none hover:scale-105"
        >
          {isLoading ? (
            <span className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#0a0a0a] px-3 text-muted">or</span>
        </div>
      </div>

      <GoogleSignInButton label="Continue with Google" />

      <p className="mt-8 text-center text-sm text-muted">
        Don't have an account?{" "}
        <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors">
          Sign up
        </Link>
      </p>
    </>
  );
}
