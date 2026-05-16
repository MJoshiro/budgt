import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, LogOut } from 'lucide-react';
import { SignOutArt } from './ui/CardArt';
import { useAuth } from '../context/AuthContext';

interface SignOutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutModal({ open, onOpenChange }: SignOutModalProps) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      onOpenChange(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-[50%] top-[50%] z-50 w-[90vw] max-w-sm translate-x-[-50%] translate-y-[-50%] rounded-xl bg-surface-base border border-border-strong shadow-xl flex flex-col overflow-hidden"
              >
                {/* SVG Header Area */}
                <div className="relative h-32 bg-surface-overlay flex items-center justify-center border-b border-border-subtle overflow-hidden">
                  <SignOutArt className="absolute inset-0 w-full h-full text-text-tertiary opacity-40 scale-150 translate-y-8" />
                  <div className="relative z-10 w-16 h-16 rounded-full bg-surface-base border border-border-strong flex items-center justify-center shadow-sm">
                    <LogOut size={24} className="text-danger" strokeWidth={1.5} />
                  </div>
                  <Dialog.Close asChild>
                    <button className="absolute top-3 right-3 p-1.5 rounded-full bg-surface-base/50 text-text-tertiary hover:text-text-primary hover:bg-surface-active transition-colors">
                      <X size={16} strokeWidth={2} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="p-5 flex flex-col items-center text-center gap-2">
                  <Dialog.Title className="text-lg font-bold text-text-primary font-serif">
                    Sign Out
                  </Dialog.Title>
                  <Dialog.Description className="text-[13px] text-text-secondary leading-snug">
                    Are you sure you want to log out? You will need to enter your credentials to access your data again.
                  </Dialog.Description>
                  
                  <div className="grid grid-cols-2 gap-3 w-full mt-6">
                    <Dialog.Close asChild>
                      <button className="px-4 py-2.5 rounded-lg border border-border-strong bg-surface-overlay text-text-primary text-[13px] font-medium hover:bg-surface-hover transition-colors">
                        Cancel
                      </button>
                    </Dialog.Close>
                    <button 
                      onClick={handleSignOut}
                      className="px-4 py-2.5 rounded-lg bg-danger text-white text-[13px] font-medium hover:bg-[#A64036] transition-colors shadow-sm"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
