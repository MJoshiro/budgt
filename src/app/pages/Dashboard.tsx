import React, { useState } from "react";
import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Flame,
  Plus,
  ArrowRight,
  PieChart as PieChartIcon, // Renamed to avoid conflict with recharts PieChart
  Target,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { useFinance, getCategoryMeta } from "../context/FinanceContext";
import { AddTransactionModal } from "../components/AddTransactionModal";
import { UpcomingBills } from "../components/UpcomingBills";
import { QuickEntry } from "../components/QuickEntry";
import { AIInsightsCard } from "../components/AIInsightsCard";
import { AnomalyBanner } from "../components/AnomalyBanner";
import { useNavigate, Link } from "react-router";
import { getToday } from "../lib/utils";
import { HeroArt } from "../components/HeroArt";
import { RightSidebarPortal } from "../context/RightSidebarContext";
import {
  WalletArt,
  TransactionsArt,
  StreakArt,
  CategoryArt,
} from "../components/ui/CardArt";
import { SketchBorder } from "../components/ui/SketchyBorder";
import { formatCurrency, formatPercentage } from "../../lib/formatters";
import { IncomeVsExpenseChart } from "../components/charts/IncomeVsExpenseChart";
import { NetWorthChart } from "../components/charts/NetWorthChart";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      type: "spring" as const,
      damping: 24,
      stiffness: 260,
    },
  }),
};

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-overlay p-5">
      <div className="h-3 w-16 bg-surface-active rounded mb-3 animate-pulse" />
      <div className="h-7 w-28 bg-surface-active rounded mb-2 animate-pulse" />
      <div className="h-2.5 w-20 bg-surface-hover rounded animate-pulse" />
    </div>
  );
}

