// Re-export from local-db with Supabase-compatible interface
import * as localDb from './local-db'

export const supabase = localDb.supabase
export const PLAYERS = localDb.PLAYERS
export const PLAYER_UUIDS = localDb.PLAYER_UUIDS

export const getAllPlayers = localDb.getAllPlayers
export const getPlayerByName = localDb.getPlayerByName
export const submitPlayerStats = localDb.submitPlayerStats
export const hasPlayerSubmittedThisWeek = localDb.hasPlayerSubmittedThisWeek
export const getCurrentWeekStats = localDb.getCurrentWeekStats
export const getPlayerRankings = localDb.getPlayerRankings
export const getActiveGameSettings = localDb.getActiveGameSettings
export const upsertGameSettings = localDb.upsertGameSettings
export const getAllGameSettings = localDb.getAllGameSettings
export const isSubmissionWindowOpen = localDb.isSubmissionWindowOpen
export const getCurrentSubmissionWindow = localDb.getCurrentSubmissionWindow

// For admin API routes - getSupabaseAdmin compatibility
export function getSupabaseAdmin() {
  return {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: (data: any) => Promise.resolve({ data: [data], error: null }),
      update: (data: any) => ({ eq: () => Promise.resolve({ error: null }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) })
    })
  }
}

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

export interface GameSettings {
  id?: string
  game_date: string
  submission_start: string
  submission_end: string
  is_active: boolean
  created_at?: string
}