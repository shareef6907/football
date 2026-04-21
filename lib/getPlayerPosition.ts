import { PLAYERS, Position } from './constants'
import { supabase } from './supabase/client'

// Cache to avoid repeated DB calls within the same page load
let positionCache: Record<string, Position> | null = null
let cacheTimestamp = 0
const CACHE_TTL = 30000 // 30 seconds

export async function loadPlayerPositions(): Promise<Record<string, Position>> {
 const now = Date.now()
 if (positionCache && now - cacheTimestamp < CACHE_TTL) {
 return positionCache
 }

 const { data } = await supabase
 .from('user_profiles')
 .select('player_id, preferred_position')
 .not('preferred_position', 'is', null)

 const positions: Record<string, Position> = {}

 // Start with defaults from constants
 PLAYERS.forEach(p => {
 positions[p.id] = p.position
 })

 // Override with DB preferences
 data?.forEach((row: any) => {
 if (row.player_id && row.preferred_position) {
 positions[row.player_id] = row.preferred_position as Position
 }
 })

 positionCache = positions
 cacheTimestamp = now
 return positions
}

export function getPositionSync(playerId: string): Position {
 if (positionCache && positionCache[playerId]) {
 return positionCache[playerId]
 }
 const player = PLAYERS.find(p => p.id === playerId)
 return player?.position || 'midfielder'
}