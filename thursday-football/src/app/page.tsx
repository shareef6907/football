'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/auth'
import { TEAM_MEMBERS } from '@/lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Target, Shield, LogIn, UserCog, ChevronRight, Goal, Users, Zap, Award } from 'lucide-react'

interface PlayerStats {
  name: string
  rating: number
  goals: number
  assists: number
  saves: number
  wins: number
  points: number
  rank: number
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [activeSection, setActiveSection] = useState<'stats' | 'login'>('stats')

  useEffect(() => {
    checkAuthAndLoadStats()
  }, [])

  const checkAuthAndLoadStats = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      router.push('/dashboard')
      return
    }

    loadTopPlayers()
    setLoading(false)
  }

  const loadTopPlayers = () => {
    const storedRatings = localStorage.getItem('playerRatings')
    const ratings = storedRatings ? JSON.parse(storedRatings) : []
    
    const matchData = localStorage.getItem('matchData')
    const matches = matchData ? JSON.parse(matchData) : {}

    const stats: PlayerStats[] = TEAM_MEMBERS.map((name) => {
      const playerRating = ratings.find((r: any) => r.name === name)?.rating || 5
      const playerMatches = matches[name] || {}
      
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
        points,
        rank: 0
      }
    })

    stats.sort((a, b) => b.points - a.points)
    stats.forEach((player, index) => {
      player.rank = index + 1
    })

    setTopPlayers(stats.slice(0, 3))
  }

  const calculatePoints = (stats: {
    rating: number
    goals: number
    assists: number
    saves: number
    wins: number
  }) => {
    return (
      stats.rating * 10 +
      stats.goals * 5 +
      stats.assists * 3 +
      stats.saves * 2 +
      stats.wins * 4
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setLoginError(error.message)
      setIsLoggingIn(false)
    } else {
      router.push('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  }

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-48 -right-48 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 blur-3xl"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-gradient-to-br from-green-500/10 to-blue-500/10 blur-3xl"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Header */}
        <motion.header 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="w-full py-8 px-8 lg:px-16"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <motion.div 
                className="flex items-center gap-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/25">
                  <Trophy className="w-9 h-9 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Thursday Football
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">Elite Competition Platform</p>
                </div>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/rate-players"
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-3 font-bold text-lg shadow-2xl shadow-purple-500/25"
                >
                  <Star className="w-5 h-5" />
                  <span>Rate Players</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.header>

        {/* Main Content Area */}
        <main className="flex-1 w-full px-8 lg:px-16 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Toggle Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center gap-4 mb-12"
            >
              <button
                onClick={() => setActiveSection('stats')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                  activeSection === 'stats' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-purple-500/25' 
                    : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                <Trophy className="w-5 h-5 inline mr-2" />
                Top Players
              </button>
              <button
                onClick={() => setActiveSection('login')}
                className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                  activeSection === 'login' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg shadow-purple-500/25' 
                    : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                <LogIn className="w-5 h-5 inline mr-2" />
                Player Login
              </button>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeSection === 'stats' ? (
                /* Top Players Section */
                <motion.div
                  key="stats"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="grid lg:grid-cols-3 gap-8 mb-16"
                >
                  {topPlayers.map((player, index) => (
                    <motion.div
                      key={player.name}
                      variants={itemVariants}
                      whileHover={{ 
                        y: -10,
                        transition: { type: "spring", stiffness: 300 }
                      }}
                      className="relative"
                    >
                      <div className={`
                        h-full bg-gradient-to-br p-1 rounded-3xl shadow-2xl
                        ${index === 0 ? 'from-yellow-400 to-amber-600 shadow-yellow-500/30' :
                          index === 1 ? 'from-gray-300 to-gray-500 shadow-gray-400/30' :
                          'from-orange-400 to-orange-600 shadow-orange-500/30'}
                      `}>
                        <div className="bg-gray-950 rounded-3xl p-10 h-full backdrop-blur-xl">
                          {/* Rank Badge */}
                          <div className="flex justify-center mb-8">
                            <motion.div 
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                              className={`
                                w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black
                                bg-gradient-to-br shadow-lg
                                ${index === 0 ? 'from-yellow-400 to-amber-600 shadow-yellow-500/50' :
                                  index === 1 ? 'from-gray-300 to-gray-500 shadow-gray-400/50' :
                                  'from-orange-400 to-orange-600 shadow-orange-500/50'}
                              `}
                            >
                              #{player.rank}
                            </motion.div>
                          </div>

                          {/* Player Info */}
                          <div className="text-center mb-8">
                            <p className="text-sm text-gray-400 uppercase tracking-[0.3em] mb-3">
                              {index === 0 ? 'CHAMPION' : index === 1 ? 'RUNNER-UP' : 'THIRD PLACE'}
                            </p>
                            <p className="text-3xl font-bold">{player.name}</p>
                          </div>

                          {/* Stats */}
                          <div className="space-y-6">
                            <div className="text-center p-4 bg-gray-900/50 rounded-xl">
                              <p className="text-5xl font-black">{player.points}</p>
                              <p className="text-sm text-gray-400 mt-2">Total Points</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                                <p className="text-2xl font-bold">{player.goals}</p>
                                <p className="text-xs text-gray-400">Goals</p>
                              </div>
                              <div className="text-center p-3 bg-gray-900/50 rounded-lg">
                                <p className="text-2xl font-bold">{player.assists}</p>
                                <p className="text-xs text-gray-400">Assists</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-center gap-1 p-3 bg-gray-900/50 rounded-lg">
                              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                              <span className="text-xl font-bold">{player.rating}/10</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                /* Login Section */
                <motion.div
                  key="login"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="max-w-md mx-auto"
                >
                  <motion.div 
                    className="bg-gray-950/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-10 shadow-2xl"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <h2 className="text-3xl font-bold mb-8 text-center">Player Login</h2>
                    
                    <form onSubmit={handleLogin} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-5 py-4 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition-all text-lg"
                          placeholder="Enter your email"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-5 py-4 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition-all text-lg"
                          placeholder="Enter your password"
                          required
                        />
                      </div>

                      {loginError && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 rounded-xl bg-red-900/20 border border-red-800 text-red-400"
                        >
                          {loginError}
                        </motion.div>
                      )}

                      <motion.button
                        type="submit"
                        disabled={isLoggingIn}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-6 py-5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-purple-500/25"
                      >
                        {isLoggingIn ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            <span>Signing in...</span>
                          </>
                        ) : (
                          <>
                            <LogIn className="w-5 h-5" />
                            <span>Sign In</span>
                          </>
                        )}
                      </motion.button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-gray-800 text-center">
                      <p className="text-gray-400 mb-4">Don't have an account?</p>
                      <Link
                        href="/login"
                        className="text-blue-400 hover:text-blue-300 transition-colors font-semibold text-lg"
                      >
                        Create one here →
                      </Link>
                    </div>
                  </motion.div>

                  {/* Admin Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6"
                  >
                    <Link
                      href="/login?admin=true"
                      className="w-full px-8 py-5 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 hover:from-gray-800 hover:to-gray-700 transition-all flex items-center justify-between group shadow-xl"
                    >
                      <div className="flex items-center gap-3">
                        <UserCog className="w-6 h-6 text-orange-400" />
                        <span className="font-bold text-lg">Admin Access</span>
                      </div>
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* View Rankings Button */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <Link
                href="/rankings"
                className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-all font-bold text-lg group shadow-xl"
              >
                <Award className="w-6 h-6 text-yellow-400" />
                <span>View Complete Rankings</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Points System - Simplified */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-20 py-12 border-t border-gray-800"
            >
              <h3 className="text-2xl font-bold mb-8 text-center">Points System</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 max-w-4xl mx-auto">
                {[
                  { icon: Star, label: 'Rating', value: '×10', color: 'text-yellow-400' },
                  { icon: Goal, label: 'Goals', value: '×5', color: 'text-blue-400' },
                  { icon: Target, label: 'Assists', value: '×3', color: 'text-purple-400' },
                  { icon: Shield, label: 'Saves', value: '×2', color: 'text-green-400' },
                  { icon: Trophy, label: 'Wins', value: '×4', color: 'text-orange-400' }
                ].map(({ icon: Icon, label, value, color }, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    whileHover={{ scale: 1.1 }}
                    className="bg-gray-950/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 text-center"
                  >
                    <Icon className={`w-10 h-10 ${color} mx-auto mb-3`} />
                    <p className="text-2xl font-bold mb-1">{value}</p>
                    <p className="text-sm text-gray-400">{label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-gray-800 bg-black/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-8 lg:px-16 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400">
                © 2025 Thursday Football Club. All rights reserved.
              </p>
              <div className="flex items-center gap-8 text-sm">
                <a href="https://thursdayfootball.com" className="text-gray-400 hover:text-white transition-colors">
                  Official Website
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}