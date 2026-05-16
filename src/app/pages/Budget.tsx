import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Check, Edit3, Save, X } from "lucide-react";
import { useFinance, getCategoryMeta } from "../context/FinanceContext";
import { EmptyAnalyticsArt } from "../components/EmptyAnalyticsArt";
import { RightSidebarPortal } from "../context/RightSidebarContext";
import { toast } from "sonner";
import { formatCurrency } from "../../lib/formatters";
import { DateRangeSelector, filterByDateRange } from "../components/DateRangeSelector";
import type { PresetKey, DateRange } from "../components/DateRangeSelector";

export function Budget() {
  const { budgets, transactions, settings, updateBudget } = useFinance();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [datePreset, setDatePreset] = useState<PresetKey>("this_month");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  const filteredExpenses = useMemo(
    () => filterByDateRange(transactions, dateRange).filter((t) => t.type === 'expense'),
    [transactions, dateRange]
  );

  const getFilteredSpent = (category: string) =>
    filteredExpenses.filter((t) => t.category === category).reduce((s, t) => s + t.amount, 0);

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + getFilteredSpent(b.category), 0);
  const overallPct = Math.min((totalSpent / totalBudget) * 100, 100);

  const handleSave = (category: string) => {
    const val = parseFloat(editValue);
    if (val > 0) { updateBudget(category, val); toast.success(`${category} budget updated`); }
    setEditingCategory(null);
  };

  const budgetItems = budgets.map((b) => {
    const spent = getFilteredSpent(b.category);
    const pct = Math.min((spent / b.limit) * 100, 100);
    const isOver = spent > b.limit;
    const isWarning = pct >= 80 && !isOver;
    const meta = getCategoryMeta(b.category);
    return { ...b, spent, pct, isOver, isWarning, meta };
  }).sort((a, b) => b.pct - a.pct);

  const overBudgetCount = budgetItems.filter((b) => b.isOver).length;
  const getBarColor = (item: typeof budgetItems[0]) => item.isOver ? "var(--danger)" : item.isWarning ? "var(--warning)" : item.meta.color;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <motion.h1 className="text-text-primary" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>Budget</motion.h1>
          <motion.p className="text-text-tertiary text-sm mt-0.5" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>Stay on track with your spending goals</motion.p>
        </div>
        <DateRangeSelector
          value={datePreset}
          onChange={(key, range) => { setDatePreset(key); setDateRange(range); }}
        />
      </div>

      {/* Right Sidebar Portal for Budget Context */}
      <RightSidebarPortal>
        <div className="p-5 space-y-6">
          <div className="space-y-4">
            <h3 className="text-text-primary text-[13px] font-medium border-b border-border-subtle pb-2">
              Overall Status
            </h3>
            <div className="rounded-xl border border-border-subtle bg-surface-overlay p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[12px] text-text-quaternary uppercase tracking-wide">Total Budget</p>
                  <p className="text-xl text-text-primary tracking-tight mt-1">{formatCurrency(totalSpent, settings.currency)} <span className="text-sm text-text-quaternary">/ {formatCurrency(totalBudget, settings.currency)}</span></p>
                </div>
                <div className="text-right">
                  <p className={`text-xl tracking-tight ${overallPct >= 90 ? "text-danger" : overallPct >= 70 ? "text-warning" : "text-success"}`}>{overallPct.toFixed(0)}%</p>
                  <p className="text-[11px] text-text-quaternary">used</p>
                </div>
              </div>
              <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: overallPct >= 90 ? "var(--danger)" : overallPct >= 70 ? "var(--warning)" : "var(--success)" }} initial={{ width: 0 }} animate={{ width: `${overallPct}%` }} transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }} />
              </div>
              {overBudgetCount > 0 && (
                <motion.div className="flex items-center gap-2 mt-3 text-warning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                  <AlertTriangle size={13} />
                  <span className="text-[12px]">{overBudgetCount} categor{overBudgetCount > 1 ? "ies" : "y"} over budget</span>
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border-subtle">
            <h3 className="text-text-primary text-[13px] font-medium border-b border-border-subtle pb-2">
              Smart Tips
            </h3>
            <div className="space-y-3">
              {["Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings", "Set up alerts when you reach 80% of any category budget", "Review your spending every Sunday — it only takes 2 minutes"].map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px] text-text-tertiary">
                  <Check size={12} className="text-success mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RightSidebarPortal>

      <div className="space-y-2">
        {budgetItems.map((item, i) => (
          <motion.div key={item.category} className={`rounded-lg border p-4 transition-colors ${item.isOver ? "border-danger/20 bg-danger-subtle" : item.isWarning ? "border-warning/15 bg-warning-subtle" : "border-border-subtle bg-surface-overlay"}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.04 }}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ backgroundColor: `${item.meta.color}14` }}>{item.meta.icon}</div>
                <div>
                  <p className="text-[13px] text-text-primary flex items-center gap-2">
                    {item.category}
                    {item.isOver && <span className="text-[10px] px-1.5 py-0.5 rounded bg-danger-subtle text-danger">Over</span>}
                    {item.isWarning && <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning-subtle text-warning">Close</span>}
                  </p>
                  <p className="text-[11px] text-text-quaternary">{formatCurrency(item.spent, settings.currency)} spent</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  {editingCategory === item.category ? (
                    <motion.div key="edit" className="flex items-center gap-1.5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-16 rounded-md bg-surface-active border border-border-default px-2 py-1 text-[12px] text-text-primary text-right focus:outline-none focus:border-primary/30" autoFocus onKeyDown={(e) => { if (e.key === "Enter") handleSave(item.category); if (e.key === "Escape") setEditingCategory(null); }} />
                      <button onClick={() => handleSave(item.category)} className="p-1 rounded-md bg-success-subtle text-success hover:bg-success/25 transition-colors"><Save size={12} /></button>
                      <button onClick={() => setEditingCategory(null)} className="p-1 rounded-md hover:bg-surface-active text-text-quaternary transition-colors"><X size={12} /></button>
                    </motion.div>
                  ) : (
                    <motion.div key="display" className="flex items-center gap-1.5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <span className="text-[12px] text-text-quaternary tabular-nums">{formatCurrency(item.limit, settings.currency)}</span>
                      <button onClick={() => { setEditingCategory(item.category); setEditValue(item.limit.toString()); }} className="p-1 rounded-md hover:bg-surface-active text-text-ghost hover:text-text-tertiary transition-colors"><Edit3 size={12} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: getBarColor(item), opacity: 0.7 }} initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ delay: 0.4 + i * 0.04, duration: 0.7, ease: "easeOut" }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[10px] text-text-ghost">{item.pct.toFixed(0)}% used</span>
              <span className="text-[10px] text-text-ghost">{formatCurrency(Math.max(item.limit - item.spent, 0), settings.currency)} remaining</span>
            </div>
          </motion.div>
        ))}
      </div>

      {totalSpent === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center py-6 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <EmptyAnalyticsArt className="w-48 h-48 text-text-ghost mb-2 opacity-40" />
          <p className="text-[12px] text-text-quaternary mt-1 text-center max-w-[250px]">
            Your budget looks pristine. Log your first expense to see your progress here.
          </p>
        </motion.div>
      )}


    </div>
  );
}
