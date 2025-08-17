'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/auth'
import { TEAM_MEMBERS } from '@/lib/auth'
import { getPlayerBadges } from '@/lib/awards'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Star, Target, Shield, LogIn, UserCog, 
  Goal, Users, Award, TrendingUp, Calendar,
  Lock, Unlock, Clock, Download, CheckCircle,
  Medal, Activity, Sparkles, Zap
} from 'lucide-react'

interface PlayerRating {
  name: string
  rating: number
  totalRatings: number
}

interface LeaderStats {
  topScorer: { name: string, goals: number }
  topAssists: { name: string, assists: number }
  topKeeper: { name: string, saves: number }
  topRanked: { name: string, points: number }
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [playerRatings, setPlayerRatings] = useState<PlayerRating[]>([])
  const [userRatings, setUserRatings] = useState<{[key: string]: number}>({})
  const [hasRated, setHasRated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [leaders, setLeaders] = useState<LeaderStats | null>(null)
  const [isThursdayUnlocked, setIsThursdayUnlocked] = useState(false)
  const [timeUntilThursday, setTimeUntilThursday] = useState('')
  const [showRatingSuccess, setShowRatingSuccess] = useState(false)

  useEffect(() => {
    checkAuthAndLoadData()
    checkThursdayStatus()
    loadLeaders()
    
    // Check if user has already rated
    const existingRatings = localStorage.getItem('userPlayerRatings')
    if (existingRatings) {
      setUserRatings(JSON.parse(existingRatings))
      setHasRated(true)
    }

    // Update Thursday status every minute
    const interval = setInterval(checkThursdayStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      router.push('/dashboard')
      return
    }

    loadPlayerRatings()
    setLoading(false)
  }

  const loadPlayerRatings = () => {
    // Load all ratings from localStorage
    const storedRatings = localStorage.getItem('allPlayerRatings')
    const ratings = storedRatings ? JSON.parse(storedRatings) : {}
    
    // Calculate average ratings for each player
    const calculatedRatings: PlayerRating[] = TEAM_MEMBERS.map(name => {
      const playerRatings = ratings[name] || []
      const avgRating = playerRatings.length > 0 
        ? playerRatings.reduce((a: number, b: number) => a + b, 0) / playerRatings.length
        : 5.0
      
      return {
        name,
        rating: Math.round(avgRating * 10) / 10,
        totalRatings: playerRatings.length
      }
    })

    // Sort alphabetically
    calculatedRatings.sort((a, b) => a.name.localeCompare(b.name))
    setPlayerRatings(calculatedRatings)
  }

  const loadLeaders = () => {
    const storedRatings = localStorage.getItem('playerRatings')
    const ratings = storedRatings ? JSON.parse(storedRatings) : []
    
    const matchData = localStorage.getItem('matchData')
    const matches = matchData ? JSON.parse(matchData) : {}

    // Calculate leaders
    let topScorer = { name: 'TBD', goals: 0 }
    let topAssists = { name: 'TBD', assists: 0 }
    let topKeeper = { name: 'TBD', saves: 0 }
    let topRanked = { name: 'TBD', points: 0 }

    TEAM_MEMBERS.forEach(name => {
      const playerMatches = matches[name] || {}
      const playerRating = ratings.find((r: any) => r.name === name)?.rating || 5
      
      if (playerMatches.goals > topScorer.goals) {
        topScorer = { name, goals: playerMatches.goals }
      }
      if (playerMatches.assists > topAssists.assists) {
        topAssists = { name, assists: playerMatches.assists }
      }
      if (playerMatches.saves > topKeeper.saves) {
        topKeeper = { name, saves: playerMatches.saves }
      }
      
      const points = calculatePoints({
        rating: playerRating,
        goals: playerMatches.goals || 0,
        assists: playerMatches.assists || 0,
        saves: playerMatches.saves || 0,
        wins: playerMatches.wins || 0
      })
      
      if (points > topRanked.points) {
        topRanked = { name, points }
      }
    })

    setLeaders({ topScorer, topAssists, topKeeper, topRanked })
    
    // Update rankings whenever ratings change
    updateRankings()
  }

  const updateRankings = () => {
    // Force rankings page to update by dispatching a custom event
    window.dispatchEvent(new Event('ratingsUpdated'))
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
      stats.wins * 5
    )
  }

  const checkThursdayStatus = () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    
    // Thursday is day 4, unlock from Thursday to Saturday (4, 5, 6)
    setIsThursdayUnlocked(dayOfWeek >= 4 && dayOfWeek <= 6)
    
    // Calculate time until next Thursday
    let daysUntilThursday = (4 - dayOfWeek + 7) % 7
    if (daysUntilThursday === 0 && dayOfWeek !== 4) {
      daysUntilThursday = 7
    }
    
    if (dayOfWeek >= 4 && dayOfWeek <= 6) {
      setTimeUntilThursday('🔓 Entry Open!')
    } else {
      const nextThursday = new Date(now)
      nextThursday.setDate(now.getDate() + daysUntilThursday)
      nextThursday.setHours(0, 0, 0, 0)
      
      const timeDiff = nextThursday.getTime() - now.getTime()
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      
      setTimeUntilThursday(`🔒 ${days}d ${hours}h`)
    }
  }

