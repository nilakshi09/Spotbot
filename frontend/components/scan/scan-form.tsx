'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Camera, Play } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { UpgradeWall } from '../billing/upgrade-wall';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { getLabel } from '@/lib/platform-labels';
import type { Platform } from '@/types/scan';

export function ScanForm() {
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const [showUpgradeWall, setShowUpgradeWall] = useState(false);
  const [limitDetails, setLimitDetails] = useState<{used:number,limit:number,plan:string} | null>(null);

  const { data: stats } = useDashboardStats();

  useEffect(() => {
    if (stats?.trial?.isTrialExpired) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Trigger modal when stats load
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
      const data = await apiClient.post<{ id?: string; scan?: { id: string }; data?: { id: string } }>('/api/scans', {
        platform,
        handle,
      });

      const scanId = data?.id || data?.scan?.id || data?.data?.id;
      if (!scanId) {
        toast.error('Invalid response from server: Missing scan ID');
        return;
      }

      router.push(`/scan/${scanId}`);
    } catch (error: unknown) {
      if (error instanceof ApiClientError && error.status === 402 && error.error.code === 'SCAN_LIMIT_REACHED') {
        setLimitDetails(error.error.details as { used: number, limit: number, plan: string });
        setShowUpgradeWall(true);
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Failed to start scan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleScan} className="flex flex-col gap-6 w-full max-w-md mx-auto mt-8">
        {/* Platform Selector */}
        <div>
          <label className="block text-sm font-medium text-muted mb-3">Platform</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPlatform('instagram')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                platform === 'instagram'
                  ? 'border-indigo-500 bg-indigo-500/10 text-white'
                  : 'border-white/10 bg-[#0d1117] text-muted hover:border-white/20 hover:text-white'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span className="font-medium">Instagram</span>
            </button>
            <button
              type="button"
              onClick={() => setPlatform('youtube')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                platform === 'youtube'
                  ? 'border-red-500 bg-red-500/10 text-white'
                  : 'border-white/10 bg-[#0d1117] text-muted hover:border-white/20 hover:text-white'
              }`}
            >
              <Play className="w-5 h-5" fill={platform === 'youtube' ? 'currentColor' : 'none'} />
              <span className="font-medium">YouTube</span>
            </button>
          </div>
        </div>

        {/* Handle Input */}
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            {getLabel(platform, 'handleLabel')}
          </label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={`@${getLabel(platform, 'handlePlaceholder')}`}
            className="w-full px-4 py-3 bg-[#0d1117] border border-white/10 rounded-lg text-white placeholder:text-muted/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || (stats?.trial?.isTrialExpired ?? false)}
          className="px-4 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          <Search className="w-5 h-5" />
          {isLoading ? 'Analyzing...' : getLabel(platform, 'scanButtonText')}
        </button>

        {/* Info row */}
        <p className="text-xs text-muted text-center">
          ⚡ Results in under {platform === 'youtube' ? '45' : '30'} seconds
        </p>
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
