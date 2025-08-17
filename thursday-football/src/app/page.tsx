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
  Medal, Activity
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
      setTimeUntilThursday('Unlocked for score entry!')
    } else {
      const nextThursday = new Date(now)
      nextThursday.setDate(now.getDate() + daysUntilThursday)
      nextThursday.setHours(0, 0, 0, 0)
      
      const timeDiff = nextThursday.getTime() - now.getTime()
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      
      setTimeUntilThursday(`${days}d ${hours}h until unlock`)
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h1 className="text-2xl font-bold">Thursday Football</h1>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {isThursdayUnlocked ? (
                <div className="flex items-center gap-2 text-green-400">
                  <Unlock className="w-4 h-4" />
                  <span>Entry Open</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <Lock className="w-4 h-4" />
                  <span>{timeUntilThursday}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section 1: Player Ratings Table */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-xl font-bold">Rate All Players</h2>
              <p className="text-gray-400 text-sm mt-1">
                {hasRated ? 'You have rated all players. You can update your ratings anytime.' : 'Please rate all players from 1-10 based on their overall performance'}
              </p>
            </div>

            {/* Success Message */}
            <AnimatePresence>
              {showRatingSuccess && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-green-900/20 border-b border-green-800 px-6 py-3"
                >
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>Ratings submitted successfully!</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Player</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Avg Rating</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-400 uppercase">Your Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {playerRatings.map((player) => (
                    <tr key={player.name} className="hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-xs text-gray-500">{player.totalRatings} ratings</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold">{player.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => handleRatingChange(player.name, rating)}
                              className="group p-0.5"
                            >
                              <Star
                                className={`w-5 h-5 transition-all ${
                                  rating <= (userRatings[player.name] || 0)
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-600 hover:text-yellow-400'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="ml-2 text-sm text-gray-400 w-8">
                            {userRatings[player.name] || '-'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-800">
              <button
                onClick={submitRatings}
                disabled={Object.keys(userRatings).length < TEAM_MEMBERS.length}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
              >
                {hasRated ? 'Update Ratings' : 'Submit All Ratings'} ({Object.keys(userRatings).length}/{TEAM_MEMBERS.length})
              </button>
            </div>
          </div>
        </motion.section>

        {/* Section 2: Login Form */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="grid md:grid-cols-2 gap-8">
            {/* Login Form */}
            <div className="bg-gray-950 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-bold mb-4">Player Login</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition-all"
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
                  className="w-full px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <Link href="/register" className="text-blue-400 hover:text-blue-300 text-sm">
                  Don't have an account? Register here →
                </Link>
              </div>
              <div className="mt-4">
                <Link
                  href="/login?admin=true"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 transition-colors"
                >
                  <UserCog className="w-4 h-4 text-orange-400" />
                  <span>Admin Access</span>
                </Link>
              </div>
            </div>

            {/* Current Month Leaders */}
            <div className="bg-gray-950 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-bold mb-4">Current Month Leaders</h2>
              {leaders && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Goal className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-xs text-gray-400">Top Scorer</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{leaders.topScorer.name}</p>
                          {getPlayerBadges(leaders.topScorer.name).length > 0 && (
                            <span className="text-sm">{getPlayerBadges(leaders.topScorer.name).join(' ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xl font-bold">{leaders.topScorer.goals}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-xs text-gray-400">Most Assists</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{leaders.topAssists.name}</p>
                          {getPlayerBadges(leaders.topAssists.name).length > 0 && (
                            <span className="text-sm">{getPlayerBadges(leaders.topAssists.name).join(' ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xl font-bold">{leaders.topAssists.assists}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-xs text-gray-400">Top Keeper</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{leaders.topKeeper.name}</p>
                          {getPlayerBadges(leaders.topKeeper.name).length > 0 && (
                            <span className="text-sm">{getPlayerBadges(leaders.topKeeper.name).join(' ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xl font-bold">{leaders.topKeeper.saves}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="text-xs text-gray-400">Highest Ranking</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{leaders.topRanked.name}</p>
                          {getPlayerBadges(leaders.topRanked.name).length > 0 && (
                            <span className="text-sm">{getPlayerBadges(leaders.topRanked.name).join(' ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xl font-bold">{leaders.topRanked.points} pts</span>
                  </div>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-800">
                <Link
                  href="/rankings"
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 transition-colors"
                >
                  <Award className="w-4 h-4" />
                  <span>View Full Rankings</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 3: Scoring Rules */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-gray-950 rounded-xl border border-gray-800 p-6">
            <h2 className="text-xl font-bold mb-6">How Points Work</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {[
                { icon: Star, label: 'Peer Rating', value: '×10 points', color: 'text-yellow-400', desc: 'Monthly peer ratings' },
                { icon: Goal, label: 'Goals', value: '×5 points', color: 'text-blue-400', desc: 'Goals scored' },
                { icon: Target, label: 'Assists', value: '×3 points', color: 'text-purple-400', desc: 'Assists made' },
                { icon: Shield, label: 'Saves', value: '×2 points', color: 'text-green-400', desc: 'Goalkeeper saves' },
                { icon: Trophy, label: 'Team Win', value: '×5 points', color: 'text-orange-400', desc: 'Winning team bonus' }
              ].map(({ icon: Icon, label, value, color, desc }) => (
                <div key={label} className="bg-gray-900 rounded-lg p-4 text-center">
                  <Icon className={`w-8 h-8 ${color} mx-auto mb-2`} />
                  <p className="font-bold text-lg">{value}</p>
                  <p className="text-sm text-gray-400">{label}</p>
                  <p className="text-xs text-gray-500 mt-1">{desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Trust-Based System
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Players self-report their stats honestly after each Thursday game</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Score entry unlocks every Thursday and remains open until Saturday</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>One submission per week - make sure your stats are accurate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Admin can review and correct any discrepancies if needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>Monthly awards and personal progress reports available for download</span>
                </li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-400">
                <strong>Monthly Reset:</strong> Rankings and awards reset on the last day of each month. 
                Download your personal report before the reset!
              </p>
            </div>
            
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800 rounded-lg">
              <h4 className="font-semibold mb-2 text-purple-400">🏆 Prestigious Awards</h4>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-lg">⚽️🏆</span>
                  <div>
                    <p className="font-semibold text-white">Ballon d'Or</p>
                    <p className="text-xs text-gray-400">Best overall performance every 4 months</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">👟</span>
                  <div>
                    <p className="font-semibold text-white">Golden Boot</p>
                    <p className="text-xs text-gray-400">Top scorer every 4 months</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                * Quarterly awards are permanent badges that stay with you forever!
              </p>
            </div>
          </div>
        </motion.section>

        {/* Complete Rules Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16 mb-8"
        >
          <div className="relative">
            {/* Floating effect background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-3xl" />
            
            <div className="relative bg-gradient-to-br from-gray-950/90 to-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-800 overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-8 py-6 border-b border-gray-800">
                <h2 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  📜 Thursday Football Official Rules & Guidelines
                </h2>
                <p className="text-center text-gray-400 mt-2">Everything you need to know about our league</p>
              </div>

              <div className="p-8">
                {/* Rules Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  {/* 1. Game Schedule */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-700 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Calendar className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="font-bold text-lg">Game Schedule</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li>• Games every Thursday evening</li>
                      <li>• Score entry window: Thu-Sat</li>
                      <li>• One submission per week allowed</li>
                      <li>• Late entries not accepted</li>
                    </ul>
                  </motion.div>

                  {/* 2. Scoring System */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-700 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-yellow-500/20">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                      </div>
                      <h3 className="font-bold text-lg">Point System</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li>• Peer Rating: ×10 points</li>
                      <li>• Goals: ×5 points each</li>
                      <li>• Assists: ×3 points each</li>
                      <li>• Saves: ×2 points each</li>
                      <li>• Team Win: +5 points bonus</li>
                    </ul>
                  </motion.div>

                  {/* 3. Player Ratings */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-700 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-500/20">
                        <Star className="w-6 h-6 text-purple-400" />
                      </div>
                      <h3 className="font-bold text-lg">Rating Rules</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li>• Rate all players 1-10 stars</li>
                      <li>• Ratings reset monthly</li>
                      <li>• Anonymous ratings only</li>
                      <li>• Cannot rate yourself</li>
                      <li>• Update anytime during month</li>
                    </ul>
                  </motion.div>

                  {/* 4. Monthly Awards */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-700 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <Award className="w-6 h-6 text-green-400" />
                      </div>
                      <h3 className="font-bold text-lg">Monthly Awards</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li>⚽ Top Scorer badge</li>
                      <li>🥇 Most Assists badge</li>
                      <li>🧤 Best Keeper badge</li>
                      <li>• Awards on last day of month</li>
                      <li>• Badges are permanent</li>
                    </ul>
                  </motion.div>

                  {/* 5. Quarterly Awards */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-700 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <Medal className="w-6 h-6 text-orange-400" />
                      </div>
                      <h3 className="font-bold text-lg">Quarterly Awards</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li>⚽️🏆 Ballon d'Or (Best Overall)</li>
                      <li>👟 Golden Boot (Top Scorer)</li>
                      <li>• Awarded every 4 months</li>
                      <li>• April, August, December</li>
                      <li>• Permanent legacy badges</li>
                    </ul>
                  </motion.div>

                  {/* 6. Form Status */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-700 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <Activity className="w-6 h-6 text-red-400" />
                      </div>
                      <h3 className="font-bold text-lg">Player Form</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li>✅ Fully Fit - Ready to play</li>
                      <li>⚠️ Slightly Injured - Limited</li>
                      <li>❌ Injured - Cannot play</li>
                      <li>• Update weekly with stats</li>
                      <li>• Affects team selection</li>
                    </ul>
                  </motion.div>

                  {/* 7. Trust System */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-700 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-cyan-500/20">
                        <Shield className="w-6 h-6 text-cyan-400" />
                      </div>
                      <h3 className="font-bold text-lg">Fair Play</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li>• Self-report stats honestly</li>
                      <li>• Admin reviews all entries</li>
                      <li>• False stats will be corrected</li>
                      <li>• Respect the honor system</li>
                      <li>• Build trust with teammates</li>
                    </ul>
                  </motion.div>

                  {/* 8. Data & Reports */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-700 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-indigo-500/20">
                        <Download className="w-6 h-6 text-indigo-400" />
                      </div>
                      <h3 className="font-bold text-lg">Reports</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li>• Monthly PDF reports</li>
                      <li>• Personal progress tracking</li>
                      <li>• Form status history</li>
                      <li>• Download before reset</li>
                      <li>• Stats reset monthly</li>
                    </ul>
                  </motion.div>

                  {/* 9. Important Dates */}
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-gray-700 shadow-xl"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-pink-500/20">
                        <Clock className="w-6 h-6 text-pink-400" />
                      </div>
                      <h3 className="font-bold text-lg">Key Dates</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li>• Thursday: Game day</li>
                      <li>• Thu-Sat: Score entry open</li>
                      <li>• Month end: Awards & reset</li>
                      <li>• Every 4 months: Quarterly awards</li>
                      <li>• Anytime: Update ratings</li>
                    </ul>
                  </motion.div>

                </div>

                {/* Bottom Summary Cards */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-6 border border-blue-800/50"
                  >
                    <h4 className="font-bold text-lg mb-3 text-blue-400">🎯 Quick Summary</h4>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Play every Thursday, submit your stats within 3 days, rate your teammates honestly, 
                      and compete for monthly and quarterly awards. All stats reset monthly but your badges 
                      are permanent. Download your report before month end!
                    </p>
                  </motion.div>

                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 rounded-2xl p-6 border border-green-800/50"
                  >
                    <h4 className="font-bold text-lg mb-3 text-green-400">💡 Pro Tips</h4>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Submit stats early on Thursday for accuracy. Update your form status to help with 
                      team selection. Rate players fairly to improve team balance. Check rankings regularly 
                      to track your progress toward awards!
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Admin Access Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center pb-8"
        >
          <Link
            href="/login?admin=true"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 transition-all shadow-2xl shadow-orange-500/25"
          >
            <UserCog className="w-6 h-6" />
            <span className="text-lg font-bold">Admin Access</span>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}