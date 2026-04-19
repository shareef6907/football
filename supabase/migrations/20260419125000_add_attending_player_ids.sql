-- Add attending_player_ids column to draft_sessions
ALTER TABLE public.draft_sessions ADD COLUMN IF NOT EXISTS attending_player_ids TEXT[] DEFAULT ARRAY[]::TEXT[];