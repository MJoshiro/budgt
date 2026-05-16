/**
 * Local NLP Parser — regex-based, 0ms latency, 0 tokens
 * Only falls back to Gemini AI when confidence < 0.8
 */

import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "../app/context/FinanceContext";

export interface ParsedExpense {
  amount: number;
  category: string;
  description: string;
  type: "expense" | "income";
  confidence: number;
}

// Keyword → category mapping
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Food & Dining": ["coffee", "food", "lunch", "dinner", "breakfast", "eat", "meal", "restaurant", "cafe", "mcdonald", "jollibee", "kfc", "pizza", "burger", "snack", "drink", "starbucks", "milk tea", "boba"],
  "Transportation": ["grab", "uber", "gas", "fuel", "fare", "taxi", "bus", "train", "jeep", "jeepney", "angkas", "commute", "parking", "toll", "transit"],
  "Shopping": ["shop", "buy", "bought", "purchase", "clothes", "shoe", "bag", "lazada", "shopee", "amazon", "mall"],
  "Entertainment": ["movie", "netflix", "spotify", "game", "concert", "show", "stream", "subscription", "youtube", "premium"],
  "Health": ["medicine", "pharmacy", "doctor", "hospital", "clinic", "health", "gym", "vitamin", "dental", "checkup"],
  "Bills & Utilities": ["bill", "electric", "electricity", "water", "internet", "wifi", "phone", "load", "postpaid", "prepaid", "rent", "meralco", "pldt", "globe"],
  "Education": ["book", "school", "tuition", "course", "class", "study", "training", "udemy", "seminar"],
  "Travel": ["travel", "hotel", "flight", "airbnb", "vacation", "trip", "booking", "resort"],
  "Groceries": ["grocery", "groceries", "supermarket", "market", "sm", "puregold", "robinsons"],
  "Other": [],
};

const INCOME_KEYWORDS: Record<string, string[]> = {
  "Salary": ["salary", "payroll", "wage", "pay day", "payday", "sweldo"],
  "Freelance": ["freelance", "gig", "project", "client", "side hustle", "upwork", "fiverr"],
  "Investments": ["dividend", "interest", "stock", "investment", "return", "profit"],
  "Other Income": ["refund", "cashback", "rebate", "gift", "allowance", "padala", "received", "bigay"],
};

function detectCategory(text: string): { category: string; type: "expense" | "income"; confidence: number } {
  const lower = text.toLowerCase();

  // Check income keywords first
  for (const [category, keywords] of Object.entries(INCOME_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return { category, type: "income", confidence: 0.9 };
      }
    }
  }

  // Check expense keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return { category, type: "expense", confidence: 0.9 };
      }
    }
  }

  return { category: "Other", type: "expense", confidence: 0.3 };
}

/**
 * Parse natural language into a transaction.
 * Handles patterns:
 *   "coffee 120"
 *   "120 coffee"
 *   "spent 350 on groceries"
 *   "lunch at jollibee 250"
 *   "received salary 25000"
 */
export function parseLocal(input: string): ParsedExpense | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Extract amount — find any number (with optional decimal)
  const amountMatch = trimmed.match(/(\d+(?:[.,]\d{1,2})?)/);
  if (!amountMatch) return null;

  const amount = parseFloat(amountMatch[1].replace(",", "."));
  if (amount <= 0 || isNaN(amount)) return null;

  // Extract description — everything except the amount and common filler words
  const descPart = trimmed
    .replace(amountMatch[0], "")
    .replace(/\b(spent|paid|bought|for|on|at|the|a|an|my|from|via|got|received|earned)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const description = descPart || "Quick entry";

  // Detect category from the full original text
  const { category, type, confidence } = detectCategory(trimmed);

  return { amount, category, description, type, confidence };
}
