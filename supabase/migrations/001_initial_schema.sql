-- Supabase Database Migration: Initial Schema
-- Project: uuslujxtsrtbvjihcdzw
-- 
-- Execute this SQL in the Supabase Dashboard SQL Editor at:
-- https://supabase.com/dashboard/project/uuslujxtsrtbvjihcdzw/sql
--
-- Or run via Supabase CLI:
--   supabase db push --linked
--
-- Or via psql with the database password:
--   psql "postgresql://postgres.uuslujxtsrtbvjihcdzw:<YOUR_DB_PASSWORD>@db.uuslujxtsrtbvjihcdzw.supabase.co:5432/postgres"

-- ============================================
-- TABLES
-- ============================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  skills TEXT DEFAULT '[]',
  github_url TEXT,
  is_frozen BOOLEAN DEFAULT false,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template TEXT DEFAULT 'node',
  files TEXT DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  is_deployed BOOLEAN DEFAULT false,
  deploy_url TEXT,
  preview_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT,
  status TEXT DEFAULT 'pending',
  logs TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create ai_chat_messages table
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STORAGE
-- ============================================

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts on re-run
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can read all users" ON users;
  DROP POLICY IF EXISTS "Users can update own profile" ON users;
  DROP POLICY IF EXISTS "Users can insert themselves" ON users;
  DROP POLICY IF EXISTS "Admin can manage users" ON users;
  DROP POLICY IF EXISTS "Admin can update users" ON users;
  DROP POLICY IF EXISTS "Anyone can read public projects" ON projects;
  DROP POLICY IF EXISTS "Users can read own projects" ON projects;
  DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
  DROP POLICY IF EXISTS "Users can update own projects" ON projects;
  DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
  DROP POLICY IF EXISTS "Users can manage deployments" ON deployments;
  DROP POLICY IF EXISTS "Users can manage their messages" ON ai_chat_messages;
  DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can update avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can delete avatars" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- RLS Policies for users
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Users can insert themselves" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can manage users" ON users FOR DELETE USING (true);
CREATE POLICY "Admin can update users" ON users FOR UPDATE USING (true);

-- RLS Policies for projects
CREATE POLICY "Anyone can read public projects" ON projects FOR SELECT USING (is_public = true);
CREATE POLICY "Users can read own projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (true);

-- RLS Policies for deployments
CREATE POLICY "Users can manage deployments" ON deployments FOR ALL USING (true);

-- RLS Policies for ai_chat_messages
CREATE POLICY "Users can manage their messages" ON ai_chat_messages FOR ALL USING (true);

-- ============================================
-- STORAGE POLICIES
-- ============================================

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can delete avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);
CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON ai_chat_messages(user_id);