export function Dashboard() {
  const {
    transactions,
    getTotalExpenses,
    getTotalIncome,
    getBalance,
    streak,
    getSpentByCategory,
    budgets,
    settings,
    goals,
  } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const totalExpenses = getTotalExpenses();
  const totalIncome = getTotalIncome();
  const balance = getBalance();
  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
  const today = getToday();
  const todayTransactions = transactions.filter((t) => t.date === today);
  const todayTotal = todayTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const recentTransactions = transactions.slice(0, 5); // Used for the old "Recent Activity" block

  const categorySpending = budgets.map((b) => ({
    category: b.category,
    spent: getSpentByCategory(b.category),
    limit: b.limit,
  }));
  const topCategory = [...categorySpending].sort(
    (a, b) => b.spent - a.spent,
  )[0];

  const pieData = categorySpending
    .filter((cat) => cat.spent > 0)
    .map((cat) => ({
      name: cat.category,
      value: cat.spent,
      color: getCategoryMeta(cat.category).color,
    }));
  const totalSpent = pieData.reduce((sum, entry) => sum + entry.value, 0);

  const topBudgets = [...budgets]
    .sort(
      (a, b) => getSpentByCategory(b.category) - getSpentByCategory(a.category),
    )
    .slice(0, 3); // Placeholder for top budgets

  const getCategorySpent = getSpentByCategory; // Alias for clarity in new code

  const recentActivity = transactions.slice(0, 5); // Placeholder for recent activity

  const summaryCards = [
    {
      title: "Balance",
      value: formatCurrency(balance, settings.currency),
      subtitle: `${totalIncome > 0 ? `${formatCurrency(totalIncome, settings.currency)} earned` : "No income yet"}`,
      icon: Wallet,
      bg: "linear-gradient(135deg, #7B8F6B 0%, #5C7252 50%, #4C6648 100%)",
      textColor: "text-[#E5E4DF]", // Ivory
      subTextColor: "text-[#E5E4DF]/80", // Ivory light
      iconBg: "rgba(255,255,255,0.12)",
      iconColor: "#E5E4DF",
      Art: WalletArt,
    },
    {
      title: "Today",
      value: formatCurrency(todayTotal, settings.currency),
      subtitle: `${todayTransactions.length} transaction${todayTransactions.length !== 1 ? "s" : ""}`,
      icon: todayTotal > 50 ? TrendingDown : TrendingDown, // Wait, user screenshot shows TrendingDown and title Today.
      bg: "linear-gradient(135deg, #C9938A 0%, #B87D75 50%, #A8706A 100%)",
      textColor: "text-[#E5E4DF]", // Ivory
      subTextColor: "text-[#E5E4DF]/80", // Ivory light
      iconBg: "rgba(255,255,255,0.12)",
      iconColor: "#E5E4DF",
      Art: TransactionsArt,
    },
    {
      title: "Tracking streak",
      value: `${streak} day${streak !== 1 ? "s" : ""}`,
      subtitle: "Keep going",
      icon: Flame,
      bg: "linear-gradient(135deg, #F0E6D4 0%, #E8D9C2 50%, #DFD0B8 100%)",
      textColor: "text-[#191919]", // Slate Dark
      subTextColor: "text-[#40403E]/80", // Slate Light
      iconBg: "rgba(0,0,0,0.05)",
      iconColor: "#262625",
      Art: StreakArt,
    },
    {
      title: "Top category",
      value: topCategory
        ? formatCurrency(topCategory.spent, settings.currency)
        : formatCurrency(0, settings.currency),
      subtitle: topCategory?.category || "None",
      icon: TrendingUp, // TrendingUp is what's on the right of the top category card in the image
      bg: "linear-gradient(135deg, #7B8FA8 0%, #5E7590 50%, #4A6280 100%)",
      textColor: "text-[#E5E4DF]", // Ivory
      subTextColor: "text-[#E5E4DF]/80", // Ivory light
      iconBg: "rgba(255,255,255,0.12)",
      iconColor: "#E5E4DF",
      Art: CategoryArt,
    },
  ];

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        {/* Hero Banner with Hand-Drawn Art */}
        <div className="relative rounded-2xl bg-surface-overlay border border-border-subtle overflow-hidden p-6 sm:p-8 flex items-center justify-between mb-2">
          <div className="relative z-10 max-w-sm">
            <motion.h1
              className="text-text-primary text-2xl sm:text-3xl mb-2 font-medium"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Good{" "}
              {new Date().getHours() < 12
                ? "morning"
                : new Date().getHours() < 18
                  ? "afternoon"
                  : "evening"}
              , {settings.name}
            </motion.h1>
            <motion.p
              className="text-text-tertiary text-sm sm:text-base mb-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Here's your spending overview for today.
            </motion.p>
            <motion.button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-primary-foreground text-sm hover:bg-primary-hover transition-colors shadow-sm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus size={16} strokeWidth={2} />
              <span>Add transaction</span>
            </motion.button>
          </div>

          {/* The Hand-Drawn Hero SVG */}
          <HeroArt className="absolute -right-8 -bottom-16 w-64 h-64 sm:w-80 sm:h-80 text-primary opacity-[0.85] rotate-[-5deg] pointer-events-none" />
        </div>

        {/* Quick Entry */}
        <QuickEntry />

        {/* Anomaly Banners */}
        <AnomalyBanner />

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {summaryCards.map((card, i) => (
              <motion.div
                key={card.title}
                custom={i}
                className="group relative cursor-pointer min-h-[160px]"
                initial={{ opacity: 0, y: 16 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: i * 0.08,
                    type: "spring",
                    damping: 24,
                    stiffness: 260,
                  },
                }}
                whileHover={{ y: -2, zIndex: 10 }}
              >
                {/* Background Fill + Shadow */}
                <div
                  className="absolute inset-[3px] rounded-[4px] transition-all duration-300 group-hover:scale-[1.01] shadow-[3px_4px_0px_0px_rgba(19,19,19,0.4)] group-hover:shadow-[5px_6px_0px_0px_rgba(19,19,19,0.6)]"
                  style={{ background: card.bg }}
                />

                {/* The Sketchy SVG Border Overlay */}
                <SketchBorder seed={i} w={300} h={160} />

                {/* SVG Background Art container */}
                <div className="absolute inset-[3px] z-0 pointer-events-none opacity-[0.18] overflow-hidden rounded-[4px] transition-transform duration-300 group-hover:scale-[1.01]">
                  <card.Art className="w-full h-full object-cover" />
                </div>

                {/* Content Wrapper */}
                <div className="relative z-10 flex flex-col h-full justify-between p-5 sm:p-6 pointer-events-none min-w-0">
                  {/* Top: Title & Icon */}
                  <div className="flex items-start justify-between mb-8">
                    <span
                      className={`text-[12px] tracking-widest uppercase mt-1 font-medium ${card.subTextColor}`}
                    >
                      {card.title}
                    </span>
                    <div
                      className="p-1.5 rounded-lg flex items-center justify-center backdrop-blur-md transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: card.iconBg }}
                    >
                      <card.icon
                        size={16}
                        style={{ color: card.iconColor }}
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  {/* Bottom: Value & Subtext */}
                  <div className="mt-auto transition-transform duration-300 group-hover:translate-x-1">
                    <p
                      className={`text-[2rem] leading-none mb-2 font-serif tracking-tight drop-shadow-sm ${card.textColor}`}
                    >
                      {card.value}
                    </p>
                    <p className={`text-[13px] ${card.subTextColor}`}>
                      {card.subtitle}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Charts Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            className="group relative p-5 sm:p-6 cursor-default h-[400px] flex flex-col min-w-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Background Fill + Shadow */}
            <div className="absolute inset-[3px] rounded-[4px] bg-surface-base shadow-[3px_4px_0px_0px_rgba(19,19,19,0.3)] transition-all duration-300" />

            <SketchBorder seed={10} w={800} h={500} strokeWidth={3.5} />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[13px] text-text-primary font-bold flex items-center gap-2 tracking-widest uppercase">
                  <PieChartIcon
                    size={16}
                    className="text-primary"
                    strokeWidth={2}
                  />{" "}
                  6-Month Flow
                </h3>
              </div>
              <div className="flex-1 min-h-0">
                <IncomeVsExpenseChart />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="group relative p-5 sm:p-6 cursor-default h-[400px] flex flex-col min-w-0"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Background Fill + Shadow */}
            <div className="absolute inset-[3px] rounded-[4px] bg-surface-base shadow-[3px_4px_0px_0px_rgba(19,19,19,0.3)] transition-all duration-300" />

            <SketchBorder seed={11} w={800} h={500} strokeWidth={3.5} />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[13px] text-text-primary font-bold flex items-center gap-2 tracking-widest uppercase">
                  <TrendingUp
                    size={16}
                    className="text-primary"
                    strokeWidth={2}
                  />{" "}
                  Net Worth History
                </h3>
              </div>
              <div className="flex-1 min-h-0">
                <NetWorthChart />
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Insights */}
        <AIInsightsCard />

        {/* Upcoming Bills */}
        <UpcomingBills />

        {/* Goals Mini Widget */}
        {goals.length > 0 && (
          <motion.div
            className="group relative p-5 sm:p-6 cursor-pointer"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.35,
              type: "spring",
              damping: 24,
              stiffness: 260,
            }}
            whileHover={{ y: -2, zIndex: 10 }}
          >
            {/* Background Fill + Shadow */}
            <div className="absolute inset-[3px] rounded-[4px] bg-[#E5E4DF] shadow-[3px_4px_0px_0px_rgba(19,19,19,0.4)] group-hover:shadow-[5px_6px_0px_0px_rgba(19,19,19,0.6)] transition-all duration-300 group-hover:scale-[1.01]" />

            <SketchBorder seed={12} w={1200} h={250} strokeWidth={3.5} />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full pointer-events-none">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] text-[#191919] font-bold flex items-center gap-2 tracking-widest uppercase">
                  <Target size={16} className="text-[#BF4D43]" strokeWidth={2} />{" "}
                  Goals Progress
                </h3>
                <Link
                  to="/goals"
                  className="text-[12px] text-[#BF4D43] hover:underline flex items-center font-medium pointer-events-auto"
                >
                  View All <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-2.5">
                {goals.slice(0, 3).map((g) => {
                  const pct =
                    g.target_amount > 0
                      ? Math.min(
                          (g.current_amount / g.target_amount) * 100,
                          100,
                        )
                      : 0;
                  return (
                    <div key={g.id} className="space-y-1">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#40403E] font-medium truncate max-w-[160px]">
                          {g.name}
                        </span>
                        <span className="text-[#666663] tabular-nums">
                          {formatCurrency(g.current_amount, settings.currency)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#191919]/10 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: g.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Right Sidebar Portal for Dashboard secondary widgets */}
      <RightSidebarPortal>
        <div className="p-5 space-y-6">
          {/* Budget Overview Widget */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <h3 className="text-text-primary text-[13px] font-medium flex items-center gap-2">
                <Target size={15} className="text-purple-500" /> Top Budgets
              </h3>
              <Link
                to="/budget"
                className="text-[11px] text-primary hover:underline flex items-center"
              >
                View All <ChevronRight size={12} />
              </Link>
            </div>
            {topBudgets.length > 0 ? (
              <div className="space-y-4">
                {topBudgets.map((budget) => {
                  const spent = getCategorySpent(budget.category);
                  const progress = Math.min((spent / budget.limit) * 100, 100);
                  const meta = getCategoryMeta(budget.category);
                  const isWarning = progress > 85;

                  return (
                    <div key={budget.category} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-text-secondary">
                            {budget.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-[12px] font-medium ${isWarning ? "text-warning" : "text-text-primary"}`}
                          >
                            {formatCurrency(spent, settings.currency)}
                          </span>
                          <span className="text-[11px] text-text-ghost ml-1">
                            /{" "}
                            {formatCurrency(
                              budget.limit,
                              settings.currency,
                            ).replace(".00", "")}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-surface-raised rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: meta.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[12px] text-text-ghost text-center py-4">
                No active budgets.
              </p>
            )}
          </div>

          {/* Recent Activity Widget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
              <h3 className="text-text-primary text-[13px] font-medium flex items-center gap-2">
                <RefreshCw size={15} className="text-text-tertiary" /> Recent
                Activity
              </h3>
              <Link
                to="/transactions"
                className="text-[11px] text-primary hover:underline flex items-center"
              >
                History <ChevronRight size={12} />
              </Link>
            </div>
            <div className="space-y-1">
              {recentActivity.length > 0 ? (
                recentActivity.map((t) => {
                  const meta = getCategoryMeta(t.category);
                  const isIncome = t.type === "income";

                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br ${meta.gradient} bg-opacity-10`}
                        >
                          <div className="text-white opacity-90">
                            {meta.icon}
                          </div>
                        </div>
                        <div className="truncate">
                          <p className="text-[13px] text-text-primary font-medium truncate">
                            {t.description}
                          </p>
                          <p className="text-[11px] text-text-ghost truncate">
                            {t.category} •{" "}
                            {new Date(t.date).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[13px] font-medium whitespace-nowrap pl-2 ${isIncome ? "text-success" : "text-text-primary"}`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatCurrency(t.amount, settings.currency)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="text-[12px] text-text-ghost text-center py-4">
                  No recent transactions.
                </p>
              )}
            </div>
          </div>
        </div>
      </RightSidebarPortal>

      <AddTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
