import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { useAccounts } from "../../context/AccountsContext";
import { useFinance } from "../../context/FinanceContext";
import { format, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns";

export function NetWorthChart() {
  const { accounts } = useAccounts();
  const { transactions, settings } = useFinance();

  const data = useMemo(() => {
    // Current total net worth based on live accounts
    const currentNetWorth = accounts.reduce((sum, acc) => sum + acc.current_balance, 0);

    const today = new Date();
    const intervalStart = subMonths(today, 5); // 6 months visualization
    const months = eachMonthOfInterval({ start: intervalStart, end: today });

    // We'll calculate backwards from the current network by reversing transactions per month
    // E.g., Net Worth month M-1 = Net Worth M - (Income M) + (Expenses M)
    let runningNetWorth = currentNetWorth;
    const history = [];

    // Traverse from current month backwards
    const reversedMonths = [...months].reverse();

    for (const monthDate of reversedMonths) {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthName = format(monthDate, "MMM yy");

      history.unshift({
        name: monthName,
        value: Math.round(runningNetWorth),
      });

      // Calculate net flow for this month to step backwards
      const monthTxs = transactions.filter(
        (t) => new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd
      );

      const income = monthTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      const netFlow = income - expenses;
      
      // Since we are going backwards in time, reverse the net flow to find previous month's balance
      runningNetWorth = runningNetWorth - netFlow;
    }

    return history;
  }, [accounts, transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md border border-border-default bg-surface-raised px-4 py-3 shadow-xl min-w-[140px]">
          <p className="text-text-primary font-medium mb-3">{label}</p>
          <div className="space-y-1.5 flex flex-col">
              <div className="flex justify-between items-center text-[12px] gap-4">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
                  Net Worth
                </span>
                <span className="text-text-primary font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: settings.currency,
                    maximumFractionDigits: 0,
                  }).format(payload[0].value)}
                </span>
              </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
          <XAxis
            dataKey="name"
            stroke="var(--border-subtle)"
            tick={{ fill: "var(--text-quaternary)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="var(--border-subtle)"
            tick={{ fill: "var(--text-quaternary)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val) => val >= 1000 ? `${val / 1000}k` : val}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-subtle)', strokeWidth: 1, strokeDasharray: '3 3' }} />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="var(--primary)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#netWorthGrad)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
