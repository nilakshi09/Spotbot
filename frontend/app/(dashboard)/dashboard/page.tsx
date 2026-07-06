"use client";

import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { TrialNudgeBanner } from "@/components/billing/trial-nudge-banner";
import { useAnalytics } from '@/hooks/use-analytics';
import { useScans } from '@/hooks/use-scans';
import type { ScanFilters } from '@/types/scan';
import { RiskDistributionChart } from '@/components/dashboard/risk-distribution-chart';
import { ScanVolumeChart } from '@/components/dashboard/scan-volume-chart';
import { AvgScoreChart } from '@/components/dashboard/avg-score-chart';
import { PlatformDistributionChart } from '@/components/dashboard/platform-distribution-chart';
import { ScanSearch } from '@/components/dashboard/scan-search';
import RecentScansTable from '@/components/dashboard/recent-scans-table';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.5,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { data: analytics, isLoading: analyticsLoading } = useAnalytics();

  const [scanFilters, setScanFilters] = useState<ScanFilters>({
    page: 1,
    limit: 10,
    status: 'completed',
  });

  const { data: scansData, isLoading: scansLoading } = useScans(scanFilters);

  useEffect(() => {
    if (searchParams.get('welcome') === 'true') {
      toast.success('Welcome to Spotbot! Your account is ready.');
      // Remove query param
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams, toast]);
  
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

      {/* Analytics Section */}
      <div className="mb-12">
        <h2 className="text-lg font-semibold text-white mb-4">
          Analytics
          <span className="text-sm font-normal text-gray-500 ml-2">
            Last 30 days
          </span>
        </h2>

        {/* 2x2 grid on desktop, 1 col on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ScanVolumeChart
            data={analytics?.scanVolumeByDay ?? []}
            isLoading={analyticsLoading}
          />
          <RiskDistributionChart
            data={analytics?.riskDistribution ?? { low: 0, medium: 0, high: 0 }}
            isLoading={analyticsLoading}
          />
          <AvgScoreChart
            data={analytics?.avgScoreByDay ?? []}
            isLoading={analyticsLoading}
          />
          <PlatformDistributionChart
            data={analytics?.platformDistribution ?? { instagram: 0, youtube: 0 }}
            isLoading={analyticsLoading}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Recent Scans
          </h2>
          <Link href="/reports"
            className="text-sm text-indigo-400 hover:text-indigo-300">
            View all →
          </Link>
        </div>

        {/* Search and filters */}
        <div className="mb-4">
          <ScanSearch
            filters={scanFilters}
            onFiltersChange={setScanFilters}
          />
        </div>

        {scansLoading ? (
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-16 text-center">
            <span className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin inline-block" />
          </div>
        ) : (
          <RecentScansTable scans={scansData?.data ?? []} />
        )}
      </div>
    </div>
  );
}
