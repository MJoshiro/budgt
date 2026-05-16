import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Info, ChevronRight, ChevronLeft, ExternalLink } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import { fetchWeeklyInsights, type SpendingSummary, type WeeklyInsight, type WeeklyInsightItem } from "../../lib/aiService";
import { AIInsightArt } from "./ui/CardArt";
import { useNavigate } from "react-router";
import { FoodIcon, ShoppingIcon, TransportIcon, EntertainmentIcon } from "./ui/CategoryIcons";

const CACHE_KEY = "ai_weekly_insights_v9";
const CACHE_HASH_KEY = "ai_weekly_insights_hash_v9";
const DEVIATION_THRESHOLD = 0.05; // 5%

function getIconForType(iconType: string) {
  switch (iconType) {
    case "trend_up": return <TrendingUp size={24} />;
    case "trend_down": return <TrendingDown size={24} />;
    case "warning": return <AlertTriangle size={24} />;
    case "success": return <CheckCircle size={24} />;
    case "food": return <FoodIcon size={24} />;
    case "shopping": return <ShoppingIcon size={24} />;
    case "transport": return <TransportIcon size={24} />;
    case "entertainment": return <EntertainmentIcon size={24} />;
    case "info":
    default: return <Info size={24} />;
  }
}

function getColorClassesForType(type: string) {
  switch (type) {
    case "alert": return { bg: "bg-warning-subtle", text: "text-warning", border: "border-warning/20" };
    case "praise": return { bg: "bg-success-subtle", text: "text-success", border: "border-success/20" };
    case "tip":
    default: return { bg: "bg-primary-subtle", text: "text-primary", border: "border-primary/20" };
  }
}

