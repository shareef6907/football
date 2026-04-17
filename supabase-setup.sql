-- Thursday Football League v2 - Supabase Schema
-- Project: pngnqlypyyqetklpcpjs

-- =====================================================
-- PLAYERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  google_id TEXT,
  preferred_position VARCHAR(20) DEFAULT 'midfielder',
  form_status VARCHAR(20) DEFAULT 'fit' CHECK (form_status IN ('injured', 'slightly_injured', 'fit')),
  is_guest BOOLEAN DEFAULT FALSE,
  guest_appearance_count INTEGER DEFAULT 0,
  avatar_color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SEASONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MATCHES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  match_date DATE NOT NULL,
  team_size INTEGER DEFAULT 7,
  num_teams INTEGER DEFAULT 2 CHECK (num_teams IN (2, 3)),
  format_notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MATCH TEAMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS match_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  team_number INTEGER NOT NULL,
  team_name VARCHAR(50),
  games_played INTEGER DEFAULT 0,
  consecutive_wins INTEGER DEFAULT 0,
  UNIQUE(match_id, team_number)
);

-- =====================================================
-- MATCH TEAM PLAYERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS match_team_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_team_id UUID REFERENCES match_teams(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  position_played VARCHAR(20)
);

-- =====================================================
-- MATCH STATS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS match_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0 CHECK (goals >= 0),
  assists INTEGER DEFAULT 0 CHECK (assists >= 0),
  is_winner BOOLEAN DEFAULT FALSE,
  played_as_gk BOOLEAN DEFAULT FALSE,
  clean_sheet BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

-- =====================================================
-- ATTENDANCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  attended BOOLEAN DEFAULT TRUE,
  UNIQUE(player_id, match_id)
);

-- =====================================================
-- PLAYER RATINGS TABLE (Monthly peer ratings)
-- =====================================================
CREATE TABLE IF NOT EXISTS player_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID REFERENCES players(id) ON DELETE CASCADE,
  rated_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id) ON DELETE SET NULL,
  rating_month INTEGER CHECK (rating_month BETWEEN 1 AND 12),
  rating_year INTEGER,
  forward_rating INTEGER CHECK (forward_rating BETWEEN 1 AND 10),
  midfielder_rating INTEGER CHECK (midfielder_rating BETWEEN 1 AND 10),
  defender_rating INTEGER CHECK (defender_rating BETWEEN 1 AND 10),
  goalkeeper_rating INTEGER CHECK (goalkeeper_rating BETWEEN 1 AND 10),
  rated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rater_id, rated_player_id, rating_month, rating_year)
);

-- =====================================================
-- MAN OF THE MATCH VOTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS man_of_the_match_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES players(id) ON DELETE CASCADE,
  voted_for_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, voter_id)
);

-- =====================================================
-- MAN OF THE MATCH WINNERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS man_of_the_match_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  vote_count INTEGER DEFAULT 0
);

