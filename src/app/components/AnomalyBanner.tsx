import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Info, X, Lightbulb } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { useAuth } from "../context/AuthContext";
import supabase from "../../lib/supabase";
import { fetchAnomalyExplanation, type AnomalyData, type AnomalyExplanation } from "../../lib/aiService";

const CACHE_KEY = "ai_anomalies";
const CACHE_HASH_KEY = "ai_anomalies_hash";

export function AnomalyBanner() {
  const { transactions } = useFinance();
  const { user } = useAuth();
  const [anomalies, setAnomalies] = useState<AnomalyExplanation[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [loaded, setLoaded] = useState(false);

  // State hash for cache invalidation
  const computeHash = () => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStr = weekStart.toISOString().split("T")[0];
    const weekExpenses = transactions
      .filter((t) => t.date >= weekStr && t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return `${weekStr}|${weekExpenses.toFixed(0)}`;
  };

  useEffect(() => {
    if (!user || loaded) return;

    const currentHash = computeHash();
    const cachedHash = localStorage.getItem(CACHE_HASH_KEY);
    const cached = localStorage.getItem(CACHE_KEY);

    if (cached && cachedHash === currentHash) {
      setAnomalies(JSON.parse(cached));
      setLoaded(true);
      return;
    }

    // Call Postgres RPC for anomaly detection
    const detectAnomalies = async () => {
      try {
        const { data: rpcData, error } = await supabase.rpc("calculate_anomalies", { p_user_id: user.id });

        if (error) {
          console.warn("Anomaly RPC failed:", error);
          setLoaded(true);
          return;
        }

        if (!rpcData || rpcData.length === 0) {
          setAnomalies([]);
          localStorage.setItem(CACHE_KEY, "[]");
          localStorage.setItem(CACHE_HASH_KEY, currentHash);
          setLoaded(true);
          return;
        }

        // Send flagged anomalies to Gemini for human explanation
        const anomalyData: AnomalyData[] = rpcData.map((r: any) => ({
          category: r.category,
          current_week_total: parseFloat(r.current_week_total),
          avg_weekly: parseFloat(r.avg_weekly),
          z_score: parseFloat(r.z_score),
        }));

        const explanations = await fetchAnomalyExplanation(anomalyData);
        setAnomalies(explanations);
        localStorage.setItem(CACHE_KEY, JSON.stringify(explanations));
        localStorage.setItem(CACHE_HASH_KEY, currentHash);
      } catch (err) {
        console.warn("Anomaly detection failed:", err);
      }
      setLoaded(true);
    };

    detectAnomalies();
  }, [user, transactions.length]);

  const visibleAnomalies = anomalies.filter((_, i) => !dismissed.has(i));

  if (visibleAnomalies.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {anomalies.map((a, i) => {
          if (dismissed.has(i)) return null;
          const isWarning = a.severity === "warning";
          return (
            <motion.div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                isWarning
                  ? "bg-warning-subtle border-warning/20"
                  : "bg-primary-subtle border-primary/15"
              }`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {isWarning ? (
                <AlertTriangle size={14} className="text-warning shrink-0 mt-0.5" strokeWidth={1.5} />
              ) : (
                <Info size={14} className="text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] leading-relaxed ${isWarning ? "text-warning" : "text-primary"}`}>{a.message}</p>
                {a.tip && (
                  <div className="flex gap-1.5 items-start mt-1.5 pt-1.5 border-t border-border-subtle/30">
                    <Lightbulb size={12} className="text-text-tertiary shrink-0 mt-[1px]" strokeWidth={1.5} />
                    <p className="text-[11px] text-text-tertiary font-medium">{a.tip}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setDismissed((prev) => new Set(prev).add(i))}
                className="p-1 rounded-md hover:bg-surface-active text-text-ghost shrink-0"
              >
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
