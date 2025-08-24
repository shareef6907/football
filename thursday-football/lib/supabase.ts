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
    
    // Store submission in localStorage for tracking
    if (result.success && result.submissionId) {
      const weekStart = getWeekStart()
      const submissionKey = `submission_${weekStart}_${playerName}`
      localStorage.setItem(submissionKey, JSON.stringify({
        id: result.submissionId,
        playerName: result.playerName,
        submittedAt: new Date().toISOString(),
        stats: stats
      }))
    }
    
    return true
  } catch (error) {
    console.error('Error submitting player stats:', error)
    return false
  }
}

// Check if player has submitted this week using localStorage
export async function hasPlayerSubmittedThisWeek(playerName: string): Promise<boolean> {
  const weekStart = getWeekStart()
  const submissionKey = `submission_${weekStart}_${playerName}`
  
  // Check localStorage first for fast response
  if (typeof window !== 'undefined') {
    const storedSubmission = localStorage.getItem(submissionKey)
    if (storedSubmission) {
      return true
    }
  }
  
  return false
}

// Helper function to get the start of the current week (Monday)
function getWeekStart(): string {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

// Get aggregated stats for all players using localStorage tracking
export async function getPlayerRankings(): Promise<any[]> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
  
  if (error) {
    console.error('Error fetching player rankings:', error)
    return []
  }
  
  const playerStats: { [key: string]: any } = {}
  
  // Initialize all players with default stats
  PLAYERS.forEach(playerName => {
    playerStats[playerName] = {
      name: playerName,
      goals: 0,
      assists: 0,
      saves: 0,
      wins: 0,
      totalGames: 0,
      form: 'fit',
      submissions: []
    }
  })
  
  // Get submissions from localStorage and match with database stats
  if (typeof window !== 'undefined') {
    const weekStart = getWeekStart()
    
    PLAYERS.forEach(playerName => {
      const submissionKey = `submission_${weekStart}_${playerName}`
      const storedSubmission = localStorage.getItem(submissionKey)
      
      if (storedSubmission) {
        try {
          const submission = JSON.parse(storedSubmission)
          const stats = submission.stats
          
          playerStats[playerName].goals += stats.goals || 0
          playerStats[playerName].assists += stats.assists || 0
          playerStats[playerName].saves += stats.saves || 0
          playerStats[playerName].wins += stats.won ? 1 : 0
          playerStats[playerName].totalGames += 1
          playerStats[playerName].submissions.push(submission)
        } catch (e) {
          console.error('Error parsing stored submission:', e)
        }
      }
    })
  }
  
  // Convert to array and calculate total points
  return Object.values(playerStats).map((player: any) => ({
    ...player,
    totalPoints: (player.goals * 5) + (player.assists * 3) + (player.saves * 2) + (player.wins * 10)
  })).sort((a: any, b: any) => b.totalPoints - a.totalPoints)
}