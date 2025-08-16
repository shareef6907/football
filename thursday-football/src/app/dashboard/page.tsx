'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Target, 
  Users, 
  TrendingUp, 
  Calendar,
  Crown,
  Award,
  Zap,
  LogOut,
  User
} from 'lucide-react'

interface User {
  id: string
  username: string
  display_name: string
  email: string
  is_admin: boolean
  total_points: number
}

interface LeaderboardEntry {
  id: string
  display_name: string
  total_points: number
  goals: number
  assists: number
  rank: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalGames: 0,
    totalGoals: 0,
    totalAssists: 0,
    winRate: 0
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
    loadDashboardData()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    // Get user profile from our users table
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userProfile) {
      setUser(userProfile)
    }
  }

  const loadDashboardData = async () => {
    try {
      // Load leaderboard (top 10 players by points)
      const { data: leaderboardData } = await supabase
        .from('users')
        .select('id, display_name, total_points')
        .order('total_points', { ascending: false })
        .limit(10)

      if (leaderboardData) {
        const leaderboard = leaderboardData.map((player, index) => ({
          ...player,
          goals: 0, // We'll calculate this from player_stats
          assists: 0,
          rank: index + 1
        }))
        setLeaderboard(leaderboard)
      }

      // Load basic stats
      const { data: gamesData } = await supabase
        .from('games')
        .select('id')

      const { data: goalsData } = await supabase
        .from('player_stats')
        .select('goals')

      const { data: assistsData } = await supabase
        .from('player_stats')
        .select('assists')

      setStats({
        totalGames: gamesData?.length || 0,
        totalGoals: goalsData?.reduce((sum, stat) => sum + (stat.goals || 0), 0) || 0,
        totalAssists: assistsData?.reduce((sum, stat) => sum + (stat.assists || 0), 0) || 0,
        winRate: 0 // Calculate later based on user's games
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="glass border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center glow-blue">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Thursday Football</h1>
                <p className="text-xs text-slate-400">Club Statistics & Management</p>
              </div>
            </motion.div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-slate-300">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">{user?.display_name}</span>
                {user?.is_admin && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full font-medium">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.display_name}! 👋
          </h2>
          <p className="text-slate-400">
            Here&apos;s what&apos;s happening with Thursday Football today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6 glow-blue"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{user?.total_points}</span>
            </div>
            <h3 className="text-slate-300 font-medium">Total Points</h3>
            <p className="text-slate-500 text-sm">Your career total</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6 glow-green"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.totalGoals}</span>
            </div>
            <h3 className="text-slate-300 font-medium">Total Goals</h3>
            <p className="text-slate-500 text-sm">Club total scored</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6 glow-orange"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.totalGames}</span>
            </div>
            <h3 className="text-slate-300 font-medium">Games Played</h3>
            <p className="text-slate-500 text-sm">Total matches</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">{stats.totalAssists}</span>
            </div>
            <h3 className="text-slate-300 font-medium">Total Assists</h3>
            <p className="text-slate-500 text-sm">Club total assists</p>
          </motion.div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 glass rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Crown className="w-6 h-6 mr-2 text-yellow-500" />
                Leaderboard
              </h3>
              <span className="text-sm text-slate-400">Monthly rankings</span>
            </div>

            <div className="space-y-3">
              {leaderboard.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                    player.id === user?.id 
                      ? 'bg-blue-500/20 border border-blue-500/30' 
                      : 'bg-slate-800/50 hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500 text-yellow-900' :
                      index === 1 ? 'bg-gray-400 text-gray-900' :
                      index === 2 ? 'bg-amber-600 text-amber-100' :
                      'bg-slate-600 text-slate-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-white">{player.display_name}</p>
                      <p className="text-xs text-slate-400">{player.total_points} points</p>
                    </div>
                  </div>
                  {index < 3 && (
                    <div className="flex items-center space-x-1">
                      {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
                      {index === 1 && <Award className="w-5 h-5 text-gray-400" />}
                      {index === 2 && <Award className="w-5 h-5 text-amber-600" />}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions & Monthly Awards */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-blue-500" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200">
                  Log Game Stats
                </button>
                <button className="w-full p-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200">
                  Create Teams
                </button>
                <button className="w-full p-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-200">
                  Rate Players
                </button>
                <button className="w-full p-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all duration-200">
                  View History
                </button>
              </div>
            </div>

            {/* Upcoming Games */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Calendar className="w-6 h-6 mr-2 text-green-500" />
                This Week
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="font-medium text-white">Thursday Game</p>
                  <p className="text-sm text-slate-400">Tomorrow • 7:00 PM</p>
                  <p className="text-xs text-green-400 mt-1">⚡ Peak Form</p>
                </div>
                <button className="w-full p-3 border border-slate-600 text-slate-300 rounded-lg font-medium hover:bg-slate-800/50 transition-all duration-200">
                  Update Form Status
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}