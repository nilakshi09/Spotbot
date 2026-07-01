'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Circle, AlertTriangle } from 'lucide-react';
import { PlatformBadge } from '@/components/ui/platform-badge';
import { Platform } from '@/types/scan';

interface ScanProgressProps {
  scanId: string;
  handle: string;
  platform: Platform;
  /** Real progress from backend polling (0-based step index). If provided, overrides the timer. */
  stepsCompleted?: number;
}

const YOUTUBE_STEPS = [
  'Fetching channel info',
  'Fetching recent videos',
  'Fetching video comments',
  'Analyzing engagement rate',
  'Analyzing comment quality',
  'Computing fraud score',
];

const INSTAGRAM_STEPS = [
  'Fetching profile',
  'Fetching posts & comments',
  'Analyzing engagement rate',
  'Detecting follower spikes',
  'Analyzing comments',
  'Computing fraud score',
];

const MAX_WAIT_SECONDS = 120; // Show timeout warning after 2 minutes

export default function ScanProgress({ scanId, handle, platform, stepsCompleted }: ScanProgressProps) {
  const [timerStep, setTimerStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const steps = platform === 'youtube' ? YOUTUBE_STEPS : INSTAGRAM_STEPS;

  // Use backend progress if available, otherwise fall back to timer
  const activeStep = stepsCompleted !== undefined
    ? Math.min(stepsCompleted, steps.length - 1)
    : timerStep;

  const hasTimedOut = elapsedSeconds >= MAX_WAIT_SECONDS;

  // Timer-based fallback (only used when backend progress is not available)
  useEffect(() => {
    if (stepsCompleted !== undefined) return; // Backend progress is driving the UI

    const interval = setInterval(() => {
      setTimerStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        return prev; // Stay on last step (don't clearInterval — timeout will handle it)
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [steps.length, stepsCompleted]);

  // Elapsed time tracker for timeout detection
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#0d1117] border border-white/10 rounded-2xl p-8 w-full max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <h2 className="text-white text-lg font-semibold font-[family-name:var(--font-space-grotesk)]">
          Analyzing @{handle}
        </h2>
        <PlatformBadge platform={platform} />
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-white/5 rounded-full h-1.5 mb-8 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${hasTimedOut ? 'bg-red-400' : 'bg-cyan-400'}`}
          initial={{ width: '0%' }}
          animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <AnimatePresence>
          {steps.map((step, index) => {
            const isCompleted = index < activeStep;
            const isActive = index === activeStep;
            const isPending = index > activeStep;

            return (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                  isActive ? (hasTimedOut ? 'bg-red-400/5' : 'bg-cyan-400/5') : ''
                }`}
              >
                {/* Step Icon */}
                <div className="flex-shrink-0">
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Check size={18} className="text-green-400" />
                    </motion.div>
                  )}
                  {isActive && !hasTimedOut && (
                    <Loader2 size={18} className="text-cyan-400 animate-spin" />
                  )}
                  {isActive && hasTimedOut && (
                    <AlertTriangle size={18} className="text-red-400" />
                  )}
                  {isPending && (
                    <Circle size={18} className="text-[#8899aa]" />
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'text-green-400'
                      : isActive
                        ? hasTimedOut ? 'text-red-400' : 'text-cyan-400'
                        : 'text-[#8899aa]'
                  }`}
                >
                  {step}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {hasTimedOut ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-8"
        >
          <p className="text-red-400 text-sm font-medium mb-1">
            This scan is taking longer than expected.
          </p>
          <p className="text-[#8899aa] text-xs">
            The scan is still running in the background. Please refresh the page in a minute or check your reports later.
          </p>
        </motion.div>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-[#8899aa] text-xs mt-8"
        >
          This usually takes 20–30 seconds…
        </motion.p>
      )}
    </motion.div>
  );
}

