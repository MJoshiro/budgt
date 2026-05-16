import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import supabase from "../../lib/supabase";
import { useAuth } from "./AuthContext";
import { addToQueue } from "../../lib/offlineQueue";

export type AccountType = 'cash' | 'bank' | 'credit_card' | 'e_wallet' | 'investment';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  current_balance: number;
  currency: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at?: string;
}

interface AccountsContextType {
  accounts: Account[];
  isLoaded: boolean;
  addAccount: (account: Omit<Account, "id" | "user_id" | "current_balance"> & { starting_balance: number }) => void;
  updateAccount: (id: string, updates: Partial<Omit<Account, "id" | "user_id" | "current_balance">>) => void;
  deleteAccount: (id: string) => void;
  getDefaultAccount: () => Account | undefined;
}

const AccountsContext = createContext<AccountsContextType | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const cached = localStorage.getItem("finance_accounts");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!user || hasFetched.current) return;
    hasFetched.current = true;

    const fetchAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped: Account[] = data.map((row: any) => ({
            id: row.id,
            user_id: row.user_id,
            name: row.name,
            type: row.type as AccountType,
            current_balance: parseFloat(row.current_balance || 0),
            currency: row.currency,
            icon: row.icon,
            color: row.color,
            is_default: row.is_default,
          }));
          setAccounts(mapped);
          localStorage.setItem("finance_accounts", JSON.stringify(mapped));
        } else {
            // Seed a default account if user has none
            seedDefaultAccount(user.id);
        }
      } catch (err) {
        console.warn("Falling back to localStorage for accounts", err);
        const cached = localStorage.getItem("finance_accounts");
        if (cached) setAccounts(JSON.parse(cached));
      } finally {
        setIsLoaded(true);
      }
    };

    fetchAccounts();
  }, [user]);

  const seedDefaultAccount = async (userId: string) => {
    const defaultId = crypto.randomUUID();
    const defaultAcc: Account = {
        id: defaultId,
        user_id: userId,
        name: "Main Wallet",
        type: "cash",
        current_balance: 0,
        currency: "PHP",
        icon: "Wallet",
        color: "#D4845A",
        is_default: true
    };
    
    setAccounts([defaultAcc]);
    localStorage.setItem("finance_accounts", JSON.stringify([defaultAcc]));

    // Try to save to DB, but don't crash if tables aren't made yet (graceful fallback)
    try {
        await supabase.from("accounts").insert({
            id: defaultId,
            user_id: userId,
            name: defaultAcc.name,
            type: defaultAcc.type,
            current_balance: 0,
            currency: defaultAcc.currency,
            icon: defaultAcc.icon,
            color: defaultAcc.color,
            is_default: true
        });
    } catch (e) {
        console.log("DB might not have accounts table yet", e);
    }
  }

  const addAccount = useCallback(async (account: Omit<Account, "id" | "user_id" | "current_balance"> & { starting_balance: number }) => {
    if (!user) return;
    const newId = crypto.randomUUID();
    
    // De-duplicate default if this new one is marked default
    let updatedAccounts = [...accounts];
    if (account.is_default) {
        updatedAccounts = updatedAccounts.map(a => ({...a, is_default: false}));
    }

    const newAcc: Account = {
        ...account,
        id: newId,
        user_id: user.id,
        current_balance: account.starting_balance // Initial mock
    };

    updatedAccounts.push(newAcc);
    setAccounts(updatedAccounts);
    localStorage.setItem("finance_accounts", JSON.stringify(updatedAccounts));

    try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
            addToQueue('INSERT_ACCOUNT', newAcc);
        } else {
            if (account.is_default) {
                await supabase.from("accounts").update({ is_default: false }).eq("user_id", user.id);
            }
            await supabase.from("accounts").insert({
                id: newId,
                user_id: user.id,
                name: account.name,
                type: account.type,
                current_balance: account.starting_balance,
                currency: account.currency,
                icon: account.icon,
                color: account.color,
                is_default: account.is_default
            });
        }
    } catch (err) {
        console.error("Failed to add account", err);
    }
  }, [user, accounts]);

  const updateAccount = useCallback(async (id: string, updates: Partial<Omit<Account, "id" | "user_id" | "current_balance">>) => {
    if (!user) return;
    
    let updatedAccounts = [...accounts];
    if (updates.is_default) {
        updatedAccounts = updatedAccounts.map(a => ({...a, is_default: false}));
    }
    
    updatedAccounts = updatedAccounts.map(a => a.id === id ? { ...a, ...updates } : a);
    setAccounts(updatedAccounts);
    localStorage.setItem("finance_accounts", JSON.stringify(updatedAccounts));

    try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
            addToQueue('UPDATE_ACCOUNT', { id, updates });
        } else {
            if (updates.is_default) {
                await supabase.from("accounts").update({ is_default: false }).eq("user_id", user.id);
            }
            await supabase.from("accounts").update(updates).eq("id", id);
        }
    } catch (err) {
        console.error("Failed to update account", err);
    }
  }, [user, accounts]);

  const deleteAccount = useCallback(async (id: string) => {
    if (!user) return;
    const remaining = accounts.filter(a => a.id !== id);
    
    // Ensure there's a default
    if (remaining.length > 0 && !remaining.some(a => a.is_default)) {
        remaining[0].is_default = true;
        // background update to supabase...
    }

    setAccounts(remaining);
    localStorage.setItem("finance_accounts", JSON.stringify(remaining));

    try {
        if (typeof navigator !== "undefined" && !navigator.onLine) {
            addToQueue('DELETE_ACCOUNT', id);
        } else {
            await supabase.from("accounts").delete().eq("id", id);
        }
    } catch (err) {
        console.error("Failed to delete account", err);
    }
  }, [user, accounts]);

  const getDefaultAccount = useCallback(() => {
    return accounts.find(a => a.is_default) || accounts[0];
  }, [accounts]);

  return (
    <AccountsContext.Provider value={{ accounts, isLoaded, addAccount, updateAccount, deleteAccount, getDefaultAccount }}>
      {children}
    </AccountsContext.Provider>
  );
}

export function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error("useAccounts must be used within AccountsProvider");
  return ctx;
}
