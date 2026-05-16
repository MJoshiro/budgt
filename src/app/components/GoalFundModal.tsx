import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Minus } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../../lib/formatters";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  goalId: string;
  goalName: string;
  currentAmount: number;
  targetAmount: number;
}

export function GoalFundModal({ open, onClose, goalId, goalName, currentAmount, targetAmount }: Props) {
  const { fundGoal, settings } = useFinance();
  const [mode, setMode] = useState<"add" | "withdraw">("add");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast.error("Enter a valid amount"); return; }

    if (mode === "withdraw" && val > currentAmount) {
      toast.error("Cannot withdraw more than current amount");
      return;
    }

    fundGoal(goalId, mode === "add" ? val : -val);
    toast.success(mode === "add" ? `Added ${formatCurrency(val, settings.currency)} to ${goalName}` : `Withdrew ${formatCurrency(val, settings.currency)} from ${goalName}`);
    onClose();
  };

  const remaining = targetAmount - currentAmount;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-sm rounded-xl border border-border-default bg-surface-raised p-6 shadow-2xl"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-text-primary text-base">{goalName}</h2>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-hover text-text-tertiary">
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-1.5 rounded-lg bg-surface-overlay p-0.5 border border-border-subtle mb-4">
              <button
                type="button"
                onClick={() => setMode("add")}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[13px] transition-colors ${mode === "add" ? "text-text-primary" : "text-text-quaternary"}`}
              >
                {mode === "add" && <motion.div className="absolute inset-0 rounded-md bg-success-subtle" layoutId="fundToggle" />}
                <Plus size={14} className="relative z-10" />
                <span className="relative z-10">Add Funds</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("withdraw")}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[13px] transition-colors ${mode === "withdraw" ? "text-text-primary" : "text-text-quaternary"}`}
              >
                {mode === "withdraw" && <motion.div className="absolute inset-0 rounded-md bg-danger-subtle" layoutId="fundToggle" />}
                <Minus size={14} className="relative z-10" />
                <span className="relative z-10">Withdraw</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-text-quaternary mb-1.5">
                  <span>Current: {formatCurrency(currentAmount, settings.currency)}</span>
                  <span>Remaining: {formatCurrency(Math.max(0, remaining), settings.currency)}</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  className="w-full rounded-lg bg-surface-overlay border border-border-default px-3.5 py-2.5 text-text-primary text-xl placeholder:text-text-ghost focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {mode === "add" && remaining > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(remaining.toFixed(2))}
                  className="text-[11px] text-primary hover:underline"
                >
                  Fill remaining ({formatCurrency(remaining, settings.currency)})
                </button>
              )}

              <motion.button
                type="submit"
                className={`w-full rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors ${
                  mode === "add"
                    ? "bg-success text-white hover:bg-success/90"
                    : "bg-danger text-white hover:bg-danger/90"
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {mode === "add" ? <Plus size={16} /> : <Minus size={16} />}
                {mode === "add" ? "Add funds" : "Withdraw"}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
