
-- Enum for User Roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'moderator', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enum for Subscription Tiers
DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('free', 'starter', 'pro', 'unlimited');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update Profiles Table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user',
ADD COLUMN IF NOT EXISTS tier subscription_tier NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS custom_openai_key TEXT,
ADD COLUMN IF NOT EXISTS monthly_usage_count INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_usage_reset TIMESTAMPTZ NOT NULL DEFAULT now();

-- Update RLS for profiles based on RBAC
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('super_admin', 'admin')
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'
);

-- Update RLS for content_history to allow admins to see all history
DROP POLICY IF EXISTS "Users can view own history" ON public.content_history;
CREATE POLICY "Users can view own history" 
ON public.content_history FOR SELECT 
USING (
  auth.uid() = user_id 
  OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('super_admin', 'admin', 'moderator')
);
