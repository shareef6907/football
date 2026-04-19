'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PLAYERS, POINTS_SYSTEM } from '../../lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Navigation, Header } from '../../components/Navigation'

interface PlayerStats {
  player_id: string
  goals: number
  assists: number
  wins: number
  clean_sheets: number
  gk_bonuses: number
  motm_count: number
  attendance: number
}

type SortKey = 'points' | 'goals' | 'assists' | 'wins' | 'motm' | 'coins'

export default function StandingsPage() {
  const [sortBy, setSortBy] = useState<SortKey>('points')
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      
      // Parallel queries for speed
      const [matchesRes, statsRes, motmRes, attendanceRes, coinsRes] = await Promise.all([
        supabase.from('matches').select('id').order('match_date', { ascending: false }),
        supabase.from('match_stats').select('*'),
        supabase.from('man_of_the_match_winners').select('player_id, match_id'),
        supabase.from('attendance').select('player_id, match_id'),
        supabase.from('coins_ledger').select('player_id, amount'),
      ])
      
      const matches = matchesRes.data
      if (!matches || matches.length === 0) {
        setLoading(false)
        return
      }
      
      const matchIds = matches.map(m => m.id)
      const stats = statsRes.data || []
      const motmWins = motmRes.data || []
      const attendance = attendanceRes.data || []
      const coins = coinsRes.data || []
      
      // Build stats per player
      const statsMap: Record<string, PlayerStats> = {}
      
      PLAYERS.forEach(p => {
        statsMap[p.id] = {
          player_id: p.id,
          goals: 0,
          assists: 0,
          wins: 0,
          clean_sheets: 0,
          gk_bonuses: 0,
          motm_count: 0,
          attendance: 0,
        }
      })
      
      // Filter stats to relevant matches and count
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
        }
      })
      
      // Count MOTM
      motmWins.filter(m => matchIds.includes(m.match_id)).forEach(m => {
        if (statsMap[m.player_id]) {
          statsMap[m.player_id].motm_count += 1
        }
      })
      
      // Count attendance
      attendance.filter(a => matchIds.includes(a.match_id)).forEach(a => {
        if (statsMap[a.player_id]) {
          statsMap[a.player_id].attendance += 1
        }
      })
      
      setPlayerStats(statsMap)
      setLoading(false)
    }
    
    loadStats()
  }, [])

  // Points calculation using EXACT formula
  const getPoints = (stats: PlayerStats) => {
    return (
      stats.goals * POINTS_SYSTEM.goal +
      stats.assists * POINTS_SYSTEM.assist +
      stats.wins * POINTS_SYSTEM.matchWin +
      stats.clean_sheets * POINTS_SYSTEM.cleanSheet +
      stats.gk_bonuses * POINTS_SYSTEM.goalkeeperWinBonus +
      stats.attendance * POINTS_SYSTEM.attendance +
      stats.motm_count * POINTS_SYSTEM.manOfTheMatch
    )
  }

  // Coins = points
  const getCoins = (stats: PlayerStats) => {
    return getPoints(stats)
  }

  const sorted = PLAYERS.map(p => ({
    ...p,
    stats: playerStats[p.id] || { goals: 0, assists: 0, wins: 0, clean_sheets: 0, gk_bonuses: 0, motm_count: 0, attendance: 0 },
  })).sort((a, b) => {
    const aStats = a.stats
    const bStats = b.stats
    
    switch (sortBy) {
      case 'points': return getPoints(bStats) - getPoints(aStats)
      case 'goals': return bStats.goals - aStats.goals
      case 'assists': return bStats.assists - aStats.assists
      case 'wins': return bStats.wins - aStats.wins
      case 'motm': return bStats.motm_count - aStats.motm_count
      case 'coins': return getCoins(bStats) - getCoins(aStats)
      default: return 0
    }
  })

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Standings" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Sort Options */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {([
            { key: 'points', label: '🏆 Points' },
            { key: 'goals', label: '⚽ Goals' },
            { key: 'assists', label: '🎯 Assists' },
            { key: 'wins', label: '🎉 Wins' },
            { key: 'motm', label: '⭐ Man of Match' },
            { key: 'coins', label: '🪙 Coins' },
          ] as const).map(item => (
            <button
              key={item.key}
              onClick={() => setSortBy(item.key)}
              className={`px-3 py-2 rounded-full text-xs whitespace-nowrap transition-colors ${
                sortBy === item.key 
                  ? 'bg-green-500 text-black' 
                  : 'glass border border-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Standings Table */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="glass rounded-xl p-3 border border-white/10 flex items-center animate-pulse"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 mr-3" />
                <div className="w-10 h-10 rounded-full bg-white/10 mr-3" />
                <div className="flex-1">
                  <div className="h-4 w-24 rounded bg-white/10 mb-2" />
                  <div className="h-3 w-32 rounded bg-white/10" />
                </div>
                <div className="text-right">
                  <div className="h-6 w-12 rounded bg-white/10 mb-1" />
                  <div className="h-3 w-16 rounded bg-white/10" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((player, index) => {
              const stats = player.stats
              const points = getPoints(stats)
              const coins = getCoins(stats)
              
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="glass rounded-xl p-3 border border-white/10 flex items-center"
                >
                  <div className="w-8 text-center font-bold text-lg mr-3">
                    {getRankEmoji(index + 1)}
                  </div>
                  
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mr-3"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-bold">{player.name}</div>
                    <div className="text-xs text-gray-400">
                      {stats.goals}G • {stats.assists}A • {stats.wins}W • {stats.motm_count > 0 ? `⭐ ${stats.motm_count}` : ''}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-400">{points}</div>
                    <div className="text-xs text-gray-400">{coins} coins</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      <Navigation activePath="/standings" />
    </div>
  )
}