import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { X, Send, Maximize2, Trash2, Sparkle, WifiOff, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useAccounts } from '../context/AccountsContext';
import { BartArt, BartState } from './ui/CardArt';
import { streamBartMessage, BartMessage, BartSnapshot } from '../../lib/aiService';
import supabase from '../../lib/supabase';
import { useNetworkState } from '../../hooks/useNetworkState';
import { AddTransactionModal } from './AddTransactionModal';

import remarkGfm from 'remark-gfm';

const MessageStream = React.memo(({ content }: { content: string }) => {
  return (
    <div className="prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-surface-active prose-pre:border prose-pre:border-border-subtle prose-a:text-primary overflow-x-auto">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

interface BartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BartDrawer({ open, onOpenChange }: BartDrawerProps) {
  const { user } = useAuth();
  const { transactions, budgets, goals } = useFinance();
  const { accounts } = useAccounts();
  const [messages, setMessages] = useState<BartMessage[]>([]);
  const [inputTitle, setInputTitle] = useState("");
  const [bartState, setBartState] = useState<BartState>("idle");
  const [streamingContent, setStreamingContent] = useState("");
  const isOnline = useNetworkState();
  const [modalOpen, setModalOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  useEffect(() => {
    if (open && user && messages.length === 0) {
      loadHistory();
    }
  }, [open, user]);

  const loadHistory = async () => {
    try {
      const { data } = await supabase
        .from('bart_conversations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data && data.length > 0) {
        setMessages(data.reverse().map(d => ({ role: d.role as "user" | "model", content: d.content })));
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const buildSnapshot = (): BartSnapshot => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    
    const catTotals = recent.reduce((acc, txn) => {
      acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      categoryTotals30d: catTotals,
      recentTxns: transactions.slice(0, 5),
      budgets,
      accounts,
      goals
    };
  };

  const handleClearChat = async () => {
    if (messages.length === 0) return;
    if (!window.confirm("Are you sure you want to clear your chat history with Bart?")) return;
    
    setMessages([]);
    setBartState("idle");
    setStreamingContent("");
    
    try {
      if (user) {
        await supabase
          .from('bart_conversations')
          .delete()
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error("Failed to clear history", err);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputTitle.trim() || bartState === "generating" || !isOnline) return;

    const userMsg = inputTitle.trim();
    setInputTitle("");
    const newHistory: BartMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newHistory);
    setBartState("generating");
    setStreamingContent("");

    supabase.from('bart_conversations').insert({ user_id: user?.id, role: 'user', content: userMsg }).then();

    try {
      const contextWindow = newHistory.slice(-10);
      const snapshot = buildSnapshot();
      let fullResponse = "";

      const generator = streamBartMessage(userMsg, contextWindow.slice(0,-1), snapshot);
      for await (const chunk of generator) {
        fullResponse += chunk;
        setStreamingContent(fullResponse);
      }

      await supabase.from('bart_conversations').insert({ user_id: user?.id, role: 'model', content: fullResponse });
      setMessages([...newHistory, { role: "model", content: fullResponse }]);
      setStreamingContent("");
      setBartState("idle");

    } catch (err) {
      console.error("Bart generate error:", err);
      setBartState("error");
      setStreamingContent("Oops, looks like I chewed on a bad eucalyptus leaf. Connection error! **Please try again.**");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full md:w-[420px] bg-surface-base border-l border-border-default shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] border-b border-border-subtle bg-surface-overlay">
              <div className="flex items-center gap-3">
                <div className="relative w-11 h-11 rounded-full border border-border-strong bg-surface-base overflow-hidden flex items-center justify-center shadow-inner pt-2">
                  <BartArt state={!isOnline ? "asleep" : bartState} className="w-[120%] h-[120%] absolute text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-primary">Bart</h2>
                  <p className="text-[11px] text-text-quaternary leading-none mt-0.5">Apparently koalas can do math</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={handleClearChat} className="p-2 mr-1 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger-subtle transition-colors" title="Clear Chat">
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                )}
                <Link to="/bart" onClick={() => onOpenChange(false)} className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-active transition-colors" title="Full Screen">
                  <Maximize2 size={16} strokeWidth={1.5} />
                </Link>
                <button onClick={() => onOpenChange(false)} className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-active transition-colors">
                  <X size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {!isOnline && (
              <div className="bg-surface-active border-b border-border-subtle p-3.5 flex flex-col items-center justify-center gap-3 text-center z-10 shrink-0">
                <div className="flex items-center gap-2 text-text-secondary text-[13px] font-medium">
                  <WifiOff size={16} />
                  <span>The connection to the grove is lost. Bart is taking a nap.</span>
                </div>
                <button 
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-1.5 text-[12px] bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary-hover transition-colors font-medium shadow-sm"
                >
                  <Plus size={14} strokeWidth={2} />
                  Log Transaction Locally
                </button>
              </div>
            )}

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6">
              {messages.length === 0 && bartState !== "generating" && (
                <div className="text-center py-12 px-6 flex flex-col items-center">
                   <div className={`w-24 h-24 mb-6 text-primary ${!isOnline ? 'opacity-50' : 'opacity-30'}`}>
                     <BartArt state={!isOnline ? "asleep" : "idle"} />
                   </div>
                   <h3 className="text-base font-serif font-bold text-text-primary mb-2">G'day! I'm Bart.</h3>
                   <p className="text-[13px] text-text-tertiary leading-relaxed">I've got a read on your active budget and recent transactions. How can I help you crunch the numbers today?</p>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'model' && (
                    <span className="text-[10px] font-bold text-text-quaternary uppercase tracking-wider mb-1.5 ml-1">Bart</span>
                  )}
                  <div className={`px-4 py-3.5 max-w-[85%] text-[13px] ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm' : 'bg-surface-overlay border border-border-subtle text-text-secondary rounded-2xl rounded-tl-sm shadow-sm'}`}>
                    {msg.role === 'user' ? msg.content : <MessageStream content={msg.content} />}
                  </div>
                </div>
              ))}
              
              {streamingContent && (
                <div className="flex flex-col items-start">
                  <span className="text-[10px] font-bold text-text-quaternary uppercase tracking-wider mb-1.5 ml-1 flex items-center gap-1.5">
                     Bart <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  </span>
                  <div className="px-4 py-3.5 max-w-[85%] text-[13px] bg-surface-overlay border border-border-subtle text-text-secondary rounded-2xl rounded-tl-sm shadow-sm">
                    <MessageStream content={streamingContent} />
                  </div>
                </div>
              )}

              {bartState === "generating" && !streamingContent && (
                <div className="flex flex-col items-start px-2">
                  <motion.div 
                    className="flex items-center gap-2.5 bg-surface-overlay border border-border-subtle pl-3 pr-4 py-2.5 rounded-full shadow-sm"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <motion.div 
                      className="w-5 h-5 flex items-center justify-center shrink-0 text-primary"
                      animate={{ rotate: 180, scale: [0.8, 1.1, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkle size={14} strokeWidth={2} />
                    </motion.div>
                    <div className="text-[12px] font-medium text-text-primary flex items-center tracking-wide">
                      Thinking<motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>...</motion.span>
                    </div>
                  </motion.div>
                </div>
              )}
              
              {bartState === "error" && !streamingContent && (
                <div className="flex flex-col items-start">
                  <div className="px-4 py-3.5 max-w-[85%] text-[13px] bg-danger-subtle border border-danger/20 text-danger rounded-2xl rounded-tl-sm">
                    My connection to the eucalyptus grove was lost. Please try again.
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border-subtle bg-surface-base">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  placeholder={!isOnline ? "Bart is sleeping (Offline)..." : "Ask Bart anything..."}
                  value={inputTitle}
                  onChange={(e) => setInputTitle(e.target.value)}
                  disabled={bartState === "generating" || !isOnline}
                  className="w-full bg-surface-overlay border border-border-strong rounded-full pl-5 pr-12 py-3.5 text-[13px] text-text-primary focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 shadow-sm"
                />
                <button 
                  type="submit" 
                  disabled={!inputTitle.trim() || bartState === "generating" || !isOnline}
                  className="absolute right-2 p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:bg-surface-active disabled:text-text-ghost transition-all"
                >
                  <Send size={16} strokeWidth={2} />
                </button>
              </form>
              <div className="text-center mt-3">
                <span className="text-[10px] text-text-ghost">AI can make mistakes. Verify important financial data.</span>
              </div>
            </div>
          </motion.div>
          
          <AddTransactionModal 
            open={modalOpen} 
            onClose={() => setModalOpen(false)} 
          />
        </>
      )}
    </AnimatePresence>
  );
}