  const handleRatingChange = (playerName: string, rating: number) => {
    setUserRatings(prev => ({
      ...prev,
      [playerName]: rating
    }))
  }

  const submitRatings = () => {
    // Save user's ratings
    localStorage.setItem('userPlayerRatings', JSON.stringify(userRatings))
    
    // Update global ratings
    const storedRatings = localStorage.getItem('allPlayerRatings')
    const allRatings = storedRatings ? JSON.parse(storedRatings) : {}
    
    Object.entries(userRatings).forEach(([name, rating]) => {
      if (!allRatings[name]) {
        allRatings[name] = []
      }
      allRatings[name].push(rating)
    })
    
    localStorage.setItem('allPlayerRatings', JSON.stringify(allRatings))
    
    setHasRated(true)
    setShowRatingSuccess(true)
    loadPlayerRatings()
    loadLeaders() // Update leaders and rankings in real-time
    
    setTimeout(() => {
      setShowRatingSuccess(false)
    }, 3000)
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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-16 h-16 text-yellow-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background with subtle glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-cyan-600/10 to-blue-600/10 rounded-full blur-3xl"
        />
      </div>

      {/* Header - Centered and Bigger */}
      <header className="relative z-10 pt-16 pb-32">
        <div className="text-center">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-block"
          >
            <div className="flex items-center justify-center gap-6 mb-8">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Trophy className="w-24 h-24 text-yellow-400 drop-shadow-2xl" />
              </motion.div>
            </div>
            <h1 className="text-8xl md:text-9xl font-black bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x drop-shadow-2xl">
              Thursday Football
            </h1>
            <p className="text-2xl bg-gradient-to-r from-gray-400 to-gray-200 bg-clip-text text-transparent mt-6 font-semibold">Elite Competition League</p>
            
            {/* Thursday Status */}
            <motion.div 
              className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-black/60 backdrop-blur-xl border border-white/20"
              whileHover={{ scale: 1.05 }}
            >
              {isThursdayUnlocked ? (
                <Unlock className="w-6 h-6 text-green-400 animate-bounce" />
              ) : (
                <Lock className="w-6 h-6 text-red-400" />
              )}
              <span className="text-lg font-semibold text-white">{timeUntilThursday}</span>
            </motion.div>
          </motion.div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* Section 1: Player Ratings Table - Centered */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-32"
        >
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-black/60 px-8 py-8 border-b border-white/10">
              <h2 className="text-4xl font-bold text-center bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">⭐ Rate All Players</h2>
              <p className="text-gray-400 text-center mt-3 text-xl">
                {hasRated ? '✅ Ratings submitted! You can update anytime.' : 'Rate each player from 1-10 stars'}
              </p>
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {showRatingSuccess && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-black/60 border-b border-green-400/30 px-8 py-4"
                >
                  <div className="flex items-center justify-center gap-3 text-green-400">
                    <CheckCircle className="w-7 h-7 animate-bounce" />
                    <span className="text-xl font-semibold">Ratings submitted successfully! 🎉</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-8 py-6 text-left text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent uppercase tracking-wider">Player</th>
                    <th className="px-8 py-6 text-center text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider">Avg Rating</th>
                    <th className="px-8 py-6 text-center text-lg font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent uppercase tracking-wider">Your Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {playerRatings.map((player) => (
                    <motion.tr 
                      key={player.name} 
                      className="hover:bg-white/5 transition-all"
                      whileHover={{ scale: 1.01 }}
                    >
                      <td className="px-8 py-7">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-xl font-semibold text-white">{player.name}</div>
                            <div className="text-base text-gray-500">{player.totalRatings} ratings</div>
                          </div>
                          {getPlayerBadges(player.name).length > 0 && (
                            <span className="text-xl animate-pulse">{getPlayerBadges(player.name).join(' ')}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-7 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                          <span className="text-3xl font-bold text-yellow-400">{player.rating}</span>
                        </div>
                      </td>
                      <td className="px-8 py-7">
                        <div className="flex items-center justify-center gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                            <motion.button
                              key={rating}
                              onClick={() => handleRatingChange(player.name, rating)}
                              className="group p-1"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Star
                                className={`w-8 h-8 transition-all ${
                                  rating <= (userRatings[player.name] || 0)
                                    ? 'text-yellow-400 fill-yellow-400 drop-shadow-glow'
                                    : 'text-gray-600 hover:text-yellow-400'
                                }`}
                              />
                            </motion.button>
                          ))}
                          <span className="ml-4 text-2xl font-bold text-yellow-400 w-12">
                            {userRatings[player.name] || '-'}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Button - Centered and Animated */}
          <div className="mt-12 text-center">
            <motion.button
              onClick={submitRatings}
              disabled={Object.keys(userRatings).length < TEAM_MEMBERS.length}
              className="relative px-16 py-8 text-3xl font-bold rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group shadow-2xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient-x" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient-x blur-xl opacity-50" />
              <span className="relative flex items-center gap-4">
                <Sparkles className="w-10 h-10" />
                {hasRated ? 'Update Ratings' : 'Submit All Ratings'} 
                <span className="text-xl">({Object.keys(userRatings).length}/{TEAM_MEMBERS.length})</span>
              </span>
            </motion.button>
          </div>
        </motion.section>

        {/* Section 2: Login and Leaders - Side by Side with Space */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-32"
        >
          <div className="grid md:grid-cols-2 gap-16">
            {/* Login Form */}
            <motion.div 
              className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8"
              whileHover={{ scale: 1.02 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">🔐 Player Login</h2>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-base font-medium text-gray-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 text-lg rounded-xl bg-black/60 border border-white/20 focus:border-cyan-400 outline-none transition-all text-white"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-400 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-4 text-lg rounded-xl bg-black/60 border border-white/20 focus:border-cyan-400 outline-none transition-all text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-black/60 border border-red-400/30 text-red-400"
                  >
                    {loginError}
                  </motion.div>
                )}
                <motion.button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full px-6 py-4 text-xl font-bold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoggingIn ? (
                    <>
                      <motion.div 
                        className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-6 h-6" />
                      <span>Sign In</span>
                    </>
                  )}
                </motion.button>
              </form>
              <div className="mt-6 pt-6 border-t border-blue-500/30 text-center">
                <Link href="/register" className="text-blue-400 hover:text-blue-300 text-lg font-semibold">
                  Create Account →
                </Link>
              </div>
            </motion.div>

            {/* Current Month Leaders */}
            <motion.div 
              className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8"
              whileHover={{ scale: 1.02 }}
            >
              <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">🏆 Current Leaders</h2>
              {leaders && (
                <div className="space-y-4">
                  {[
                    { icon: Goal, label: 'Top Scorer', data: leaders.topScorer, value: 'goals', color: 'from-blue-500 to-cyan-500' },
                    { icon: Target, label: 'Most Assists', data: leaders.topAssists, value: 'assists', color: 'from-purple-500 to-pink-500' },
                    { icon: Shield, label: 'Top Keeper', data: leaders.topKeeper, value: 'saves', color: 'from-green-500 to-emerald-500' },
                    { icon: Trophy, label: 'Highest Points', data: leaders.topRanked, value: 'points', color: 'from-yellow-500 to-orange-500' }
                  ].map(({ icon: Icon, label, data, value, color }) => (
                    <motion.div 
                      key={label}
                      className={`bg-gradient-to-r ${color} p-0.5 rounded-2xl`}
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="bg-black rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Icon className="w-8 h-8" />
                          <div>
                            <p className="text-sm text-gray-500">{label}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xl font-bold text-white">{data.name}</p>
                              {getPlayerBadges(data.name).length > 0 && (
                                <span className="text-lg">{getPlayerBadges(data.name).join(' ')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-3xl font-black">
                          {(data as any)[value]}
                          {value === 'points' && ' pts'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              <div className="mt-6 pt-6 border-t border-purple-500/30">
                <Link
                  href="/rankings"
                  className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all text-lg font-semibold"
                >
                  <Award className="w-6 h-6" />
                  <span>View Full Rankings</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Section 3: How Points Work - More Space and Visual */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-32"
        >
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-10">
            <h2 className="text-4xl font-bold mb-10 text-center bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">⚡ How Points Work</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
              {[
                { icon: Star, label: 'Peer Rating', value: '×10', color: 'from-yellow-400 to-orange-500', desc: 'Monthly ratings' },
                { icon: Goal, label: 'Goals', value: '×5', color: 'from-blue-400 to-cyan-500', desc: 'Goals scored' },
                { icon: Target, label: 'Assists', value: '×3', color: 'from-purple-400 to-pink-500', desc: 'Assists made' },
                { icon: Shield, label: 'Saves', value: '×2', color: 'from-green-400 to-emerald-500', desc: 'Keeper saves' },
                { icon: Trophy, label: 'Team Win', value: '×5', color: 'from-orange-400 to-red-500', desc: 'Victory bonus' }
              ].map(({ icon: Icon, label, value, color, desc }) => (
                <motion.div 
                  key={label} 
                  className="relative group"
                  whileHover={{ scale: 1.1, y: -10 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`} />
                  <div className={`relative bg-gradient-to-br ${color} p-0.5 rounded-2xl`}>
                    <div className="bg-black rounded-2xl p-6 text-center h-full">
                      <Icon className="w-12 h-12 mx-auto mb-3" />
                      <p className="text-3xl font-black mb-2">{value}</p>
                      <p className="text-base font-semibold text-white">{label}</p>
                      <p className="text-sm text-gray-500 mt-1">{desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div 
                className="bg-black/60 rounded-2xl p-6 border border-cyan-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-cyan-400" />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Monthly Awards</span>
                </h3>
                <div className="space-y-3 text-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚽</span>
                    <span className="text-gray-300">Top Scorer Badge</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🥇</span>
                    <span className="text-gray-300">Most Assists Badge</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🧤</span>
                    <span className="text-gray-300">Best Keeper Badge</span>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="bg-black/60 rounded-2xl p-6 border border-purple-400/20"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Medal className="w-8 h-8 text-purple-400" />
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Quarterly Awards</span>
                </h3>
                <div className="space-y-3 text-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚽️🏆</span>
                    <span className="text-gray-300">Ballon d'Or (Best Overall)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👟</span>
                    <span className="text-gray-300">Golden Boot (Top Scorer)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <span className="text-gray-300">Every 4 months</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* Rules Section - Comprehensive and Beautiful */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-32"
        >
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-10">
            <h2 className="text-4xl font-bold mb-12 text-center bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">📋 League Rules & Guidelines</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Rule Cards */}
              {[
                {
                  icon: Calendar,
                  title: "Entry Window",
                  rules: [
                    "Submissions open Thursday 12:00 AM",
                    "Closes Saturday 11:59 PM",
                    "One submission per week only",
                    "Cannot edit after submission"
                  ],
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  icon: Star,
                  title: "Rating System",
                  rules: [
                    "Rate all players 1-10 stars",
                    "Ratings affect monthly rankings",
                    "Can update ratings anytime",
                    "Average rating displayed publicly"
                  ],
                  color: "from-yellow-500 to-orange-500"
                },
                {
                  icon: Trophy,
                  title: "Points Calculation",
                  rules: [
                    "Peer Rating: ×10 points",
                    "Goals Scored: ×5 points",
                    "Assists Made: ×3 points",
                    "Saves (Keeper): ×2 points",
                    "Team Win: +5 bonus points"
                  ],
                  color: "from-purple-500 to-pink-500"
                },
                {
                  icon: Award,
                  title: "Monthly Awards",
                  rules: [
                    "⚽ Top Scorer Badge",
                    "🥇 Most Assists Badge",
                    "🧤 Best Keeper Badge",
                    "Badges are permanent",
                    "Reset scores monthly"
                  ],
                  color: "from-green-500 to-emerald-500"
                },
                {
                  icon: Medal,
                  title: "Quarterly Awards",
                  rules: [
                    "⚽️🏆 Ballon d'Or (Every 4 months)",
                    "👟 Golden Boot (Top scorer)",
                    "Based on overall performance",
                    "Prestigious permanent badges"
                  ],
                  color: "from-red-500 to-pink-500"
                },
                {
                  icon: Activity,
                  title: "Form Status",
                  rules: [
                    "Track your fitness level",
                    "Fully Fit: Peak condition",
                    "Slightly Injured: Minor issues",
                    "Injured: Unable to play fully"
                  ],
                  color: "from-indigo-500 to-purple-500"
                },
                {
                  icon: Shield,
                  title: "Fair Play",
                  rules: [
                    "Submit honest scores only",
                    "No false entries allowed",
                    "Admin reviews suspicious data",
                    "Violations may result in ban"
                  ],
                  color: "from-orange-500 to-red-500"
                },
                {
                  icon: Users,
                  title: "Eligibility",
                  rules: [
                    "Must be registered player",
                    "Play Thursday matches only",
                    "Active participation required",
                    "20 total league players"
                  ],
                  color: "from-teal-500 to-cyan-500"
                },
                {
                  icon: Download,
                  title: "Reports",
                  rules: [
                    "Monthly PDF reports available",
                    "Track personal progress",
                    "Compare with previous months",
                    "Download anytime from dashboard"
                  ],
                  color: "from-gray-500 to-gray-600"
                }
              ].map(({ icon: Icon, title, rules, color }) => (
                <motion.div
                  key={title}
                  className="relative group"
                  whileHover={{ scale: 1.05, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-full">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-white">{title}</h3>
                    <ul className="space-y-2">
                      {rules.map((rule, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-gray-600 mt-1">•</span>
                          <span className="text-sm text-gray-400">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-black/60 rounded-2xl border border-white/10">
              <p className="text-center text-lg">
                <span className="font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Important:</span>
                <span className="text-gray-400"> All players must maintain good sportsmanship. 
                The league is based on trust and honest reporting. Enjoy the competition and have fun! ⚽</span>
              </p>
            </div>
          </div>
        </motion.section>

        {/* Admin Access Button - Big and Centered */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-20"
        >
          <Link href="/admin">
            <motion.button
              className="relative px-16 py-8 text-2xl font-bold rounded-3xl overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 animate-gradient-x" />
              <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 animate-gradient-x blur-xl opacity-50" />
              <span className="relative flex items-center gap-4">
                <UserCog className="w-10 h-10" />
                Admin Access
              </span>
            </motion.button>
          </Link>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
          background-size: 200% 200%;
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 10px currentColor);
        }
      `}</style>
    </div>
  )
}