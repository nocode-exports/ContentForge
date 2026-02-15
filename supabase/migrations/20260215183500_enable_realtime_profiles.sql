-- Enable Realtime for the profiles table
begin;
  -- Safely add the table to the publication without dropping if exists (which fails on PG < 15)
  do $$ 
  begin
    if not exists (
      select 1 from pg_publication_tables 
      where pubname = 'supabase_realtime' 
      and schemaname = 'public' 
      and tablename = 'profiles'
    ) then
      alter publication supabase_realtime add table public.profiles;
    end if;
  end $$;
commit;
