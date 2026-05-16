import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, Check, X, Zap } from "lucide-react";
import { parseLocal } from "../../lib/localParser";
import { parseExpenseAI } from "../../lib/aiService";
import { useFinance, getCategoryMeta } from "../context/FinanceContext";
import { formatCurrency } from "../../lib/formatters";
import { toast } from "sonner";

export function QuickEntry() {
  const { addTransaction, settings } = useFinance();
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<ReturnType<typeof parseLocal>>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: / to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !isOpen && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
        setInput("");
        setPreview(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  // Live local parsing
  const handleInput = useCallback((val: string) => {
    setInput(val);
    if (val.trim().length > 1) {
      const result = parseLocal(val);
      setPreview(result);
    } else {
      setPreview(null);
    }
  }, []);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    let parsed = parseLocal(input);

    // If local parser confidence is low, try AI
    if (!parsed || parsed.confidence < 0.8) {
      setAiLoading(true);
      try {
        const aiResult = await parseExpenseAI(input);
        parsed = { ...aiResult, confidence: 1 };
      } catch (err) {
        console.error("AI parse failed:", err);
        // Use local result as fallback
        if (!parsed) {
          toast.error("Couldn't parse that. Try: 'coffee 120'");
          setAiLoading(false);
          return;
        }
      }
      setAiLoading(false);
    }

    if (parsed && parsed.amount > 0) {
      addTransaction({
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        date: new Date().toISOString().split("T")[0],
        type: parsed.type,
      });
      toast.success(`${parsed.type === "income" ? "Income" : "Expense"} added: ${formatCurrency(parsed.amount, settings.currency)}`);
      setInput("");
      setPreview(null);
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="relative group">
        {/* Soft animated background blur / glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-success/20 via-primary/20 to-warning/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-700 pointer-events-none" />
        
        <motion.button
          onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 100); }}
          className="relative w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-border-strong bg-surface-raised shadow-sm text-text-ghost text-[14px] hover:border-primary/40 hover:bg-surface-raised transition-all"
          whileHover={{ y: -2, scale: 1.005 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Zap size={16} strokeWidth={1.5} className="text-primary group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-serif text-[17px] tracking-wide text-text-primary">Quick add — Type <span className="italic font-medium text-text-primary">"coffee 120"</span> or press</span>
          <kbd className="ml-auto px-2.5 py-1 rounded-md bg-surface-active text-text-tertiary text-[11px] font-sans border border-border-default shadow-sm group-hover:border-primary/30 transition-colors">/</kbd>
        </motion.button>
      </div>
    );
  }

  const meta = preview ? getCategoryMeta(preview.category) : null;

  return (
    <div className="relative">
      {/* Animated Glowing border when open */}
      <motion.div 
        className="absolute -inset-[3px] rounded-[20px] bg-gradient-to-r from-primary via-success to-warning z-0 opacity-100 blur-[2px]"
        animate={{ 
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
        }}
        transition={{ 
          duration: 3, 
          ease: "linear", 
          repeat: Infinity 
        }}
        style={{ backgroundSize: "200% 200%" }}
      />

      <motion.div
        className="relative z-10 rounded-2xl border border-border-strong bg-surface-raised shadow-xl overflow-hidden flex flex-col"
        initial={{ height: 50, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 50, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
      >
        <div className="flex items-center gap-3 p-4">
          <motion.div 
            className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
            animate={{ rotate: aiLoading ? 360 : 0 }}
            transition={{ repeat: aiLoading ? Infinity : 0, duration: 1, ease: "linear" }}
          >
            <Sparkles size={16} className="text-primary" strokeWidth={1.5} />
          </motion.div>
          
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder='e.g. "dinner with friends 45" or "salary 2000"'
            className="flex-1 bg-transparent text-text-primary text-[17px] font-serif placeholder:font-serif placeholder:text-[17px] placeholder:text-text-ghost/60 focus:outline-none"
          />
          
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            {!preview && !input && (
              <motion.span 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-[12px] font-serif text-text-ghost uppercase tracking-widest mr-2 hidden sm:inline-block"
              >
                Waiting for input
              </motion.span>
            )}
            <button
              onClick={() => { setIsOpen(false); setInput(""); setPreview(null); }}
              className="p-1.5 rounded-lg hover:bg-surface-hover text-text-ghost"
            >
              <X size={16} />
            </button>
          </div>
        </div>

      {/* Live Preview */}
      <AnimatePresence>
        {preview && preview.amount > 0 && (
          <motion.div
            className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-border-subtle/50"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-3 pt-3">
              {meta && (
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 border border-border-subtle"
                  style={{ backgroundColor: meta.color + "15", color: meta.color }}
                >
                  <span className="text-[14px] drop-shadow-sm">{meta.icon}</span>
                </div>
              )}
              <div>
                <p className="text-[18px] font-serif text-text-primary mb-1">{preview.description}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-surface-active text-text-secondary capitalize tracking-wide border border-border-subtle">{preview.category}</span>
                  <span className="text-[11px] text-text-ghost capitalize">— {preview.type}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 pt-3">
              <span className={`text-[16px] font-medium tabular-nums tracking-tight ${preview.type === "income" ? "text-success" : "text-text-primary"}`}>
                {preview.type === "income" ? "+" : "-"}{formatCurrency(preview.amount, settings.currency)}
              </span>
              <motion.button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover shadow-md hover:shadow-lg transition-all"
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -1 }}
              >
                <span className="text-[13px] font-medium pr-1">Save</span>
                {aiLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                    <Sparkles size={14} />
                  </motion.div>
                ) : <Send size={14} />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
