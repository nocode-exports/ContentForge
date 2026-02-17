
-- Migration: Add Teams, Team Members, and Update Transactions for God Mode

-- 1. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 3. Update Profiles Table to include team_id context
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id);

-- 4. Create or Update Transactions Table (God Mode Requirement)
-- Handle case where table doesn't exist at all
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id), 
    plan_name TEXT,
    amount DECIMAL(10,2),
    payment_method TEXT,
    proof_url TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Ensure profile_id exists (in case table existed but was old)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id);

-- 5. Enable RLS on new tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Teams
DO $$ BEGIN
  CREATE POLICY "Users can create teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Team members can view their teams" ON public.teams FOR SELECT TO authenticated USING (
    exists (
      select 1 from public.team_members 
      where team_id = teams.id and user_id = auth.uid()
    ) OR owner_id = auth.uid()
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners can update their teams" ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners can delete their teams" ON public.teams FOR DELETE TO authenticated USING (auth.uid() = owner_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. RLS Policies for Team Members
DO $$ BEGIN
  CREATE POLICY "Team members can view roster" ON public.team_members FOR SELECT TO authenticated USING (
    exists (
      select 1 from public.team_members as tm
      where tm.team_id = team_members.team_id and tm.user_id = auth.uid()
    ) OR 
    exists (
      select 1 from public.teams 
      where id = team_members.team_id and owner_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners can manage team members" ON public.team_members FOR ALL TO authenticated USING (
    exists (
      select 1 from public.teams 
      where id = team_members.team_id and owner_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8. God Mode Policy Update (Transactions)
DO $$ BEGIN
  CREATE POLICY "View own txns" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users insert txns" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
