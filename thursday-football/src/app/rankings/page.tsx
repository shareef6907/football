'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus, Award, Target, Shield, Star, Medal, Activity } from 'lucide-react'
import { TEAM_MEMBERS } from '@/lib/auth'
import { getPlayerBadges } from '@/lib/awards'

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
  badges?: string[]
}

interface MonthlyAwards {
  topScorer?: string
  topAssists?: string
  topKeeper?: string
  month: string
}

export default function RankingsPage() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showPodium, setShowPodium] = useState(false)
  const [monthlyAwards, setMonthlyAwards] = useState<MonthlyAwards | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    console.log('🚀 Rankings page mounted - loading initial data')
    loadRankings()
    checkEndOfMonth()
    loadMonthlyAwards()
    saveMonthlyAwards()
    
    // Listen for all types of updates from other components
    const handleRatingsUpdate = () => {
      console.log('🔔 Rankings updating due to ratings change')
      setIsRefreshing(true)
      loadRankings()
      loadMonthlyAwards()
      setLastUpdated(new Date().toLocaleTimeString())
      setTimeout(() => setIsRefreshing(false), 1000)
    }
    
    const handlePlayerStatsUpdate = (event: CustomEvent) => {
      console.log('Rankings updating due to player stats change:', event.detail)
      setIsRefreshing(true)
      loadRankings()
      loadMonthlyAwards()
      setLastUpdated(new Date().toLocaleTimeString())
      setTimeout(() => setIsRefreshing(false), 1000)
    }
    
    const handleDataUpdate = (event: CustomEvent) => {
      console.log('Rankings updating due to data change:', event.detail)
      setIsRefreshing(true)
      loadRankings()
      loadMonthlyAwards()
      setLastUpdated(new Date().toLocaleTimeString())
      setTimeout(() => setIsRefreshing(false), 1000)
    }
    
    const handleAdminAction = (event: CustomEvent) => {
      console.log('Rankings updating due to admin action:', event.detail)
      setIsRefreshing(true)
      loadRankings()
      loadMonthlyAwards()
      setLastUpdated(new Date().toLocaleTimeString())
      setTimeout(() => setIsRefreshing(false), 1000)
    }
    
    // Set up comprehensive event listeners for real-time updates
    window.addEventListener('ratingsUpdated', handleRatingsUpdate)
    window.addEventListener('playerStatsUpdated', handlePlayerStatsUpdate as EventListener)
    window.addEventListener('dataUpdated', handleDataUpdate as EventListener)
    window.addEventListener('adminAction', handleAdminAction as EventListener)
    
    // Set up interval for real-time updates every 15 seconds for ultra-responsive feel
    const interval = setInterval(handleRatingsUpdate, 15000)
    
    // Also listen for page visibility changes to refresh when user returns to rankings
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Rankings page became visible - refreshing data')
        handleRatingsUpdate()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleRatingsUpdate)
    
    // Add keyboard shortcut to force refresh (Ctrl+R or Cmd+R)
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault()
        console.log('🔄 Force refresh triggered by keyboard')
        handleRatingsUpdate()
      }
    }
    
    document.addEventListener('keydown', handleKeyPress)
    
    return () => {
      window.removeEventListener('ratingsUpdated', handleRatingsUpdate)
      window.removeEventListener('playerStatsUpdated', handlePlayerStatsUpdate as EventListener)
      window.removeEventListener('dataUpdated', handleDataUpdate as EventListener)
      window.removeEventListener('adminAction', handleAdminAction as EventListener)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleRatingsUpdate)
      document.removeEventListener('keydown', handleKeyPress)
      clearInterval(interval)
    }
  }, [])

  const checkEndOfMonth = () => {
    const today = new Date()
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const daysUntilEndOfMonth = lastDayOfMonth.getDate() - today.getDate()
    
    // Show podium only in the last 3 days of the month
    setShowPodium(daysUntilEndOfMonth <= 3)
  }

  const loadRankings = () => {
    console.log('🔄 Loading rankings...')
    
    // Get ratings from localStorage
    const storedRatings = localStorage.getItem('playerRatings')
    const ratings = storedRatings ? JSON.parse(storedRatings) : []
    console.log('📊 Loaded ratings:', ratings)
    
    // Get match data from localStorage
    const matchData = localStorage.getItem('matchData')
    const matches = matchData ? JSON.parse(matchData) : {}
    console.log('⚽ Loaded match data:', matches)
    
    // Debug: Check localStorage keys
    console.log('🔍 All localStorage keys:', Object.keys(localStorage))
    console.log('🔍 Raw matchData string:', localStorage.getItem('matchData'))
    console.log('🔍 Parsed matches object structure:', Object.keys(matches))

    // Get last month's awards
    const awards = localStorage.getItem('monthlyAwards')
    const lastMonthAwards = awards ? JSON.parse(awards) : null

    // Calculate stats for each player
    const stats: PlayerStats[] = TEAM_MEMBERS.map((name) => {
      const playerRating = ratings.find((r: any) => r.name === name)?.rating || 5
      const playerMatches = matches[name] || {}
      
      console.log(`👤 ${name}:`)
      console.log(`  • Rating: ${playerRating}`)
      console.log(`  • Match data exists: ${!!matches[name]}`)
      console.log(`  • Match data:`, playerMatches)
      console.log(`  • Goals: ${playerMatches.goals || 0}`)
      console.log(`  • Assists: ${playerMatches.assists || 0}`)
      console.log(`  • Saves: ${playerMatches.saves || 0}`)
      console.log(`  • Wins: ${playerMatches.wins || 0}`)
      
      // Get all permanent badges for this player
      const badges = getPlayerBadges(name)
      
      // Calculate total points
      const points = calculatePoints({
        rating: playerRating,
        goals: playerMatches.goals || 0,
        assists: playerMatches.assists || 0,
        saves: playerMatches.saves || 0,
        wins: playerMatches.wins || 0
      })
      
      console.log(`💯 ${name} total points: ${points}`)

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
        previousRank: playerMatches.previousRank || 0,
        badges
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

  const loadMonthlyAwards = () => {
    const awards = localStorage.getItem('monthlyAwards')
    if (awards) {
      setMonthlyAwards(JSON.parse(awards))
    }
  }

  const saveMonthlyAwards = () => {
    // Check if it's the end of the month
    const today = new Date()
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    const daysUntilEndOfMonth = lastDayOfMonth.getDate() - today.getDate()
    
    if (daysUntilEndOfMonth <= 3 && playerStats.length > 0) {
      // Find top performers
      const topScorer = [...playerStats].sort((a, b) => b.goals - a.goals)[0]
      const topAssists = [...playerStats].sort((a, b) => b.assists - a.assists)[0]
      const topKeeper = [...playerStats].sort((a, b) => b.saves - a.saves)[0]
      
      const currentMonth = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      const awards: MonthlyAwards = {
        topScorer: topScorer?.name,
        topAssists: topAssists?.name,
        topKeeper: topKeeper?.name,
        month: currentMonth
      }
      
      localStorage.setItem('monthlyAwards', JSON.stringify(awards))
      setMonthlyAwards(awards)
    }
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
    if (rank === 1) return { icon: Trophy, color: 'from-yellow-400 to-amber-600', label: 'CHAMPION', bgGlow: 'shadow-yellow-500/50' }
    if (rank === 2) return { icon: Medal, color: 'from-gray-300 to-gray-500', label: 'RUNNER-UP', bgGlow: 'shadow-gray-400/50' }
    if (rank === 3) return { icon: Award, color: 'from-orange-400 to-orange-600', label: 'THIRD PLACE', bgGlow: 'shadow-orange-500/50' }
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
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Player Rankings
                </h1>
                <p className="text-gray-400 mt-2 text-lg">Thursday Football League Standings</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Season 2025</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      console.log('🔄 Manual refresh button clicked')
                      setIsRefreshing(true)
                      loadRankings()
                      loadMonthlyAwards()
                      setLastUpdated(new Date().toLocaleTimeString())
                      setTimeout(() => setIsRefreshing(false), 1000)
                    }}
                    className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Refresh
                  </button>
                  {isRefreshing && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Activity className="w-3 h-3 text-green-400" />
                    </motion.div>
                  )}
                  <p className="text-xs text-gray-500">
                    {isRefreshing ? 'Updating...' : `Last updated: ${lastUpdated || new Date().toLocaleTimeString()}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Podium Section - Only shown at end of month */}
        {showPodium && (
          <div className="bg-gradient-to-b from-gray-900/20 to-transparent py-16 mb-8">
            <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
              <h2 className="text-center text-3xl font-bold mb-12 text-gray-300">🏆 Podium Finishers 🏆</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
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
                    <div className={`
                      ${index === 0 ? 'transform md:scale-110 md:-mt-8' : ''}
                      ${index === 1 ? 'md:mt-8' : ''}
                      ${index === 2 ? 'md:mt-12' : ''}
                    `}>
                      <div className={`bg-gradient-to-br ${badge?.color} p-1 rounded-3xl shadow-2xl ${badge?.bgGlow}`}>
                        <div className="bg-gray-950 rounded-3xl p-10">
                          {/* Podium Number and Icon */}
                          <div className="flex flex-col items-center text-center mb-8">
                            <div className={`
                              ${index === 0 ? 'text-6xl' : 'text-5xl'}
                              font-black mb-4
                              ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : 'text-orange-400'}
                            `}>
                              #{player.rank}
                            </div>
                            {badge && <badge.icon className={`${index === 0 ? 'w-20 h-20' : 'w-16 h-16'} mb-4`} />}
                            <p className="text-sm text-gray-400 uppercase tracking-[0.3em] mb-3">{badge?.label}</p>
                            <p className="text-3xl font-bold">{player.name}</p>
                          </div>

                          {/* Stats */}
                          <div className="space-y-6">
                            <div className="bg-gradient-to-r from-transparent via-gray-800 to-transparent h-px"></div>
                            
                            {/* Points */}
                            <div className="text-center">
                              <p className="text-5xl font-black text-white">{player.points}</p>
                              <p className="text-sm text-gray-400 mt-1">Total Points</p>
                            </div>

                            {/* Rating */}
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                <span className="text-2xl font-bold">{player.rating}/10</span>
                              </div>
                              <p className="text-sm text-gray-400">Peer Rating</p>
                            </div>

                            <div className="bg-gradient-to-r from-transparent via-gray-800 to-transparent h-px"></div>

                            {/* Goals and Assists */}
                            <div className="grid grid-cols-2 gap-6">
                              <div className="text-center">
                                <p className="text-2xl font-bold">{player.goals}</p>
                                <p className="text-xs text-gray-400 uppercase">Goals</p>
                              </div>
                              <div className="text-center">
                                <p className="text-2xl font-bold">{player.assists}</p>
                                <p className="text-xs text-gray-400 uppercase">Assists</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
        )}

        {/* Separator Line - Only show when podium is visible */}
        {showPodium && (
          <div className="max-w-7xl mx-auto w-full px-6 mb-8">
            <div className="bg-gradient-to-r from-transparent via-gray-700 to-transparent h-px"></div>
          </div>
        )}

        {/* Full Rankings Table */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 pb-16 w-full flex-1">
          <div className="bg-gray-950/50 backdrop-blur-xl rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
            <div className="px-10 py-8 border-b border-gray-800 bg-gradient-to-r from-gray-900/50 to-gray-950/50">
              <h2 className="text-3xl font-bold">Complete Rankings</h2>
              <p className="text-gray-400 mt-2">All players sorted by total points</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/30">
                    <th className="px-8 py-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Rank</th>
                    <th className="px-8 py-6 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Player</th>
                    <th className="px-8 py-6 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Rating</th>
                    <th className="px-8 py-6 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Goals</th>
                    <th className="px-8 py-6 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Assists</th>
                    <th className="px-8 py-6 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Saves</th>
                    <th className="px-8 py-6 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Wins</th>
                    <th className="px-8 py-6 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Points</th>
                    <th className="px-8 py-6 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Change</th>
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
                        className="hover:bg-gray-900/50 transition-all duration-200"
                      >
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-gray-300">#{player.rank}</span>
                            {badge && <badge.icon className="w-5 h-5 text-yellow-400" />}
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-medium">{player.name}</div>
                            {player.badges && player.badges.length > 0 && (
                              <span className="text-lg">{player.badges.join(' ')}</span>
                            )}
                          </div>
                          {player.gamesPlayed > 0 && (
                            <div className="text-xs text-gray-500">{player.gamesPlayed} games</div>
                          )}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-lg">{player.rating}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center text-lg">{player.goals}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-center text-lg">{player.assists}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-center text-lg">{player.saves}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-center text-lg">{player.wins}</td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <span className="text-2xl font-bold text-white">{player.points}</span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-center">
                          <div className={`flex items-center justify-center gap-1 ${rankChange.color}`}>
                            <rankChange.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{rankChange.text}</span>
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