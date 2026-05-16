import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Cpu, AlertTriangle } from "lucide-react";
import { getTokenUsage } from "../../lib/aiService";

export function TokenBudget() {
  const [usage, setUsage] = useState({ used: 0, limit: 1000000, monthYear: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTokenUsage().then((u) => {
      setUsage(u);
      setLoading(false);
    });
  }, []);

  const pct = (usage.used / usage.limit) * 100;
  const isWarning = pct >= 80;
  const isDanger = pct >= 95;
  const barColor = isDanger ? "bg-danger" : isWarning ? "bg-warning" : "bg-primary";

  const monthLabel = usage.monthYear
    ? new Date(usage.monthYear + "-01").toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : "This month";

  return (
    <div className="space-y-4">
      <h3 className="text-text-primary text-[13px] font-medium border-b border-border-subtle pb-2 flex items-center gap-2">
        <Cpu size={15} className="text-primary" /> AI Usage
      </h3>
      <div className="rounded-xl border border-border-subtle bg-surface-overlay p-4 space-y-3">
        {loading ? (
          <div className="space-y-2">
            <div className="h-3 w-20 bg-surface-active rounded animate-pulse" />
            <div className="h-2 w-full bg-surface-active rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-text-tertiary">{monthLabel}</span>
              <span className={`text-[12px] font-medium tabular-nums ${isDanger ? "text-danger" : isWarning ? "text-warning" : "text-text-primary"}`}>
                {(usage.used / 1000).toFixed(1)}K / {(usage.limit / 1000).toFixed(0)}K
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-active overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${barColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-ghost">{pct.toFixed(1)}% used</span>
              {(isWarning || isDanger) && (
                <div className="flex items-center gap-1">
                  <AlertTriangle size={10} className={isDanger ? "text-danger" : "text-warning"} />
                  <span className={`text-[10px] ${isDanger ? "text-danger" : "text-warning"}`}>
                    {isDanger ? "Near limit" : "High usage"}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[10px] text-text-ghost leading-relaxed">
              Tokens power AI features like insights, coaching, and anomaly detection. Resets monthly.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
