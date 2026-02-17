
-- Fix RLS Infinite Recursion by using Security Definer functions

-- 1. Helper function to get teams a user belongs to (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_team_ids(uid uuid)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = uid;
$$;

-- 2. Helper function to get teams a user owns (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_owned_team_ids(uid uuid)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM public.teams WHERE owner_id = uid;
$$;

-- 3. Drop existing recursive policies
DROP POLICY IF EXISTS "Team members can view roster" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;

-- 4. Re-create Team Members Policy
-- A user can view a team member row if:
-- a) They are viewing themselves (handled by general case or explicit self-view)
-- b) The team_id of the row is in the list of teams they belong to OR own
CREATE POLICY "Team members can view roster" ON public.team_members FOR SELECT TO authenticated USING (
  team_id IN (
    SELECT public.get_user_team_ids(auth.uid())
    UNION
    SELECT public.get_owned_team_ids(auth.uid())
  )
);

-- 5. Re-create Teams Policy
-- A user can view a team row if:
-- a) They own the team
-- b) They are a member of the team (checked via function to avoid table-scan recursion)
CREATE POLICY "Team members can view their teams" ON public.teams FOR SELECT TO authenticated USING (
  owner_id = auth.uid()
  OR
  id IN (SELECT public.get_user_team_ids(auth.uid()))
);
