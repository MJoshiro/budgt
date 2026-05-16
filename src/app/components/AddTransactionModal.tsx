import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Plus, Check, ArrowUpRight, ArrowDownRight, Repeat } from "lucide-react";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, getCategoryMeta, useFinance, RECURRENCE_OPTIONS, type TransactionType, type RecurrenceFrequency } from "../context/FinanceContext";
import { useAccounts } from "../context/AccountsContext";
import type { Transaction } from "../context/FinanceContext";
import { toast } from "sonner";
import { getToday } from "../lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  editTransaction?: Transaction | null;
}

export function AddTransactionModal({ open, onClose, editTransaction }: Props) {
  const { addTransaction, editTransaction: updateTransaction, settings } = useFinance();
  const { accounts, getDefaultAccount } = useAccounts();
  
  // Transaction meta state
  const [type, setType] = useState<TransactionType | 'transfer'>(editTransaction ? (editTransaction.destination_account_id ? 'transfer' : editTransaction.type) : "expense");
  const [amount, setAmount] = useState(editTransaction?.amount?.toString() || "");
  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const [category, setCategory] = useState(editTransaction?.category || categories[0]);
  const [description, setDescription] = useState(editTransaction?.description || "");
  const [date, setDate] = useState(editTransaction?.date || getToday());
  
  // Account state
  const defaultAccId = getDefaultAccount()?.id || (accounts[0]?.id ?? "");
  const [accountId, setAccountId] = useState(editTransaction?.account_id || defaultAccId);
  const [destAccountId, setDestAccountId] = useState(editTransaction?.destination_account_id || "");

  // Recur state
  const [isRecurring, setIsRecurring] = useState(editTransaction?.is_recurring || false);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(editTransaction?.recurrence_frequency || "monthly");
  const [endDate, setEndDate] = useState(editTransaction?.recurrence_end_date || "");

  // Update default account if it loads later
  React.useEffect(() => {
    if (!accountId && defaultAccId) setAccountId(defaultAccId);
  }, [defaultAccId, accountId]);

  // Reset category when type changes
  const handleTypeChange = (newType: TransactionType | 'transfer') => {
    setType(newType);
    if (newType !== 'transfer') {
      const newCats = newType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
      if (!newCats.includes(category)) setCategory(newCats[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    const finalAccountId = accountId || defaultAccId;
    if (!finalAccountId) {
      toast.error("Please select an account. If you don't have one, please create an account first.");
      return;
    }
    if (type === 'transfer' && (!destAccountId || finalAccountId === destAccountId)) {
      toast.error("Please select a valid destination account");
      return;
    }

    const txData = {
      account_id: finalAccountId,
      destination_account_id: type === 'transfer' ? destAccountId : null,
      amount: parseFloat(amount),
      category: type === 'transfer' ? "Transfer" : category,
      description: description || (type === 'transfer' ? "Account Transfer" : ""),
      date,
      type: (type === 'transfer' ? 'expense' : type) as TransactionType, // Transfers are technically expenses on the source account
      is_recurring: isRecurring,
      recurrence_frequency: isRecurring ? frequency : null,
      recurrence_next_date: isRecurring ? advanceNext(date, frequency) : null,
      recurrence_end_date: isRecurring && endDate ? endDate : null,
    };
    if (editTransaction) {
      updateTransaction({ id: editTransaction.id, ...txData });
      toast.success("Transaction updated");
    } else {
      addTransaction(txData);
      toast.success(type === 'transfer' ? "Transfer complete" : `${type === "income" ? "Income" : "Expense"} added`);
    }
    onClose();
  };

  // Compute next recurrence date from a given start date
  function advanceNext(d: string, f: RecurrenceFrequency): string {
    const dt = new Date(d + "T00:00:00");
    switch (f) {
      case "daily": dt.setDate(dt.getDate() + 1); break;
      case "weekly": dt.setDate(dt.getDate() + 7); break;
      case "biweekly": dt.setDate(dt.getDate() + 14); break;
      case "monthly": dt.setMonth(dt.getMonth() + 1); break;
      case "quarterly": dt.setMonth(dt.getMonth() + 3); break;
      case "yearly": dt.setFullYear(dt.getFullYear() + 1); break;
    }
    return dt.toISOString().split("T")[0];
  }

  const currentCategories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

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
                {editTransaction ? "Edit transaction" : "New transaction"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-md p-1.5 hover:bg-surface-hover transition-colors text-text-tertiary hover:text-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Toggle */}
              <div className="flex gap-1.5 rounded-lg bg-surface-overlay p-0.5 border border-border-subtle">
                <button
                  type="button"
                  onClick={() => handleTypeChange("expense")}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-[13px] transition-colors ${
                    type === "expense" ? "text-text-primary" : "text-text-quaternary hover:text-text-tertiary"
                  }`}
                >
                  {type === "expense" && (
                    <motion.div className="absolute inset-0 rounded-md bg-danger-subtle" layoutId="typeToggle" transition={{ type: "spring", damping: 28, stiffness: 320 }} />
                  )}
                  <ArrowDownRight size={14} className="relative z-10" />
                  <span className="relative z-10">Expense</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("income")}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-[13px] transition-colors ${
                    type === "income" ? "text-text-primary" : "text-text-quaternary hover:text-text-tertiary"
                  }`}
                >
                  {type === "income" && (
                    <motion.div className="absolute inset-0 rounded-md bg-success-subtle" layoutId="typeToggle" transition={{ type: "spring", damping: 28, stiffness: 320 }} />
                  )}
                  <ArrowUpRight size={14} className="relative z-10" />
                  <span className="relative z-10">Income</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("transfer")}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-[13px] transition-colors ${
                    type === "transfer" ? "text-text-primary" : "text-text-quaternary hover:text-text-tertiary"
                  }`}
                >
                  {type === "transfer" && (
                    <motion.div className="absolute inset-0 rounded-md bg-primary-subtle" layoutId="typeToggle" transition={{ type: "spring", damping: 28, stiffness: 320 }} />
                  )}
                  <Repeat size={14} className="relative z-10" />
                  <span className="relative z-10">Transfer</span>
                </button>
              </div>

              {/* Account Selection */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[12px] text-text-tertiary mb-1.5 uppercase tracking-wide">
                    {type === 'transfer' ? 'From Account' : 'Account'}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full rounded-lg bg-surface-overlay border border-border-default px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                  >
                    {!accountId && <option value="" disabled>Select...</option>}
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                    ))}
                  </select>
                </div>
                {type === 'transfer' && (
                  <div className="flex-1">
                    <label className="block text-[12px] text-text-tertiary mb-1.5 uppercase tracking-wide">To Account</label>
                    <select
                      value={destAccountId}
                      onChange={(e) => setDestAccountId(e.target.value)}
                      className="w-full rounded-lg bg-surface-overlay border border-border-default px-3 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    >
                       <option value="" disabled>Select destination...</option>
                      {accounts.filter(a => a.id !== accountId).map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[12px] text-text-tertiary mb-1.5 uppercase tracking-wide">Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-quaternary text-sm">{settings.currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg bg-surface-overlay border border-border-default pl-14 pr-4 py-2.5 text-text-primary text-xl placeholder:text-text-ghost focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Category */}
              {type !== 'transfer' && (
                <div>
                  <label className="block text-[12px] text-text-tertiary mb-1.5 uppercase tracking-wide">Category</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {currentCategories.map((cat) => {
                      const meta = getCategoryMeta(cat);
                      const isActive = category === cat;
                      return (
                        <motion.button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                            isActive
                              ? "border-primary/30 bg-primary-subtle"
                              : "border-border-subtle bg-surface-overlay hover:bg-surface-hover"
                          }`}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          {isActive && (
                            <div className="absolute top-1 right-1">
                              <Check size={8} className="text-primary" />
                            </div>
                          )}
                          <span className="text-lg">{meta.icon}</span>
                          <span className="text-[9px] text-text-tertiary leading-tight text-center truncate w-full">
                            {cat.split(" ")[0]}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-[12px] text-text-tertiary mb-1.5 uppercase tracking-wide">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg bg-surface-overlay border border-border-default px-3.5 py-2.5 text-text-primary text-sm focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                  style={{ colorScheme: 'auto' }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[12px] text-text-tertiary mb-1.5 uppercase tracking-wide">Description <span className="normal-case text-text-quaternary">(optional)</span></label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was this for?"
                  className="w-full rounded-lg bg-surface-overlay border border-border-default px-3.5 py-2.5 text-text-primary text-sm placeholder:text-text-ghost focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Recurring Toggle */}
              <div className="rounded-lg border border-border-subtle bg-surface-overlay p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat size={14} className={isRecurring ? "text-primary" : "text-text-quaternary"} strokeWidth={1.5} />
                    <span className="text-[13px] text-text-primary">Recurring</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={`w-9 h-[20px] rounded-full transition-all relative ${isRecurring ? "bg-primary" : "bg-switch-background"}`}
                  >
                    <motion.div
                      className={`w-3.5 h-3.5 rounded-full absolute top-[3px] ${isRecurring ? "bg-primary-foreground" : "bg-text-tertiary"}`}
                      animate={{ left: isRecurring ? 19 : 3 }}
                      transition={{ type: "spring", damping: 22, stiffness: 320 }}
                    />
                  </button>
                </div>
                <AnimatePresence>
                  {isRecurring && (
                    <motion.div
                      className="space-y-3 mt-3 pt-3 border-t border-border-subtle"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div>
                        <label className="block text-[11px] text-text-quaternary mb-1 uppercase tracking-wide">Frequency</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {RECURRENCE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setFrequency(opt.value)}
                              className={`py-1.5 rounded-md border text-[11px] transition-all ${
                                frequency === opt.value
                                  ? "border-primary/30 bg-primary-subtle text-primary"
                                  : "border-border-subtle bg-surface-overlay text-text-tertiary hover:bg-surface-hover"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] text-text-quaternary mb-1 uppercase tracking-wide">End date <span className="normal-case">(optional)</span></label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full rounded-lg bg-surface-overlay border border-border-default px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary/40 transition-all"
                          style={{ colorScheme: 'auto' }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                className={`w-full rounded-lg py-2.5 text-sm flex items-center justify-center gap-2 transition-colors ${
                  type === "income"
                    ? "bg-success text-white hover:bg-success/90"
                    : type === "transfer" 
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                    : "bg-danger text-white hover:bg-danger/90" 
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Plus size={16} strokeWidth={2} />
                {editTransaction ? "Update transaction" : type === 'transfer' ? 'Complete Transfer' : `Add ${type}`}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
