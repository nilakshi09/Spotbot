'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { BadgeCheck } from 'lucide-react';
import { PlatformBadge } from '@/components/ui/platform-badge';
import { getLabel } from '@/lib/platform-labels';
import type { ScanProfile, Platform } from '@/types/scan';

interface ProfileSummaryProps {
  profile: ScanProfile;
  platform: Platform;
  handle: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const riskColors: Record<string, string> = {
  LOW: 'bg-green-500/20 text-green-400 border-green-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function ProfileSummary({
  profile,
  platform,
  handle,
  riskLevel,
}: ProfileSummaryProps) {
  const isYouTube = platform === 'youtube';

  const stats = isYouTube
    ? [
        { label: getLabel(platform, 'followers'), value: profile.followers },
        { label: getLabel(platform, 'posts'), value: profile.posts },
        {
          label: 'Total Views',
          value: profile.extraData?.totalViews ?? 0,
        },
      ]
    : [
        { label: getLabel(platform, 'followers'), value: profile.followers },
        { label: getLabel(platform, 'following'), value: profile.following },
        { label: getLabel(platform, 'posts'), value: profile.posts },
      ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative bg-[#0d1117] border border-white/10 rounded-2xl p-6"
    >
      {/* Risk level badge */}
      {riskLevel && (
        <span
          className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full border ${riskColors[riskLevel]}`}
        >
          {riskLevel} RISK
        </span>
      )}

      {/* Profile header */}
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <Image
          src={profile.profilePictureUrl}
          alt={profile.displayName}
          width={80}
          height={80}
          className="w-20 h-20 rounded-full object-cover border-2 border-white/10 flex-shrink-0"
        />

        <div className="min-w-0 flex-1">
          {/* Name + verified */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white font-[family-name:var(--font-space-grotesk)] truncate">
              {profile.displayName}
            </h2>
            {profile.isVerified && (
              <BadgeCheck className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            )}
          </div>

          {/* Handle + platform badge */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-[#8899aa]">@{handle}</span>
            <PlatformBadge platform={platform} size="sm" />
          </div>

          {/* Category */}
          {profile.category && (
            <span className="inline-block mt-2 text-xs text-[#8899aa] bg-white/5 px-2.5 py-0.5 rounded-full">
              {profile.category}
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="text-center bg-white/5 rounded-xl py-3 px-2"
          >
            <p className="text-lg font-bold text-white font-[family-name:var(--font-space-grotesk)]">
              {formatNumber(stat.value)}
            </p>
            <p className="text-xs text-[#8899aa] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="mt-4 text-sm text-[#8899aa] leading-relaxed line-clamp-2">
          {profile.bio}
        </p>
      )}
    </motion.div>
  );
}
