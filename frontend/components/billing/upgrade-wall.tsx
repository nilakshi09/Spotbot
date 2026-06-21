'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { AlertTriangle, Check, ArrowRight, X } from 'lucide-react';

interface UpgradeWallProps {
  used: number;
  limit: number;
  plan: string;
  onDismiss?: () => void;
  isOpen?: boolean;
}

export function UpgradeWall({ used, limit, plan, onDismiss, isOpen = true }: UpgradeWallProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onDismiss) {
      onDismiss();
    } else {
      router.back();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleBack()}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
              >
                <Dialog.Content asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                    className="relative bg-zinc-900 border border-zinc-800 shadow-2xl rounded-2xl w-full max-w-2xl p-6 sm:p-8 my-8 focus:outline-none"
                  >
                    {onDismiss && (
                      <Dialog.Close asChild>
                        <button className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors">
                          <X className="h-5 w-5" />
                        </button>
                      </Dialog.Close>
                    )}

                    <div className="text-center mb-8">
                      <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      </div>
                      <Dialog.Title className="text-2xl font-bold text-white mb-2">
                        Scan Limit Reached
                      </Dialog.Title>
                      <Dialog.Description className="text-zinc-400">
                        You've used all {limit} scans on the {plan.charAt(0).toUpperCase() + plan.slice(1)} plan this month.
                      </Dialog.Description>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {/* Free Plan (Current) */}
                      <div className="bg-zinc-800/30 border border-zinc-800 rounded-xl p-5 flex flex-col opacity-60 grayscale relative overflow-hidden">
                        <div className="text-sm font-semibold text-zinc-400 mb-1">Free</div>
                        <div className="text-2xl font-bold text-white mb-1">$0<span className="text-sm font-normal text-zinc-500">/mo</span></div>
                        <div className="text-xs text-zinc-500 mb-4">5 scans/mo</div>
                        <ul className="text-xs text-zinc-400 space-y-2 flex-1 mb-4">
                          <li className="flex gap-2"><Check className="h-3.5 w-3.5 shrink-0" /> Basic Analysis</li>
                        </ul>
                        <div className="text-center text-xs text-zinc-500 font-medium py-2 bg-zinc-800/50 rounded-lg">Current Plan</div>
                      </div>

                      {/* Starter Plan */}
                      <div className="bg-blue-900/10 border-2 border-blue-500 rounded-xl p-5 flex flex-col relative transform scale-105 z-10 shadow-lg shadow-blue-900/20">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Most Popular
                        </div>
                        <div className="text-sm font-semibold text-blue-400 mb-1">Starter</div>
                        <div className="text-2xl font-bold text-white mb-1">$49<span className="text-sm font-normal text-zinc-500">/mo</span></div>
                        <div className="text-xs text-zinc-400 mb-4">100 scans/mo</div>
                        <ul className="text-xs text-zinc-300 space-y-2 flex-1 mb-4">
                          <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-blue-400 shrink-0" /> Deep Fraud Analysis</li>
                          <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-blue-400 shrink-0" /> PDF Reports</li>
                        </ul>
                        <Link 
                          href="/billing?plan=starter" 
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          Upgrade <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>

                      {/* Pro Plan */}
                      <div className="bg-purple-900/10 border border-purple-500/30 rounded-xl p-5 flex flex-col">
                        <div className="text-sm font-semibold text-purple-400 mb-1">Pro</div>
                        <div className="text-2xl font-bold text-white mb-1">$149<span className="text-sm font-normal text-zinc-500">/mo</span></div>
                        <div className="text-xs text-zinc-400 mb-4">500 scans/mo</div>
                        <ul className="text-xs text-zinc-300 space-y-2 flex-1 mb-4">
                          <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-purple-400 shrink-0" /> Bulk Scanning</li>
                          <li className="flex gap-2"><Check className="h-3.5 w-3.5 text-purple-400 shrink-0" /> API Access</li>
                        </ul>
                        <Link 
                          href="/billing?plan=pro" 
                          className="w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center border border-purple-500/30"
                        >
                          Choose Pro
                        </Link>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-zinc-800 gap-4">
                      <button 
                        onClick={handleBack}
                        className="text-sm text-zinc-400 hover:text-white transition-colors"
                      >
                        Go Back
                      </button>
                      <Link 
                        href="/billing"
                        className="text-sm text-white hover:text-blue-400 transition-colors flex items-center gap-1 font-medium"
                      >
                        See All Plans <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                  </motion.div>
                </Dialog.Content>
              </motion.div>
            </Dialog.Overlay>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
