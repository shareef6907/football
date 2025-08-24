import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for admin operations (server-side only)
function createAdminClient() {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

export const getSupabaseAdmin = () => createAdminClient()

// Database helper functions for existing schema
export interface PlayerStats {
  id?: string
  game_id?: string | null
  user_id?: string | null
  goals: number
  assists: number
  saves: number
  points_earned?: number
  team: string
  confirmed_by?: any[]
  verification_count?: number
  verified?: boolean
  created_at?: string
}

export interface Game {
  id?: string
  name?: string
  date?: string
  created_at?: string
}

// Player names array (since no players table)
export const PLAYERS = [
  'Ahmed', 'Fasin', 'Hamsheed', 'Jalal', 'Shareef',
  'Shaheen', 'Emaad', 'Darwish', 'Luqman', 'Nabeel',
  'Jinish', 'Afzal', 'Rathul', 'Madan', 'Waleed',
  'Ahmed-Ateeq', 'Junaid', 'Shafeer', 'Fathah', 'Nithin'
]

// Get all players (return from static list since no players table)
export async function getAllPlayers(): Promise<{id: number, name: string}[]> {
  return PLAYERS.map((name, index) => ({
    id: index + 1,
    name: name
  }))
}

// Get player by name (return from static list)
export async function getPlayerByName(name: string): Promise<{id: number, name: string} | null> {
  const index = PLAYERS.indexOf(name)
  if (index === -1) return null
  return { id: index + 1, name: name }
}

// No need for upsertPlayer since using static list

// Get current week's stats for all players
export async function getCurrentWeekStats(): Promise<PlayerStats[]> {
  const weekStart = getWeekStart()
  
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .gte('created_at', weekStart + 'T00:00:00')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching current week stats:', error)
    return []
  }
  
  return data || []
}

// Submit player stats using API route
export async function submitPlayerStats(playerName: string, stats: {
  goals: number
  assists: number
  saves: number
  won: boolean
  form_status?: string
  game_date: string
}): Promise<boolean> {
  try {
    const response = await fetch('/api/submit-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        playerName,
        goals: stats.goals,
        assists: stats.assists,
        saves: stats.saves,
        won: stats.won
      })
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('API error:', result.error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error submitting player stats:', error)
    return false
  }
}

// Check if player has submitted this week (simplified - just check if team is full)
export async function hasPlayerSubmittedThisWeek(playerName: string): Promise<boolean> {
  const weekStart = getWeekStart()
  
  // Map players to teams A and B only (constraint allows only A, B)
  const playerTeamMap: { [key: string]: string } = {
    // Team A (10 players)
    'Ahmed': 'A', 'Hamsheed': 'A', 'Shareef': 'A', 'Emaad': 'A', 'Luqman': 'A',
    'Jinish': 'A', 'Rathul': 'A', 'Waleed': 'A', 'Junaid': 'A', 'Fathah': 'A',
    // Team B (10 players)  
    'Fasin': 'B', 'Jalal': 'B', 'Shaheen': 'B', 'Darwish': 'B', 'Nabeel': 'B',
    'Afzal': 'B', 'Madan': 'B', 'Ahmed-Ateeq': 'B', 'Shafeer': 'B', 'Nithin': 'B'
  }
  const assignedTeam = playerTeamMap[playerName] || 'Z'
  
  // Check if team already has maximum submissions this week
  const { data } = await supabase
    .from('player_stats')
    .select('*')
    .gte('created_at', weekStart + 'T00:00:00')
    .eq('team', assignedTeam)
  
  // If team already has 10 submissions, consider player as already submitted
  return (data && data.length >= 10) || false
}

// Helper function to get the start of the current week (Monday)
function getWeekStart(): string {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

// Get aggregated stats for all players
export async function getPlayerRankings(): Promise<any[]> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
  
  if (error) {
    console.error('Error fetching player rankings:', error)
    return []
  }
  
  // Create reverse mapping for stats aggregation (multiple players per team)
  const teamPlayerMap: { [key: string]: string[] } = {
    'A': ['Ahmed', 'Hamsheed', 'Shareef', 'Emaad', 'Luqman', 'Jinish', 'Rathul', 'Waleed', 'Junaid', 'Fathah'],
    'B': ['Fasin', 'Jalal', 'Shaheen', 'Darwish', 'Nabeel', 'Afzal', 'Madan', 'Ahmed-Ateeq', 'Shafeer', 'Nithin']
  }
  
  const playerStats: { [key: string]: any } = {}
  
  // Since we need to map individual records back to players, we need a different approach
  // We'll use the original player names and look up their team assignments
  const playerToTeamMap: { [key: string]: string } = {
    // Team A (10 players)
    'Ahmed': 'A', 'Hamsheed': 'A', 'Shareef': 'A', 'Emaad': 'A', 'Luqman': 'A',
    'Jinish': 'A', 'Rathul': 'A', 'Waleed': 'A', 'Junaid': 'A', 'Fathah': 'A',
    // Team B (10 players)  
    'Fasin': 'B', 'Jalal': 'B', 'Shaheen': 'B', 'Darwish': 'B', 'Nabeel': 'B',
    'Afzal': 'B', 'Madan': 'B', 'Ahmed-Ateeq': 'B', 'Shafeer': 'B', 'Nithin': 'B'
  }
  
  // Group stats by team first, then we'll need to manually assign to players
  // Since multiple players can be on team A/B, we cannot reverse-map from team to individual player
  // We'll need to track by created_at timestamp and match to specific submissions
  
  // Since we can't track individual players without user_id, 
  // we'll create aggregate stats based on team performance
  const teamStats: { [key: string]: any } = {}
  
  data?.forEach((stat: any) => {
    const team = stat.team
    if (!team) return
    
    if (!teamStats[team]) {
      teamStats[team] = {
        name: `Team ${team}`,
        goals: 0,
        assists: 0,
        saves: 0,
        wins: 0,
        totalGames: 0,
        form: 'fit'
      }
    }
    
    teamStats[team].goals += stat.goals || 0
    teamStats[team].assists += stat.assists || 0
    teamStats[team].saves += stat.saves || 0
    if (stat.points_earned >= 10) teamStats[team].wins += 1
    teamStats[team].totalGames += 1
  })
  
  // For individual rankings, create entries for all players with default values
  PLAYERS.forEach(playerName => {
    const playerTeam = playerToTeamMap[playerName] || 'Z'
    const teamData = teamStats[playerTeam]
    
    if (teamData) {
      // Distribute team stats evenly among team players for display
      const teamSize = teamPlayerMap[playerTeam]?.length || 1
      playerStats[playerName] = {
        name: playerName,
        goals: Math.floor(teamData.goals / teamSize),
        assists: Math.floor(teamData.assists / teamSize),
        saves: Math.floor(teamData.saves / teamSize),
        wins: Math.floor(teamData.wins / teamSize),
        totalGames: Math.floor(teamData.totalGames / teamSize),
        form: 'fit'
      }
    } else {
      playerStats[playerName] = {
        name: playerName,
        goals: 0,
        assists: 0,
        saves: 0,
        wins: 0,
        totalGames: 0,
        form: 'fit'
      }
    }
  })
  
  // Convert to array and calculate total points
  return Object.values(playerStats).map((player: any) => ({
    ...player,
    totalPoints: (player.goals * 5) + (player.assists * 3) + (player.saves * 2) + (player.wins * 10)
  })).sort((a: any, b: any) => b.totalPoints - a.totalPoints)
}