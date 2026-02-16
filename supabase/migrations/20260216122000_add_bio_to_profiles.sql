-- Add bio column to profiles for personalization
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
