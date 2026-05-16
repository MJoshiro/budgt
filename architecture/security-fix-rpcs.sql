-- Security Fix: H3 + H4 — Atomic Increment RPCs
-- Eliminates read-then-write race conditions
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- H3: Atomic token usage increment (replaces client-side read-modify-write)
CREATE OR REPLACE FUNCTION increment_token_usage(
  p_user_id UUID,
  p_month_year TEXT,
  p_tokens INTEGER
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO ai_token_usage (user_id, month_year, tokens_used)
  VALUES (p_user_id, p_month_year, p_tokens)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET tokens_used = ai_token_usage.tokens_used + p_tokens;
$$;

-- H4: Atomic goal funding increment (replaces client-side read-modify-write)
CREATE OR REPLACE FUNCTION fund_savings_goal(
  p_goal_id UUID,
  p_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_amount NUMERIC;
BEGIN
  UPDATE savings_goals
  SET current_amount = GREATEST(0, current_amount + p_amount)
  WHERE id = p_goal_id
    AND user_id = auth.uid()
  RETURNING current_amount INTO new_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Goal not found or access denied';
  END IF;

  RETURN new_amount;
END;
$$;
