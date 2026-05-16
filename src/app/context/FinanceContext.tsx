import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { FoodIcon, TransportIcon, ShoppingIcon, EntertainmentIcon, HealthIcon, BillsIcon, EducationIcon, TravelIcon, GroceriesIcon, OtherIcon, SalaryIcon, FreelanceIcon, InvestmentsIcon, OtherIncomeIcon } from "../components/ui/CategoryIcons";
import supabase from "../../lib/supabase";
import { useAuth } from "./AuthContext";
import { syncQueue, addToQueue } from "../../lib/offlineQueue";

// ─── Types ───────────────────────────────────────────────────────────

export type TransactionType = 'expense' | 'income';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Transaction {
  id: string;
  user_id?: string;
  account_id: string;
  destination_account_id?: string | null;
  amount: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  is_recurring?: boolean;
  recurrence_frequency?: RecurrenceFrequency | null;
  recurrence_next_date?: string | null;
  recurrence_end_date?: string | null;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface UserSettings {
  name: string;
  currency: string;
  notifications: boolean;
  weeklyReport: boolean;
  theme: "dark" | "light";
}

export interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  icon: string;
  color: string;
  created_at: string;
}

// ─── Category Metadata ───────────────────────────────────────────────

const EXPENSE_CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; gradient: string }> = {
  "Food & Dining": { icon: <FoodIcon size={18} />, color: "var(--chart-1)", gradient: "from-[#CC785C] to-[#D58B72]" },
  "Transportation": { icon: <TransportIcon size={18} />, color: "var(--chart-2)", gradient: "from-[#D4A27F] to-[#DBA986]" },
  "Shopping": { icon: <ShoppingIcon size={18} />, color: "var(--chart-3)", gradient: "from-[#EBDBBC] to-[#F2E2C3]" },
  "Entertainment": { icon: <EntertainmentIcon size={18} />, color: "var(--chart-4)", gradient: "from-[#61AAF2] to-[#68B1F9]" },
  "Health": { icon: <HealthIcon size={18} />, color: "var(--chart-5)", gradient: "from-[#BF4D43] to-[#C6544A]" },
  "Bills & Utilities": { icon: <BillsIcon size={18} />, color: "var(--chart-1)", gradient: "from-[#CC785C] to-[#D58B72]" },
  "Education": { icon: <EducationIcon size={18} />, color: "var(--chart-2)", gradient: "from-[#D4A27F] to-[#DBA986]" },
  "Travel": { icon: <TravelIcon size={18} />, color: "var(--chart-3)", gradient: "from-[#EBDBBC] to-[#F2E2C3]" },
  "Groceries": { icon: <GroceriesIcon size={18} />, color: "var(--chart-4)", gradient: "from-[#61AAF2] to-[#68B1F9]" },
  "Other": { icon: <OtherIcon size={18} />, color: "var(--chart-5)", gradient: "from-[#BF4D43] to-[#C6544A]" },
};

const INCOME_CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; gradient: string }> = {
  "Salary": { icon: <SalaryIcon size={18} />, color: "var(--success)", gradient: "from-[#61AAF2] to-[#68B1F9]" },
  "Freelance": { icon: <FreelanceIcon size={18} />, color: "var(--chart-1)", gradient: "from-[#CC785C] to-[#D58B72]" },
  "Investments": { icon: <InvestmentsIcon size={18} />, color: "var(--chart-2)", gradient: "from-[#D4A27F] to-[#DBA986]" },
  "Other Income": { icon: <OtherIncomeIcon size={18} />, color: "var(--chart-3)", gradient: "from-[#EBDBBC] to-[#F2E2C3]" },
};

export const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_META);
export const INCOME_CATEGORIES = Object.keys(INCOME_CATEGORY_META);
export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

export const getCategoryMeta = (cat: string) =>
  EXPENSE_CATEGORY_META[cat] || INCOME_CATEGORY_META[cat] || EXPENSE_CATEGORY_META["Other"];

export const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

// ─── Default data ────────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  name: "User",
  currency: "USD",
  notifications: true,
  weeklyReport: true,
  theme: "dark",
};

// ─── Helpers ─────────────────────────────────────────────────────────

