'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Camera, Play } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { UpgradeWall } from '../billing/upgrade-wall';
import { getLabel } from '@/lib/platform-labels';
import type { Platform } from '@/types/scan';

export function QuickScanInput() {
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [showUpgradeWall, setShowUpgradeWall] = useState(false);
  const [limitDetails, setLimitDetails] = useState<{used:number,limit:number,plan:string} | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    setIsLoading(true);
    try {
      const data = await apiClient.post<{ id: string }>('/api/scans', {
        platform,
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
      <form onSubmit={handleScan} className="flex gap-2 w-full max-w-lg items-center">
        {/* Platform Toggle */}
        <div className="flex rounded-lg border border-white/10 overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setPlatform('instagram')}
            className={`flex items-center justify-center w-9 h-9 transition-colors ${
              platform === 'instagram'
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-[#0d1117] text-muted hover:text-white'
            }`}
            title="Instagram"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setPlatform('youtube')}
            className={`flex items-center justify-center w-9 h-9 border-l border-white/10 transition-colors ${
              platform === 'youtube'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-[#0d1117] text-muted hover:text-white'
            }`}
            title="YouTube"
          >
            <Play className="w-4 h-4" fill={platform === 'youtube' ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Handle Input */}
        <input
          type="text"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder={platform === 'youtube' ? 'youtube_channel' : 'instagram_handle'}
          className="flex-1 px-4 py-2 bg-[#0d1117] border border-white/10 rounded-lg text-white placeholder:text-muted/50 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-cyan-500 text-black font-medium rounded-lg hover:bg-cyan-400 disabled:opacity-50 flex items-center gap-2 shrink-0 transition-colors"
        >
          <Search className="w-4 h-4" />
          Scan
        </button>
      </form>
      
      {showUpgradeWall && limitDetails && (
        <UpgradeWall
          used={limitDetails.used}
          limit={limitDetails.limit}
          plan={limitDetails.plan}
          onDismiss={() => setShowUpgradeWall(false)}
        />
      )}
    </>
  );
}
