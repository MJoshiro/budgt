-- Phase 3: AI Token Usage + Anomaly Detection
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- 1. Token usage tracking table (server-side)
CREATE TABLE IF NOT EXISTS ai_token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  month_year TEXT NOT NULL, -- e.g. "2026-02"
  tokens_used INTEGER DEFAULT 0,
  UNIQUE(user_id, month_year)
);

ALTER TABLE ai_token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own token usage"
  ON ai_token_usage FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own token usage"
  ON ai_token_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own token usage"
  ON ai_token_usage FOR UPDATE USING (auth.uid() = user_id);

-- 2. Anomaly Detection RPC (stddev math in Postgres)
CREATE OR REPLACE FUNCTION calculate_anomalies(p_user_id UUID)
RETURNS TABLE(
  category TEXT,
  current_week_total NUMERIC,
  avg_weekly NUMERIC,
  std_dev NUMERIC,
  z_score NUMERIC
)
LANGUAGE sql STABLE AS $$
  WITH weekly AS (
    SELECT category,
           date_trunc('week', date::date) AS week,
           SUM(amount) AS total
    FROM transactions
    WHERE user_id = p_user_id AND type = 'expense'
    GROUP BY category, week
  ),
  stats AS (
    SELECT category,
           AVG(total) AS avg_weekly,
           STDDEV_POP(total) AS std_dev
    FROM weekly
    GROUP BY category
    HAVING COUNT(*) >= 3
  ),
  current AS (
    SELECT category, SUM(amount) AS current_week_total
    FROM transactions
    WHERE user_id = p_user_id
      AND type = 'expense'
      AND date >= date_trunc('week', CURRENT_DATE)::date
    GROUP BY category
  )
  SELECT c.category,
         c.current_week_total,
         s.avg_weekly,
         s.std_dev,
         CASE WHEN s.std_dev > 0
              THEN (c.current_week_total - s.avg_weekly) / s.std_dev
              ELSE 0 END AS z_score
  FROM current c
  JOIN stats s ON c.category = s.category
  WHERE c.current_week_total > s.avg_weekly + (2 * s.std_dev);
$$;
