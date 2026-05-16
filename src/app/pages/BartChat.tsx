import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { Send, ArrowLeft, Trash2, Sparkle, WifiOff, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { useAccounts } from '../context/AccountsContext';
import { BartArt, BartState } from '../components/ui/CardArt';
import { streamBartMessage, BartMessage, BartSnapshot } from '../../lib/aiService';
import supabase from '../../lib/supabase';
import { useNetworkState } from '../../hooks/useNetworkState';
import { AddTransactionModal } from '../components/AddTransactionModal';

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

export function BartChat() {
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
    if (user && messages.length === 0) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const { data } = await supabase
        .from('bart_conversations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(15); // Slightly larger history for full screen
      
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
    <div className="flex flex-col h-full h-screen md:h-auto bg-surface-base">
      <div className="flex items-center justify-between px-6 pb-4 pt-[max(env(safe-area-inset-top),1rem)] border-b border-border-default sticky top-0 bg-surface-base/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-overlay transition-colors">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Link>
          <div className="relative w-12 h-12 rounded-full border border-border-strong bg-surface-overlay overflow-hidden flex items-center justify-center shadow-inner pt-2 shrink-0">
            <BartArt state={!isOnline ? "asleep" : bartState} className="w-[120%] h-[120%] absolute text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-text-primary">Bart</h1>
            <p className="text-[13px] text-text-quaternary leading-none mt-1">Might nap for 16 hours today</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button onClick={handleClearChat} className="p-2 -mr-2 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger-subtle transition-colors flex items-center gap-2 text-[13px] font-medium" title="Clear Chat">
            <Trash2 size={16} strokeWidth={1.5} />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </div>

      {!isOnline && (
        <div className="bg-surface-active border-b border-border-subtle p-3.5 flex flex-col sm:flex-row items-center justify-center gap-3 text-center shrink-0 z-10">
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-8 pb-10">
          {messages.length === 0 && bartState !== "generating" && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20 px-6 flex flex-col items-center max-w-md mx-auto">
               <div className={`w-32 h-32 mb-8 text-primary ${!isOnline ? 'opacity-50' : 'opacity-40'}`}>
                 <BartArt state={!isOnline ? "asleep" : "idle"} />
               </div>
               <h3 className="text-2xl font-serif font-bold text-text-primary mb-3">G'day! I'm Bart.</h3>
               <p className="text-[15px] text-text-tertiary leading-relaxed">This is your dedicated planning space. I've aggregated your 30-day spending, active budgets, and multi-account balances. Ask me anything about your finances.</p>
            </motion.div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-2 ml-1">
                {msg.role === 'model' && (
                  <span className="text-[11px] font-bold text-text-quaternary uppercase tracking-wider">Bart</span>
                )}
              </div>
              <div className={`px-5 py-4 max-w-[90%] md:max-w-[80%] text-[14px] ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm shadow-md' : 'bg-surface-overlay border border-border-subtle text-text-secondary rounded-2xl rounded-tl-sm shadow-sm'}`}>
                {msg.role === 'user' ? msg.content : <MessageStream content={msg.content} />}
              </div>
            </div>
          ))}
          
          {streamingContent && (
            <div className="flex flex-col items-start w-full">
              <span className="text-[11px] font-bold text-text-quaternary uppercase tracking-wider mb-2 ml-1 flex items-center gap-2">
                 Bart <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              </span>
              <div className="px-5 py-4 max-w-[90%] md:max-w-[80%] text-[14px] bg-surface-overlay border border-border-subtle text-text-secondary rounded-2xl rounded-tl-sm shadow-sm opacity-90">
                <MessageStream content={streamingContent} />
              </div>
            </div>
          )}

          {bartState === "generating" && !streamingContent && (
            <div className="flex flex-col items-start w-full">
              <span className="text-[11px] font-bold text-text-quaternary uppercase tracking-wider mb-2 ml-1">Bart</span>
              <motion.div 
                className="flex items-center gap-2.5 bg-surface-overlay border border-border-subtle pl-4 pr-5 py-3 rounded-full shadow-sm w-fit"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div 
                  className="w-5 h-5 flex items-center justify-center shrink-0 text-primary"
                  animate={{ rotate: 180, scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkle size={15} strokeWidth={2} />
                </motion.div>
                <div className="text-[13px] font-medium text-text-primary flex items-center tracking-wide">
                  Thinking<motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>...</motion.span>
                </div>
              </motion.div>
            </div>
          )}

          {bartState === "error" && !streamingContent && (
             <div className="flex flex-col items-start w-full">
               <div className="px-5 py-4 max-w-[90%] md:max-w-[80%] text-[14px] bg-danger-subtle border border-danger/20 text-danger rounded-2xl rounded-tl-sm">
                 Lost connection to the grove! Please check your network or try asking again.
               </div>
             </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 bg-surface-base border-t border-border-default shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="relative flex items-end">
            <textarea
              placeholder={!isOnline ? "Bart is sleeping (Offline)..." : "Ask Bart to build a budget plan..."}
              value={inputTitle}
              onChange={(e) => setInputTitle(e.target.value)}
              disabled={bartState === "generating" || !isOnline}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="w-full bg-surface-overlay border border-border-strong rounded-2xl pl-5 pr-14 py-4 text-[14px] text-text-primary focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50 resize-none min-h-[54px] shadow-sm"
            />
            <button 
              type="submit" 
              disabled={!inputTitle.trim() || bartState === "generating" || !isOnline}
              className="absolute right-3 bottom-2.5 p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:bg-surface-active disabled:text-text-ghost transition-all"
            >
              <Send size={16} strokeWidth={2} />
            </button>
          </form>
          <div className="text-center mt-3">
             <span className="text-[11px] text-text-ghost">Generated by AI. Always verify important numbers.</span>
          </div>
        </div>
      </div>

      <AddTransactionModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </div>
  );
}
