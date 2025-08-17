'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/auth'
import { TEAM_MEMBERS } from '@/lib/auth'
import { motion } from 'framer-motion'
import { Trophy, Star, Target, Shield, Users, LogIn, UserCog, ChevronRight, Award, TrendingUp, Goal } from 'lucide-react'

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

  useEffect(() => {
    checkAuthAndLoadStats()
  }, [])

  const checkAuthAndLoadStats = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      router.push('/dashboard')
      return
    }

    // Load top players
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

    setTopPlayers(stats.slice(0, 5))
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

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-br from-green-500/10 to-blue-500/10 blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Thursday Football</h1>
                  <p className="text-xs text-gray-400">Professional Club Management</p>
                </div>
              </div>
              <Link
                href="/rate-players"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 font-medium"
              >
                <Star className="w-4 h-4" />
                <span>Rate Players</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-12">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left Column - Top Players */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  Top Players This Month
                </h2>

                <div className="space-y-4">
                  {topPlayers.map((player, index) => (
                    <motion.div
                      key={player.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-950/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold
                            ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-600' :
                              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                              index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                              'bg-gradient-to-br from-gray-700 to-gray-800'}
                          `}>
                            #{player.rank}
                          </div>
                          <div>
                            <p className="text-xl font-semibold">{player.name}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {player.rating}/10
                              </span>
                              <span>Goals: {player.goals}</span>
                              <span>Assists: {player.assists}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{player.points}</p>
                          <p className="text-xs text-gray-400">Points</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Link
                  href="/rankings"
                  className="mt-6 w-full px-6 py-4 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-800 transition-all flex items-center justify-between group inline-flex"
                >
                  <span className="font-medium">View Complete Rankings</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              {/* Right Column - Login */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                  <LogIn className="w-8 h-8 text-blue-400" />
                  Player Login
                </h2>

                <div className="bg-gray-950/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition-colors"
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
                        className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition-colors"
                        placeholder="Enter your password"
                        required
                      />
                    </div>

                    {loginError && (
                      <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
                        {loginError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50"
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
                    </button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                    <p className="text-sm text-gray-400 mb-3">Don't have an account?</p>
                    <Link
                      href="/login"
                      className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                    >
                      Create one here →
                    </Link>
                  </div>
                </div>

                {/* Admin Login Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6"
                >
                  <Link
                    href="/login?admin=true"
                    className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 hover:from-gray-800 hover:to-gray-700 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <UserCog className="w-5 h-5 text-orange-400" />
                      <span className="font-medium">Admin Access</span>
                    </div>
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            {/* Points System Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-16 py-12 border-t border-gray-800"
            >
              <h3 className="text-2xl font-bold mb-8 text-center">
                ⚽ Points Calculation System ⚽
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
                <div className="bg-gray-950/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                  <p className="text-2xl font-bold mb-1">×10</p>
                  <p className="text-sm text-gray-400">Peer Rating</p>
                </div>
                
                <div className="bg-gray-950/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                  <Goal className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <p className="text-2xl font-bold mb-1">×5</p>
                  <p className="text-sm text-gray-400">Goals</p>
                </div>
                
                <div className="bg-gray-950/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                  <Target className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <p className="text-2xl font-bold mb-1">×3</p>
                  <p className="text-sm text-gray-400">Assists</p>
                </div>
                
                <div className="bg-gray-950/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                  <Shield className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <p className="text-2xl font-bold mb-1">×2</p>
                  <p className="text-sm text-gray-400">Saves</p>
                </div>
                
                <div className="bg-gray-950/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6 text-center">
                  <Trophy className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                  <p className="text-2xl font-bold mb-1">×4</p>
                  <p className="text-sm text-gray-400">Wins</p>
                </div>
              </div>

              <p className="text-center text-gray-400 mt-8 text-sm">
                Total Points = (Rating × 10) + (Goals × 5) + (Assists × 3) + (Saves × 2) + (Wins × 4)
              </p>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 bg-black/50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400">
                © 2025 Thursday Football Club. All rights reserved.
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <Link href="/rankings" className="hover:text-white transition-colors">
                  Rankings
                </Link>
                <Link href="/rate-players" className="hover:text-white transition-colors">
                  Rate Players
                </Link>
                <a href="https://thursdayfootball.com" className="hover:text-white transition-colors">
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