import React, { useMemo } from "react";
import { motion } from "motion/react";
import { Zap, CalendarClock } from "lucide-react";
import { useFinance, getCategoryMeta } from "../context/FinanceContext";
import { formatCurrency } from "../../lib/formatters";
import { SketchBorder } from "./ui/SketchyBorder";

export function UpcomingBills() {
  const { transactions, settings } = useFinance();

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return transactions
      .filter(
        (t) =>
          t.is_recurring &&
          t.recurrence_next_date &&
          t.type === "expense" &&
          t.recurrence_next_date >= today
      )
      .sort((a, b) => (a.recurrence_next_date || "").localeCompare(b.recurrence_next_date || ""))
      .slice(0, 5);
  }, [transactions]);

  const getDaysUntil = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + "T00:00:00");
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getUrgencyColor = (days: number) => {
    if (days <= 3) return "text-danger";
    if (days <= 7) return "text-warning";
    return "text-text-quaternary";
  };

  if (upcoming.length === 0) return null;

  return (
    <motion.div
      className="group relative w-full h-full min-h-[220px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Background Fill + Shadow */}
      <div className="absolute inset-[3px] rounded-[4px] bg-surface-overlay shadow-[3px_4px_0px_0px_rgba(19,19,19,0.3)] transition-all duration-300 group-hover:shadow-[5px_6px_0px_0px_rgba(19,19,19,0.4)] group-hover:scale-[1.01]" />
      
      <SketchBorder seed={55} w={350} h={300} strokeWidth={3.5} />
      
      <div className="relative z-10 flex flex-col h-full w-full p-5 overflow-hidden rounded-[4px] pointer-events-auto">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock size={15} className="text-warning" strokeWidth={1.5} />
        <h3 className="text-[13px] text-text-primary font-medium">Upcoming Bills</h3>
      </div>
      <div className="space-y-2">
        {upcoming.map((tx) => {
          const meta = getCategoryMeta(tx.category);
          const days = getDaysUntil(tx.recurrence_next_date!);
          const urgency = getUrgencyColor(days);
          return (
            <div
              key={tx.id}
              className="flex items-center justify-between py-1.5"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: meta.color + "18" }}
                >
                  <span className="text-[13px]" style={{ color: meta.color }}>
                    {meta.icon}
                  </span>
                </div>
                <div>
                  <p className="text-[12px] text-text-primary leading-tight truncate max-w-[140px]">
                    {tx.description || tx.category}
                  </p>
                  <p className={`text-[10px] ${urgency}`}>
                    {days === 0
                      ? "Due today"
                      : days === 1
                      ? "Due tomorrow"
                      : `in ${days} days`}
                  </p>
                </div>
              </div>
              <span className="text-[12px] text-text-primary tabular-nums">
                {formatCurrency(tx.amount, settings.currency)}
              </span>
            </div>
          );
        })}
      </div>
      </div>
    </motion.div>
  );
}
