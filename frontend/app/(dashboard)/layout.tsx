"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Settings, 
  CreditCard,
  LogOut,
  Menu,
  X,
  Users,
  FileSpreadsheet,
  Key,
  BarChart3
} from "lucide-react";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";

const navLinks = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "New Scan", href: "/scan", icon: Search },
  { name: "Bulk Scan", href: "/scan/bulk", icon: FileSpreadsheet },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: stats } = useDashboardStats();
  const nudgeLevel = stats?.trial?.nudgeLevel;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#0a0b0d] flex items-center justify-center">
        <span className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-[#0a0b0d] flex">
      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -256 }}
        animate={{ x: mobileMenuOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth >= 768 ? 0 : -256) }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 h-screen w-64 bg-[#0d1117] border-r border-white/10 z-50 flex flex-col transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-1">
            <span className="font-[family-name:var(--font-space-grotesk)] font-bold text-white text-xl">
              Spotbot
            </span>
            <span className="relative flex items-center justify-center">
              <span className="absolute w-3 h-3 rounded-full bg-cyan-400/30 animate-ping" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </span>
          </Link>
          <button 
            className="ml-auto md:hidden text-muted hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const showBadge = link.name === 'Billing' && (nudgeLevel === 'urgent' || nudgeLevel === 'expired');

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-cyan-500/10 text-cyan-400" 
                    : "text-[#8899aa] hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <link.icon className={`w-5 h-5 ${isActive ? "text-cyan-400" : "text-muted"}`} />
                  {link.name}
                </div>
                {showBadge && (
                  <span className="relative flex items-center justify-center w-2 h-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </Link>
            );
          })}
          
          {['pro', 'enterprise'].includes(stats?.planName ?? '') && (
            <Link
              href="/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/analytics'
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-[#8899aa] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className={`w-5 h-5 ${pathname === '/analytics' ? 'text-cyan-400' : 'text-muted'}`} />
                Analytics
              </div>
            </Link>
          )}
          
          {user?.role === 'admin' && (
            <Link
              href="/settings/team"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/settings/team'
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-[#8899aa] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className={`w-5 h-5 ${pathname === '/settings/team' ? 'text-cyan-400' : 'text-muted'}`} />
                Team
              </div>
            </Link>
          )}

          {stats?.planName === 'enterprise' && (
            <Link
              href="/settings/white-label"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/settings/white-label'
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-[#8899aa] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className={`w-5 h-5 ${pathname === '/settings/white-label' ? 'text-cyan-400' : 'text-muted'}`} />
                White Label
              </div>
            </Link>
          )}

          {['pro', 'enterprise'].includes(stats?.planName ?? '') && (
            <Link
              href="/settings/api"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/settings/api'
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-[#8899aa] hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Key className={`w-5 h-5 ${pathname === '/settings/api' ? 'text-cyan-400' : 'text-muted'}`} />
                API Keys
              </div>
            </Link>
          )}
        </nav>

        {/* User profile (bottom) */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-sm font-bold shrink-0 relative overflow-hidden">
              {getInitials(user.name)}
              {user?.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
            <button 
              onClick={() => logout()}
              className="text-muted hover:text-danger p-1 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        {/* Top bar */}
        <header className="h-16 fixed top-0 right-0 left-0 md:left-64 bg-[#0d1117]/80 backdrop-blur-lg border-b border-white/5 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-muted hover:text-white"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-medium text-muted capitalize">
              {pathname.split('/').pop() || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Quota Indicator */}
            <QuotaIndicator />
            
            {/* User Dropdown Toggle */}
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="relative w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 overflow-hidden"
              >
                {getInitials(user.name)}
                {user?.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-[#111820] border border-white/10 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-sm text-white font-medium truncate">{user.name}</p>
                    </div>
                    <Link href="/settings" className="block px-4 py-2 text-sm text-muted hover:text-white hover:bg-white/5" onClick={() => setDropdownOpen(false)}>
                      Profile Settings
                    </Link>
                    <button 
                      onClick={() => { setDropdownOpen(false); logout(); }}
                      className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 md:p-8 mt-16 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function QuotaIndicator() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading || !stats) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted">
        <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
      </div>
    );
  }

  const percentUsed = (stats.scansUsed / stats.scanLimit) * 100;
  let dotColor = "bg-green-500";
  let textColor = "text-muted";
  
  if (percentUsed >= 100) {
    dotColor = "bg-red-500";
    textColor = "text-red-400";
  } else if (percentUsed >= 80) {
    dotColor = "bg-red-500";
  } else if (percentUsed >= 60) {
    dotColor = "bg-amber-500";
  }

  return (
    <Link href="/billing" className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors">
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className={textColor}>
        {percentUsed >= 100 ? (
          "Upgrade"
        ) : (
          `${stats.scansUsed} / ${stats.scanLimit} scans`
        )}
      </span>
    </Link>
  );
}

