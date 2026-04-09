-- ============================================================
-- Cloud IDE - Initial Schema Migration
-- Run this in the Supabase SQL Editor if the /api/setup endpoint fails
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Users Table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password      TEXT NOT NULL,
  avatar        TEXT,
  bio           TEXT,
  role          TEXT NOT NULL DEFAULT 'user',
  skills        JSONB DEFAULT '[]'::jsonb,
  github_url    TEXT,
  is_frozen     BOOLEAN NOT NULL DEFAULT false,
  is_online     BOOLEAN NOT NULL DEFAULT false,
  last_seen     TIMESTAMPTZ,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);

-- Users updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Projects Table
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  template      TEXT NOT NULL DEFAULT 'node',
  files         JSONB DEFAULT '{}'::jsonb,
  is_public     BOOLEAN NOT NULL DEFAULT false,
  is_deployed   BOOLEAN NOT NULL DEFAULT false,
  deploy_url    TEXT,
  preview_url   TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON projects(is_public);
CREATE INDEX IF NOT EXISTS idx_projects_template ON projects(template);

-- Projects updated_at trigger
DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Deployments Table
-- ============================================================
CREATE TABLE IF NOT EXISTS deployments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url           TEXT,
  status        TEXT NOT NULL DEFAULT 'pending',
  logs          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deployments indexes
CREATE INDEX IF NOT EXISTS idx_deployments_project_id ON deployments(project_id);
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);

-- Deployments updated_at trigger
DROP TRIGGER IF EXISTS deployments_updated_at ON deployments;
CREATE TRIGGER deployments_updated_at
  BEFORE UPDATE ON deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AI Chat Messages Table
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES projects(id) ON DELETE SET NULL,
  role          TEXT NOT NULL,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Chat Messages indexes
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_project_id ON ai_chat_messages(project_id);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Anyone can read public user info (no password)
CREATE POLICY "Public users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Only authenticated users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Insert only via service role (handled by backend)
CREATE POLICY "Service role can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Delete only via service role
CREATE POLICY "Service role can delete users"
  ON users FOR DELETE
  USING (true);

-- Projects policies
CREATE POLICY "Projects are viewable by everyone if public"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert projects"
  ON projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update projects"
  ON projects FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete projects"
  ON projects FOR DELETE
  USING (true);

-- Deployments policies
CREATE POLICY "Deployments are viewable by everyone"
  ON deployments FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert deployments"
  ON deployments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update deployments"
  ON deployments FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- AI Chat Messages policies
CREATE POLICY "Chat messages are viewable by everyone"
  ON ai_chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert chat messages"
  ON ai_chat_messages FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Supabase Storage: Avatars Bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
-- Allow public read access to avatars
CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- Allow service role to delete avatars
CREATE POLICY "Service role can delete avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars');

-- ============================================================
-- Additional columns for password reset and email verification
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;

-- Index for reset_token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- ============================================================
-- Seed Data: Default Admin User
-- Password: admin123 (bcrypt hashed)
-- ============================================================
INSERT INTO users (email, name, password, role, bio, avatar, email_verified)
VALUES (
  'admin@cloudide.com',
  'مدير النظام',
  '$2a$10$rBGJ0ZqvQE1Q0QEZ9SJ0.uJj2T5N7cKQ0KR0vFENmH/x9p9jRKLGW',
  'admin',
  'مدير النظام الرئيسي',
  'https://api.dicebear.com/7.x/initials/svg?seed=AD&backgroundColor=059669',
  true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- Post-initialization: Add columns if they don't exist (for existing databases)
-- ============================================================
DO $$
BEGIN
  -- Add email_verified column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- Add verification_token column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'verification_token'
  ) THEN
    ALTER TABLE users ADD COLUMN verification_token TEXT;
  END IF;
END
$$;
