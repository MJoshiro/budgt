import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { useFinance, getCategoryMeta, EXPENSE_CATEGORIES } from "../context/FinanceContext";
import { EmptyAnalyticsArt } from "../components/EmptyAnalyticsArt";
import { RightSidebarPortal } from "../context/RightSidebarContext";
import { formatCurrency } from "../../lib/formatters";
import { DateRangeSelector, filterByDateRange } from "../components/DateRangeSelector";
import type { PresetKey, DateRange } from "../components/DateRangeSelector";
import { CashFlowCalendar } from "../components/ui/CashFlowCalendar";

type Tab = "overview" | "categories" | "trends" | "calendar";

const COLORS = [
  "#D4845A", "#7A9E7E", "#C4956A", "#8B7EC8", "#6B9E8A",
  "#C75B4A", "#7B8EC8", "#8EA89E", "#9EAE7A", "#8C8478",
];

export function Analytics() {
  const { transactions, settings } = useFinance();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<PresetKey>("this_month");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  // Filter transactions by date range, then isolate expenses
  const filteredTransactions = useMemo(
    () => filterByDateRange(transactions, dateRange),
    [transactions, dateRange]
  );
  const expenses = filteredTransactions.filter((t) => t.type === 'expense');

  const categoryData = useMemo(() => {
    const spentMap: Record<string, number> = {};
    expenses.forEach((t) => {
      spentMap[t.category] = (spentMap[t.category] || 0) + t.amount;
    });
    return EXPENSE_CATEGORIES.map((cat, i) => ({
      name: cat,
      value: spentMap[cat] || 0,
      color: COLORS[i % COLORS.length],
      icon: getCategoryMeta(cat).icon,
    })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const totalSpent = categoryData.reduce((s, d) => s + d.value, 0);

  const dailyData = (() => {
    const days: Record<string, number> = {};
    expenses.forEach((e) => {
      days[e.date] = (days[e.date] || 0) + e.amount;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: date.substring(5),
        amount: Math.round(amount * 100) / 100,
      }));
  })();

  const barData = categoryData.map((d) => ({
    name: d.name.split(" ")[0],
    amount: Math.round(d.value * 100) / 100,
    fill: d.color,
  }));

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "categories", label: "Categories" },
    { key: "trends", label: "Trends" },
    { key: "calendar", label: "Calendar" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md border border-border-default bg-surface-raised px-3 py-2 shadow-xl">
          <p className="text-text-tertiary text-[11px]">{label}</p>
          <p className="text-text-primary text-sm">{formatCurrency(payload[0].value, settings.currency)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <motion.h1
            className="text-text-primary"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Analytics
          </motion.h1>
          <motion.p
            className="text-text-tertiary text-sm mt-0.5"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
          >
            Understand where your money goes
          </motion.p>
        </div>
        <DateRangeSelector
          value={datePreset}
          onChange={(key, range) => { setDatePreset(key); setDateRange(range); }}
        />
      </div>

      {expenses.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center py-16 text-text-quaternary"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <EmptyAnalyticsArt className="w-56 h-56 text-text-ghost mb-2 opacity-50" />
          <p className="text-sm font-medium text-text-secondary">Not enough data</p>
          <p className="text-[12px] text-text-ghost mt-1">Add some expenses to unlock your analytics.</p>
        </motion.div>
      ) : (
        <>
          {/* Tabs */}
          <motion.div
            className="flex gap-0.5 rounded-lg bg-surface-overlay p-0.5 border border-border-subtle"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 py-2 px-3 rounded-md text-[13px] transition-colors ${
                  activeTab === tab.key ? "text-text-primary" : "text-text-quaternary hover:text-text-tertiary"
                }`}
              >
                {activeTab === tab.key && (
                  <motion.div
                    className="absolute inset-0 rounded-md bg-surface-active"
                    layoutId="analyticsTab"
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                {/* Donut */}
                <div className="rounded-xl border border-border-subtle bg-surface-overlay p-5">
                  <h3 className="text-text-primary text-sm mb-4">Spending breakdown</h3>
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <ResponsiveContainer width={230} height={230}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                            animationBegin={200}
                            animationDuration={700}
                            onMouseEnter={(_, index) =>
                              setSelectedCategory(categoryData[index].name)
                            }
                            onMouseLeave={() => setSelectedCategory(null)}
                          >
                            {categoryData.map((entry) => (
                              <Cell
                                key={entry.name}
                                fill={entry.color}
                                opacity={
                                  selectedCategory
                                    ? selectedCategory === entry.name ? 1 : 0.25
                                    : 0.75
                                }
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                            <p className="text-xl text-text-primary tracking-tight">{formatCurrency(totalSpent, settings.currency)}</p>
                            <p className="text-[11px] text-text-quaternary">Total</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Area Chart */}
                  <div className="rounded-xl border border-border-subtle bg-surface-overlay p-5">
                  <h3 className="text-text-primary text-sm mb-4">Daily spending</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyData}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis
                        dataKey="date"
                        stroke="var(--border-subtle)"
                        tick={{ fill: "var(--text-quaternary)", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="var(--border-subtle)"
                        tick={{ fill: "var(--text-quaternary)", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="var(--primary)"
                        strokeWidth={1.5}
                        fill="url(#areaGrad)"
                        animationDuration={1000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {activeTab === "categories" && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-border-subtle bg-surface-overlay p-5">
                  <h3 className="text-text-primary text-sm mb-4">By category</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={barData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis
                        dataKey="name"
                        stroke="var(--border-subtle)"
                        tick={{ fill: "var(--text-quaternary)", fontSize: 10 }}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={55}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="var(--border-subtle)"
                        tick={{ fill: "var(--text-quaternary)", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]} animationDuration={700}>
                        {barData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} opacity={0.75} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryData.map((d, i) => (
                    <motion.div
                      key={d.name}
                      className="rounded-lg border border-border-subtle bg-surface-overlay p-4 hover:bg-surface-hover transition-colors"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                          style={{ backgroundColor: `${d.color}14` }}
                        >
                          {d.icon}
                        </div>
                        <div>
                          <p className="text-[13px] text-text-primary">{d.name}</p>
                          <p className="text-[11px] text-text-quaternary">
                            {expenses.filter((e) => e.category === d.name).length} items
                          </p>
                        </div>
                      </div>
                      <p className="text-lg text-text-primary tracking-tight">{formatCurrency(d.value, settings.currency)}</p>
                      <p className="text-[11px] text-text-quaternary mt-0.5">
                        {((d.value / totalSpent) * 100).toFixed(1)}% of total
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "trends" && (
              <motion.div
                key="trends"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-border-subtle bg-surface-overlay p-5">
                  <h3 className="text-text-primary text-sm mb-1">Cumulative spending</h3>
                  <p className="text-[12px] text-text-quaternary mb-4">See how it adds up over time</p>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart
                      data={dailyData.reduce<{ date: string; amount: number; cumulative: number }[]>(
                        (acc, d) => {
                          const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
                          acc.push({ ...d, cumulative: Math.round((prev + d.amount) * 100) / 100 });
                          return acc;
                        },
                        []
                      )}
                    >
                      <defs>
                        <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--success)" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                      <XAxis
                        dataKey="date"
                        stroke="var(--border-subtle)"
                        tick={{ fill: "var(--text-quaternary)", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="var(--border-subtle)"
                        tick={{ fill: "var(--text-quaternary)", fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="cumulative"
                        stroke="var(--success)"
                        strokeWidth={1.5}
                        fill="url(#cumGrad)"
                        animationDuration={1200}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Average per day", value: formatCurrency(totalSpent / Math.max(dailyData.length, 1), settings.currency), colorVar: "var(--primary)" },
                    { label: "Highest day", value: formatCurrency(Math.max(...dailyData.map((d) => d.amount), 0), settings.currency), colorVar: "var(--danger)" },
                    { label: "Lowest day", value: formatCurrency(Math.min(...dailyData.map((d) => d.amount), 0), settings.currency), colorVar: "var(--success)" },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      className="rounded-lg border border-border-subtle bg-surface-overlay p-4"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full mb-3" style={{ backgroundColor: stat.colorVar }} />
                      <p className="text-lg text-text-primary tracking-tight">{stat.value}</p>
                      <p className="text-[12px] text-text-quaternary mt-0.5">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
               </motion.div>
            )}

            {activeTab === "calendar" && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="w-full"
              >
                <div className="mb-4">
                  <h3 className="text-text-primary text-sm mb-1">Cash Flow</h3>
                  <p className="text-[12px] text-text-quaternary">Daily breakdown of your net income vs. expenses</p>
                </div>
                <CashFlowCalendar />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Right Sidebar Widget for Analytics */}
      <RightSidebarPortal>
        <div className="p-5 space-y-6">
          <div className="space-y-4">
            <h3 className="text-text-primary text-[13px] font-medium border-b border-border-subtle pb-2">
              Spending Breakdown
            </h3>
            {categoryData.length > 0 ? (
              <div className="space-y-1.5">
                {categoryData.map((d) => (
                  <div
                    key={d.name}
                    className="flex justify-between items-center text-[13px] cursor-pointer hover:bg-surface-hover rounded-md p-2 transition-colors -mx-2"
                    onMouseEnter={() => setSelectedCategory(d.name)}
                    onMouseLeave={() => setSelectedCategory(null)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="text-text-primary">{d.icon} {d.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-text-primary font-medium">{formatCurrency(d.value, settings.currency)}</span>
                      <span className="text-text-quaternary text-[11px] w-8 text-right shrink-0">
                        {((d.value / totalSpent) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-text-ghost py-4">No spending data.</p>
            )}
          </div>

          {dailyData.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border-subtle">
              <h3 className="text-text-primary text-[13px] font-medium border-b border-border-subtle pb-2">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-text-tertiary">Total Expenses</span>
                  <span className="text-text-primary font-medium">{formatCurrency(totalSpent, settings.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-text-tertiary">Average per day</span>
                  <span className="text-text-primary font-medium">{formatCurrency(totalSpent / Math.max(dailyData.length, 1), settings.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-text-tertiary">Highest day</span>
                  <span className="text-text-primary font-medium">{formatCurrency(Math.max(...dailyData.map((d) => d.amount), 0), settings.currency)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </RightSidebarPortal>
    </div>
  );
}
