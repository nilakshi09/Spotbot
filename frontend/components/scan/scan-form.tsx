'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { UpgradeWall } from '../billing/upgrade-wall';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';

export function ScanForm() {
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const [showUpgradeWall, setShowUpgradeWall] = useState(false);
  const [limitDetails, setLimitDetails] = useState<{used:number,limit:number,plan:string} | null>(null);

  const { data: stats } = useDashboardStats();

  useEffect(() => {
    if (stats?.trial?.isTrialExpired) {
      setLimitDetails({
        used: stats.trial.scansUsed,
        limit: stats.trial.scanLimit,
        plan: stats.planName || 'free',
      });
      setShowUpgradeWall(true);
    }
  }, [stats]);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setIsLoading(true);
    try {
      const data = await apiClient.post<{ id: string }>('/api/scans', {
        platform: 'instagram',
        handle,
      });

      router.push(`/reports/${data.id}`);
    } catch (error: any) {
      if (error instanceof ApiClientError && error.status === 402 && error.error.code === 'SCAN_LIMIT_REACHED') {
        setLimitDetails(error.error.details as any);
        setShowUpgradeWall(true);
        return;
      }
      toast.error(error.message || 'Failed to start scan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleScan} className="flex flex-col gap-4 w-full max-w-md mx-auto mt-8">
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@handle"
          className="px-4 py-3 bg-[#0d1117] border border-white/10 rounded-lg text-white"
        />
        <button
          type="submit"
          disabled={isLoading || (stats?.trial?.isTrialExpired ?? false)}
          className="px-4 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Search className="w-5 h-5" />
          Start Analysis
        </button>
      </form>

      {showUpgradeWall && limitDetails && (
        <UpgradeWall
          used={limitDetails.used}
          limit={limitDetails.limit}
          plan={limitDetails.plan}
          isOpen={showUpgradeWall}
          onDismiss={() => {
            setShowUpgradeWall(false);
            router.back();
          }}
        />
      )}
    </>
  );
}
