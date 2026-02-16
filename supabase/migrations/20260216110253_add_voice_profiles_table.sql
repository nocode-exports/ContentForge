-- Migration to add voice_profiles table for Tone Cloner feature

CREATE TABLE IF NOT EXISTS public.voice_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    profile_name TEXT NOT NULL,
    tone_description TEXT NOT NULL,
    writing_style TEXT NOT NULL,
    characteristics TEXT[] NOT NULL DEFAULT '{}',
    sample_sentences TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can create their own voice profiles" ON public.voice_profiles;
DROP POLICY IF EXISTS "Users can view their own voice profiles" ON public.voice_profiles;
DROP POLICY IF EXISTS "Users can update their own voice profiles" ON public.voice_profiles;
DROP POLICY IF EXISTS "Users can delete their own voice profiles" ON public.voice_profiles;

CREATE POLICY "Users can create their own voice profiles" ON public.voice_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own voice profiles" ON public.voice_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own voice profiles" ON public.voice_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own voice profiles" ON public.voice_profiles FOR DELETE USING (auth.uid() = user_id);
