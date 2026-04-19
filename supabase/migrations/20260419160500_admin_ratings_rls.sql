-- Admin fixes already in supabase-setup.sql - this file is a placeholder.
-- The policies should already exist there.
-- Just in case, drop and recreate:
DROP POLICY IF EXISTS "Anyone can update player ratings" ON player_ratings;
CREATE POLICY "Anyone can update player ratings" ON player_ratings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete player ratings" ON player_ratings;
CREATE POLICY "Anyone can delete player ratings" ON player_ratings FOR DELETE USING (true);