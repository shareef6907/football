import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'lib', 'data.json')

// Player UUID mapping (same as before)
export const PLAYER_UUIDS: { [key: string]: string } = {
  "Ahmed": "7f1e43d8-80f0-49c6-84ac-6378af6de477",
  "Fasin": "d58595c9-cb6c-4b9d-8158-523f6b893580",
  "Hamsheed": "6e3d931a-dc26-4b90-81f0-59ff53019e50",
  "Jalal": "6c0ce954-87a5-41b2-8898-1330751155b0",
  "Shareef": "ba7c5acc-c94d-466e-8d5a-0c7773c2bf0c",
  "Shaheen": "10825c4b-23d0-4e93-8c49-eadface5aeb3",
  "Emaad": "ac54a34c-4448-4721-8442-5dde27973756",
  "Luqman": "df86a60e-5940-406a-8330-f74379c89da3",
  "Nabeel": "3b16e4b3-82f5-4a0e-80d3-86f6b149891a",
  "Jinish": "793fb65a-2b41-41d8-84d4-f4ab015c6aab",
  "Shammas": "e30229fa-f9d5-4440-8dc4-471d213ffb6b",
  "Rathul": "d7a8e753-d98e-43d6-8c44-6eda18f32d4d",
  "Madan": "611a0a44-d1e2-40fe-8946-ba84e980a694",
  "Waleed": "1b6a5f4a-c0e8-4694-83cb-4da00c20545e",
  "Raihan": "149aedd7-a9a5-4810-8002-c67163cd5cf6",
  "Junaid": "1215383b-bbb7-43f3-8759-2f5b69994330",
  "Shafeer": "dfea2af6-9ab5-4e88-8f0b-6860f83ae8ef",
  "Fathah": "ae977a0c-cfb6-4827-87c9-f2448f03164e",
  "Raed": "42c2e951-394b-4b32-8823-3b5f70d3a56d",
  "Ameen": "9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d",
  "Darwish": "6c6b378f-2748-467a-8eca-62c782eacd0a"
}

export const PLAYERS = Object.keys(PLAYER_UUIDS)

// Reverse UUID mapping
const uuidToPlayer: { [key: string]: string } = {}
Object.entries(PLAYER_UUIDS).forEach(([name, uuid]) => {
  uuidToPlayer[uuid] = name
})

interface PlayerStats {
  id: string
  goals: number
  assists: number
  saves: number
  points_earned: number
  team: string
  player_uuid: string | null
  verified: boolean
  created_at: string
}

interface GameSettings {
  game_date: string
  submission_start: string
  submission_end: string
  is_active: boolean
}

interface DataStore {
  player_stats: PlayerStats[]
  game_settings: GameSettings[]
  last_updated: string
}

// Read data from JSON file
function loadData(): DataStore {
  try {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    // Return empty data if file doesn't exist
    return {
      player_stats: [],
      game_settings: [],
      last_updated: new Date().toISOString()
    }
  }
}

