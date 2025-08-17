'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, TEAM_MEMBERS } from '@/lib/auth'
import { motion } from 'framer-motion'
import { 
  Trophy, Target, Shield, Activity, TrendingUp, Users, 
  Calendar, Award, BarChart3, Plus, ChevronRight, LogOut,
  Goal, HandHelping, ShieldCheck
} from 'lucide-react'
import Link from 'next/link'

interface UserData {
  display_name: string
  team: string
}

interface MatchStats {
  goals: number
  assists: number
  saves: number
  wins: number
  losses: number
  gamesPlayed: number
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [matchStats, setMatchStats] = useState<MatchStats>({
    goals: 0,
    assists: 0,
    saves: 0,
    wins: 0,
    losses: 0,
    gamesPlayed: 0
  })
  const [showMatchForm, setShowMatchForm] = useState(false)
  const [matchData, setMatchData] = useState({
    goals: 0,
    assists: 0,
    saves: 0,
    teamWon: false
  })

  useEffect(() => {
    checkUser()
    loadMatchStats()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    // Get user data
    const userName = session.user?.email?.split('@')[0] || 'Player'
    setUser({
      display_name: userName.charAt(0).toUpperCase() + userName.slice(1),
      team: 'Thursday FC'
    })
    
    setLoading(false)
  }

  const loadMatchStats = () => {
    const storedStats = localStorage.getItem('matchData')
    if (storedStats) {
      const stats = JSON.parse(storedStats)
      const userName = user?.display_name || ''
      if (stats[userName]) {
        setMatchStats(stats[userName])
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const saveMatchData = () => {
    // Get the user's display name and try to match it with TEAM_MEMBERS
    const userName = user?.display_name || ''
    
    // Try to find exact match in TEAM_MEMBERS (case-insensitive)
    const actualPlayerName = TEAM_MEMBERS.find(name => 
      name.toLowerCase() === userName.toLowerCase()
    ) || userName // Use the userName if no match found
    
    const existingData = localStorage.getItem('matchData')
    const allStats = existingData ? JSON.parse(existingData) : {}
    
    const currentStats = allStats[actualPlayerName] || {
      goals: 0,
      assists: 0,
      saves: 0,
      wins: 0,
      losses: 0,
      gamesPlayed: 0
    }

    // Update stats - handle both string and number inputs
    const goalsToAdd = typeof matchData.goals === 'string' ? (parseInt(matchData.goals) || 0) : matchData.goals
    const assistsToAdd = typeof matchData.assists === 'string' ? (parseInt(matchData.assists) || 0) : matchData.assists
    const savesToAdd = typeof matchData.saves === 'string' ? (parseInt(matchData.saves) || 0) : matchData.saves
    
    currentStats.goals += goalsToAdd
    currentStats.assists += assistsToAdd
    currentStats.saves += savesToAdd
    currentStats.gamesPlayed += 1
    if (matchData.teamWon) {
      currentStats.wins += 1
    } else {
      currentStats.losses += 1
    }

    allStats[actualPlayerName] = currentStats
    localStorage.setItem('matchData', JSON.stringify(allStats))
    
    setMatchStats(currentStats)
    setShowMatchForm(false)
    setMatchData({ goals: 0, assists: 0, saves: 0, teamWon: false })
    
    // Show success message
    alert(`Stats saved successfully for ${actualPlayerName}!\nGoals: ${goalsToAdd}, Assists: ${assistsToAdd}, Saves: ${savesToAdd}`)
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
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Thursday Football</h1>
                  <p className="text-xs text-gray-500">Professional League</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/rankings"
                  className="px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Rankings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {user?.display_name}
            </h2>
            <p className="text-gray-500">
              Track your performance and manage your statistics
            </p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <button
              onClick={() => setShowMatchForm(!showMatchForm)}
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6" />
                <div className="text-left">
                  <p className="font-semibold">Record Match Performance</p>
                  <p className="text-sm opacity-80">Add your stats from the last game</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Match Form */}
          {showMatchForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 p-6 rounded-xl bg-gray-950/50 border border-gray-800"
            >
              <h3 className="text-xl font-semibold mb-4">Record Match Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Goals Scored</label>
                  <input
                    type="number"
                    min="0"
                    value={matchData.goals}
                    onChange={(e) => setMatchData({...matchData, goals: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Assists</label>
                  <input
                    type="number"
                    min="0"
                    value={matchData.assists}
                    onChange={(e) => setMatchData({...matchData, assists: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Saves (GK)</label>
                  <input
                    type="number"
                    min="0"
                    value={matchData.saves}
                    onChange={(e) => setMatchData({...matchData, saves: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-2">Match Result</label>
                  <select
                    value={matchData.teamWon ? 'won' : 'lost'}
                    onChange={(e) => setMatchData({...matchData, teamWon: e.target.value === 'won'})}
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none"
                  >
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={saveMatchData}
                  className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Save Match Data
                </button>
                <button
                  onClick={() => setShowMatchForm(false)}
                  className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-2xl bg-gray-950/50 border border-gray-800 backdrop-blur-xl shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <Goal className="w-8 h-8 text-blue-400" />
                <span className="text-xs text-gray-500">Total</span>
              </div>
              <p className="text-3xl font-bold mb-1">{matchStats.goals}</p>
              <p className="text-sm text-gray-500">Goals Scored</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-8 rounded-2xl bg-gray-950/50 border border-gray-800 backdrop-blur-xl shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <HandHelping className="w-8 h-8 text-purple-400" />
                <span className="text-xs text-gray-500">Total</span>
              </div>
              <p className="text-3xl font-bold mb-1">{matchStats.assists}</p>
              <p className="text-sm text-gray-500">Assists</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-8 rounded-2xl bg-gray-950/50 border border-gray-800 backdrop-blur-xl shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <ShieldCheck className="w-8 h-8 text-green-400" />
                <span className="text-xs text-gray-500">Total</span>
              </div>
              <p className="text-3xl font-bold mb-1">{matchStats.saves}</p>
              <p className="text-sm text-gray-500">Saves</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-8 rounded-2xl bg-gray-950/50 border border-gray-800 backdrop-blur-xl shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <span className="text-xs text-gray-500">W/L</span>
              </div>
              <p className="text-3xl font-bold mb-1">
                {matchStats.wins}-{matchStats.losses}
              </p>
              <p className="text-sm text-gray-500">Win Record</p>
            </motion.div>
          </div>

          {/* Performance Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 rounded-xl bg-gray-950/50 border border-gray-800"
          >
            <h3 className="text-xl font-semibold mb-4">Performance Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Games Played</p>
                <p className="text-2xl font-bold">{matchStats.gamesPlayed}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Win Rate</p>
                <p className="text-2xl font-bold">
                  {matchStats.gamesPlayed > 0 
                    ? Math.round((matchStats.wins / matchStats.gamesPlayed) * 100) 
                    : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Goals/Game</p>
                <p className="text-2xl font-bold">
                  {matchStats.gamesPlayed > 0 
                    ? (matchStats.goals / matchStats.gamesPlayed).toFixed(1)
                    : '0.0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Contribution</p>
                <p className="text-2xl font-bold">
                  {matchStats.goals + matchStats.assists}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}