/**
 * AI Service Layer — thin client wrapper for Gemini calls.
 * 
 * DEV MODE: Calls Gemini API directly via VITE_GEMINI_API_KEY.
 * PRODUCTION: Should be switched to supabase.functions.invoke('ai-gateway').
 * 
 * All data is pre-compressed before sending (summaries, not raw arrays).
 */

import supabase from "./supabase";

const GEMINI_MODEL = "gemini-2.5-flash";
// In production on Vercel, requests are securely proxied through /api/chat.
// In local development, Vite proxies this or we can hit the function directly if using Vercel CLI.
const API_URL = import.meta.env.PROD ? "/api/chat" : "/api/chat";

const SYSTEM_PROMPT = `You are a helpful personal finance assistant for a Filipino user. You analyze spending data and provide actionable, concise advice. Always respond in JSON format as specified. Be encouraging but honest. Use Philippine Peso (₱) for amounts.`;

// ─── Core Gemini Call ───────────────────────────────────────────────

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: { totalTokenCount?: number };
}

async function callGemini(userPrompt: string, responseSchema?: any): Promise<{ data: any; tokensUsed: number }> {
  const body: any = {
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ parts: [{ text: userPrompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  };

  if (responseSchema) {
    body.generationConfig.responseSchema = responseSchema;
  }

  // Get auth token for server-side verification
  const { data: { session } } = await supabase.auth.getSession();
  const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    authHeaders["Authorization"] = `Bearer ${session.access_token}`;
  }

  // Send request securely through the Vercel Edge Function
  const res = await fetch(API_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      endpoint: `${GEMINI_MODEL}:generateContent`,
      body,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const json: GeminiResponse = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const tokensUsed = json.usageMetadata?.totalTokenCount || 0;

  // Track tokens in DB (best-effort)
  trackTokenUsage(tokensUsed);

  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    let cleanText = start !== -1 && end !== -1 ? text.substring(start, end + 1) : text;
    // Strip trailing commas before closing braces/brackets (common LLM JSON error)
    cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');
    return { data: JSON.parse(cleanText), tokensUsed };
  } catch (err: any) {
    console.warn("Gemini JSON parse error:", err, "Raw text:", text);
    return { data: { raw: text, error: err.message || err.toString() }, tokensUsed };
  }
}

// ─── Token Tracking (Server-side via Supabase) ─────────────────────

async function trackTokenUsage(tokens: number) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const monthYear = new Date().toISOString().slice(0, 7); // "2026-02"

    // Atomic upsert via Postgres RPC (eliminates read-modify-write race condition)
    await supabase.rpc("increment_token_usage", {
      p_user_id: user.id,
      p_month_year: monthYear,
      p_tokens: tokens,
    });
  } catch (e) {
    console.warn("Token tracking failed (non-blocking):", e);
  }
}

// ─── Feature: NLP Expense Parsing (AI Fallback) ────────────────────

export interface AIParsedExpense {
  amount: number;
  category: string;
  description: string;
  type: "expense" | "income";
}

const VALID_CATEGORIES = [
  "Food & Dining", "Transportation", "Shopping", "Entertainment", "Health",
  "Bills & Utilities", "Education", "Travel", "Groceries", "Other",
  "Salary", "Freelance", "Investments", "Other Income",
];

export async function parseExpenseAI(text: string): Promise<AIParsedExpense> {
  const prompt = `Parse this natural language expense/income entry into structured data.
  
Input: "${text}"

Valid categories: ${VALID_CATEGORIES.join(", ")}

Respond with JSON: { "amount": number, "category": string, "description": string, "type": "expense" or "income" }`;

  const { data } = await callGemini(prompt);
  return {
    amount: data.amount || 0,
    category: VALID_CATEGORIES.includes(data.category) ? data.category : "Other",
    description: data.description || text,
    type: data.type === "income" ? "income" : "expense",
  };
}

// ─── Feature: Weekly Insights ──────────────────────────────────────

export interface WeeklyInsightItem {
  type: "alert" | "praise" | "tip";
  icon_type: "trend_up" | "trend_down" | "warning" | "success" | "info" | "food" | "shopping" | "transport" | "entertainment";
  title: string;
  description: string;
  action: { label: string; route: string } | null;
}

export interface WeeklyInsight {
  insights: WeeklyInsightItem[];
}

export interface SpendingSummary {
  totalIncome: number;
  totalExpenses: number;
  categoryBreakdown: { category: string; amount: number; count: number }[];
  topCategory: string;
  transactionCount: number;
  savingsRate: number;
}

export async function fetchWeeklyInsights(summary: SpendingSummary): Promise<WeeklyInsight> {
  const prompt = `Analyze this weekly financial summary and provide 2-3 structured insights. Use punchy, fragment sentences. Do not exceed 10-15 words for descriptions.

Data:
- Total income: ₱${summary.totalIncome.toFixed(0)}
- Total expenses: ₱${summary.totalExpenses.toFixed(0)}
- Savings rate: ${(summary.savingsRate * 100).toFixed(1)}%
- ${summary.transactionCount} transactions
- Top category: ${summary.topCategory}
- Breakdown: ${summary.categoryBreakdown.map(c => `${c.category}: ₱${c.amount.toFixed(0)} (${c.count}x)`).join(", ")}`;

  const schema = {
    type: "OBJECT",
    properties: {
      insights: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            type: { type: "STRING" },
            icon_type: { type: "STRING" },
            title: { type: "STRING" },
            description: { type: "STRING" },
            action: {
              type: "OBJECT",
              properties: {
                label: { type: "STRING" },
                route: {
                  type: "STRING",
                  enum: ["/transactions", "/analytics", "/goals", "/budget", "/accounts", "/settings", "/"]
                }
              }
            }
          },
          required: ["type", "icon_type", "title", "description"]
        }
      }
    },
    required: ["insights"]
  };

  const { data } = await callGemini(prompt, schema);
  return {
    insights: data.insights || [
      {
        type: "alert",
        icon_type: "warning",
        title: "JSON Parse Error",
        description: `Err: ${data.error}. Raw: ${data.raw?.substring(0, 100)}`,
        action: null
      }
    ]
  };
}

