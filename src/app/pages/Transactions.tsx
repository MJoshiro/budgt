import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, Trash2, Edit3, Plus, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useFinance, getCategoryMeta, EXPENSE_CATEGORIES, INCOME_CATEGORIES, ALL_CATEGORIES, TransactionType } from "../context/FinanceContext";
import { useAccounts } from "../context/AccountsContext";
import type { Transaction } from "../context/FinanceContext";
import { formatCurrency } from "../../lib/formatters";
import { RightSidebarPortal } from "../context/RightSidebarContext";
import { AddTransactionModal } from "../components/AddTransactionModal";
import { EmptyTransactionsArt } from "../components/EmptyTransactionsArt";
import { TransactionsSidebarArt } from "../components/ui/CardArt";
import { toast } from "sonner";

type SortField = "date" | "amount" | "category";
type SortDir = "asc" | "desc";
type TypeFilter = "all" | "expense" | "income";
type SortBy = "date-desc" | "date-asc" | "amount-desc" | "amount-asc" | "category-asc" | "category-desc";

export function Transactions() {
  const { transactions, deleteTransaction, settings } = useFinance();
  const { accounts } = useAccounts();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date-desc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "All") {
      result = result.filter((t) => t.category === categoryFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "date-desc":
          cmp = b.date.localeCompare(a.date);
          break;
        case "date-asc":
          cmp = a.date.localeCompare(b.date);
          break;
        case "amount-desc":
          cmp = b.amount - a.amount;
          break;
        case "amount-asc":
          cmp = a.amount - b.amount;
          break;
        case "category-asc":
          cmp = a.category.localeCompare(b.category);
          break;
        case "category-desc":
          cmp = b.category.localeCompare(a.category);
          break;
      }
      return cmp;
    });
    return result;
  }, [transactions, search, categoryFilter, typeFilter, sortBy]);

  // Reset pagination when filters change
  useMemo(() => setCurrentPage(1), [search, categoryFilter, typeFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalFiltered = filtered.reduce((s, t) => {
    return t.type === 'income' ? s + t.amount : s - t.amount;
  }, 0);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    setSwipedId(null);
    toast.success("Transaction deleted");
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setModalOpen(true);
    setSwipedId(null);
  };

  const displayCategories = typeFilter === "income" ? INCOME_CATEGORIES : typeFilter === "expense" ? EXPENSE_CATEGORIES : ALL_CATEGORIES;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <motion.h1
            className="text-text-primary"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Transactions
          </motion.h1>
          <motion.p
            className="text-text-tertiary text-sm mt-0.5"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
          >
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} · net {formatCurrency(totalFiltered, settings.currency)}
          </motion.p>
        </div>
        <motion.button
          onClick={() => {
            setEditingTx(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-primary-foreground text-sm hover:bg-primary-hover transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={16} strokeWidth={2} />
          <span className="hidden sm:inline">Add</span>
        </motion.button>
      </div>

      {/* Transaction List */}
      <div className="space-y-1">
        <AnimatePresence mode="popLayout">
          {paginated.map((tx, i) => {
            const meta = getCategoryMeta(tx.category);
            const isSwiped = swipedId === tx.id;
            const isIncome = tx.type === 'income';
            return (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -80, height: 0 }}
                transition={{ delay: i * 0.02 }}
                className="relative overflow-hidden rounded-lg"
              >
                {/* Actions */}
                <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2">
                  <motion.button
                    onClick={() => handleEdit(tx)}
                    className="p-2 rounded-md bg-chart-4/15 text-chart-4 hover:bg-chart-4/25 transition-colors"
                    initial={{ scale: 0 }}
                    animate={{ scale: isSwiped ? 1 : 0 }}
                  >
                    <Edit3 size={14} />
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(tx.id)}
                    className="p-2 rounded-md bg-danger-subtle text-danger hover:bg-danger/25 transition-colors"
                    initial={{ scale: 0 }}
                    animate={{ scale: isSwiped ? 1 : 0 }}
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>

                <motion.div
                  className="relative flex items-center justify-between px-3 py-3 rounded-lg border border-border-subtle bg-surface-overlay hover:bg-surface-hover transition-colors cursor-pointer"
                  onClick={() => setSwipedId(isSwiped ? null : tx.id)}
                  animate={{ x: isSwiped ? -90 : 0 }}
                  transition={{ type: "spring", damping: 28 }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${meta.color}14` }}
                    >
                      <span className="text-sm">{meta.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] text-text-primary truncate">{tx.description || tx.category}</p>
                      <p className="text-[11px] text-text-quaternary flex items-center gap-1">
                        {tx.category} · {tx.date}
                        {tx.account_id && (
                          <>
                            <span className="mx-1 opacity-50">•</span>
                            <span>{accounts.find(a => a.id === tx.account_id)?.name || 'Account'}</span>
                          </>
                        )}
                        {tx.destination_account_id && (
                           <>
                            <ChevronRight size={10} className="mx-0.5 opacity-50" />
                            <span>{accounts.find(a => a.id === tx.destination_account_id)?.name || 'Account'}</span>
                           </>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[13px] shrink-0 ml-3 tabular-nums ${
                    tx.destination_account_id 
                      ? "text-text-primary" 
                      : isIncome ? "text-success" : "text-text-primary"
                  }`}>
                    {tx.destination_account_id ? "" : (isIncome ? "+" : "-")}{formatCurrency(tx.amount, settings.currency)}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-20 text-text-quaternary"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <EmptyTransactionsArt className="w-48 h-36 text-text-ghost mb-6 opacity-60" />
            <p className="text-sm font-medium text-text-secondary">No transactions found</p>
            <p className="text-[12px] text-text-ghost mt-1">Try adjusting your filters or add a new entry.</p>
          </motion.div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
            <p className="text-[12px] text-text-quaternary">
              {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md hover:bg-surface-hover text-text-tertiary disabled:text-text-ghost disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={16} strokeWidth={1.5} />
              </button>
              <span className="text-[12px] text-text-secondary px-2 tabular-nums">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md hover:bg-surface-hover text-text-tertiary disabled:text-text-ghost disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={16} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      <RightSidebarPortal>
        <div className="p-5 space-y-6 shrink-0 relative h-full overflow-hidden">
          <div className="space-y-4 relative z-10">
            <h3 className="text-text-primary text-[13px] font-medium flex items-center gap-2 border-b border-border-subtle pb-2">
              <SlidersHorizontal size={15} className="text-primary" /> Find & Filter
            </h3>

            {/* Type Filter Tabs */}
            <div className="flex gap-0.5 rounded-lg bg-surface-overlay p-0.5 border border-border-subtle mt-2">
              {(["all", "expense", "income"] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTypeFilter(t); setCategoryFilter("All"); }}
                  className={`relative flex-1 py-2 px-3 rounded-md text-[13px] transition-colors ${
                    typeFilter === t ? "text-text-primary" : "text-text-quaternary hover:text-text-tertiary"
                  }`}
                >
                  {typeFilter === t && (
                    <motion.div
                      className="absolute inset-0 rounded-md bg-surface-active"
                      layoutId="txTypeTab"
                      transition={{ type: "spring", damping: 28, stiffness: 320 }}
                    />
                  )}
                  <span className="relative z-10 capitalize">{t}</span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-quaternary" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg bg-surface-overlay border border-border-default pl-10 pr-4 py-2.5 text-text-primary text-sm placeholder:text-text-ghost focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/15 transition-all"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-[11px] text-text-quaternary mb-1.5 uppercase tracking-wide">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-lg bg-surface-overlay border border-border-default px-3 py-2.5 text-text-primary text-[13px] focus:outline-none focus:border-primary/30 transition-colors"
              >
                <option value="All">All Categories</option>
                {displayCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-[11px] text-text-quaternary mb-1.5 uppercase tracking-wide">Sort Order</label>
              <div className="flex flex-col gap-1 rounded-lg border border-border-default p-1 bg-surface-base">
                <button
                  onClick={() => setSortBy("date-desc")}
                  className={`px-3 py-2 text-[13px] text-left rounded-md transition-colors ${sortBy === "date-desc" ? "bg-surface-raised text-text-primary shadow-sm" : "text-text-tertiary hover:bg-surface-hover hover:text-text-secondary"}`}
                >
                  Newest Date
                </button>
                <button
                  onClick={() => setSortBy("date-asc")}
                  className={`px-3 py-2 text-[13px] text-left rounded-md transition-colors ${sortBy === "date-asc" ? "bg-surface-raised text-text-primary shadow-sm" : "text-text-tertiary hover:bg-surface-hover hover:text-text-secondary"}`}
                >
                  Oldest Date
                </button>
                <button
                  onClick={() => setSortBy("amount-desc")}
                  className={`px-3 py-2 text-[13px] text-left rounded-md transition-colors ${sortBy === "amount-desc" ? "bg-surface-raised text-text-primary shadow-sm" : "text-text-tertiary hover:bg-surface-hover hover:text-text-secondary"}`}
                >
                  Highest Amount
                </button>
                <button
                  onClick={() => setSortBy("amount-asc")}
                  className={`px-3 py-2 text-[13px] text-left rounded-md transition-colors ${sortBy === "amount-asc" ? "bg-surface-raised text-text-primary shadow-sm" : "text-text-tertiary hover:bg-surface-hover hover:text-text-secondary"}`}
                >
                  Lowest Amount
                </button>
                <button
                  onClick={() => setSortBy("category-asc")}
                  className={`px-3 py-2 text-[13px] text-left rounded-md transition-colors ${sortBy === "category-asc" ? "bg-surface-raised text-text-primary shadow-sm" : "text-text-tertiary hover:bg-surface-hover hover:text-text-secondary"}`}
                >
                  Category (A-Z)
                </button>
                <button
                  onClick={() => setSortBy("category-desc")}
                  className={`px-3 py-2 text-[13px] text-left rounded-md transition-colors ${sortBy === "category-desc" ? "bg-surface-raised text-text-primary shadow-sm" : "text-text-tertiary hover:bg-surface-hover hover:text-text-secondary"}`}
                >
                  Category (Z-A)
                </button>
              </div>
            </div>
            
          </div>
          
          {/* Sidebar Art Decoration */}
          <div className="absolute -bottom-8 -right-8 w-72 h-72 z-0 pointer-events-none opacity-100 text-[#6384D4]">
            <TransactionsSidebarArt className="w-full h-full object-contain" />
          </div>
        </div>
      </RightSidebarPortal>

      <AddTransactionModal
        key={editingTx?.id || "new"}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingTx(null);
        }}
        editTransaction={editingTx}
      />
    </div>
  );
}
