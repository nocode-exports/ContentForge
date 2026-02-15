-- Refine RBAC hierarchy and RLS policies

-- Update Profile RLS to allow admins to manage non-admins
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Admins can update users" 
on public.profiles for update 
using (
  auth.uid() = user_id 
  or (
    (select role from public.profiles where user_id = auth.uid()) = 'super_admin'
  )
  or (
    (select role from public.profiles where user_id = auth.uid()) = 'admin'
    and role not in ('super_admin', 'admin') -- Admins can't edit other admins or super admins
  )
);

-- Allow moderators and admins to select any profile
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Management can view all profiles" 
on public.profiles for select 
using (
  auth.uid() = user_id 
  or (select role from public.profiles where user_id = auth.uid()) in ('super_admin', 'admin', 'moderator')
);
