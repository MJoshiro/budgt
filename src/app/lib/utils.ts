/**
 * Shared utility functions for the untitled; finance app.
 */

/** Get today's date as YYYY-MM-DD string */
export const getToday = (): string => new Date().toISOString().split("T")[0];

/** Format a number as currency string */
export const formatCurrency = (amount: number, currency: string = "USD"): string => {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", AUD: "A$",
  };
  const symbol = symbols[currency] || "$";
  return `${symbol}${amount.toFixed(2)}`;
};

/** Format a number as compact currency (no decimals) */
export const formatCompact = (amount: number, currency: string = "USD"): string => {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", AUD: "A$",
  };
  const symbol = symbols[currency] || "$";
  return `${symbol}${amount.toFixed(0)}`;
};
