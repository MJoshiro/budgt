import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit3, Trash2, Target, Plane, Home, GraduationCap, Car, ShoppingBag, Wallet, Heart, TrendingUp } from "lucide-react";
import { useFinance, type SavingsGoal } from "../context/FinanceContext";
import { formatCurrency } from "../../lib/formatters";
import { RightSidebarPortal } from "../context/RightSidebarContext";
import { AddGoalModal } from "../components/AddGoalModal";
import { GoalFundModal } from "../components/GoalFundModal";
import { toast } from "sonner";

const ICON_MAP: Record<string, React.ReactNode> = {
  Target: <Target size={22} strokeWidth={1.5} />,
  Plane: <Plane size={22} strokeWidth={1.5} />,
  Home: <Home size={22} strokeWidth={1.5} />,
  GraduationCap: <GraduationCap size={22} strokeWidth={1.5} />,
  Car: <Car size={22} strokeWidth={1.5} />,
  ShoppingBag: <ShoppingBag size={22} strokeWidth={1.5} />,
  Wallet: <Wallet size={22} strokeWidth={1.5} />,
  Heart: <Heart size={22} strokeWidth={1.5} />,
};

export function Goals() {
  const { goals, deleteGoal, settings } = useFinance();
  const [addOpen, setAddOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);
  const [fundGoal, setFundGoal] = useState<SavingsGoal | null>(null);

  const totalSaved = useMemo(() => goals.reduce((s, g) => s + g.current_amount, 0), [goals]);
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.target_amount, 0), [goals]);

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(deadline + "T00:00:00");
    return Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1 className="text-text-primary" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>Goals</motion.h1>
          <motion.p className="text-text-tertiary text-sm mt-0.5" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}>Track your savings targets</motion.p>
        </div>
        <motion.button
          onClick={() => { setEditGoal(null); setAddOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] hover:bg-primary-hover transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={15} strokeWidth={2} /> New Goal
        </motion.button>
      </div>

      {/* Overview Card */}
      {goals.length > 0 && (
        <motion.div
          className="rounded-xl border border-border-subtle bg-surface-overlay p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[12px] text-text-quaternary uppercase tracking-wide">Total Saved</p>
              <p className="text-xl text-text-primary tracking-tight mt-0.5">
                {formatCurrency(totalSaved, settings.currency)}
                <span className="text-sm text-text-quaternary ml-1">/ {formatCurrency(totalTarget, settings.currency)}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl text-success tracking-tight">{totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%</p>
              <p className="text-[11px] text-text-quaternary">{goals.length} goal{goals.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <div className="h-2 rounded-full bg-surface-active overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-success"
              initial={{ width: 0 }}
              animate={{ width: `${totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      )}

      {/* Goal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {goals.map((goal, i) => {
            const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
            const daysLeft = getDaysUntilDeadline(goal.deadline);
            const isComplete = pct >= 100;
            return (
              <motion.div
                key={goal.id}
                className="rounded-xl border border-border-subtle bg-surface-overlay p-4 group"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: goal.color + "18", color: goal.color }}
                    >
                      {ICON_MAP[goal.icon] || <Target size={22} strokeWidth={1.5} />}
                    </div>
                    <div>
                      <p className="text-[13px] text-text-primary font-medium">{goal.name}</p>
                      <p className="text-[11px] text-text-quaternary">
                        {isComplete ? "🎉 Goal reached!" : daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days left` : "Past deadline") : "No deadline"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditGoal(goal); setAddOpen(true); }} className="p-1.5 rounded-md hover:bg-surface-active text-text-ghost hover:text-text-tertiary transition-colors">
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => { deleteGoal(goal.id); toast.success("Goal deleted"); }} className="p-1.5 rounded-md hover:bg-danger-subtle text-text-ghost hover:text-danger transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Circular Progress */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-active)" strokeWidth="3" />
                      <motion.circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={goal.color}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="100"
                        initial={{ strokeDashoffset: 100 }}
                        animate={{ strokeDashoffset: 100 - pct }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[11px] text-text-primary tabular-nums font-medium">{Math.round(pct)}%</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-[12px] mb-0.5">
                      <span className="text-text-tertiary">Saved</span>
                      <span className="text-text-primary tabular-nums">{formatCurrency(goal.current_amount, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-text-tertiary">Target</span>
                      <span className="text-text-quaternary tabular-nums">{formatCurrency(goal.target_amount, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-[12px] mt-0.5">
                      <span className="text-text-tertiary">Remaining</span>
                      <span className="text-text-quaternary tabular-nums">{formatCurrency(Math.max(0, goal.target_amount - goal.current_amount), settings.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Fund Button */}
                <motion.button
                  onClick={() => setFundGoal(goal)}
                  className="w-full rounded-lg border border-border-subtle bg-surface-overlay py-2 text-[12px] text-text-secondary hover:bg-surface-hover transition-colors flex items-center justify-center gap-1.5"
                  whileTap={{ scale: 0.99 }}
                >
                  <TrendingUp size={13} strokeWidth={1.5} />
                  {isComplete ? "Manage funds" : "Add funds"}
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {goals.length === 0 && (
        <motion.div
          className="flex flex-col items-center justify-center py-20 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-subtle border border-primary/15 flex items-center justify-center mb-4">
            <Target size={28} className="text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-text-secondary mb-1">No savings goals yet</p>
          <p className="text-[12px] text-text-ghost max-w-[260px]">Create your first goal to start tracking your progress towards something meaningful.</p>
          <button
            onClick={() => setAddOpen(true)}
            className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[13px] hover:bg-primary-hover transition-colors"
          >
            <Plus size={15} /> Create a goal
          </button>
        </motion.div>
      )}

      {/* Right Sidebar */}
      <RightSidebarPortal>
        <div className="p-5 space-y-6">
          {goals.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-text-primary text-[13px] font-medium border-b border-border-subtle pb-2 flex items-center gap-2">
                <Target size={15} className="text-primary" /> Quick Overview
              </h3>
              {goals.slice(0, 5).map((g) => {
                const pct = g.target_amount > 0 ? Math.min((g.current_amount / g.target_amount) * 100, 100) : 0;
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-text-secondary truncate max-w-[120px]">{g.name}</span>
                      <span className="text-text-quaternary tabular-nums">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface-active overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: g.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </RightSidebarPortal>

      {/* Modals */}
      <AddGoalModal open={addOpen} onClose={() => { setAddOpen(false); setEditGoal(null); }} editGoal={editGoal} />
      {fundGoal && (
        <GoalFundModal
          open={!!fundGoal}
          onClose={() => setFundGoal(null)}
          goalId={fundGoal.id}
          goalName={fundGoal.name}
          currentAmount={fundGoal.current_amount}
          targetAmount={fundGoal.target_amount}
        />
      )}
    </div>
  );
}