// ─── Feature: Anomaly Explanation ──────────────────────────────────

export interface AnomalyData {
  category: string;
  current_week_total: number;
  avg_weekly: number;
  z_score: number;
}

export interface AnomalyExplanation {
  message: string;
  severity: "warning" | "info";
  tip: string;
}

export async function fetchAnomalyExplanation(anomalies: AnomalyData[]): Promise<AnomalyExplanation[]> {
  if (anomalies.length === 0) return [];

  const prompt = `These spending anomalies were detected this week. Generate human-readable explanations.

Anomalies:
${anomalies.map(a => `- ${a.category}: ₱${a.current_week_total.toFixed(0)} this week vs ₱${a.avg_weekly.toFixed(0)} average (${a.z_score.toFixed(1)} standard deviations above normal)`).join("\n")}

Respond with JSON array:
[{ "message": "short human explanation", "severity": "warning" or "info", "tip": "one actionable suggestion" }]`;

  const { data } = await callGemini(prompt);
  return Array.isArray(data) ? data : [];
}

// ─── Token Usage Query ─────────────────────────────────────────────

export async function getTokenUsage(): Promise<{ used: number; limit: number; monthYear: string }> {
  const monthYear = new Date().toISOString().slice(0, 7);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { used: 0, limit: 1000000, monthYear };

  const { data } = await supabase
    .from("ai_token_usage")
    .select("tokens_used")
    .eq("user_id", user.id)
    .eq("month_year", monthYear)
    .single();

  return {
    used: data?.tokens_used || 0,
    limit: 1000000,
    monthYear,
  };
}

// ─── Feature: Bart AI Assistant (Streaming & Context RAG) ────────────

export interface BartMessage {
  role: "user" | "model";
  content: string;
}

export interface BartSnapshot {
  categoryTotals30d: Record<string, number>;
  recentTxns: any[];
  budgets: any[];
  accounts: any[];
  goals: any[];
}

export async function* streamBartMessage(
  newMessage: string,
  history: BartMessage[],
  snapshot: BartSnapshot
): AsyncGenerator<string, void, unknown> {
  const BART_SYSTEM = `You are Bart, a brilliant but slightly goofy financial koala. You are highly analytical with numbers, occasionally use subtle eucalyptus/marsupial puns, and feel alive. You NEVER compromise on accurate financial math. 
**You must format responses in Markdown. Use bolding for numbers. ALWAYS format numbers in the thousands or millions with commas (e.g., 1,500 or 1,250,000). Use bulleted lists or standard markdown tables for 3+ data points. Keep paragraphs under 3 sentences.**

CURRENT FINANCIAL SNAPSHOT:
${JSON.stringify(snapshot, null, 2)}
`;

  const contents = [
    ...history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    })),
    {
      role: "user",
      parts: [{ text: newMessage }]
    }
  ];

  const body = {
    system_instruction: { parts: [{ text: BART_SYSTEM }] },
    contents,
    generationConfig: {
      temperature: 0.7,
    },
  };

  // Get auth token for server-side verification
  const { data: { session } } = await supabase.auth.getSession();
  const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    authHeaders["Authorization"] = `Bearer ${session.access_token}`;
  }

  // Stream securely through the Vercel Edge Function
  const res = await fetch(API_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      endpoint: `${GEMINI_MODEL}:streamGenerateContent?alt=sse`,
      body,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini stream error ${res.status}: ${errText}`);
  }

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      // Process any remaining buffer if it doesn't end cleanly
      if (buffer.trim()) {
        const chunk = buffer.trim();
        if (chunk.startsWith('data: ')) {
          try {
            const dataStr = chunk.slice(6);
            if (dataStr.trim() !== '[DONE]') {
              const data = JSON.parse(dataStr);
              const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textChunk) yield textChunk;
            }
          } catch (e) { }
        }
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    // SSE events can be separated by \r\n\r\n or \n\n
    const chunks = buffer.split(/\r?\n\r?\n/);
    buffer = chunks.pop() || "";

    for (const chunk of chunks) {
      if (chunk.startsWith('data: ')) {
        const dataStr = chunk.slice(6);
        if (dataStr.trim() === '[DONE]') return;

        try {
          const data = JSON.parse(dataStr);
          const parts = data.candidates?.[0]?.content?.parts;
          if (parts && parts.length > 0) {
            const textChunk = parts[0]?.text;
            if (textChunk) {
              yield textChunk;
            }
          }
        } catch (e) {
          console.warn("Skipping partial or malformed chunk line");
        }
      }
    }
  }
}

