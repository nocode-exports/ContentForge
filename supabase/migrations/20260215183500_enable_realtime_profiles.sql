-- Enable Realtime for the profiles table
begin;
  -- Remove the table from publication if it exists to avoid errors
  alter publication supabase_realtime drop table if exists public.profiles;
  -- Add the table to the public publication
  alter publication supabase_realtime add table public.profiles;
commit;
