-- Allow admin to update/delete player ratings
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;

-- Add UPDATE policy for admin
CREATE POLICY "Anyone can update player ratings" ON player_ratings FOR UPDATE USING (true);

-- Add DELETE policy for admin
CREATE POLICY "Anyone can delete player ratings" ON player_ratings FOR DELETE USING (true);