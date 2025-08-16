'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus, Award, Target, Shield, Star } from 'lucide-react'
import { TEAM_MEMBERS } from '@/lib/auth'

interface PlayerStats {
  name: string
  rating: number
  goals: number
  assists: number
  saves: number
  wins: number
  gamesPlayed: number
  points: number
  rank: number
  previousRank: number
}

export default function RankingsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRankings()
  }, [])

  const loadRankings = () => {
    // Get ratings from localStorage
    const storedRatings = localStorage.getItem('playerRatings')
    const ratings = storedRatings ? JSON.parse(storedRatings) : []
    
    // Get match data from localStorage (will be added later)
    const matchData = localStorage.getItem('matchData')
    const matches = matchData ? JSON.parse(matchData) : {}

    // Calculate stats for each player
    const stats: PlayerStats[] = TEAM_MEMBERS.map((name) => {
      const playerRating = ratings.find((r: any) => r.name === name)?.rating || 5
      const playerMatches = matches[name] || {}
      
      // Calculate total points
      const points = calculatePoints({
        rating: playerRating,
        goals: playerMatches.goals || 0,
        assists: playerMatches.assists || 0,
        saves: playerMatches.saves || 0,
        wins: playerMatches.wins || 0
      })

      return {
        name,
        rating: playerRating,
        goals: playerMatches.goals || 0,
        assists: playerMatches.assists || 0,
        saves: playerMatches.saves || 0,
        wins: playerMatches.wins || 0,
        gamesPlayed: playerMatches.gamesPlayed || 0,
        points,
        rank: 0,
        previousRank: playerMatches.previousRank || 0
      }
    })

    // Sort by points and assign ranks
    stats.sort((a, b) => b.points - a.points)
    stats.forEach((player, index) => {
      player.rank = index + 1
    })

    setPlayerStats(stats)
    setLoading(false)
  }

  const calculatePoints = (stats: {
    rating: number
    goals: number
    assists: number
    saves: number
    wins: number
  }) => {
    // Points formula:
    // Rating * 10 + Goals * 5 + Assists * 3 + Saves * 2 + Wins * 4
    return (
      stats.rating * 10 +
      stats.goals * 5 +
      stats.assists * 3 +
      stats.saves * 2 +
      stats.wins * 4
    )
  }

  const getRankChange = (current: number, previous: number) => {
    if (previous === 0) return { icon: Minus, color: 'text-gray-500', text: 'NEW' }
    const diff = previous - current
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-400', text: `+${diff}` }
    if (diff < 0) return { icon: TrendingDown, color: 'text-red-400', text: `${diff}` }
    return { icon: Minus, color: 'text-gray-500', text: '-' }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: 'from-yellow-400 to-amber-600', label: 'Champion' }
    if (rank === 2) return { icon: Award, color: 'from-gray-300 to-gray-500', label: 'Runner-up' }
    if (rank === 3) return { icon: Award, color: 'from-orange-400 to-orange-600', label: 'Third Place' }
    if (rank <= 5) return { icon: Star, color: 'from-purple-400 to-purple-600', label: 'Top 5' }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Player Rankings
                </h1>
                <p className="text-gray-500 mt-1">Thursday Football League Standings</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Season 2025</p>
                <p className="text-xs text-gray-600">Updated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Podium */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {playerStats.slice(0, 3).map((player, index) => {
              const badge = getRankBadge(player.rank)
              return (
                <motion.div
                  key={player.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative ${index === 0 ? 'md:order-2' : index === 1 ? 'md:order-1' : 'md:order-3'}`}
                >
                  <div className={`bg-gradient-to-br ${badge?.color} p-0.5 rounded-2xl ${index === 0 ? 'transform md:scale-110' : ''}`}>
                    <div className="bg-gray-950 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {badge && <badge.icon className="w-8 h-8 text-white" />}
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider">{badge?.label}</p>
                            <p className="text-2xl font-bold">{player.name}</p>
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-gray-600">#{player.rank}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Points</span>
                          <span className="font-bold text-xl">{player.points}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Rating</span>
                          <span>{player.rating}/10</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-800">
                          <div>
                            <p className="text-xs text-gray-500">Goals</p>
                            <p className="font-semibold">{player.goals}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Assists</p>
                            <p className="font-semibold">{player.assists}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Full Rankings Table */}
          <div className="bg-gray-950/50 backdrop-blur-xl rounded-2xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-xl font-semibold">Complete Rankings</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Goals</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Assists</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Saves</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Wins</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {playerStats.map((player, index) => {
                    const rankChange = getRankChange(player.rank, player.previousRank)
                    const badge = getRankBadge(player.rank)
                    return (
                      <motion.tr
                        key={player.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-gray-900/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-400">#{player.rank}</span>
                            {badge && <badge.icon className="w-4 h-4 text-yellow-400" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium">{player.name}</div>
                          {player.gamesPlayed > 0 && (
                            <div className="text-xs text-gray-500">{player.gamesPlayed} games</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span>{player.rating}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">{player.goals}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">{player.assists}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">{player.saves}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">{player.wins}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-lg font-bold">{player.points}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className={`flex items-center justify-center gap-1 ${rankChange.color}`}>
                            <rankChange.icon className="w-4 h-4" />
                            <span className="text-sm">{rankChange.text}</span>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}