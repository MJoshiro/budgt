import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { useFinance } from "../../context/FinanceContext";

export function IncomeVsExpenseChart() {
  const { transactions, settings } = useFinance();

  const data = useMemo(() => {
    const today = new Date();
    const intervalStart = subMonths(today, 5); // Show last 6 months
    const months = eachMonthOfInterval({ start: intervalStart, end: today });

    return months.map((monthDate) => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthName = format(monthDate, "MMM yy");

      const monthTxs = transactions.filter(
        (t) => new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd
      );

      const income = monthTxs
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTxs
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        name: monthName,
        income: Math.round(income),
        expenses: Math.round(expenses),
      };
    });
  }, [transactions]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md border border-border-default bg-surface-raised px-4 py-3 shadow-xl min-w-[140px]">
          <p className="text-text-primary font-medium mb-3">{label}</p>
          <div className="space-y-1.5 flex flex-col">
            {payload.map((p: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-[12px] gap-4">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name === 'income' ? 'Income' : 'Expenses'}
                </span>
                <span className="text-text-primary font-medium">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: settings.currency,
                    maximumFractionDigits: 0,
                  }).format(p.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex gap-4 justify-center mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-[11px] text-text-secondary font-medium uppercase tracking-wider">
              {entry.value === 'income' ? 'Total Income' : 'Total Expenses'}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barGap={2}
        >
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--surface-hover)' }} />
          <Legend content={<CustomLegend />} />
          <Bar dataKey="income" fill="var(--success)" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
          <Bar dataKey="expenses" fill="var(--danger)" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1000} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
