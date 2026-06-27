import { Camera, Play } from 'lucide-react';

interface PlatformBadgeProps {
  platform: 'instagram' | 'youtube';
  size?: 'sm' | 'md';
}

export function PlatformBadge({ platform, size = 'md' }: PlatformBadgeProps) {
  const iconSize = size === 'sm' ? 12 : 14;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';

  if (platform === 'youtube') {
    return (
      <span className={`inline-flex items-center gap-1 ${padding} ${textSize}
        bg-red-600 text-white rounded-full font-medium`}>
        <Play size={iconSize} fill="white" />
        YouTube
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 ${padding} ${textSize}
      bg-gradient-to-r from-pink-500 to-purple-600
      text-white rounded-full font-medium`}>
      <Camera size={iconSize} />
      Instagram
    </span>
  );
}
