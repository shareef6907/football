-- Game Settings Table Creation
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS game_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_date TIMESTAMPTZ NOT NULL,
  submission_start TIMESTAMPTZ NOT NULL,
  submission_end TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_game_settings_active ON game_settings (is_active);
CREATE INDEX IF NOT EXISTS idx_game_settings_created_at ON game_settings (created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow read access to all authenticated users
CREATE POLICY "Allow read access to all users" ON game_settings
  FOR SELECT USING (true);

-- Policy to allow admin operations (you might want to restrict this further)
CREATE POLICY "Allow admin access" ON game_settings
  FOR ALL USING (true);

-- Insert a sample record for testing (Wednesday 8:30PM this week)
-- You can modify the dates as needed
INSERT INTO game_settings (game_date, submission_start, submission_end, is_active)
VALUES (
  -- Game on this Wednesday 8:30PM (adjust as needed)
  '2025-09-03 20:30:00+03',
  -- Submission starts now (adjust as needed)
  now(),
  -- Submission ends next Thursday 6AM (adjust as needed)
  '2025-09-12 06:00:00+03',
  true
)
ON CONFLICT DO NOTHING;