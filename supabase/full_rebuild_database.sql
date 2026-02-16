-- COMPREHENSIVE DATABASE REBUILD SCRIPT (VERSION 2)
-- WARNING: This script will DROP and RECREATE all public tables.
-- Run this in your Supabase SQL Editor.

BEGIN;

-- 0. CLEANUP (Drop remnants to ensure fresh start)
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.content_history CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;

-- 1. ENUMS (Create only if they don't exist)
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

-- 2. TABLES

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  tier subscription_tier NOT NULL DEFAULT 'free',
  custom_openai_key TEXT,
  custom_gemini_key TEXT,
  monthly_usage_count INT NOT NULL DEFAULT 0,
  last_usage_reset TIMESTAMPTZ NOT NULL DEFAULT now(),
  credits INTEGER DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Content History
CREATE TABLE public.content_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Messages (Support Queue)
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved')),
    admin_notes TEXT
);

-- 3. FUNCTIONS & TRIGGERS

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync profiles for ANY existing auth users who might have lost their profile record
INSERT INTO public.profiles (user_id, display_name)
SELECT id, email FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 4. INDICES
CREATE INDEX IF NOT EXISTS content_history_user_id_idx ON public.content_history (user_id);

-- 5. ROW LEVEL SECURITY (RLS)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT 
USING (auth.uid() = user_id OR (SELECT (role::text) FROM public.profiles WHERE user_id = auth.uid()) IN ('super_admin', 'admin', 'moderator'));

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id OR (SELECT (role::text) FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin');

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Content History Policies
CREATE POLICY "Users can view own history" ON public.content_history FOR SELECT 
USING (auth.uid() = user_id OR (SELECT (role::text) FROM public.profiles WHERE user_id = auth.uid()) IN ('super_admin', 'admin', 'moderator'));

CREATE POLICY "Users can insert own history" ON public.content_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own history" ON public.content_history FOR DELETE USING (auth.uid() = user_id);

-- Messages Policies
CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (
    (SELECT (role::text) FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
);

CREATE POLICY "Admins can update messages" ON public.messages FOR UPDATE USING (
    (SELECT (role::text) FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'super_admin')
);

-- 6. STORAGE BUCKETS (Re-ensure)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('watermark-logos', 'watermark-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own logos" ON storage.objects;
CREATE POLICY "Users can upload own logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'watermark-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view own logos" ON storage.objects;
CREATE POLICY "Users can view own logos" ON storage.objects FOR SELECT USING (bucket_id = 'watermark-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete own logos" ON storage.objects;
CREATE POLICY "Users can delete own logos" ON storage.objects FOR DELETE USING (bucket_id = 'watermark-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Public can view watermark logos" ON storage.objects;
CREATE POLICY "Public can view watermark logos" ON storage.objects FOR SELECT USING (bucket_id = 'watermark-logos');

-- 7. REALTIME
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
