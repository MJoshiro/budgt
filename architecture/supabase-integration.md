# SOP: Supabase Integration (Planned)

## Goal
Replace `localStorage` with Supabase for auth and persistent, per-user data storage.

## Package
```
npm install @supabase/supabase-js
```

## Client Setup
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

export default supabase;
```

## Environment Variables
```
VITE_SUPABASE_URL=<project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key-or-anon-key>
```

## Authentication
- **Method**: Magic Link via `supabase.auth.signInWithOtp({ email })`
- **Session**: Managed via `supabase.auth.onAuthStateChange()`
- **Validation**: `supabase.auth.getClaims()` for JWT verification
- **Logout**: `supabase.auth.signOut()`

## Database Schema
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  category TEXT NOT NULL,
  amount_limit NUMERIC(12,2) NOT NULL,
  UNIQUE(user_id, category)
);

CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT DEFAULT 'User',
  currency TEXT DEFAULT 'USD',
  notifications BOOLEAN DEFAULT true,
  weekly_report BOOLEAN DEFAULT true,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light'))
);
```

## Row Level Security
```sql
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own budgets"
  ON budgets FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings"
  ON user_settings FOR ALL USING (auth.uid() = user_id);
```

## Migration Plan
1. Install `@supabase/supabase-js`
2. Create Supabase project and run SQL schema
3. Create `src/lib/supabase.ts` client
4. Add auth flow (login/signup pages, auth context)
5. Replace `localStorage` calls in `FinanceContext` with Supabase queries
6. Add loading/error states for async data fetching
7. Keep `localStorage` as offline fallback cache

## Edge Cases
- **Offline**: Fall back to cached `localStorage` data
- **Auth expiry**: Auto-refresh via `onAuthStateChange`
- **Rate limits**: Supabase free tier: 500 API requests/day — implement client-side caching
