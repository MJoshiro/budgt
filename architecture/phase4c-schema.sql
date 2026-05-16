-- Phase 4c: Bart the AI Assistant Context History Table

CREATE TABLE IF NOT EXISTS public.bart_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'model')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for faster chronological querying of a user's conversational history
CREATE INDEX IF NOT EXISTS idx_bart_conversations_user_time ON public.bart_conversations(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.bart_conversations ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view their own bart conversations"
    ON public.bart_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bart conversations"
    ON public.bart_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bart conversations"
    ON public.bart_conversations FOR DELETE
    USING (auth.uid() = user_id);
