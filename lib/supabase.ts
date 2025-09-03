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
  confirmed_by?: string[]
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

// Deterministic UUID mapping for players
export const PLAYER_UUIDS: { [key: string]: string } = {
  "Ahmed": "7f1e43d8-80f0-49c6-84ac-6378af6de477",
  "Fasin": "d58595c9-cb6c-4b9d-8158-523f6b893580",
  "Hamsheed": "6e3d931a-dc26-4b90-81f0-59ff53019e50",
  "Jalal": "6c0ce954-87a5-41b2-8898-1330751155b0",
  "Shareef": "ba7c5acc-c94d-466e-8d5a-0c7773c2bf0c",
  "Shaheen": "10825c4b-23d0-4e93-8c49-eadface5aeb3",
  "Emaad": "ac54a34c-4448-4721-8442-5dde27973756",
  "Darwish": "6c6b378f-2748-467a-8eca-62c782eacd0a",
  "Luqman": "df86a60e-5940-406a-8330-f74379c89da3",
  "Nabeel": "3b16e4b3-82f5-4a0e-80d3-86f6b149891a",
  "Jinish": "793fb65a-2b41-41d8-84d4-f4ab015c6aab",
  "Afzal": "e30229fa-f9d5-4440-8dc4-471d213ffb6b",
  "Rathul": "d7a8e753-d98e-43d6-8c44-6eda18f32d4d",
  "Madan": "611a0a44-d1e2-40fe-8946-ba84e980a694",
  "Waleed": "1b6a5f4a-c0e8-4694-83cb-4da00c20545e",
  "Ahmed-Ateeq": "149aedd7-a9a5-4810-8002-c67163cd5cf6",
  "Junaid": "1215383b-bbb7-43f3-8759-2f5b69994330",
  "Shafeer": "dfea2af6-9ab5-4e88-8f0b-6860f83ae8ef",
  "Fathah": "ae977a0c-cfb6-4827-87c9-f2448f03164e",
  "Nithin": "42c2e951-394b-4b32-8823-3b5f70d3a56d"
}

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
    
    // No need for localStorage - data is now properly stored in database with UUIDs
    
    return true
  } catch (error) {
    console.error('Error submitting player stats:', error)
    return false
  }
}

// Check if player has submitted this week using database
export async function hasPlayerSubmittedThisWeek(playerName: string): Promise<boolean> {
  const submissionWindow = await getCurrentSubmissionWindow()
  const playerUUID = PLAYER_UUIDS[playerName]
  
  if (!playerUUID || !submissionWindow) return false
  
  const { data } = await supabase
    .from('player_stats')
    .select('*')
    .gte('created_at', submissionWindow.start)
    .lte('created_at', submissionWindow.end)
    .contains('confirmed_by', [playerUUID])
  
  return (data && data.length > 0) || false
}

// Get current submission window based on active game settings or default
export async function getCurrentSubmissionWindow(): Promise<{start: string, end: string} | null> {
  try {
    const gameSettings = await getActiveGameSettings()
    
    if (gameSettings) {
      return {
        start: gameSettings.submission_start,
        end: gameSettings.submission_end
      }
    }
    
    // Fallback to default Thursday logic
    const weekStart = getWeekStart()
    const weekEnd = getWeekEnd()
    
    return {
      start: weekStart + 'T00:00:00',
      end: weekEnd + 'T23:59:59'
    }
  } catch (error) {
    console.error('Error getting submission window:', error)
    return null
  }
}

// Check if submission window is currently open
export async function isSubmissionWindowOpen(): Promise<boolean> {
  const window = await getCurrentSubmissionWindow()
  if (!window) return false
  
  const now = new Date().toISOString()
  return now >= window.start && now <= window.end
}

// Helper function to get the start of the current submission window (Thursday 6PM Bahrain time)
function getWeekStart(): string {
  const now = new Date()
  
  // Convert to Bahrain time (UTC+3)
  const bahrainTime = new Date(now.getTime() + (3 * 60 * 60 * 1000))
  
  // Get this week's Thursday at 6PM
  const thursday = new Date(bahrainTime)
  thursday.setDate(bahrainTime.getDate() - bahrainTime.getDay() + 4) // This week's Thursday
  thursday.setHours(18, 0, 0, 0) // 6PM
  
  // If it's before Thursday 6PM, use previous Thursday 6PM
  if (bahrainTime < thursday) {
    thursday.setDate(thursday.getDate() - 7)
  }
  
  // Convert back to UTC and return ISO date
  const utcThursday = new Date(thursday.getTime() - (3 * 60 * 60 * 1000))
  return utcThursday.toISOString().split('T')[0]
}

