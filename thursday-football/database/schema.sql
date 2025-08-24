-- Thursday Football League Database Schema

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game stats table  
CREATE TABLE IF NOT EXISTS game_stats (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  game_date DATE NOT NULL,
  goals INTEGER DEFAULT 0 CHECK (goals >= 0),
  assists INTEGER DEFAULT 0 CHECK (assists >= 0),
  saves INTEGER DEFAULT 0 CHECK (saves >= 0),
  won BOOLEAN DEFAULT FALSE,
  form_status VARCHAR(20) DEFAULT 'fit' CHECK (form_status IN ('injured', 'slightly_injured', 'fit')),
  submitted_at TIMESTAMP DEFAULT NOW()
);

-- Weekly submissions tracking
CREATE TABLE IF NOT EXISTS weekly_submissions (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  submitted BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id, week_start)
);

-- Insert initial players
INSERT INTO players (name) VALUES 
  ('Ahmed'),
  ('Fasin'),
  ('Hamsheed'),
  ('Jalal'),
  ('Shareef'),
  ('Shaheen'),
  ('Emaad'),
  ('Darwish'),
  ('Luqman'),
  ('Nabeel'),
  ('Jinish'),
  ('Afzal'),
  ('Rathul'),
  ('Madan'),
  ('Waleed'),
  ('Ahmed-Ateeq'),
  ('Junaid'),
  ('Shafeer'),
  ('Fathah'),
  ('Nithin')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_game_stats_player_date ON game_stats(player_id, game_date);
CREATE INDEX IF NOT EXISTS idx_weekly_submissions_player_week ON weekly_submissions(player_id, week_start);
CREATE INDEX IF NOT EXISTS idx_game_stats_date ON game_stats(game_date);

-- RLS (Row Level Security) policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_submissions ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow read access for players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow read access for game_stats" ON game_stats FOR SELECT USING (true);
CREATE POLICY "Allow read access for weekly_submissions" ON weekly_submissions FOR SELECT USING (true);

-- Allow insert/update for authenticated users
CREATE POLICY "Allow insert for game_stats" ON game_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for game_stats" ON game_stats FOR UPDATE USING (true);
CREATE POLICY "Allow insert for weekly_submissions" ON weekly_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for weekly_submissions" ON weekly_submissions FOR UPDATE USING (true);