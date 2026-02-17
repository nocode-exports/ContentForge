-- MASTER REBUILD SCRIPT FOR CONTENT SPARK STUDIO (VERSION 4 - TEAMS & GOD MODE)
-- This script reconstructs the entire database schema with Team support.
-- WARNING: This script will DROP and RECREATE all public tables.

BEGIN;

-- 0. CLEANUP
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.content_history CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. ENUMS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'moderator', 'user');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
        CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'unlimited', 'lifetime');
    END IF;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABLES

-- Profiles (Extended with team_id placeholder)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT, -- Synced for easier admin search
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  tier subscription_tier NOT NULL DEFAULT 'free',
  credits_balance INTEGER DEFAULT 0,
  bio TEXT,
  custom_openai_key TEXT,
  custom_gemini_key TEXT,
  monthly_usage_count INT NOT NULL DEFAULT 0,
  last_usage_reset TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team Members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin' or 'member'
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Content History (Updated)
CREATE TABLE public.content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL, -- Optional: if generated as team
  topic TEXT NOT NULL,
  platform TEXT NOT NULL,
  tone TEXT NOT NULL,
  template TEXT,
  headline TEXT NOT NULL,
  post TEXT NOT NULL,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  cta TEXT,
  image_prompt TEXT,
  image_url TEXT,
  slides JSONB, -- For carousels
  section_images JSONB, -- For articles
  carousel BOOLEAN DEFAULT false,
  full_article BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages (Support)
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Transactions (Fixed with Profile Link)
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id), -- Specific link for PostgREST joins
    plan_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    proof_url TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- 3. FUNCTIONS & TRIGGERS

-- Handle New User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: Check Admin
CREATE OR REPLACE FUNCTION public.check_user_is_admin()
RETURNS BOOLEAN AS $$
DECLARE u_role public.user_role;
BEGIN
    SELECT role INTO u_role FROM public.profiles WHERE user_id = auth.uid();
    RETURN u_role IN ('super_admin', 'admin', 'moderator');
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Check Super Admin
CREATE OR REPLACE FUNCTION public.check_user_is_super_admin()
RETURNS BOOLEAN AS $$
DECLARE u_role public.user_role;
BEGIN
    SELECT role INTO u_role FROM public.profiles WHERE user_id = auth.uid();
    RETURN u_role = 'super_admin';
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING (public.check_user_is_admin());
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "SuperAdmins update all profiles" ON public.profiles FOR UPDATE USING (public.check_user_is_super_admin());

-- Teams
CREATE POLICY "View team if member" ON public.teams FOR SELECT USING (
  auth.uid() = owner_id OR 
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = public.teams.id AND user_id = auth.uid())
);
CREATE POLICY "Owner manage team" ON public.teams FOR ALL USING (auth.uid() = owner_id);

-- Team Members
CREATE POLICY "View members if in team" ON public.team_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members Tm WHERE Tm.team_id = public.team_members.team_id AND Tm.user_id = auth.uid())
);
CREATE POLICY "Owner manage members" ON public.team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.teams WHERE id = public.team_members.team_id AND owner_id = auth.uid())
);

-- Content History
CREATE POLICY "View own history" ON public.content_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all history" ON public.content_history FOR SELECT USING (public.check_user_is_admin());
CREATE POLICY "Insert own history" ON public.content_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions
CREATE POLICY "View own txns" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all txns" ON public.transactions FOR SELECT USING (public.check_user_is_admin());
CREATE POLICY "SuperAdmins update txns" ON public.transactions FOR UPDATE USING (public.check_user_is_super_admin());
CREATE POLICY "Users insert txns" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('watermark-logos', 'watermark-logos', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Users access own logos" ON storage.objects FOR ALL USING (bucket_id = 'watermark-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

COMMIT;
