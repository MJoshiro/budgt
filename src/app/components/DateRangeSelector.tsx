import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, ChevronDown, X } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  format,
  isWithinInterval,
  parseISO,
} from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

type PresetKey = "this_week" | "this_month" | "last_month" | "this_year" | "all_time";

interface DateRangeSelectorProps {
  value: PresetKey;
  onChange: (key: PresetKey, range: DateRange | null) => void;
  className?: string;
}

// ─── Presets ─────────────────────────────────────────────────────────

const getPresets = (): Record<PresetKey, { label: string; range: DateRange | null }> => {
  const now = new Date();
  return {
    this_week: {
      label: "This Week",
      range: {
        startDate: startOfWeek(now, { weekStartsOn: 1 }),
        endDate: endOfWeek(now, { weekStartsOn: 1 }),
        label: "This Week",
      },
    },
    this_month: {
      label: "This Month",
      range: {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now),
        label: "This Month",
      },
    },
    last_month: {
      label: "Last Month",
      range: {
        startDate: startOfMonth(subMonths(now, 1)),
        endDate: endOfMonth(subMonths(now, 1)),
        label: "Last Month",
      },
    },
    this_year: {
      label: "This Year",
      range: {
        startDate: startOfYear(now),
        endDate: endOfYear(now),
        label: "This Year",
      },
    },
    all_time: {
      label: "All Time",
      range: null,
    },
  };
};

// ─── Component ───────────────────────────────────────────────────────

export function DateRangeSelector({ value, onChange, className = "" }: DateRangeSelectorProps) {
  const [open, setOpen] = useState(false);
  const presets = useMemo(getPresets, []);

  const currentLabel = presets[value]?.label ?? "All Time";
  const currentRange = presets[value]?.range ?? null;

  // Format subtitle
  const subtitle = currentRange
    ? `${format(currentRange.startDate, "MMM d")} – ${format(currentRange.endDate, "MMM d, yyyy")}`
    : "";

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-overlay border border-border-subtle hover:border-border-default text-text-secondary text-[12px] transition-all"
      >
        <Calendar size={13} strokeWidth={1.5} className="text-text-ghost" />
        <span>{currentLabel}</span>
        {subtitle && (
          <span className="text-text-ghost hidden sm:inline">· {subtitle}</span>
        )}
        <ChevronDown size={12} strokeWidth={1.5} className={`text-text-ghost transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1 z-50 bg-surface-raised border border-border-subtle rounded-lg shadow-xl py-1 min-w-[160px]"
            >
              {(Object.keys(presets) as PresetKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    onChange(key, presets[key].range);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${
                    key === value
                      ? "text-primary bg-primary/5"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  }`}
                >
                  {presets[key].label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helper: filter transactions by date range ───────────────────────

export function filterByDateRange<T extends { date: string }>(
  items: T[],
  range: DateRange | null
): T[] {
  if (!range) return items;
  return items.filter((item) => {
    const d = parseISO(item.date);
    return isWithinInterval(d, { start: range.startDate, end: range.endDate });
  });
}

export type { PresetKey };
