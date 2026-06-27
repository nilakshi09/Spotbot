"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculateStrength(password);
  
  const strengthData = [
    { label: "Too weak", color: "bg-danger" },
    { label: "Weak", color: "bg-warning" },
    { label: "Fair", color: "bg-cyan-400" },
    { label: "Strong", color: "bg-green-500" }
  ];

  const currentStrength = password ? Math.max(0, strength - 1) : -1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (strength < 4) {
      setError("Password must be at least 8 characters and contain uppercase, lowercase, and numbers");
      return;
    }

    setIsLoading(true);

    try {
      await signup(email, password, name);
    } catch (error: any) {
      console.error("Signup Error:", error);
      setError(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white">
          Create your account
        </h1>
        <p className="text-muted text-sm mt-1">Start detecting influencer fraud in 60 seconds</p>
      </div>

      <GoogleSignInButton label="Sign up with Google" />

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[#0a0a0a] px-3 text-muted">
            or sign up with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-[#f0f4f8] mb-2 block">
            Full Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#111820] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder-[#8899aa] focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 transition-all duration-200"
            placeholder="John Doe"
          />
        </div>

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
          <label className="text-sm font-medium text-[#f0f4f8] mb-2 block">
            Password
          </label>
          <div className="relative mb-2">
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
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 h-1 w-full mb-1">
                {[0, 1, 2, 3].map((idx) => (
                  <div 
                    key={idx} 
                    className={`flex-1 rounded-full ${
                      idx <= currentStrength ? strengthData[currentStrength].color : 'bg-white/10'
                    } transition-colors duration-300`}
                  />
                ))}
              </div>
              <p className={`text-xs ${currentStrength >= 0 ? 'text-[#f0f4f8]' : 'text-muted'}`}>
                {currentStrength >= 0 ? strengthData[currentStrength].label : "Enter password"}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="text-danger text-sm font-medium">
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
            "Create Account"
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
          Sign in
        </Link>
      </p>
    </>
  );
}
