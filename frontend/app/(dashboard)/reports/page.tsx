"use client";

import { useState, useEffect } from "react";
import { FileText, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api-client";
import RecentScansTable from "@/components/dashboard/recent-scans-table";
import type { ScanListItem, Platform } from "@/types/scan";

export default function ReportsPage() {
  const [scans, setScans] = useState<ScanListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all');

  useEffect(() => {
    let mounted = true;

    const fetchScans = async () => {
      try {
        const params = platformFilter !== 'all' ? `?platform=${platformFilter}` : '';
        const data = await apiClient.get<{ scans: ScanListItem[] }>(`/api/scans${params}`);
        if (mounted) {
          setScans(data.scans || []);
          setIsLoading(false);
        }
      } catch {
        if (mounted) {
          setScans([]);
          setIsLoading(false);
        }
      }
    };

    fetchScans();
    return () => { mounted = false; };
  }, [platformFilter]);

  return (
    <div className="max-w-5xl mx-auto pt-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-white">
              Reports
            </h1>
            <p className="text-muted text-sm">View history of scanned handles</p>
          </div>
        </div>

        {/* Platform Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted" />
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as 'all' | Platform)}
            className="bg-[#0d1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {isLoading ? (
          <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-16 text-center">
            <span className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin inline-block" />
          </div>
        ) : (
          <RecentScansTable scans={scans} />
        )}
      </motion.div>
    </div>
  );
}
