# Database Setup for Game Settings Feature

## Quick Setup

To enable the new game settings management feature, you need to create the `game_settings` table in your Supabase database.

### Step 1: Go to Supabase Dashboard
1. Visit [supabase.com](https://supabase.com)
2. Open your project: **slxkyrqgxvekxrzcoiew**
3. Go to **SQL Editor**

### Step 2: Run This SQL Command

Copy and paste this SQL into the SQL Editor and click **RUN**:

```sql
-- Create game_settings table
CREATE TABLE game_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_date TIMESTAMP WITH TIME ZONE NOT NULL,
  submission_start TIMESTAMP WITH TIME ZONE NOT NULL,
  submission_end TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_game_settings_is_active ON game_settings(is_active);
CREATE INDEX idx_game_settings_created_at ON game_settings(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to everyone
CREATE POLICY "Allow read access to game_settings" ON game_settings
  FOR SELECT USING (true);

-- Create policy to allow admin operations (you may need to adjust this)
CREATE POLICY "Allow admin operations on game_settings" ON game_settings
  FOR ALL USING (true);
```

### Step 3: Verify Setup
After running the SQL, your production site should now show:
- ✅ **Admin Panel**: Game Time & Submission Window section (orange theme)
- ✅ **Homepage**: Dynamic countdown based on custom game times
- ✅ **Functionality**: Ability to set custom game times and submission windows

## What This Enables

**Before Setup**: 
- Fixed Thursday 8PM games
- Fixed submission window (Thu 6PM to Wed 11:59PM)

**After Setup**:
- ✨ **Custom Game Times**: Set any day/time for games
- ✨ **Custom Submission Windows**: Set any submission period
- ✨ **Admin Control**: Easy management through admin panel
- ✨ **Real-time Updates**: Homepage countdown adapts automatically

## Current Status

The application has been deployed with **graceful fallback** - it works perfectly even without the database table:

- ✅ **Deployment Fixed**: No more Vercel errors
- ✅ **Backward Compatible**: Falls back to default Thursday schedule
- ✅ **Ready for Enhancement**: Add table to unlock new features

**Next Steps**: Run the SQL above to unlock the full game settings management system!