-- =====================================================
-- COINS LEDGER TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coins_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER PROFILES TABLE (Google auth linking)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  role VARCHAR(20) DEFAULT 'spectator' CHECK (role IN ('player', 'spectator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_match_stats_player ON match_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_match ON match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_attendance_player ON attendance(player_id);
CREATE INDEX IF NOT EXISTS idx_attendance_match ON attendance(match_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_rated ON player_ratings(rated_player_id, rating_month, rating_year);
CREATE INDEX IF NOT EXISTS idx_man_of_match_match ON man_of_the_match_votes(match_id);
CREATE INDEX IF NOT EXISTS idx_coins_ledger_player ON coins_ledger(player_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_google ON user_profiles(google_id);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE man_of_the_match_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE man_of_the_match_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE coins_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - Public Read Access
-- =====================================================
-- Players: open read
CREATE POLICY "Anyone can read players" ON players FOR SELECT USING (true);

-- Seasons: open read
CREATE POLICY "Anyone can read seasons" ON seasons FOR SELECT USING (true);

-- Matches: open read
CREATE POLICY "Anyone can read matches" ON matches FOR SELECT USING (true);

-- Match teams: open read
CREATE POLICY "Anyone can read match teams" ON match_teams FOR SELECT USING (true);

-- Match team players: open read
CREATE POLICY "Anyone can read match team players" ON match_team_players FOR SELECT USING (true);

-- Match stats: open read
CREATE POLICY "Anyone can read match stats" ON match_stats FOR SELECT USING (true);

-- Attendance: open read
CREATE POLICY "Anyone can read attendance" ON attendance FOR SELECT USING (true);

-- Player ratings: open read (but we use a view to hide rater_id)
CREATE POLICY "Anyone can read player ratings" ON player_ratings FOR SELECT USING (true);

-- Man of the Match votes: open read (but we use a view to hide voter_id)
CREATE POLICY "Anyone can read man of the match votes" ON man_of_the_match_votes FOR SELECT USING (true);

-- Man of the Match winners: open read
CREATE POLICY "Anyone can read man of the match winners" ON man_of_the_match_winners FOR SELECT USING (true);

-- Coins ledger: open read
CREATE POLICY "Anyone can read coins ledger" ON coins_ledger FOR SELECT USING (true);

-- User profiles: open read
CREATE POLICY "Anyone can read user profiles" ON user_profiles FOR SELECT USING (true);

-- =====================================================
-- RLS POLICIES - Authenticated Insert/Update
-- =====================================================
-- Match stats: own player only
CREATE POLICY "Players can insert own stats" ON match_stats FOR INSERT WITH CHECK (
  auth.uid()::TEXT IN (SELECT google_id FROM user_profiles WHERE player_id = match_stats.player_id)
);

CREATE POLICY "Players can update own stats" ON match_stats FOR UPDATE USING (
  auth.uid()::TEXT IN (SELECT google_id FROM user_profiles WHERE player_id = match_stats.player_id)
);

-- Attendance: own attendance
CREATE POLICY "Players can mark own attendance" ON attendance FOR INSERT WITH CHECK (
  auth.uid()::TEXT IN (SELECT google_id FROM user_profiles WHERE player_id = attendance.player_id)
);

-- Man of the Match votes: authenticated users
CREATE POLICY "Auth users can vote for MOTM" ON man_of_the_match_votes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Player ratings: authenticated players only
CREATE POLICY "Players can submit ratings" ON player_ratings FOR INSERT WITH CHECK (
  auth.uid()::TEXT IN (SELECT google_id FROM user_profiles WHERE player_id = player_ratings.rater_id AND role = 'player')
);

-- User profiles: allow insert for new users
CREATE POLICY "Anyone can create user profile" ON user_profiles FOR INSERT WITH CHECK (true);

-- User profiles: allow update own profile
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (
  auth.uid()::TEXT = user_profiles.google_id
);

-- Coins ledger: allow insert
CREATE POLICY "System can add coin entries" ON coins_ledger FOR INSERT WITH CHECK (true);

-- =====================================================
-- SEED 21 PLAYERS WITH EXISTING UUIDs
-- =====================================================
INSERT INTO players (id, name, avatar_color, preferred_position) VALUES
  ('7f1e43d8-80f0-49c6-84ac-6378af6de477', 'Ahmed', '#EF4444', 'forward'),
  ('d58595c9-cb6c-4b9d-8158-523f6b893580', 'Fasin', '#F97316', 'midfielder'),
  ('6e3d931a-dc26-4b90-81f0-59ff53019e50', 'Hamsheed', '#EAB308', 'forward'),
  ('6c0ce954-87a5-41b2-8898-1330751155b0', 'Jalal', '#22C55E', 'defender'),
  ('ba7c5acc-c94d-466e-8d5a-0c7773c2bf0c', 'Shareef', '#3B82F6', 'midfielder'),
  ('10825c4b-23d0-4e93-8c49-eadface5aeb3', 'Shaheen', '#8B5CF6', 'forward'),
  ('ac54a34c-4448-4721-8442-5dde27973756', 'Emaad', '#EC4899', 'defender'),
  ('df86a60e-5940-406a-8330-f74379c89da3', 'Luqman', '#14B8A6', 'midfielder'),
  ('3b16e4b3-82f5-4a0e-80d3-86f6b149891a', 'Nabeel', '#06B6D4', 'forward'),
  ('793fb65a-2b41-41d8-84d4-f4ab015c6aab', 'Jinish', '#F43F5E', 'midfielder'),
  ('e30229fa-f9d5-4440-8dc4-471d213ffb6b', 'Shammas', '#84CC16', 'defender'),
  ('d7a8e753-d98e-43d6-8c44-6eda18f32d4d', 'Rathul', '#A855F7', 'goalkeeper'),
  ('611a0a44-d1e2-40fe-8946-ba84e980a694', 'Madan', '#10B981', 'forward'),
  ('1b6a5f4a-c0e8-4694-83cb-4da00c20545e', 'Waleed', '#0EA5E9', 'midfielder'),
  ('149aedd7-a9a5-4810-8002-c67163cd5cf6', 'Raihan', '#F59E0B', 'defender'),
  ('1215383b-bbb7-43f3-8759-2f5b69994330', 'Junaid', '#6366F1', 'defender'),
  ('dfea2af6-9ab5-4e88-8f0b-6860f83ae8ef', 'Shafeer', '#D946EF', 'goalkeeper'),
  ('ae977a0c-cfb6-4827-87c9-f2448f03164e', 'Fathah', '#14B8A6', 'midfielder'),
  ('42c2e951-394b-4b32-8823-3b5f70d3a56d', 'Raed', '#F97316', 'forward'),
  ('9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d', 'Ameen', '#22C55E', 'defender'),
  ('6c6b378f-2748-467a-8eca-62c782eacd0a', 'Darwish', '#3B82F6', 'defender')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  avatar_color = EXCLUDED.avatar_color,
  preferred_position = EXCLUDED.preferred_position;

-- =====================================================
-- SEED FIRST SEASON
-- =====================================================
INSERT INTO seasons (id, name, start_date, end_date, is_active) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Season 1', '2025-01-01', '2025-03-31', TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- DATABASE FUNCTIONS (for anonymous aggregations)
-- =====================================================

-- Get average ratings for a player ( hides individual raters )
CREATE OR REPLACE FUNCTION get_player_average_ratings(p_player_id UUID)
RETURNS TABLE (
  player_id UUID,
  forward_avg NUMERIC,
  midfielder_avg NUMERIC,
  defender_avg NUMERIC,
  goalkeeper_avg NUMERIC,
  total_ratings INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    player_ratings.rated_player_id,
    AVG(player_ratings.forward_rating)::NUMERIC(3,1),
    AVG(player_ratings.midfielder_rating)::NUMERIC(3,1),
    AVG(player_ratings.defender_rating)::NUMERIC(3,1),
    AVG(player_ratings.goalkeeper_rating)::NUMERIC(3,1),
    COUNT(*)::INTEGER
  FROM player_ratings
  WHERE player_ratings.rated_player_id = p_player_id
    AND player_ratings.rater_id != p_player_id  -- Exclude self-rating
  GROUP BY player_ratings.rated_player_id;
END;
$$ LANGUAGE plpgsql;

-- Calculate player coins balance
CREATE OR REPLACE FUNCTION get_player_coins(p_player_id UUID)
RETURNS TABLE (
  player_id UUID,
  total_coins BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    coins_ledger.player_id,
    SUM(coins_ledger.amount)::BIGINT
  FROM coins_ledger
  WHERE coins_ledger.player_id = p_player_id
  GROUP BY coins_ledger.player_id;
END;
$$ LANGUAGE plpgsql;