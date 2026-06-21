"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 w-full z-50 h-16 flex items-center justify-between px-6 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-cyan-500/10"
          : "bg-transparent"
      }`}
    >
      <a href="#hero" className="flex items-center gap-1">
        <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-xl">
          Spotbot
        </span>
        <span className="relative flex items-center justify-center">
          <span className="absolute w-4 h-4 rounded-full bg-cyan-400/30 animate-ping" />
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
        </span>
      </a>

      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#how-it-works"
            className="text-muted hover:text-white transition-colors text-sm"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="text-muted hover:text-white transition-colors text-sm"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-muted hover:text-white transition-colors text-sm"
          >
            FAQ
          </a>
          <span className="w-px h-4 bg-white/10" />
          <Link href="/login" className="text-muted hover:text-white transition-colors text-sm">Login</Link>
        </nav>
        <Link
          href="/signup"
          className="bg-cyan-500 text-black text-sm font-bold px-5 py-2 rounded-full hover:bg-cyan-400 hover:scale-105 transition-all glow-teal"
        >
          Try Free
        </Link>
      </div>
    </motion.header>
  );
}
