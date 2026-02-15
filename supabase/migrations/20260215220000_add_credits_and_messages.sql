-- Add credits to profiles and create messages table
alter table public.profiles add column if not exists credits integer default 0;
alter table public.profiles add column if not exists custom_gemini_key text; -- Ensure it exists here too

create table if not exists public.messages (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    subject text not null,
    content text not null,
    status text default 'pending' check (status in ('pending', 'investigating', 'resolved')),
    admin_notes text
);

-- Enable RLS for messages
alter table public.messages enable row level security;

-- Users can insert their own messages
create policy "Users can insert own messages"
on public.messages for insert
with check (auth.uid() = user_id);

-- Users can view their own messages
create policy "Users can view own messages"
on public.messages for select
using (auth.uid() = user_id);

-- Admins can view and update all messages
create policy "Admins can view all messages"
on public.messages for select
using (
    (select role from public.profiles where user_id = auth.uid()) in ('admin', 'super_admin')
);

create policy "Admins can update messages"
on public.messages for update
using (
    (select role from public.profiles where user_id = auth.uid()) in ('admin', 'super_admin')
);

-- Enable Realtime for messages if needed
do $$ 
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
