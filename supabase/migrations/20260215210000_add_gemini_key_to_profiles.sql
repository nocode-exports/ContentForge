-- Add custom_gemini_key to profiles table
alter table public.profiles add column if not exists custom_gemini_key text;

