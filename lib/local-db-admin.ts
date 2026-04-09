import fs from 'fs'
import path from 'path'
import { PLAYER_UUIDS } from './local-db'

const DATA_FILE = path.join(process.cwd(), 'lib', 'data.json')

function loadData() {
  try {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(fileContent)
  } catch {
    return { player_stats: [], game_settings: [] }
  }
}

function saveData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

export async function resetAllStats(): Promise<boolean> {
  const data = loadData()
  data.player_stats = []
  saveData(data)
  return true
}

export async function resetWeeklyStats(): Promise<boolean> {
  const data = loadData()
  const now = new Date()
  const currentDay = now.getDay()
  const currentHour = now.getHours()
  
  let weekStart = new Date(now)
  
  if (currentDay < 4 || (currentDay === 4 && currentHour < 20)) {
    const daysToLastThursday = currentDay + 3
    weekStart.setDate(now.getDate() - daysToLastThursday)
  } else {
    const daysToThursday = currentDay - 4
    weekStart.setDate(now.getDate() - daysToThursday)
  }
  
  weekStart.setHours(20, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  
  data.player_stats = data.player_stats.filter((stat: any) => {
    const statDate = new Date(stat.created_at)
    return statDate < weekStart || statDate > weekEnd
  })
  
  saveData(data)
  return true
}

export async function editPlayerStats(playerName: string, stats: any): Promise<boolean> {
  const data = loadData()
  const playerUUID = PLAYER_UUIDS[playerName]
  
  if (!playerUUID) return false
  
  // Find the most recent stat for this player
  const statIndex = data.player_stats.findIndex((s: any) => s.player_uuid === playerUUID)
  
  if (statIndex >= 0) {
    data.player_stats[statIndex] = {
      ...data.player_stats[statIndex],
      ...stats
    }
    saveData(data)
    return true
  }
  
  return false
}

export async function updateGameSettings(settings: any): Promise<boolean> {
  const data = loadData()
  
  data.game_settings.forEach((s: any) => s.is_active = false)
  data.game_settings.push({
    ...settings,
    is_active: true
  })
  
  saveData(data)
  return true
}

export async function getGameSettings(): Promise<any[]> {
  const data = loadData()
  return data.game_settings
}