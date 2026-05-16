import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Target, Plane, Home, GraduationCap, Car, ShoppingBag, Wallet, Heart } from "lucide-react";
import { useFinance, type SavingsGoal } from "../context/FinanceContext";
import { toast } from "sonner";

const GOAL_ICONS = [
  { name: "Target", icon: <Target size={20} strokeWidth={1.5} /> },
  { name: "Plane", icon: <Plane size={20} strokeWidth={1.5} /> },
  { name: "Home", icon: <Home size={20} strokeWidth={1.5} /> },
  { name: "GraduationCap", icon: <GraduationCap size={20} strokeWidth={1.5} /> },
  { name: "Car", icon: <Car size={20} strokeWidth={1.5} /> },
  { name: "ShoppingBag", icon: <ShoppingBag size={20} strokeWidth={1.5} /> },
  { name: "Wallet", icon: <Wallet size={20} strokeWidth={1.5} /> },
  { name: "Heart", icon: <Heart size={20} strokeWidth={1.5} /> },
];

const GOAL_COLORS = ["#D4845A", "#61AAF2", "#4CAF50", "#E57373", "#9575CD", "#FFB74D"];

interface Props {
  open: boolean;
  onClose: () => void;
  editGoal?: SavingsGoal | null;
}

export function AddGoalModal({ open, onClose, editGoal }: Props) {
  const { addGoal, updateGoal } = useFinance();
  const [name, setName] = useState(editGoal?.name || "");
  const [targetAmount, setTargetAmount] = useState(editGoal?.target_amount?.toString() || "");
  const [deadline, setDeadline] = useState(editGoal?.deadline || "");
  const [selectedIcon, setSelectedIcon] = useState(editGoal?.icon || "Target");
  const [selectedColor, setSelectedColor] = useState(editGoal?.color || GOAL_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Please enter a goal name"); return; }
    if (!targetAmount || parseFloat(targetAmount) <= 0) { toast.error("Please enter a valid target amount"); return; }

    if (editGoal) {
      updateGoal({
        ...editGoal,
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        deadline: deadline || null,
        icon: selectedIcon,
        color: selectedColor,
      });
      toast.success("Goal updated");
    } else {
      addGoal({
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
        current_amount: 0,
        deadline: deadline || null,
        icon: selectedIcon,
        color: selectedColor,
      });
      toast.success("Goal created!");
    }
    onClose();
  };

  const getIconComponent = (iconName: string) =>
    GOAL_ICONS.find((i) => i.name === iconName)?.icon || <Target size={20} strokeWidth={1.5} />;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-md rounded-xl border border-border-default bg-surface-raised p-6 shadow-2xl"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-text-primary text-base">
                {editGoal ? "Edit goal" : "New savings goal"}
              </h2>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-surface-hover transition-colors text-text-tertiary hover:text-text-primary">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Preview */}
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle bg-surface-overlay">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: selectedColor + "20", color: selectedColor }}>
                  {getIconComponent(selectedIcon)}
                </div>
                <div>
                  <p className="text-[13px] text-text-primary">{name || "Goal name"}</p>
                  <p className="text-[11px] text-text-quaternary">{targetAmount ? `Target: ${parseFloat(targetAmount).toLocaleString()}` : "Set a target"}</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[12px] text-text-tertiary mb-1.5 uppercase tracking-wide">Goal name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vacation, Emergency fund"
                  className="w-full rounded-lg bg-surface-overlay border border-border-default px-3.5 py-2.5 text-text-primary text-sm placeholder:text-text-ghost focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Target Amount */}
              <div>
                <label className="block text-[12px] text-text-tertiary mb-1.5 uppercase tracking-wide">Target amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg bg-surface-overlay border border-border-default px-3.5 py-2.5 text-text-primary text-sm placeholder:text-text-ghost focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-[12px] text-text-tertiary mb-1.5 uppercase tracking-wide">Deadline <span className="normal-case text-text-quaternary">(optional)</span></label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-lg bg-surface-overlay border border-border-default px-3.5 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary/40 transition-all"
                  style={{ colorScheme: "auto" }}
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-[12px] text-text-tertiary mb-1.5 uppercase tracking-wide">Icon</label>
                <div className="grid grid-cols-8 gap-1.5">
                  {GOAL_ICONS.map((ic) => (
                    <button
                      key={ic.name}
                      type="button"
                      onClick={() => setSelectedIcon(ic.name)}
                      className={`p-2 rounded-lg border transition-all flex items-center justify-center ${
                        selectedIcon === ic.name
                          ? "border-primary/30 bg-primary-subtle text-primary"
                          : "border-border-subtle bg-surface-overlay text-text-tertiary hover:bg-surface-hover"
                      }`}
                    >
                      {ic.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-[12px] text-text-tertiary mb-1.5 uppercase tracking-wide">Color</label>
                <div className="flex gap-2">
                  {GOAL_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color ? "border-text-primary scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm text-primary-foreground flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {editGoal ? "Update goal" : "Create goal"}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { GOAL_ICONS };
