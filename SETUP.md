# Thursday Football League v2 - Setup Guide

## New Supabase Project Details

- **Project Name:** Football
- **Project ID:** pngnqlypyyqetklpcpjs
- **Project URL:** https://pngnqlypyyqetklpcpjs.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/pngnqlypyyqetklpcpjs
- **Database Password:** 1mNoUX2pBDHoSwBN
- **Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZ25xbHlweXlxZXRrbHBjcGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTUyMzgsImV4cCI6MjA5MTk5MTIzOH0.Bj1UVMSAuTQWGferXoZkN3tMwPT4EyaMPo40bP9YqXg
- **Service Role Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZ25xbHlweXlxZXRrbHBjcGpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQxNTIzOCwiZXhwIjoyMDkxOTkxMjM4fQ.xCMlN8LyAd8fOeEcp2LqEwhXMBSPdGYlfYJieMah4m8

## Step 1: Run SQL Schema

1. Go to **Supabase Dashboard** → https://supabase.com/dashboard/project/pngnqlypyyqetklpcpjs
2. Click **SQL Editor** in the sidebar
3. Copy the contents of `supabase-setup.sql`
4. Paste into the SQL Editor and click **Run**
5. Verify you see "SUCCESS" for all commands

## Step 2: Enable Google Auth

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Click **Google** to enable it
3. You'll need to set up a Google Cloud project with OAuth credentials:
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   - Go to **APIs & Services** → **OAuth consent screen**
   - Configure as "External" and add your email as a test user
   - Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
   - Application type: Web application
   - Authorized redirect URIs: `https://pngnqlypyyqetklpcpjs.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret
4. Back in Supabase, enter the Google Client ID and Client Secret
5. Save the Google provider settings

## Step 3: Configure Site URL

1. Go to **Settings** → **API**
2. Set **Site URL** to: `https://football.vercel.app` (you'll deploy to Vercel later)
3. Set **Redirect URLs** to include:
   - `http://localhost:3000`
   - `https://football.vercel.app`

## Step 4: Deploy to Vercel (After building locally)

1. Push your code to GitHub branch `feature/thursday-football-v2`
2. Go to https://vercel.com
3. Import the repository
4. Add the environment variables from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy

## Environment Variables

Your `.env.local` already has the correct values:

```
NEXT_PUBLIC_SUPABASE_URL=https://pngnqlypyyqetklpcpjs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZ25xbHlweXlxZXRrbHBjcGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MTUyMzgsImV4cCI6MjA5MTk5MTIzOH0.Bj1UVMSAuTQWGferXoZkN3tMwPT4EyaMPo40bP9YqXg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuZ25xbHlweXlxZXRrbHBjcGpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQxNTIzOCwiZXhwIjoyMDkxOTkxMjM4fQ.xCMlN8LyAd8fOeEcp2LqEwhXMBSPdGYlfYJieMah4m8
```

## Database Schema Overview

The schema creates 13 tables:

1. **players** - 21 seeded players with their UUIDs
2. **seasons** - Season definitions
3. **matches** - Individual match days
4. **match_teams** - Teams for each match
5. **match_team_players** - Player assignments to teams
6. **match_stats** - Goals, assists, wins per player per match
7. **attendance** - Who attended each match
8. **player_ratings** - Monthly peer ratings (1-10 for each position)
9. **man_of_the_match_votes** - Anonymous votes
10. **man_of_the_match_winners** - Match winners
11. **coins_ledger** - Coin transactions
12. **user_profiles** - Links Google accounts to players
13. **Indexes and RLS policies** - For performance and security

All RLS policies are configured for:
- Public read on standings, stats, players, matches
- Insert/update only for authenticated users for their own data
- voter_id and rater_id stored but hidden via database functions