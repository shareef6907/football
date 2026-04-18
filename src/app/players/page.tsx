'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PLAYERS, Position, POINTS_SYSTEM } from '../../lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Navigation, Header } from '../../components/Navigation'

interface PlayerStats {
  goals: number
  assists: number
  wins: number
  clean_sheets: number
  gk_bonuses: number
  motm_count: number
  coins: number
}

function getPositionColor(position: Position) {
  switch (position) {
    case 'forward': return 'text-red-400'
    case 'midfielder': return 'text-blue-400'
    case 'defender': return 'text-green-400'
    case 'goalkeeper': return 'text-yellow-400'
  }
}

function getPositionAbbrev(position: Position) {
  switch (position) {
    case 'forward': return 'FWD'
    case 'midfielder': return 'MID'
    case 'defender': return 'DEF'
    case 'goalkeeper': return 'GK'
  }
}

export default function PlayersPage() {
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      
      // Get all matches
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .order('match_date', { ascending: false })
      
      if (!matches || matches.length === 0) {
        setLoading(false)
        return
      }
      
      const matchIds = matches.map(m => m.id)
      
      // Get all match stats
      const { data: stats } = await supabase
        .from('match_stats')
        .select('*')
        .in('match_id', matchIds)
      
      // Get all MOTM wins
      const { data: motmWins } = await supabase
        .from('man_of_the_match_winners')
        .select('player_id')
        .in('match_id', matchIds)
      
      // Get coins
      const { data: coins } = await supabase
        .from('coins_ledger')
        .select('player_id, amount')
      
      // Build stats per player
      const statsMap: Record<string, PlayerStats> = {}
      
      PLAYERS.forEach(p => {
        statsMap[p.id] = {
          goals: 0,
          assists: 0,
          wins: 0,
          clean_sheets: 0,
          gk_bonuses: 0,
          motm_count: 0,
          coins: 0,
        }
      })
      
      // Count stats
      stats?.forEach(s => {
        if (statsMap[s.player_id]) {
          statsMap[s.player_id].goals += s.goals || 0
          statsMap[s.player_id].assists += s.assists || 0
          if (s.is_winner) {
            statsMap[s.player_id].wins += 1
            if (s.played_as_gk && s.clean_sheet) {
              statsMap[s.player_id].gk_bonuses += 1
            }
          }
          if (s.clean_sheet) {
            statsMap[s.player_id].clean_sheets += 1
          }
        }
      })
      
      // Count MOTM
      motmWins?.forEach(m => {
        if (statsMap[m.player_id]) {
          statsMap[m.player_id].motm_count += 1
        }
      })
      
      // Sum coins
      coins?.forEach(c => {
        if (statsMap[c.player_id]) {
          statsMap[c.player_id].coins += c.amount || 0
        }
      })
      
      setPlayerStats(statsMap)
      setLoading(false)
    }
    
    loadStats()
  }, [])

  const getOverallRating = (playerId: string) => {
    // Get latest ratings for player (placeholder - use default 5)
    // In future, query player_ratings table
    return 7 // Placeholder
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Players" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {loading ? (
            <div className="text-center p-8">Loading stats...</div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {PLAYERS.map((player, index) => {
                const stats = playerStats[player.id] || { goals: 0, assists: 0, wins: 0, clean_sheets: 0, gk_bonuses: 0, motm_count: 0, coins: 0 }
                const overall = getOverallRating(player.id)
                
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative overflow-hidden rounded-2xl border border-white/10"
                    style={{ 
                      background: `linear-gradient(135deg, ${player.color}15 0%, transparent 50%)`
                    }}
                  >
                    {/* Card header with colored bar */}
                    <div 
                      className="h-2" 
                      style={{ backgroundColor: player.color }}
                    />
                    
                    <div className="p-4">
                      {/* Avatar */}
                      <div className="flex items-center gap-3 mb-3">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                          style={{ 
                            backgroundColor: player.color,
                            boxShadow: `0 0 20px ${player.color}40`
                          }}
                        >
                          {player.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{player.name}</h3>
                          <span className={`text-xs font-semibold ${getPositionColor(player.position)}`}>
                            {getPositionAbbrev(player.position)}
                          </span>
                        </div>
                      </div>

                      {/* Overall Rating */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-2xl font-bold" style={{ color: player.color }}>
                            {overall}
                          </div>
                        </div>
                      </div>

                      {/* Actual Stats from DB */}
                      <div className="mt-3 pt-3 border-t border-white/10 flex justify-around text-center text-xs">
                        <div>
                          <div className="font-bold text-white">{stats.goals}</div>
                          <div>Goals</div>
                        </div>
                        <div>
                          <div className="font-bold text-white">{stats.assists}</div>
                          <div>Assists</div>
                        </div>
                        <div>
                          <div className="font-bold text-white">{stats.wins}</div>
                          <div>Wins</div>
                        </div>
                        <div>
                          <div className="font-bold text-green-400">{stats.coins}</div>
                          <div>Coins</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>

        <div className="mt-4 text-center text-sm text-gray-500">
          Tap a card to view full profile
        </div>
      </main>

      <Navigation activePath="/players" />
    </div>
  )
}