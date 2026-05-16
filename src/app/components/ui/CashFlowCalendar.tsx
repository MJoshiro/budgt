import React, { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useFinance } from "../../context/FinanceContext";

export function CashFlowCalendar() {
  const { transactions, settings } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fast O(1) Dictionary Lookup for the Cash Flow Grid
  const dailyFlowMap = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((tx) => {
      const existing = map.get(tx.date) || 0;
      map.set(tx.date, tx.type === "expense" ? existing - tx.amount : existing + tx.amount);
    });
    return map;
  }, [transactions]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: settings.currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full rounded-2xl border border-border-subtle bg-surface-base overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface-raised">
        <h3 className="text-text-primary text-base font-serif tracking-tight">
          {format(currentDate, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1 bg-surface-overlay p-0.5 rounded-lg border border-border-subtle">
          <button
            onClick={prevMonth}
            className="p-1 rounded-md hover:bg-surface-hover text-text-tertiary hover:text-text-primary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-2 py-1 text-[11px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-md transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-1 rounded-md hover:bg-surface-hover text-text-tertiary hover:text-text-primary transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-[10px] font-medium text-text-quaternary uppercase tracking-wider pb-2"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 md:gap-2">
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const netFlow = dailyFlowMap.get(dateStr) || 0;
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isCurrentDay = isToday(day);

            let bgClass = "bg-surface-overlay border-border-subtle";
            let textClass = "text-text-primary";
            let icon = null;

            if (netFlow > 0) {
              bgClass = "bg-success/10 ring-1 ring-success/30 border-transparent hover:bg-success/20";
              textClass = "text-success";
              icon = <TrendingUp size={12} className="text-success ml-auto" strokeWidth={2.5} />;
            } else if (netFlow < 0) {
              bgClass = "bg-danger/10 ring-1 ring-danger/30 border-transparent hover:bg-danger/20";
              textClass = "text-danger";
              icon = <TrendingDown size={12} className="text-danger ml-auto" strokeWidth={2.5} />;
            } else {
              icon = <Minus size={12} className="text-text-quaternary opacity-50 ml-auto" strokeWidth={2.5} />
            }

            if (!isCurrentMonth) {
              bgClass = "bg-transparent border-transparent opacity-30 select-none";
              textClass = "text-text-ghost";
            }

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={isCurrentMonth ? { scale: 1.05, zIndex: 10 } : {}}
                className={`relative flex flex-col justify-between p-2 md:p-2.5 rounded-lg border transition-all aspect-square md:aspect-auto md:h-20 ${bgClass}`}
              >
                <div className="flex w-full items-start justify-between">
                  {isCurrentDay ? (
                    <div className="bg-primary text-primary-foreground w-5 h-5 flex items-center justify-center rounded-full shadow-sm text-[12px] font-bold">
                       {format(day, "d")}
                    </div>
                  ) : (
                    <span className={`text-[12px] font-medium ${isCurrentMonth ? "text-text-primary" : "text-text-ghost"}`}>
                      {format(day, "d")}
                    </span>
                  )}
                  {isCurrentMonth && icon}
                </div>
                
                {isCurrentMonth && netFlow !== 0 && (
                  <div className="w-full text-right mt-1 md:mt-auto overflow-hidden">
                    <span className={`text-[9px] sm:text-[11px] font-medium truncate block ${textClass}`}>
                      {netFlow > 0 ? "+ " : "- "}
                      {formatCurrency(Math.abs(netFlow))}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
