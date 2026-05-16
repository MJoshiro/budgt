import React, { useState } from "react";
import { motion } from "motion/react";
import { User, DollarSign, Bell, Download, Upload, Palette, Moon, Sun, ChevronRight, Shield, LogOut } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { useAuth } from "../context/AuthContext";
import { RightSidebarPortal } from "../context/RightSidebarContext";
import { ImportModal } from "../components/ImportModal";
import { TokenBudget } from "../components/TokenBudget";
import { SignOutModal } from "../components/SignOutModal";
import { toast } from "sonner";

export function Settings() {
  const { settings, updateSettings, transactions } = useFinance();
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>("profile");
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "PHP"];

  const displayName = settings.name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";

  const handleExport = () => {
    const csv = ["Date,Category,Amount,Type,Description", ...transactions.map((t) => `${t.date},${t.category},${t.amount},${t.type},"${t.description}"`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "untitled-transactions.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  };

  const sections = [
    { id: "profile", icon: User, title: "Profile", description: "Your personal info", colorVar: "var(--primary)", colorSubtle: "var(--primary-subtle)",
      content: (
        <div className="space-y-4">
          <div className="rounded-lg bg-surface-overlay border border-border-subtle p-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-subtle flex items-center justify-center text-lg font-medium text-primary shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
                <p className="text-[12px] text-text-ghost truncate">{displayEmail}</p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-text-quaternary mb-1.5 uppercase tracking-wide">Display Name</label>
            <input type="text" value={settings.name} onChange={(e) => updateSettings({ name: e.target.value })} className="w-full rounded-lg bg-surface-overlay border border-border-default px-3.5 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary/30 transition-all" />
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-success-subtle border border-success/15">
             <Shield size={14} className="text-success" />
             <p className="text-[12px] text-success">Your data is encrypted and stored securely in the cloud</p>
          </div>
        </div>
      ),
    },
    { id: "currency", icon: DollarSign, title: "Currency", description: `Currently ${settings.currency}`, colorVar: "var(--success)", colorSubtle: "var(--success-subtle)",
      content: (
        <div className="grid grid-cols-3 gap-2">
          {currencies.map((c) => (
            <button key={c} onClick={() => { updateSettings({ currency: c }); toast.success(`Currency set to ${c}`); }}
              className={`py-2.5 rounded-lg border text-[13px] transition-all ${settings.currency === c ? "border-primary/30 bg-primary-subtle text-primary" : "border-border-subtle bg-surface-overlay text-text-tertiary hover:bg-surface-hover"}`}>{c}</button>
          ))}
        </div>
      ),
    },
    { id: "notifications", icon: Bell, title: "Notifications", description: settings.notifications ? "Enabled" : "Disabled", colorVar: "var(--warning)", colorSubtle: "var(--warning-subtle)",
      content: (
        <div className="space-y-2.5">
          {[{ label: "Push notifications", desc: "Alerts near budget limits", value: settings.notifications, toggle: () => updateSettings({ notifications: !settings.notifications }) },
            { label: "Weekly report", desc: "Summary every Sunday", value: settings.weeklyReport, toggle: () => updateSettings({ weeklyReport: !settings.weeklyReport }) }].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-surface-overlay border border-border-subtle">
              <div><p className="text-[13px] text-text-primary">{item.label}</p><p className="text-[11px] text-text-quaternary">{item.desc}</p></div>
              <button onClick={item.toggle} className={`w-10 h-[22px] rounded-full transition-all relative ${item.value ? "bg-primary" : "bg-switch-background"}`}>
                <motion.div className={`w-4 h-4 rounded-full absolute top-[3px] ${item.value ? "bg-primary-foreground" : "bg-text-tertiary"}`} animate={{ left: item.value ? 21 : 3 }} transition={{ type: "spring", damping: 22, stiffness: 320 }} />
              </button>
            </div>
          ))}
        </div>
      ),
    },
    { id: "theme", icon: Palette, title: "Appearance", description: settings.theme === "dark" ? "Dark" : "Light", colorVar: "var(--chart-4)", colorSubtle: "rgba(123, 110, 184, 0.1)",
      content: (
        <div className="grid grid-cols-2 gap-2.5">
          {[{ key: "dark" as const, label: "Dark", desc: "Easy on the eyes", icon: Moon },
            { key: "light" as const, label: "Light", desc: "Warm & bright", icon: Sun }].map((opt) => (
            <button key={opt.key} onClick={() => updateSettings({ theme: opt.key })}
              className={`flex items-center gap-2.5 p-3.5 rounded-lg border text-left transition-all ${settings.theme === opt.key ? "border-primary/25 bg-primary-subtle" : "border-border-subtle bg-surface-overlay hover:bg-surface-hover"}`}>
              <opt.icon size={16} className={settings.theme === opt.key ? "text-primary" : "text-text-tertiary"} strokeWidth={1.5} />
              <div><p className="text-[13px] text-text-primary">{opt.label}</p><p className="text-[11px] text-text-quaternary">{opt.desc}</p></div>
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <motion.h1 className="text-text-primary" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>Settings</motion.h1>
        <motion.p className="text-text-tertiary text-sm mt-0.5" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>Make the app yours</motion.p>
      </div>
      <div className="space-y-1.5">
        {sections.map((section, i) => (
          <motion.div key={section.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
            <button onClick={() => setActiveSection(activeSection === section.id ? null : section.id)} className="w-full flex items-center justify-between p-3.5 rounded-lg border border-border-subtle bg-surface-overlay hover:bg-surface-hover transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: section.colorSubtle }}><section.icon size={15} style={{ color: section.colorVar }} strokeWidth={1.5} /></div>
                <div><p className="text-[13px] text-text-primary">{section.title}</p><p className="text-[11px] text-text-quaternary">{section.description}</p></div>
              </div>
              <ChevronRight size={14} strokeWidth={1.5} className={`text-text-ghost transition-transform duration-200 ${activeSection === section.id ? "rotate-90" : ""}`} />
            </button>
            <motion.div initial={false} animate={{ height: activeSection === section.id ? "auto" : 0, opacity: activeSection === section.id ? 1 : 0 }} className="overflow-hidden" transition={{ duration: 0.25, ease: "easeInOut" }}>
              <div className="px-4 py-3">{section.content}</div>
            </motion.div>
          </motion.div>
        ))}
      </div>
      
      {/* Right Sidebar Portal for Settings Context */}
      <RightSidebarPortal>
        <div className="p-5 space-y-6">
          <div className="space-y-4">
            <h3 className="text-text-primary text-[13px] font-medium border-b border-border-subtle pb-2 flex items-center gap-2">
              <Download size={15} className="text-success" /> Export Data
            </h3>
            <div className="rounded-xl border border-border-subtle bg-surface-overlay p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] text-text-primary font-medium">{transactions.length} transactions</span>
                <span className="text-[10px] text-text-quaternary px-1.5 py-0.5 rounded bg-surface-active">CSV</span>
              </div>
              <p className="text-[12px] text-text-tertiary leading-relaxed">
                Download all your transactions as a CSV file. Works with Excel, Google Sheets, or any spreadsheet app.
              </p>
              <motion.button 
                onClick={handleExport} 
                className="w-full rounded-lg bg-primary py-2.5 text-primary-foreground text-[13px] flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors mt-2" 
                whileHover={{ scale: 1.01 }} 
                whileTap={{ scale: 0.99 }}
              >
                <Download size={14} strokeWidth={1.5} /> Download
              </motion.button>
            </div>
          </div>

          {/* Import Data */}
          <div className="space-y-4">
            <h3 className="text-text-primary text-[13px] font-medium border-b border-border-subtle pb-2 flex items-center gap-2">
              <Upload size={15} className="text-primary" /> Import Data
            </h3>
            <div className="rounded-xl border border-border-subtle bg-surface-overlay p-4 space-y-3">
              <p className="text-[12px] text-text-tertiary leading-relaxed">
                Import transactions from a CSV file. Map your columns and preview before importing.
              </p>
              <motion.button
                onClick={() => setImportOpen(true)}
                className="w-full rounded-lg border border-primary/30 bg-primary-subtle py-2.5 text-primary text-[13px] flex items-center justify-center gap-2 hover:bg-primary-subtle/80 transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Upload size={14} strokeWidth={1.5} /> Upload CSV
              </motion.button>
            </div>
          </div>

          {/* AI Usage */}
          <TokenBudget />

          <div className="pt-4 border-t border-border-subtle">
            <button onClick={() => setIsSignOutModalOpen(true)} className="flex items-center gap-2 text-[12px] text-text-ghost hover:text-danger transition-colors">
              <LogOut size={13} strokeWidth={1.5} /> Sign out
            </button>
            <p className="text-[11px] text-text-ghost/50 mt-1">{user?.email}</p>
            <p className="text-[11px] text-text-ghost/50 mt-3">untitled; v1.0</p>
          </div>
        </div>
      </RightSidebarPortal>

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <SignOutModal open={isSignOutModalOpen} onOpenChange={setIsSignOutModalOpen} />
    </div>
  );
}