export function AIInsightsCard() {
  const { transactions, settings } = useFinance();
  const [insight, setInsight] = useState<WeeklyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Compute state hash for cache invalidation
  const currentHash = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStr = weekStart.toISOString().split("T")[0];
    const weekTxs = transactions.filter((t) => t.date >= weekStr);
    const totalSpend = weekTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return `${weekTxs.length}|${totalSpend.toFixed(0)}`;
  }, [transactions]);

  // Build summary for API call
  const buildSummary = (): SpendingSummary => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStr = weekStart.toISOString().split("T")[0];
    const weekTxs = transactions.filter((t) => t.date >= weekStr);

    const income = weekTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = weekTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    const catMap: Record<string, { amount: number; count: number }> = {};
    weekTxs.filter((t) => t.type === "expense").forEach((t) => {
      if (!catMap[t.category]) catMap[t.category] = { amount: 0, count: 0 };
      catMap[t.category].amount += t.amount;
      catMap[t.category].count++;
    });

    const breakdown = Object.entries(catMap)
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      categoryBreakdown: breakdown,
      topCategory: breakdown[0]?.category || "None",
      transactionCount: weekTxs.length,
      savingsRate: income > 0 ? (income - expenses) / income : 0,
    };
  };

  const fetchInsight = async () => {
    setLoading(true);
    try {
      const summary = buildSummary();
      if (summary.transactionCount === 0) {
        setInsight({ 
          insights: [{ 
            type: "tip", 
            icon_type: "info", 
            title: "Welcome!", 
            description: "Add transactions to unlock personalized AI insights.", 
            action: null 
          }] 
        });
        setLoading(false);
        return;
      }
      const result = await fetchWeeklyInsights(summary);
      setInsight(result);
      // reset scroll
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      setCurrentIndex(0);
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      localStorage.setItem(CACHE_HASH_KEY, currentHash);
    } catch (err) {
      console.error("Insight fetch failed:", err);
      setInsight({ 
        insights: [{ 
          type: "alert", 
          icon_type: "warning", 
          title: "Service Unavailable", 
          description: "Couldn't generate insights right now. Try again later.", 
          action: null 
        }] 
      });
    }
    setLoading(false);
  };

  // Load cached insight or refresh
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedHash = localStorage.getItem(CACHE_HASH_KEY);

    if (cached && cachedHash) {
      try {
        setInsight(JSON.parse(cached));
      } catch {
        // ignore parse error
      }
      
      const [cachedCount, cachedSpend] = cachedHash.split("|").map(Number);
      const [currCount, currSpend] = currentHash.split("|").map(Number);
      const spendDeviation = cachedSpend > 0 ? Math.abs(currSpend - cachedSpend) / cachedSpend : 1;
      const countDeviation = cachedCount > 0 ? Math.abs(currCount - cachedCount) / cachedCount : 1;

      if (spendDeviation > DEVIATION_THRESHOLD || countDeviation > DEVIATION_THRESHOLD) {
        fetchInsight();
      }
    } else if (transactions.length > 0) {
      fetchInsight();
    }
  }, [currentHash]);

  // Track scroll position to update pagination dots
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const scrollLeft = scrollContainerRef.current.scrollLeft;
    const width = scrollContainerRef.current.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== currentIndex) setCurrentIndex(newIndex);
  };

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollBy({ left: -width, behavior: 'smooth' });
    }
  };

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollBy({ left: width, behavior: 'smooth' });
    }
  };

  return (
    <motion.div
      className="relative rounded-xl border border-border-default bg-surface-raised overflow-hidden shadow-sm"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Background SVG Art */}
      <div className="absolute -right-8 -bottom-12 w-56 h-56 z-0 pointer-events-none opacity-[0.06] text-primary">
        <AIInsightArt className="w-full h-full object-cover" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" strokeWidth={1.5} />
          <h3 className="text-[13px] text-text-primary font-serif tracking-wide">Bart suggests</h3>
        </div>
        <button
          onClick={fetchInsight}
          disabled={loading}
          className="p-1.5 rounded-md hover:bg-surface-active text-text-ghost hover:text-primary transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} strokeWidth={2} />
        </button>
      </div>

      {loading && !insight ? (
        <div className="relative z-10 px-4 pb-5 pt-2 space-y-3">
          <div className="h-10 w-10 bg-surface-active rounded-full animate-pulse mb-4" />
          <div className="h-5 w-3/4 bg-surface-active rounded animate-pulse" />
          <div className="h-4 w-full bg-surface-active rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-surface-active rounded animate-pulse" />
        </div>
      ) : insight && insight.insights && insight.insights.length > 0 ? (
        <div className="relative z-10 group/slider">
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Inject a tiny style block to ensure webkit scrollbars are hidden strictly for this container */}
            <style>{`
              .hide-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
            
            {insight.insights.map((item, i) => {
              const colors = getColorClassesForType(item.type);
              return (
                <div key={i} className="min-w-full w-full snap-center shrink-0 px-4 pt-2">
                  <div className="flex flex-col h-full gap-4">
                    {/* Top Row: Icon and Title */}
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex flex-shrink-0 items-center justify-center ${colors.bg} ${colors.text} shadow-sm border ${colors.border}`}>
                         {getIconForType(item.icon_type)}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h4 className="text-lg font-medium tracking-tight text-text-primary mb-1">
                          {item.title}
                        </h4>
                        <p className="text-[13px] text-text-secondary leading-snug line-clamp-3">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Button (Optional) */}
                    {item.action && (
                      <div className="mt-auto pt-2">
                        <button
                          onClick={() => item.action && navigate(item.action.route)}
                          className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${colors.text} hover:opacity-80 py-2 px-3 rounded-md bg-surface-overlay active:bg-surface-active border border-border-subtle inline-flex`}
                        >
                          {item.action.label}
                          <ExternalLink size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Desktop Navigation Arrows */}
          {insight.insights.length > 1 && (
            <>
              <button 
                onClick={scrollPrev}
                disabled={currentIndex === 0}
                className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-surface-base border border-border-default shadow-sm text-text-secondary transition-opacity hover:text-primary disabled:opacity-0 disabled:pointer-events-none hover:bg-surface-hover z-20"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={scrollNext}
                disabled={currentIndex === insight.insights.length - 1}
                className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-surface-base border border-border-default shadow-sm text-text-secondary transition-opacity hover:text-primary disabled:opacity-0 disabled:pointer-events-none hover:bg-surface-hover z-20"
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {/* Pagination Indicators */}
          {insight.insights.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {insight.insights.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-text-ghost/30"}`} 
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pb-5 pt-2">
          <p className="text-[12px] text-text-ghost">Add transactions to get AI insights.</p>
        </div>
      )}
    </motion.div>
  );
}
