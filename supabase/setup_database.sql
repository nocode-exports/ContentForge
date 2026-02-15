-- CONSOLIDATED DATABASE CATCH-UP SCRIPT
-- Run this in your Supabase SQL Editor to ensure all tables and columns exist.

BEGIN;

-- 1. Ensure Profiles table exists (from initial migration)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Ensure RBAC and Tiers exist (from 20260215132000)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'moderator', 'user');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'unlimited');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Add columns to profiles (using safe Alter Table)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier subscription_tier NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_openai_key TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_gemini_key TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS monthly_usage_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_usage_reset TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 4. Ensure RLS is enabled for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Restore core policies for profiles
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (SELECT (role::text) FROM public.profiles WHERE user_id = auth.uid()) IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR (SELECT (role::text) FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'
);

-- 6. Ensure Messages table exists
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved')),
    admin_notes text
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 7. Messaging Policies
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (
    (SELECT (role::text) FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
);

-- 8. Enable Realtime (Postgres 14+ safe version)
DO $$ 
BEGIN
    -- profiles
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;

    -- messages
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

COMMIT;
