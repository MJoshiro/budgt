import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, PlusSquare, X } from 'lucide-react';
import { AppLogoArt } from './ui/CardArt';

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Detect Safari (Chrome on iOS has 'crios', Firefox has 'fxios')
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|crmo|fxios/.test(userAgent);

    // Detect if already installed (standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    if (isIosDevice && isSafari && !isStandaloneMode) {
      const hasDismissed = localStorage.getItem('ios-install-prompt-dismissed');
      if (!hasDismissed) {
        // Delay to not be instantly aggressive
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 right-4 z-[100] p-4 bg-surface-overlay/95 backdrop-blur-xl border border-border-strong rounded-2xl shadow-xl flex flex-col gap-3"
        >
          <button 
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-text-tertiary hover:text-text-primary transition-colors p-1"
            aria-label="Dismiss"
          >
            <X size={16} strokeWidth={2} />
          </button>
          
          <div className="flex gap-3 items-start pr-6">
            <div className="w-12 h-12 rounded-xl bg-surface-base border border-border-subtle flex items-center justify-center shrink-0 shadow-sm">
              <AppLogoArt className="w-7 h-7 text-text-primary" />
            </div>
            
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-text-primary text-[15px]">Install untitled;</h3>
              <p className="text-[13px] text-text-secondary leading-snug">
                Install this app on your iPhone for a better, full-screen experience and offline access.
              </p>
            </div>
          </div>
          
          <div className="mt-2 text-[13px] text-text-secondary flex flex-col gap-2.5 bg-surface-base p-3.5 rounded-xl border border-border-subtle">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-active text-text-primary text-xs font-semibold">1</span>
              <span>Tap the <Share size={15} strokeWidth={2.5} className="inline mx-0.5 text-primary" /> Share button on the toolbar.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-surface-active text-text-primary text-xs font-semibold">2</span>
              <span>Select <span className="font-medium text-text-primary">Add to Home Screen</span> <PlusSquare size={15} strokeWidth={2.5} className="inline mx-0.5 text-text-primary" />.</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
