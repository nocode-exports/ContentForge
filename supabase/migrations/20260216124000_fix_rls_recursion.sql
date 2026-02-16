-- FIX FOR INFINITE RECURSION IN RLS POLICIES
-- Run this in your Supabase SQL Editor.

BEGIN;

-- 1. Helper Function to check roles without recursion (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role IN ('super_admin', 'admin', 'moderator')
    FROM public.profiles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'super_admin'
    FROM public.profiles
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own history" ON public.content_history;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.messages;

-- 3. Recreate policies using the helper functions
-- Profiles
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin_or_moderator());

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id OR public.is_super_admin());

-- Content History
CREATE POLICY "Users can view own history" ON public.content_history FOR SELECT 
USING (auth.uid() = user_id OR public.is_admin_or_moderator());

-- Messages
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT 
USING (public.is_admin_or_moderator());

CREATE POLICY "Admins can update messages" ON public.messages FOR UPDATE 
USING (public.is_admin_or_moderator());

COMMIT;
