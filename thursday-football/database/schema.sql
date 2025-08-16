-- Thursday Football Club Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_status table
CREATE TABLE public.form_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('injured', 'slightly_injured', 'full_form', 'peak_form')) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create games table
CREATE TABLE public.games (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_date DATE NOT NULL,
  team_a_players UUID[] NOT NULL,
  team_b_players UUID[] NOT NULL,
  team_a_score INTEGER DEFAULT 0,
  team_b_score INTEGER DEFAULT 0,
  winning_team VARCHAR(1) CHECK (winning_team IN ('A', 'B', 'D')) DEFAULT 'D', -- D for draw
  game_type VARCHAR(10) CHECK (game_type IN ('5v5', '6v6')) DEFAULT '5v5',
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_stats table
CREATE TABLE public.player_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  team VARCHAR(1) CHECK (team IN ('A', 'B')) NOT NULL,
  confirmed_by UUID[] DEFAULT '{}', -- Array of user IDs who confirmed these stats
  verification_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create peer_ratings table
CREATE TABLE public.peer_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rater_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rated_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 10) NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: "2025-01"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(rater_id, rated_user_id, month_year)
);

-- Create monthly_awards table
CREATE TABLE public.monthly_awards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  award_type VARCHAR(20) CHECK (award_type IN ('player_of_month', 'top_goal_scorer', 'most_assists')) NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: "2025-01"
  win_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, award_type, month_year)
);

-- Create teams table (for storing generated teams)
CREATE TABLE public.teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  team_a_players UUID[] NOT NULL,
  team_b_players UUID[] NOT NULL,
  team_a_avg_rating DECIMAL(3,2),
  team_b_avg_rating DECIMAL(3,2),
  balance_score DECIMAL(3,2), -- How balanced the teams are (lower is better)
  game_type VARCHAR(10) CHECK (game_type IN ('5v5', '6v6')) DEFAULT '5v5',
  used_in_game_id UUID REFERENCES public.games(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL, -- e.g., "5_goals_streak", "hat_trick", "clean_sheet"
  achievement_title VARCHAR(100) NOT NULL,
  achievement_description TEXT,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_id UUID REFERENCES public.games(id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_games_date ON public.games(game_date);
CREATE INDEX idx_player_stats_game_user ON public.player_stats(game_id, user_id);
CREATE INDEX idx_peer_ratings_month ON public.peer_ratings(month_year);
CREATE INDEX idx_monthly_awards_month ON public.monthly_awards(month_year);
CREATE INDEX idx_achievements_user ON public.achievements(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can read all profiles" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Create policies for form_status table
CREATE POLICY "Users can read all form status" ON public.form_status
  FOR SELECT USING (true);

CREATE POLICY "Users can update own form status" ON public.form_status
  FOR ALL USING (auth.uid() = user_id);

-- Create policies for games table
CREATE POLICY "Users can read all games" ON public.games
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage games" ON public.games
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for player_stats table
CREATE POLICY "Users can read all player stats" ON public.player_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own stats" ON public.player_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update stats they're involved in" ON public.player_stats
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for peer_ratings table
CREATE POLICY "Users can read all ratings" ON public.peer_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own ratings" ON public.peer_ratings
  FOR ALL USING (auth.uid() = rater_id);

-- Create policies for monthly_awards table
CREATE POLICY "Users can read all awards" ON public.monthly_awards
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage awards" ON public.monthly_awards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for teams table
CREATE POLICY "Users can read all teams" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage teams" ON public.teams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create policies for achievements table
CREATE POLICY "Users can read all achievements" ON public.achievements
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage achievements" ON public.achievements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create functions for calculating points
CREATE OR REPLACE FUNCTION calculate_player_points(
  goals_count INTEGER,
  assists_count INTEGER,
  saves_count INTEGER,
  is_winning_team BOOLEAN
) RETURNS INTEGER AS $$
BEGIN
  RETURN (goals_count * 5) + (assists_count * 3) + (saves_count * 2) + 
         CASE WHEN is_winning_team THEN 5 ELSE 0 END;
END;
$$ LANGUAGE plpgsql;

-- Create function to update total points
CREATE OR REPLACE FUNCTION update_user_total_points(user_uuid UUID) RETURNS VOID AS $$
BEGIN
  UPDATE public.users 
  SET total_points = (
    SELECT COALESCE(SUM(points_earned), 0)
    FROM public.player_stats 
    WHERE user_id = user_uuid AND verified = true
  )
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update total points when stats are verified
CREATE OR REPLACE FUNCTION trigger_update_total_points() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.verified = true AND (OLD.verified IS NULL OR OLD.verified = false) THEN
    PERFORM update_user_total_points(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_total_points_trigger
  AFTER UPDATE ON public.player_stats
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_total_points();