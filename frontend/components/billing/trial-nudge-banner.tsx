'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { TrialStatus } from '../../types/scan';

export function TrialNudgeBanner({ trial }: { trial: TrialStatus }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (trial.nudgeLevel === 'urgent') {
      const dismissed = sessionStorage.getItem('trial-nudge-dismissed');
      if (dismissed === 'true') {
        setIsVisible(false);
      }
    }
  }, [trial.nudgeLevel]);

  if (trial.nudgeLevel === 'none' || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem('trial-nudge-dismissed', 'true');
    setIsVisible(false);
  };

  const getBannerContent = () => {
    switch (trial.nudgeLevel) {
      case 'gentle':
        return {
          containerClass: 'bg-amber-400/10 border border-amber-400/20 text-amber-300',
          icon: <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />,
          title: `You've used ${trial.scansUsed} of ${trial.scanLimit} free scans.`,
          subtitle: 'Upgrade to get 100 scans/month.',
          buttonText: 'Upgrade Now →',
          buttonLink: '/billing',
          canDismiss: false,
        };
      case 'urgent':
        return {
          containerClass: 'bg-red-400/10 border border-red-400/20 text-red-300',
          icon: <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />,
          title: '⚠️ Last free scan remaining!',
          subtitle: 'Upgrade now to keep analyzing influencers.',
          buttonText: 'Upgrade to Starter →',
          buttonLink: '/billing',
          canDismiss: true,
        };
      case 'expired':
        return {
          containerClass: 'bg-red-500/20 border border-red-500/30 text-red-200',
          icon: <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />,
          title: "🚨 You've used all your free scans.",
          subtitle: 'Upgrade to continue analyzing influencer audiences.',
          buttonText: 'See Plans →',
          buttonLink: '/billing',
          canDismiss: false,
        };
      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className={`rounded-lg p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${content.containerClass}`}
      >
        <div className="flex items-start gap-3 flex-1">
          {content.icon}
          <div>
            <p className="font-medium text-sm sm:text-base">{content.title}</p>
            <p className="text-sm opacity-80 mt-0.5">{content.subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <Link 
            href={content.buttonLink}
            className="whitespace-nowrap px-4 py-2 rounded-md font-medium text-sm transition-colors w-full sm:w-auto text-center border border-current hover:bg-white/10"
          >
            {content.buttonText}
          </Link>
          
          {content.canDismiss && (
            <button
              onClick={handleDismiss}
              className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
