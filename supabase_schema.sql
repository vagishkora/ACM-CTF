-- ACM CTF Database Schema for Supabase
-- Run this in your Supabase project: SQL Editor -> New Query -> Run

-- 1. Create table for accounts provisioned by Admin
CREATE TABLE IF NOT EXISTS public.registered_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'participant', -- 'participant' or 'organizer'
    name TEXT,
    usn TEXT,
    year TEXT,
    branch TEXT,
    phone TEXT,
    is_profile_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create table for synchronized team solves
CREATE TABLE IF NOT EXISTS public.team_solves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL,
    challenge_id TEXT NOT NULL,
    challenge_title TEXT NOT NULL,
    category TEXT,
    points INT NOT NULL DEFAULT 0,
    solved_by TEXT NOT NULL,
    solved_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(team_name, challenge_id)
);

-- 3. Enable Row Level Security (RLS) & allow anonymous CTF event operations
ALTER TABLE public.registered_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_solves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read registered_accounts" 
ON public.registered_accounts FOR SELECT USING (true);

CREATE POLICY "Allow public insert registered_accounts" 
ON public.registered_accounts FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update registered_accounts" 
ON public.registered_accounts FOR UPDATE USING (true);

CREATE POLICY "Allow public delete registered_accounts" 
ON public.registered_accounts FOR DELETE USING (true);

CREATE POLICY "Allow public read team_solves" 
ON public.team_solves FOR SELECT USING (true);

CREATE POLICY "Allow public insert team_solves" 
ON public.team_solves FOR INSERT WITH CHECK (true);

-- 4. Enable Supabase Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.registered_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_solves;
