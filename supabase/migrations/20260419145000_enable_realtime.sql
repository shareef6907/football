-- Enable Supabase Realtime on draft tables
-- Run this in Supabase SQL Editor

ALTER PUBLICATION supabase_realtime ADD TABLE draft_picks;
ALTER PUBLICATION supabase_realtime ADD TABLE draft_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE draft_captains;