// Helper function to get the end of submission window (Wednesday 11:59PM)
function getWeekEnd(): string {
  const weekStart = getWeekStart()
  const startDate = new Date(weekStart + 'T00:00:00')
  const endDate = new Date(startDate.getTime() + (6 * 24 * 60 * 60 * 1000)) // Add 6 days
  return endDate.toISOString().split('T')[0]
}

// Get aggregated stats for all players from database using UUIDs
export async function getPlayerRankings(): Promise<any[]> {
  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
  
  if (error) {
    console.error('Error fetching player rankings:', error)
    return []
  }
  
  const playerStats: { [key: string]: { 
    name: string; 
    goals: number; 
    assists: number; 
    saves: number; 
    wins: number; 
    totalGames: number; 
    totalPoints: number; 
    form: string;
  } } = {}
  
  // Initialize all players with default stats
  PLAYERS.forEach(playerName => {
    playerStats[playerName] = {
      name: playerName,
      goals: 0,
      assists: 0,
      saves: 0,
      wins: 0,
      totalGames: 0,
      totalPoints: 0,
      form: 'fit'
    }
  })
  
  // Create reverse UUID mapping
  const uuidToPlayerMap: { [key: string]: string } = {}
  Object.entries(PLAYER_UUIDS).forEach(([playerName, uuid]) => {
    uuidToPlayerMap[uuid] = playerName
  })
  
  // Process database stats using UUID mapping from confirmed_by field
  data?.forEach((stat: PlayerStats) => {
    const confirmedBy = stat.confirmed_by
    if (confirmedBy && confirmedBy.length > 0) {
      const playerUUID = confirmedBy[0] // First UUID is the player
      const playerName = uuidToPlayerMap[playerUUID]
      
      if (playerName && playerStats[playerName]) {
        playerStats[playerName].goals += stat.goals || 0
        playerStats[playerName].assists += stat.assists || 0
        playerStats[playerName].saves += stat.saves || 0
        playerStats[playerName].totalPoints += stat.points_earned || 0
        
        // Calculate expected points without win bonus
        const expectedPoints = (stat.goals * 5) + (stat.assists * 3) + (stat.saves * 2)
        // If actual points are 10 more than expected, they won the game
        const wonGame = stat.points_earned === (expectedPoints + 10)
        playerStats[playerName].wins += wonGame ? 1 : 0
        playerStats[playerName].totalGames += 1
      }
    }
  })
  
  // Convert to array - use database points, don't recalculate
  return Object.values(playerStats).map((player) => ({
    ...player
    // totalPoints already set from database points_earned
  })).sort((a, b) => b.totalPoints - a.totalPoints)
}

// Game Settings Types and Functions
export interface GameSettings {
  id?: string
  game_date: string
  submission_start: string
  submission_end: string
  is_active: boolean
  created_at?: string
}

// Get active game settings
export async function getActiveGameSettings(): Promise<GameSettings | null> {
  try {
    const { data, error } = await supabase
      .from('game_settings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      // Check if table doesn't exist
      if (error.code === 'PGRST205' || error.message?.includes('game_settings')) {
        console.log('Game settings table not found, using default schedule')
        return null
      }
      console.log('No active game settings found, using default')
      return null
    }
    
    return data
  } catch (error) {
    console.log('Error fetching game settings, using default:', error)
    return null
  }
}

// Create or update game settings
export async function upsertGameSettings(settings: Omit<GameSettings, 'id' | 'created_at'>): Promise<boolean> {
  try {
    // First deactivate all existing settings
    const { error: updateError } = await supabase
      .from('game_settings')
      .update({ is_active: false })
      .eq('is_active', true)
    
    // If table doesn't exist, return false but don't crash
    if (updateError?.code === 'PGRST205') {
      console.log('Game settings table not found. Please run the database migration first.')
      return false
    }
    
    // Insert new active settings
    const { error } = await supabase
      .from('game_settings')
      .insert({
        game_date: settings.game_date,
        submission_start: settings.submission_start,
        submission_end: settings.submission_end,
        is_active: true
      })
    
    if (error) {
      console.error('Error upserting game settings:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error in upsertGameSettings:', error)
    return false
  }
}

// Get all game settings (for admin view)
export async function getAllGameSettings(): Promise<GameSettings[]> {
  try {
    const { data, error } = await supabase
      .from('game_settings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      // Check if table doesn't exist
      if (error.code === 'PGRST205' || error.message?.includes('game_settings')) {
        console.log('Game settings table not found')
        return []
      }
      console.error('Error fetching game settings:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error fetching all game settings:', error)
    return []
  }
}