// Save data to JSON file
function saveData(data: DataStore): void {
  data.last_updated = new Date().toISOString()
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

// Get week start (Thursday)
function getWeekStart(): string {
  const now = new Date()
  const bahrainTime = new Date(now.getTime() + (3 * 60 * 60 * 1000))
  const thursday = new Date(bahrainTime)
  thursday.setDate(bahrainTime.getDate() - bahrainTime.getDay() + 4)
  thursday.setHours(18, 0, 0, 0)
  if (bahrainTime < thursday) {
    thursday.setDate(thursday.getDate() - 7)
  }
  return new Date(thursday.getTime() - (3 * 60 * 60 * 1000)).toISOString().split('T')[0]
}

// Get week end (Wednesday)
function getWeekEnd(): string {
  const weekStart = getWeekStart()
  const startDate = new Date(weekStart + 'T00:00:00')
  const endDate = new Date(startDate.getTime() + (6 * 24 * 60 * 60 * 1000))
  return endDate.toISOString().split('T')[0]
}

// API Functions (matching the original Supabase interface)

export interface StatsInput {
  goals: number
  assists: number
  saves: number
  won: boolean
  form_status?: string
  game_date: string
}

export async function submitPlayerStats(playerName: string, stats: StatsInput): Promise<boolean> {
  const data = loadData()
  const playerUUID = PLAYER_UUIDS[playerName]
  
  if (!playerUUID) {
    console.error('Player not found:', playerName)
    return false
  }
  
  const newStats: PlayerStats = {
    id: crypto.randomUUID(),
    goals: stats.goals,
    assists: stats.assists,
    saves: stats.saves,
    points_earned: (stats.goals * 5) + (stats.assists * 3) + (stats.saves * 2) + (stats.won ? 10 : 0),
    team: 'A',
    player_uuid: playerUUID,
    verified: true,
    created_at: new Date().toISOString()
  }
  
  data.player_stats.push(newStats)
  saveData(data)
  
  return true
}

export async function hasPlayerSubmittedThisWeek(playerName: string): Promise<boolean> {
  const data = loadData()
  const weekStart = getWeekStart()
  const weekEnd = getWeekEnd()
  const playerUUID = PLAYER_UUIDS[playerName]
  
  if (!playerUUID) return false
  
  return data.player_stats.some(stat => 
    stat.player_uuid === playerUUID &&
    stat.created_at >= weekStart + 'T00:00:00' &&
    stat.created_at <= weekEnd + 'T23:59:59'
  )
}

export async function getCurrentWeekStats(): Promise<PlayerStats[]> {
  const data = loadData()
  const weekStart = getWeekStart()
  const weekEnd = getWeekEnd()
  
  return data.player_stats.filter(stat =>
    stat.created_at >= weekStart + 'T00:00:00' &&
    stat.created_at <= weekEnd + 'T23:59:59'
  )
}

export async function getPlayerRankings(): Promise<any[]> {
  const data = loadData()
  
  const playerStats: { [key: string]: any } = {}
  
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
  
  data.player_stats.forEach(stat => {
    if (stat.player_uuid) {
      const playerName = uuidToPlayer[stat.player_uuid]
      if (playerName && playerStats[playerName]) {
        playerStats[playerName].goals += stat.goals || 0
        playerStats[playerName].assists += stat.assists || 0
        playerStats[playerName].saves += stat.saves || 0
        playerStats[playerName].totalPoints += stat.points_earned || 0
        playerStats[playerName].totalGames += 1
      }
    }
  })
  
  return Object.values(playerStats).sort((a: any, b: any) => b.totalPoints - a.totalPoints)
}

export async function getAllPlayers(): Promise<{id: number, name: string}[]> {
  return PLAYERS.map((name, index) => ({
    id: index + 1,
    name: name
  }))
}

export async function getPlayerByName(name: string): Promise<{id: number, name: string} | null> {
  const index = PLAYERS.indexOf(name)
  if (index === -1) return null
  return { id: index + 1, name: name }
}

export async function getActiveGameSettings(): Promise<any> {
  const data = loadData()
  return data.game_settings.find(s => s.is_active) || null
}

export async function upsertGameSettings(settings: any): Promise<boolean> {
  const data = loadData()
  
  // Deactivate all
  data.game_settings.forEach(s => s.is_active = false)
  
  // Add new
  data.game_settings.push({
    game_date: settings.game_date,
    submission_start: settings.submission_start,
    submission_end: settings.submission_end,
    is_active: true
  })
  
  saveData(data)
  return true
}

export async function isSubmissionWindowOpen(): Promise<boolean> {
  const settings = await getActiveGameSettings()
  
  if (settings) {
    const now = new Date().toISOString()
    return now >= settings.submission_start && now <= settings.submission_end
  }
  
  // Default: Thursday 6PM to Wednesday 11:59PM Bahrain time
  const weekStart = getWeekStart()
  const weekEnd = getWeekEnd()
  const now = new Date().toISOString()
  
  return now >= weekStart + 'T15:00:00Z' && now <= weekEnd + 'T20:59:59Z'
}

export async function getCurrentSubmissionWindow(): Promise<{start: string, end: string} | null> {
  const settings = await getActiveGameSettings()
  
  if (settings) {
    return {
      start: settings.submission_start,
      end: settings.submission_end
    }
  }
  
  const weekStart = getWeekStart()
  const weekEnd = getWeekEnd()
  
  return {
    start: weekStart + 'T15:00:00Z',
    end: weekEnd + 'T20:59:59Z'
  }
}

export async function getAllGameSettings(): Promise<any[]> {
  const data = loadData()
  return data.game_settings
}

// Export dummy client for compatibility
export const supabase = {
  from: (table: string) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ error: null }),
    update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) })
  })
}