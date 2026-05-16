import React, { useState, useEffect } from "react";
import { X, Wallet, Palmtree, PiggyBank, Briefcase, Landmark } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAccounts, Account, AccountType } from "../context/AccountsContext";
import { toast } from "sonner";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../../lib/formatters";

interface AddAccountModalProps {
  open: boolean;
  onClose: () => void;
  editAccount?: Account | null;
}

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: React.ReactNode }[] = [
  { value: 'cash', label: 'Cash', icon: <Wallet size={16} /> },
  { value: 'bank', label: 'Bank Account', icon: <Landmark size={16} /> },
  { value: 'credit_card', label: 'Credit Card', icon: <Briefcase size={16} /> },
  { value: 'e_wallet', label: 'E-Wallet', icon: <Palmtree size={16} /> },
  { value: 'investment', label: 'Investment', icon: <PiggyBank size={16} /> },
];

const COLORS = [
  "#D4845A", // Kraft
  "#61AAF2", // Focus
  "#4F8A6B", // Green
  "#9663B5", // Purple
  "#CC785C", // Book Cloth
  "#3B3C3E", // Slate (Dark)
];

export function AddAccountModal({ open, onClose, editAccount }: AddAccountModalProps) {
  const { addAccount, updateAccount } = useAccounts();
  const { settings } = useFinance();

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [color, setColor] = useState(COLORS[0]);
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editAccount) {
        setName(editAccount.name);
        setType(editAccount.type);
        setColor(editAccount.color || COLORS[0]);
        setIsDefault(editAccount.is_default || false);
      } else {
        setName("");
        setType("bank");
        setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setIsDefault(false);
      }
    }
  }, [open, editAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Account name is required");

    setIsSubmitting(true);
    try {
      if (editAccount) {
        await updateAccount(editAccount.id, {
          name: name.trim(),
          type,
          color,
          is_default: isDefault,
        });
        toast.success("Account updated");
      } else {
        await addAccount({
          name: name.trim(),
          type,
          currency: settings.currency, // Use user's default currency
          icon: "Wallet", // Default icon, can be customized later
          color,
          is_default: isDefault,
          starting_balance: 0, // new accounts start at 0
        });
        toast.success("Account created");
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-[10%] z-50 w-full max-w-md -translate-x-1/2 rounded-2xl bg-surface-base border border-border-default p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif text-text-primary">
                {editAccount ? "Edit Account" : "New Account"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-full text-text-quaternary hover:text-text-primary hover:bg-surface-hover transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                  Account Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. BPI Savings"
                  className="w-full rounded-lg bg-surface-overlay border border-border-default px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/25 transition-all"
                />
              </div>

              {/* Type Grid */}
              <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ACCOUNT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm transition-all ${
                        type === t.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border-default bg-surface-overlay text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                    >
                      <span className={type === t.value ? "text-primary" : "text-text-tertiary"}>
                        {t.icon}
                      </span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

               {/* Color Selection */}
               <div>
                <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                  Color Theme
                </label>
                <div className="flex items-center gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        color === c ? "ring-2 ring-offset-2 ring-primary ring-offset-surface-base scale-110" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Default Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-border-default bg-surface-overlay mt-2">
                  <div className="pr-4">
                      <p className="text-[13px] font-medium text-text-primary">Set as Default Account</p>
                      <p className="text-[11px] text-text-quaternary mt-0.5">Quick-entry transactions will deduct from this account automatically.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDefault}
                    onClick={() => setIsDefault(!isDefault)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${
                      isDefault ? 'bg-primary' : 'bg-surface-raised border border-border-default'
                    }`}
                  >
                    <span 
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isDefault ? 'translate-x-[7px]' : '-translate-x-[7px] bg-text-ghost'
                      }`}
                    />
                  </button>
              </div>

              {/* Read Only Current Balance Warning (if editing) */}
              {editAccount && (
                  <div className="p-3 rounded-lg border border-border-subtle bg-surface-overlay flex justify-between items-center text-sm">
                      <span className="text-text-secondary">Current Balance</span>
                      <span className="font-medium text-text-primary tabular-nums">
                          {formatCurrency(editAccount.current_balance, editAccount.currency)}
                      </span>
                  </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-lg border border-border-default text-text-secondary text-sm font-medium hover:bg-surface-hover hover:text-text-primary transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editAccount ? "Save Changes" : "Create Account"}
                </button>
              </div>
            </form>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
