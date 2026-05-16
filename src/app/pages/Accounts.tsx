import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Wallet, Trash2, Edit3, Settings2 } from "lucide-react";
import { useAccounts, AccountType, Account } from "../context/AccountsContext";
import { formatCurrency } from "../../lib/formatters";
import { toast } from "sonner";
import { RightSidebarPortal } from "../context/RightSidebarContext";
import { AddAccountModal } from "../components/AddAccountModal";

const accountTypeToIcon: Record<AccountType, React.ReactNode> = {
  cash: <Wallet size={18} />,
  bank: <Wallet size={18} />,
  credit_card: <Wallet size={18} />,
  e_wallet: <Wallet size={18} />,
  investment: <Wallet size={18} />
};

export function Accounts() {
  const { accounts, deleteAccount, updateAccount, isLoaded } = useAccounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAcc, setEditingAcc] = useState<Account | null>(null);

  if (!isLoaded) return <div className="p-8 text-text-quaternary">Loading accounts...</div>;

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This will NOT delete its transactions, but might orphan them.`)) {
        deleteAccount(id);
        toast.success("Account deleted");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            className="text-text-primary text-2xl font-semibold tracking-tight"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Accounts
          </motion.h1>
          <motion.p
            className="text-text-tertiary text-sm mt-1"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
          >
            Net Worth: <span className="font-medium text-text-primary">{formatCurrency(totalBalance, "PHP")}</span>
          </motion.p>
        </div>
        <motion.button
          onClick={() => {
            setEditingAcc(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-primary-foreground text-sm hover:bg-primary-hover transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} strokeWidth={2} />
          <span className="hidden sm:inline">Add Account</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc, i) => (
            <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative overflow-hidden rounded-xl border border-border-default bg-surface-raised p-5 group"
            >
                {/* Decorative background gradient */}
                <div 
                    className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
                    style={{ backgroundColor: acc.color }}
                />

                <div className="flex justify-between items-start mb-4">
                     <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                        style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                    >
                        {accountTypeToIcon[acc.type] || <Wallet size={20} />}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingAcc(acc); setModalOpen(true); }} className="p-1.5 rounded bg-surface-overlay text-text-tertiary hover:text-text-primary">
                            <Edit3 size={14} />
                        </button>
                         <button onClick={() => handleDelete(acc.id, acc.name)} className="p-1.5 rounded bg-surface-overlay text-text-tertiary hover:text-danger">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-text-primary font-medium">{acc.name}</h3>
                    <p className="text-text-quaternary text-[11px] uppercase tracking-wider mt-0.5">{acc.type.replace('_', ' ')}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-border-subtle">
                     <p className="text-2xl font-semibold tracking-tight text-text-primary">
                        {formatCurrency(acc.current_balance, acc.currency)}
                     </p>
                     {acc.is_default && (
                         <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-primary-subtle text-primary uppercase tracking-wide">
                             Default
                         </span>
                     )}
                </div>
            </motion.div>
        ))}
      </div>

       <RightSidebarPortal>
        <div className="p-5 space-y-6 shrink-0 relative h-full overflow-hidden">
          <div className="space-y-4 relative z-10">
            <h3 className="text-text-primary text-[13px] font-medium flex items-center gap-2 border-b border-border-subtle pb-2">
              <Settings2 size={15} className="text-primary" /> Routing Rules
            </h3>
            <p className="text-text-tertiary text-xs leading-relaxed">
              When you add an expense without specifying an account, it is automatically deducted from your <strong>Default Account</strong>. Transfers will instantly deduct from one and add to another.
            </p>
          </div>
        </div>
      </RightSidebarPortal>

      <AddAccountModal 
        open={modalOpen} 
        onClose={() => { setModalOpen(false); setEditingAcc(null); }} 
        editAccount={editingAcc} 
      />
    </div>
  );
}
