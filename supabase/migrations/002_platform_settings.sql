-- ============================================================
-- Platform Settings Table Migration
-- Key-value store for application configuration
-- ============================================================

-- Create the platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- Create index on key for fast lookups
CREATE INDEX IF NOT EXISTS idx_platform_settings_key ON platform_settings(key);

-- Add updated_at trigger (reuses existing function from 001_initial_schema.sql)
DROP TRIGGER IF EXISTS platform_settings_updated_at ON platform_settings;
CREATE TRIGGER platform_settings_updated_at
  BEFORE UPDATE ON platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings
INSERT INTO platform_settings (key, value) VALUES
  ('ai_enabled', 'true'),
  ('groq_api_key', ''),
  ('max_projects_per_user', '10'),
  ('max_storage_mb', '500'),
  ('registration_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON platform_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Allow authenticated users to read settings
CREATE POLICY "Authenticated read" ON platform_settings
  FOR SELECT USING (true);
