export default function Footer() {
  return (
    <footer className="py-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-1 justify-center md:justify-start">
            <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-white">
              Spotbot
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <p className="text-muted text-sm mt-1">
            Fraud detection for influencer marketing agencies.
          </p>
        </div>

        <nav className="flex gap-6 text-muted text-sm">
          <a href="#how-it-works" className="hover:text-white transition">
            How It Works
          </a>
          <a href="#pricing" className="hover:text-white transition">
            Pricing
          </a>
          <a href="#faq" className="hover:text-white transition">
            FAQ
          </a>
        </nav>

        <div className="text-center md:text-right">
          <p className="text-muted text-sm">
            &copy; 2025 Spotbot. All rights reserved.
          </p>
          <p className="text-muted text-xs mt-1">
            <a href="#" className="hover:text-white transition">
              Privacy Policy
            </a>
            {" · "}
            <a href="#" className="hover:text-white transition">
              Terms of Service
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
