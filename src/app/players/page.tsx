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
  const [playerRatings, setPlayerRatings] = useState<Record<string, { forward: number, midfielder: number, defender: number, goalkeeper: number, count: number }>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      
      // Parallel queries for speed
      const [matchesRes, statsRes, motmRes, ratingsRes] = await Promise.all([
        supabase.from('matches').select('id').order('match_date', { ascending: false }),
        supabase.from('match_stats').select('*'),
        supabase.from('man_of_the_match_winners').select('player_id, match_id'),
        supabase.from('player_ratings').select('*').order('rating_year', { ascending: false }).order('rating_month', { ascending: false }),
      ])
      
      const matches = matchesRes.data
      if (!matches || matches.length === 0) {
        setLoading(false)
        return
      }
      
      const matchIds = matches.map(m => m.id)
      const stats = statsRes.data || []
      const motmWins = motmRes.data || []
      const ratings = ratingsRes.data || []
      
      // Build stats per player
      const statsMap: Record<string, PlayerStats> = {}
      const ratingsMap: Record<string, { forward: number, midfielder: number, defender: number, goalkeeper: number, count: number }> = {}
      
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
        ratingsMap[p.id] = { forward: 0, midfielder: 0, defender: 0, goalkeeper: 0, count: 0 }
      })
      
      // Count stats
      stats.filter(s => matchIds.includes(s.match_id)).forEach(s => {
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
          // Calculate coins = points (not from ledger)
          const playerPoints = (s.goals || 0) * POINTS_SYSTEM.goal +
                              (s.assists || 0) * POINTS_SYSTEM.assist +
                              (s.is_winner ? POINTS_SYSTEM.matchWin : 0) +
                              (s.clean_sheet ? POINTS_SYSTEM.cleanSheet : 0) +
                              (s.played_as_gk && s.clean_sheet ? POINTS_SYSTEM.goalkeeperWinBonus : 0)
          statsMap[s.player_id].coins += playerPoints
        }
      })
      
      // Count MOTM
      motmWins.filter(m => matchIds.includes(m.match_id)).forEach(m => {
        if (statsMap[m.player_id]) {
          statsMap[m.player_id].motm_count += 1
          // Add MOTM points to coins
          statsMap[m.player_id].coins += POINTS_SYSTEM.manOfTheMatch
        }
      })
      
      // Calculate average ratings per player
      ratings.forEach(r => {
        if (ratingsMap[r.rated_player_id]) {
          ratingsMap[r.rated_player_id].forward += r.forward_rating || 0
          ratingsMap[r.rated_player_id].midfielder += r.midfielder_rating || 0
          ratingsMap[r.rated_player_id].defender += r.defender_rating || 0
          ratingsMap[r.rated_player_id].goalkeeper += r.goalkeeper_rating || 0
          ratingsMap[r.rated_player_id].count += 1
        }
      })
      
      setPlayerStats(statsMap)
      setPlayerRatings(ratingsMap)
      setLoading(false)
    }
    
    loadStats()
  }, [])

  // Calculate overall rating from peer ratings (average of all position ratings)
  const getPlayerOverallRating = (playerId: string) => {
    const r = playerRatings[playerId]
    if (!r || r.count === 0) return 5 // Default if no ratings
    const avgForward = r.forward / r.count
    const avgMidfielder = r.midfielder / r.count
    const avgDefender = r.defender / r.count
    const avgGoalkeeper = r.goalkeeper / r.count
    return Math.round((avgForward + avgMidfielder + avgDefender + avgGoalkeeper) / 4 * 10) / 10
  }
  
  // Get position-specific rating
  const getPositionRating = (playerId: string, position: string) => {
    const r = playerRatings[playerId]
    if (!r || r.count === 0) return 5
    switch (position) {
      case 'forward': return Math.round((r.forward / r.count) * 10) / 10
      case 'midfielder': return Math.round((r.midfielder / r.count) * 10) / 10
      case 'defender': return Math.round((r.defender / r.count) * 10) / 10
      case 'goalkeeper': return Math.round((r.goalkeeper / r.count) * 10) / 10
      default: return 5
    }
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
                const overall = getPlayerOverallRating(player.id)
                const fwdRating = getPositionRating(player.id, 'forward')
                const midRating = getPositionRating(player.id, 'midfielder')
                const defRating = getPositionRating(player.id, 'defender')
                const gkRating = getPositionRating(player.id, 'goalkeeper')
                
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
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
                        {stats.motm_count > 0 && (
                          <div className="text-yellow-400 text-sm">⭐ {stats.motm_count}</div>
                        )}
                      </div>

                      {/* Position Ratings Breakdown */}
                      <div className="mt-2 text-xs text-gray-500 flex gap-2">
                        <span className="text-red-400">F:{fwdRating}</span>
                        <span className="text-blue-400">M:{midRating}</span>
                        <span className="text-green-400">D:{defRating}</span>
                        <span className="text-yellow-400">G:{gkRating}</span>
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