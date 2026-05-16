import React, { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Target,
  Crosshair,
  Settings as SettingsIcon,
  Menu,
  X,
  LogOut,
  Wallet,
  WifiOff,
} from "lucide-react";
import { Toaster } from "sonner";
import { FinanceProvider, useFinance } from "../context/FinanceContext";
import { RightSidebarProvider, useRightSidebar } from "../context/RightSidebarContext";
import { useAuth } from "../context/AuthContext";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AppLogoArt } from "../components/ui/CardArt";
import { AccountsProvider } from "../context/AccountsContext";
import { IosInstallPrompt } from "../components/IosInstallPrompt";
import { SignOutModal } from "../components/SignOutModal";
import { BartDrawer } from "../components/BartDrawer";
import { BartArt } from "../components/ui/CardArt";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { path: "/accounts", label: "Accounts", icon: Wallet },
  { path: "/analytics", label: "Analytics", icon: PieChart },
  { path: "/budget", label: "Budget", icon: Target },
  { path: "/goals", label: "Goals", icon: Crosshair },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
];

// old logo removed

function LayoutInner() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { settings, isLoaded } = useFinance();
  const { setSidebarContainer } = useRightSidebar();
  const { user, signOut } = useAuth();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isBartOpen, setIsBartOpen] = useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isLoaded) return null;

  return (
    <div className="flex h-screen bg-surface-base overflow-hidden transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border-subtle bg-surface-inset/90 relative z-10 shrink-0 transition-colors duration-300">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-overlay border border-border-strong flex items-center justify-center shadow-sm">
              <AppLogoArt className="w-6 h-6 text-text-primary" />
            </div>
            <p className="text-text-primary text-xl font-serif tracking-tight pt-1">untitled<span className="text-[#BF4D43]">;</span></p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all relative ${
                  isActive
                    ? "text-text-primary"
                    : "text-text-tertiary hover:text-text-secondary hover:bg-surface-overlay"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-surface-active"
                      layoutId="sidebar-active"
                      transition={{ type: "spring", damping: 30, stiffness: 350 }}
                    />
                  )}
                  <item.icon size={17} className="relative z-10" strokeWidth={1.5} />
                  <span className="relative z-10 text-[13px]">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4 space-y-2">
          <button
            onClick={() => setIsSignOutModalOpen(true)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-text-tertiary hover:text-error hover:bg-error/5 transition-all text-[12px]"
          >
            <LogOut size={14} strokeWidth={1.5} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-surface-base/95 backdrop-blur-lg border-b border-border-subtle transition-colors duration-300 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-surface-overlay border border-border-strong flex items-center justify-center shadow-sm">
               <AppLogoArt className="w-5 h-5 text-text-primary" />
            </div>
            <span className="text-text-primary text-lg font-serif pt-1">untitled<span className="text-[#BF4D43]">;</span></span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-surface-hover text-text-tertiary transition-colors"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden fixed inset-0 z-20 bg-surface-base/98 backdrop-blur-xl pt-[max(env(safe-area-inset-top),4rem)] overflow-y-auto pb-[env(safe-area-inset-bottom)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <nav className="p-4 space-y-1 mt-4">
              {navItems.map((item, i) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3.5 rounded-lg transition-all ${
                        isActive
                          ? "text-text-primary bg-surface-active"
                          : "text-text-tertiary hover:text-text-secondary"
                      }`
                    }
                  >
                    <item.icon size={20} strokeWidth={1.5} />
                    <span>{item.label}</span>
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            {/* Mobile sign out */}
            <div className="px-4 mt-4 pt-4 border-t border-border-subtle mb-[calc(env(safe-area-inset-bottom)+5rem)]">
              <button
                onClick={() => { setMobileMenuOpen(false); setIsSignOutModalOpen(true); }}
                className="flex items-center gap-3 px-4 py-3.5 rounded-lg text-text-tertiary hover:text-error transition-all w-full"
              >
                <LogOut size={20} strokeWidth={1.5} />
                <span>Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-inset/95 backdrop-blur-lg border-t border-border-subtle transition-colors duration-300 pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] px-1">
        <div className="flex items-center justify-between w-full py-1.5 pt-2">
          {navItems
            .filter(item => item.path !== "/settings")
            .map((item) => {
            const exactActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);
            return (
              <div key={item.path} className="flex-1 flex justify-center">
                <NavLink
                  to={item.path}
                  className="flex flex-col items-center justify-center gap-[3px] py-1 px-1 relative w-full h-full"
                >
                  {exactActive && (
                    <motion.div
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-primary"
                      layoutId="mobile-active"
                      transition={{ type: "spring", damping: 30, stiffness: 350 }}
                    />
                  )}
                  <item.icon
                    size={19}
                    strokeWidth={1.5}
                    className={exactActive ? "text-primary stroke-[1.8px]" : "text-text-ghost"}
                  />
                  <span
                    className={`text-[9.5px] tracking-tight leading-none ${
                      exactActive ? "text-primary font-medium" : "text-text-ghost font-normal"
                    }`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content (Center) */}
      <main className="flex-1 overflow-auto relative z-10 flex flex-col pt-[calc(3.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))] md:pt-0 md:pb-0 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] md:px-0">
        {/* Offline Banner */}
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-warning-subtle border-b border-warning/20 overflow-hidden"
            >
              <div className="flex items-center justify-center gap-2 py-1.5 px-4 text-warning text-[11px] font-medium tracking-wide">
                <WifiOff size={12} strokeWidth={2.5} />
                <span>You are offline. Changes will sync when reconnected.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mx-auto p-4 md:px-8 md:py-6 max-w-[1400px] w-full flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bart Floating Entry Point */}
      <button 
        onClick={() => setIsBartOpen(true)}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-8 right-5 md:right-8 z-40 w-[52px] h-[52px] bg-surface-raised border border-border-strong rounded-[18px] shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 hover:shadow-xl hover:border-primary/50 transition-all duration-300 group overflow-visible"
        aria-label="Chat with Bart AI"
      >
        <div className="absolute inset-0 bg-primary-subtle opacity-0 group-hover:opacity-100 transition-opacity rounded-[18px]" />
        <BartArt state="idle" className="w-[140%] h-[140%] text-primary absolute -bottom-1 drop-shadow-sm group-hover:-translate-y-1 transition-transform duration-300" />
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-success border-2 border-surface-raised rounded-full shadow-sm animate-pulse" />
      </button>

      {/* Right Contextual Sidebar */}
      <aside 
        ref={setSidebarContainer}
        className="hidden xl:flex flex-col w-[320px] 2xl:w-[380px] border-l border-border-subtle bg-surface-base/50 relative z-10 shrink-0 overflow-y-auto"
      />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--surface-raised)",
            border: "1px solid var(--border-default)",
            color: "var(--text-primary)",
            borderRadius: "8px",
            fontSize: "13px",
          },
        }}
      />
      
      <IosInstallPrompt />
      <SignOutModal open={isSignOutModalOpen} onOpenChange={setIsSignOutModalOpen} />
      <BartDrawer open={isBartOpen} onOpenChange={setIsBartOpen} />
    </div>
  );
}

export function AppLayout() {
  return (
    <ProtectedRoute>
      <AccountsProvider>
        <FinanceProvider>
          <RightSidebarProvider>
            <LayoutInner />
          </RightSidebarProvider>
        </FinanceProvider>
      </AccountsProvider>
    </ProtectedRoute>
  );
}
