# SOP: Finance Tracking

## Goal
Enable users to track income and expenses, set category budgets, and view analytics.

## Inputs
- **Transaction**: `{ amount, category, description, date, type }` (id auto-generated)
- **Budget Update**: `{ category, limit }`
- **User Settings**: `{ name, currency, notifications, weeklyReport, theme }`

## Logic Flow
1. User adds a transaction (expense or income) via modal
2. Transaction is assigned a UUID and prepended to the list
3. State is persisted to `localStorage` (future: Supabase)
4. Dashboard, Analytics, and Budget pages re-derive computed values from the transaction list

## Category System
- **Expense categories** have metadata: `{ icon, color, gradient }` (defined in `FinanceContext`)
- **Income categories**: `Salary`, `Freelance`, `Investments`, `Other Income`
- Budget limits are expense-only — income categories are not budgeted

## Edge Cases
- **Empty state**: Show zero values, not errors. No "no data" crash.
- **Budget exceeded**: Visual indicator (danger color) when `spent > limit`
- **Negative amounts**: Reject — amounts must be positive, `type` field determines direction
- **Missing category**: Fall back to `Other` category metadata
- **Date format**: Always `YYYY-MM-DD` ISO string, never locale-dependent

## Streak Calculation
Count consecutive days (from today backwards) that have at least one transaction. Break on first day with no entries.

## Computed Values
| Value | Formula |
|---|---|
| Total Expenses | `sum(transactions.filter(type === 'expense').amount)` |
| Total Income | `sum(transactions.filter(type === 'income').amount)` |
| Balance | `totalIncome - totalExpenses` |
| Spent by Category | `sum(transactions.filter(category === X && type === 'expense').amount)` |