function advanceDate(date: string, freq: RecurrenceFrequency): string {
  const d = new Date(date + "T00:00:00");
  switch (freq) {
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "yearly": d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().split("T")[0];
}

// ─── Context ─────────────────────────────────────────────────────────

interface FinanceContextType {
  transactions: Transaction[];
  budgets: Budget[];
  settings: UserSettings;
  goals: SavingsGoal[];
  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  editTransaction: (t: Transaction) => void;
  updateBudget: (category: string, limit: number) => void;
  updateSettings: (s: Partial<UserSettings>) => void;
  addGoal: (g: Omit<SavingsGoal, "id" | "created_at">) => void;
  updateGoal: (g: SavingsGoal) => void;
  deleteGoal: (id: string) => void;
  fundGoal: (id: string, amount: number) => void;
  getSpentByCategory: (category: string) => number;
  getTotalExpenses: () => number;
  getTotalIncome: () => number;
  getBalance: () => number;
  streak: number;
  isLoaded: boolean;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const hasFetched = useRef(false);

  // ─── Fetch from Supabase on mount ────────────────────────────────
  useEffect(() => {
    if (!user || hasFetched.current) return;
    hasFetched.current = true;

    // Handle initial PWA setup and queue flushing
    if (typeof navigator !== "undefined" && navigator.onLine) {
      syncQueue();
    }
    const handleOnline = () => syncQueue();
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
    }

    const fetchData = async () => {
      try {
        // Fetch transactions (including recurring fields)
        const { data: txData, error: txError } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (txError) throw txError;

        const mapped: Transaction[] = (txData || []).map((row: any) => ({
          id: row.id,
          user_id: row.user_id,
          account_id: row.account_id || "",
          destination_account_id: row.destination_account_id || null,
          amount: parseFloat(row.amount),
          category: row.category,
          description: row.description || "",
          date: row.date,
          type: row.type as TransactionType,
          is_recurring: row.is_recurring || false,
          recurrence_frequency: row.recurrence_frequency || null,
          recurrence_next_date: row.recurrence_next_date || null,
          recurrence_end_date: row.recurrence_end_date || null,
        }));
        setTransactions(mapped);
        localStorage.setItem("finance_transactions", JSON.stringify(mapped));

        // Process recurring transactions (auto-generate past-due entries)
        await processRecurring(mapped, user.id);

        // Fetch budgets
        const { data: budData, error: budError } = await supabase
          .from("budgets")
          .select("*")
          .eq("user_id", user.id);

        if (budError) throw budError;

        const mappedBudgets: Budget[] = (budData || []).map((row: any) => ({
          category: row.category,
          limit: parseFloat(row.amount_limit),
        }));
        setBudgets(mappedBudgets);
        localStorage.setItem("finance_budgets", JSON.stringify(mappedBudgets));

        // Fetch settings
        const { data: settData, error: settError } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (settError && settError.code !== "PGRST116") throw settError;

        if (settData) {
          const mappedSettings: UserSettings = {
            name: settData.name || "User",
            currency: settData.currency || "USD",
            notifications: settData.notifications ?? true,
            weeklyReport: settData.weekly_report ?? true,
            theme: (settData.theme as "dark" | "light") || "dark",
          };
          setSettings(mappedSettings);
          localStorage.setItem("finance_settings", JSON.stringify(mappedSettings));
        }

        // Fetch savings goals
        const { data: goalData, error: goalError } = await supabase
          .from("savings_goals")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (goalError) throw goalError;

        const mappedGoals: SavingsGoal[] = (goalData || []).map((row: any) => ({
          id: row.id,
          name: row.name,
          target_amount: parseFloat(row.target_amount),
          current_amount: parseFloat(row.current_amount),
          deadline: row.deadline || null,
          icon: row.icon || "Target",
          color: row.color || "#D4845A",
          created_at: row.created_at,
        }));
        setGoals(mappedGoals);
        localStorage.setItem("finance_goals", JSON.stringify(mappedGoals));
      } catch (err) {
        console.warn("Supabase fetch failed, using localStorage fallback", err);
        const cachedTx = localStorage.getItem("finance_transactions");
        if (cachedTx) setTransactions(JSON.parse(cachedTx));
        const cachedBud = localStorage.getItem("finance_budgets");
        if (cachedBud) setBudgets(JSON.parse(cachedBud));
        const cachedSet = localStorage.getItem("finance_settings");
        if (cachedSet) setSettings(JSON.parse(cachedSet));
        const cachedGoals = localStorage.getItem("finance_goals");
        if (cachedGoals) setGoals(JSON.parse(cachedGoals));
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, [user]);

  // ─── Process recurring transactions ──────────────────────────────
  const processRecurring = async (txs: Transaction[], userId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const newTxs: Transaction[] = [];

    for (const tx of txs) {
      if (!tx.is_recurring || !tx.recurrence_frequency || !tx.recurrence_next_date) continue;
      if (tx.recurrence_end_date && tx.recurrence_end_date < today) continue;

      let nextDate = tx.recurrence_next_date;
      while (nextDate <= today) {
        const newId = crypto.randomUUID();
        const generated: Transaction = {
          ...tx,
          id: newId,
          date: nextDate,
          is_recurring: false,
          recurrence_frequency: null,
          recurrence_next_date: null,
          recurrence_end_date: null,
        };
        newTxs.push(generated);

        // Insert generated transaction
        await supabase.from("transactions").insert({
          id: newId,
          user_id: userId,
          account_id: tx.account_id,
          destination_account_id: tx.destination_account_id,
          amount: tx.amount,
          category: tx.category,
          description: tx.description,
          date: nextDate,
          type: tx.type,
          is_recurring: false,
        });

        nextDate = advanceDate(nextDate, tx.recurrence_frequency);
      }

      // Update next_date on the recurring template
      if (nextDate !== tx.recurrence_next_date) {
        await supabase
          .from("transactions")
          .update({ recurrence_next_date: nextDate })
          .eq("id", tx.id);
      }
    }

    if (newTxs.length > 0) {
      setTransactions((prev) => {
        const updated = [...newTxs, ...prev];
        localStorage.setItem("finance_transactions", JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [settings.theme]);

  // ─── Transaction CRUD ────────────────────────────────────────────

  const addTransaction = useCallback(
    (t: Omit<Transaction, "id">) => {
      if (!user) return;
      const tempId = crypto.randomUUID();

      // Fallback for account_id if accounts context hasn't loaded securely yet
      let accountId = t.account_id;
      if (!accountId) {
        try {
          const cachedAccounts = localStorage.getItem("finance_accounts");
          if (cachedAccounts) {
            const accounts = JSON.parse(cachedAccounts);
            const defaultAcc = accounts.find((a: any) => a.is_default) || accounts[0];
            if (defaultAcc) accountId = defaultAcc.id;
          }
        } catch (e) {
          console.error("Failed to fallback account_id", e);
        }
      }

      const newTx: Transaction = { ...t, account_id: accountId, id: tempId };

      setTransactions((prev) => {
        const updated = [newTx, ...prev];
        localStorage.setItem("finance_transactions", JSON.stringify(updated));
        return updated;
      });

      const dbPayload = {
        id: tempId,
        user_id: user.id,
        account_id: accountId,
        destination_account_id: t.destination_account_id,
        amount: t.amount,
        category: t.category,
        description: t.description,
        date: t.date,
        type: t.type,
        is_recurring: t.is_recurring || false,
        recurrence_frequency: t.recurrence_frequency || null,
        recurrence_next_date: t.recurrence_next_date || null,
        recurrence_end_date: t.recurrence_end_date || null,
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        addToQueue('INSERT_TX', dbPayload);
      } else {
        supabase.from("transactions").insert(dbPayload).then(async ({ error }) => {
          if (error) {
            console.error("Failed to save transaction:", error);
            const { toast } = await import("sonner");
            toast.error("DB Error: " + error.message);
          }
        });
      }
    },
    [user]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        localStorage.setItem("finance_transactions", JSON.stringify(updated));
        return updated;
      });

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        addToQueue('DELETE_TX', id);
      } else {
        supabase.from("transactions").delete().eq("id", id).then(({ error }) => {
          if (error) console.error("Failed to delete transaction:", error);
        });
      }
    },
    []
  );

  const editTransaction = useCallback(
    (updated: Transaction) => {
      setTransactions((prev) => {
        const newList = prev.map((t) => (t.id === updated.id ? updated : t));
        localStorage.setItem("finance_transactions", JSON.stringify(newList));
        return newList;
      });

      const updatePayload = {
        id: updated.id,
        account_id: updated.account_id,
        destination_account_id: updated.destination_account_id,
        amount: updated.amount,
        category: updated.category,
        description: updated.description,
        date: updated.date,
        type: updated.type,
        is_recurring: updated.is_recurring || false,
        recurrence_frequency: updated.recurrence_frequency || null,
        recurrence_next_date: updated.recurrence_next_date || null,
        recurrence_end_date: updated.recurrence_end_date || null,
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        addToQueue('UPDATE_TX', updatePayload);
      } else {
        supabase.from("transactions").update(updatePayload).eq("id", updated.id).then(({ error }) => {
          if (error) console.error("Failed to update transaction:", error);
        });
      }
    },
    []
  );

  const updateBudget = useCallback(
    (category: string, limit: number) => {
      if (!user) return;
      setBudgets((prev) => {
        const updated = prev.map((b) => b.category === category ? { ...b, limit } : b);
        localStorage.setItem("finance_budgets", JSON.stringify(updated));
        return updated;
      });

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        addToQueue('UPDATE_BUDGET', { category, limit, user_id: user.id });
      } else {
        supabase.from("budgets").update({ amount_limit: limit }).eq("user_id", user.id).eq("category", category).then(({ error }) => {
          if (error) console.error("Failed to update budget:", error);
        });
      }
    },
    [user]
  );

  const updateSettings = useCallback(
    (s: Partial<UserSettings>) => {
      if (!user) return;
      setSettings((prev) => {
        const updated = { ...prev, ...s };
        localStorage.setItem("finance_settings", JSON.stringify(updated));
        return updated;
      });

      const dbUpdate: Record<string, any> = {};
      if (s.name !== undefined) dbUpdate.name = s.name;
      if (s.currency !== undefined) dbUpdate.currency = s.currency;
      if (s.notifications !== undefined) dbUpdate.notifications = s.notifications;
      if (s.weeklyReport !== undefined) dbUpdate.weekly_report = s.weeklyReport;
      if (s.theme !== undefined) dbUpdate.theme = s.theme;

      if (Object.keys(dbUpdate).length > 0) {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
          addToQueue('UPDATE_SETTINGS', { dbUpdate, user_id: user.id });
        } else {
          supabase.from("user_settings").update(dbUpdate).eq("user_id", user.id).then(({ error }) => {
            if (error) console.error("Failed to update settings:", error);
          });
        }
      }
    },
    [user]
  );

  // ─── Goals CRUD ──────────────────────────────────────────────────

  const addGoal = useCallback(
    (g: Omit<SavingsGoal, "id" | "created_at">) => {
      if (!user) return;
      const tempId = crypto.randomUUID();
      const newGoal: SavingsGoal = { ...g, id: tempId, created_at: new Date().toISOString() };

      setGoals((prev) => {
        const updated = [newGoal, ...prev];
        localStorage.setItem("finance_goals", JSON.stringify(updated));
        return updated;
      });

      const goalPayload = {
        id: tempId,
        user_id: user.id,
        name: g.name,
        target_amount: g.target_amount,
        current_amount: g.current_amount,
        deadline: g.deadline,
        icon: g.icon,
        color: g.color,
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        addToQueue('INSERT_GOAL', goalPayload);
      } else {
        supabase.from("savings_goals").insert(goalPayload).then(({ error }) => {
          if (error) console.error("Failed to save goal:", error);
        });
      }
    },
    [user]
  );

  const updateGoal = useCallback(
    (g: SavingsGoal) => {
      setGoals((prev) => {
        const updated = prev.map((old) => old.id === g.id ? g : old);
        localStorage.setItem("finance_goals", JSON.stringify(updated));
        return updated;
      });

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        addToQueue('UPDATE_GOAL', g);
      } else {
        supabase.from("savings_goals").update({
          name: g.name,
          target_amount: g.target_amount,
          current_amount: g.current_amount,
          deadline: g.deadline,
          icon: g.icon,
          color: g.color,
        }).eq("id", g.id).then(({ error }) => {
          if (error) console.error("Failed to update goal:", error);
        });
      }
    },
    []
  );

  const deleteGoal = useCallback(
    (id: string) => {
      setGoals((prev) => {
        const updated = prev.filter((g) => g.id !== id);
        localStorage.setItem("finance_goals", JSON.stringify(updated));
        return updated;
      });

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        addToQueue('DELETE_GOAL', id);
      } else {
        supabase.from("savings_goals").delete().eq("id", id).then(({ error }) => {
          if (error) console.error("Failed to delete goal:", error);
        });
      }
    },
    []
  );

  const fundGoal = useCallback(
    (id: string, amount: number) => {
      setGoals((prev) => {
        const updated = prev.map((g) =>
          g.id === id ? { ...g, current_amount: Math.max(0, g.current_amount + amount) } : g
        );
        localStorage.setItem("finance_goals", JSON.stringify(updated));
        return updated;
      });

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        addToQueue('FUND_GOAL', { id, amount });
      } else {
        // Atomic increment via Postgres RPC (eliminates read-modify-write race condition)
        supabase.rpc("fund_savings_goal", {
          p_goal_id: id,
          p_amount: amount,
        }).then(({ error }) => {
          if (error) console.error("Failed to fund goal:", error);
        });
      }
    },
    []
  );

  // ─── Computed values ─────────────────────────────────────────────

  const getSpentByCategory = useCallback(
    (category: string) =>
      transactions.filter((t) => t.category === category && t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const getTotalExpenses = useCallback(
    () => transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const getTotalIncome = useCallback(
    () => transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const getBalance = useCallback(
    () => getTotalIncome() - getTotalExpenses(),
    [getTotalIncome, getTotalExpenses]
  );

  const streak = (() => {
    const uniqueDays = [...new Set(transactions.map((t) => t.date))].sort().reverse();
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      if (uniqueDays.includes(ds)) count++;
      else if (i > 0) break;
    }
    return count;
  })();

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        settings,
        goals,
        addTransaction,
        deleteTransaction,
        editTransaction,
        updateBudget,
        updateSettings,
        addGoal,
        updateGoal,
        deleteGoal,
        fundGoal,
        getSpentByCategory,
        getTotalExpenses,
        getTotalIncome,
        getBalance,
        streak,
        isLoaded,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
