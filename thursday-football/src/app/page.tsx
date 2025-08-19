'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/auth'
import { TEAM_MEMBERS } from '@/lib/auth'
import { getPlayerBadges } from '@/lib/awards'
import { RealTimeEvents } from '@/lib/realtime'
import PlayerProfileCarousel from '@/components/PlayerProfileCarousel'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Star, Target, Shield, LogIn, UserCog, 
  Goal, Users, Award, TrendingUp, Calendar,
  Lock, Unlock, Clock, Download, CheckCircle,
  Medal, Activity, Sparkles, Zap, Shuffle
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

interface GameInfo {
  date: string
  opponent: string
  result?: string
  score?: string
}

interface TeamGeneratorProps {
  players: string[]
  teamSize: 5 | 6
}

interface BalancedTeam {
  teamA: { players: string[], avgRating: number, totalPoints: number }
  teamB: { players: string[], avgRating: number, totalPoints: number }
  balanceScore: number
  generatedAt: string
}

interface PlayerWithStats {
  name: string
  rating: number
  totalRatings: number
  formStatus: 'fully_fit' | 'slightly_injured' | 'injured'
  points: number
}

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [playerRatings, setPlayerRatings] = useState<PlayerRating[]>([])
  const [userRatings, setUserRatings] = useState<{[key: string]: number}>({})
  const [hasRated, setHasRated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<string>('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [leaders, setLeaders] = useState<LeaderStats | null>(null)
  const [isThursdayUnlocked, setIsThursdayUnlocked] = useState(false)
  const [timeUntilThursday, setTimeUntilThursday] = useState('')
  const [showRatingSuccess, setShowRatingSuccess] = useState(false)
  const [showMonthlyRatingPopup, setShowMonthlyRatingPopup] = useState(false)
  const [previousGames, setPreviousGames] = useState<GameInfo[]>([])
  const [nextGame, setNextGame] = useState<GameInfo | null>(null)
  const [showTeamGenerator, setShowTeamGenerator] = useState(false)
  const [availablePlayers, setAvailablePlayers] = useState<string[]>(TEAM_MEMBERS)
  const [teamSize, setTeamSize] = useState<5 | 6>(5)
  const [generatedTeams, setGeneratedTeams] = useState<{teamA: string[], teamB: string[]} | null>(null)
  const [monthlyBalancedTeams, setMonthlyBalancedTeams] = useState<BalancedTeam | null>(null)
  const [playersWithStats, setPlayersWithStats] = useState<PlayerWithStats[]>([])
  const [countdownTime, setCountdownTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    checkAuthAndLoadData()
    checkThursdayStatus()
    loadLeaders()
    loadGameData()
    checkMonthlyRatingStatus()
    
    // Load player stats first, then generate teams
    setTimeout(() => {
      loadPlayersWithStats()
      setTimeout(() => {
        generateMonthlyBalancedTeams()
      }, 100)
    }, 100)
    
    // Check if user has already rated
    const existingRatings = localStorage.getItem('userPlayerRatings')
    if (existingRatings) {
      setUserRatings(JSON.parse(existingRatings))
      setHasRated(true)
    }

    // Listen for real-time updates from other components
    const handleRealTimeUpdates = (event: CustomEvent) => {
      console.log('Real-time update received:', event.detail)
      loadLeaders()
      loadPlayerRatings()
      loadPlayersWithStats()
      generateMonthlyBalancedTeams()
    }
    
    const handlePlayerStatsUpdate = (event: CustomEvent) => {
      console.log('Player stats updated:', event.detail)
      loadLeaders()
      loadPlayersWithStats()
      generateMonthlyBalancedTeams()
    }
    
    // Set up event listeners for real-time updates
    window.addEventListener('ratingsUpdated', handleRealTimeUpdates as EventListener)
    window.addEventListener('playerStatsUpdated', handlePlayerStatsUpdate as EventListener)
    window.addEventListener('dataUpdated', handleRealTimeUpdates as EventListener)

    // Update Thursday status every minute  
    const statusInterval = setInterval(checkThursdayStatus, 60000)
    
    // Update countdown every second for accurate timing
    const updateCountdown = () => {
      const now = new Date()
      const nextThursday = getNextThursday()
      
      // Set time to 8:00 PM Bahrain time (UTC+3)
      const bahrainOffset = 3 * 60 // Bahrain is UTC+3 (3 hours * 60 minutes)
      const localOffset = now.getTimezoneOffset() // Local timezone offset in minutes
      const timezoneDifference = bahrainOffset + localOffset // Total difference
      
      // Set to 8:00 PM and adjust for timezone
      nextThursday.setHours(20, 0, 0, 0) // 8:00 PM
      nextThursday.setMinutes(nextThursday.getMinutes() - timezoneDifference)
      
      const timeDiff = nextThursday.getTime() - now.getTime()
      
      if (timeDiff > 0) {
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)
        
        setCountdownTime({ days, hours, minutes, seconds })
      } else {
        setCountdownTime({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }
    
    // Update countdown immediately and then every second
    updateCountdown()
    const countdownInterval = setInterval(updateCountdown, 1000)
    
    return () => {
      clearInterval(statusInterval)
      clearInterval(countdownInterval)
      window.removeEventListener('ratingsUpdated', handleRealTimeUpdates as EventListener)
      window.removeEventListener('playerStatsUpdated', handlePlayerStatsUpdate as EventListener)
      window.removeEventListener('dataUpdated', handleRealTimeUpdates as EventListener)
    }
  }, [])

  const checkAuthAndLoadData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      // Set current user 
      const userEmail = session.user?.email || ''
      const userName = userEmail.split('@')[0] || 'Player'
      const displayName = userName.charAt(0).toUpperCase() + userName.slice(1)
      const actualPlayerName = TEAM_MEMBERS.find(name => 
        name.toLowerCase() === displayName.toLowerCase()
      ) || displayName
      setCurrentUser(actualPlayerName)
      
      // Don't redirect, allow viewing homepage with profile editing
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
    const nextThursday = new Date()
    
    // Find next Thursday
    const daysUntilThursday = (4 - now.getDay() + 7) % 7 || 7
    nextThursday.setDate(now.getDate() + daysUntilThursday)
    
    setIsThursdayUnlocked(true) // Always unlocked now
    setTimeUntilThursday('🔓 Always Open!')
  }

  const handleRatingChange = (playerName: string, rating: number) => {
    setUserRatings(prev => ({
      ...prev,
      [playerName]: rating
    }))
  }

  const loadGameData = () => {
    // Sample game data - replace with real data from Supabase
    const samplePreviousGames: GameInfo[] = [
      { date: '2025-08-12', opponent: 'Team A vs Team B', result: 'Win', score: '5-3' },
      { date: '2025-08-05', opponent: 'Team C vs Team D', result: 'Loss', score: '2-4' },
      { date: '2025-07-29', opponent: 'Team E vs Team F', result: 'Win', score: '6-1' }
    ]
    
    // Calculate next Thursday
    const nextThursday = getNextThursday()
    const sampleNextGame: GameInfo = {
      date: nextThursday.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      opponent: 'Weekly Match'
    }
    
    setPreviousGames(samplePreviousGames)
    setNextGame(sampleNextGame)
  }

  const getNextThursday = () => {
    const today = new Date()
    const daysUntilThursday = (4 - today.getDay() + 7) % 7
    const nextThursday = new Date(today)
    
    if (daysUntilThursday === 0) {
      // If today is Thursday, get next Thursday
      nextThursday.setDate(today.getDate() + 7)
    } else {
      nextThursday.setDate(today.getDate() + daysUntilThursday)
    }
    
    return nextThursday
  }

  const checkMonthlyRatingStatus = () => {
    const now = new Date()
    const dayOfMonth = now.getDate()
    
    // Show popup for first 7 days of each month
    if (dayOfMonth <= 7 && !hasRated) {
      setShowMonthlyRatingPopup(true)
    }
  }

  const loadPlayersWithStats = () => {
    const storedRatings = localStorage.getItem('allPlayerRatings')
    const ratings = storedRatings ? JSON.parse(storedRatings) : {}
    
    const matchData = localStorage.getItem('matchData')
    const matches = matchData ? JSON.parse(matchData) : {}
    
    const players: PlayerWithStats[] = TEAM_MEMBERS.map(name => {
      const playerRatings = ratings[name] || []
      const avgRating = playerRatings.length > 0 
        ? playerRatings.reduce((a: number, b: number) => a + b, 0) / playerRatings.length
        : 5.0
      
      const playerMatches = matches[name] || {}
      const points = calculatePoints({
        rating: avgRating,
        goals: playerMatches.goals || 0,
        assists: playerMatches.assists || 0,
        saves: playerMatches.saves || 0,
        wins: playerMatches.wins || 0
      })
      
      return {
        name,
        rating: Math.round(avgRating * 10) / 10,
        totalRatings: playerRatings.length,
        formStatus: 'fully_fit', // Default, could be loaded from storage
        points
      }
    })
    
    setPlayersWithStats(players)
  }

  const generateBalancedTeams = (players: PlayerWithStats[], size: 5 | 6): BalancedTeam => {
    // Filter available players (not injured)
    const availablePlayers = players.filter(p => p.formStatus !== 'injured')
    
    // Sort by rating + points for better balancing
    const sortedPlayers = [...availablePlayers].sort((a, b) => 
      (b.rating + b.points/10) - (a.rating + a.points/10)
    )
    
    let bestBalance: BalancedTeam = {
      teamA: { players: [], avgRating: 0, totalPoints: 0 },
      teamB: { players: [], avgRating: 0, totalPoints: 0 },
      balanceScore: Infinity,
      generatedAt: new Date().toISOString()
    }
    
    // Try multiple combinations to find best balance
    for (let attempt = 0; attempt < 1000; attempt++) {
      const shuffled = [...sortedPlayers].sort(() => Math.random() - 0.5)
      const teamA = shuffled.slice(0, size)
      const teamB = shuffled.slice(size, size * 2)
      
      if (teamA.length < size || teamB.length < size) continue
      
      const teamAAvgRating = teamA.reduce((sum, p) => sum + p.rating, 0) / teamA.length
      const teamBAvgRating = teamB.reduce((sum, p) => sum + p.rating, 0) / teamB.length
      const teamATotalPoints = teamA.reduce((sum, p) => sum + p.points, 0)
      const teamBTotalPoints = teamB.reduce((sum, p) => sum + p.points, 0)
      
      // Balance score: lower is better (closer ratings + closer points)
      const ratingDiff = Math.abs(teamAAvgRating - teamBAvgRating)
      const pointsDiff = Math.abs(teamATotalPoints - teamBTotalPoints) / 100 // Scale down points
      const balanceScore = ratingDiff + pointsDiff
      
      if (balanceScore < bestBalance.balanceScore) {
        bestBalance = {
          teamA: { 
            players: teamA.map(p => p.name), 
            avgRating: Math.round(teamAAvgRating * 10) / 10,
            totalPoints: teamATotalPoints
          },
          teamB: { 
            players: teamB.map(p => p.name), 
            avgRating: Math.round(teamBAvgRating * 10) / 10,
            totalPoints: teamBTotalPoints
          },
          balanceScore: Math.round(balanceScore * 100) / 100,
          generatedAt: new Date().toISOString()
        }
      }
    }
    
    return bestBalance
  }

  const generateMonthlyBalancedTeams = () => {
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const storedTeams = localStorage.getItem('monthlyBalancedTeams')
    
    if (storedTeams) {
      const parsed = JSON.parse(storedTeams)
      if (parsed.month === currentMonth) {
        setMonthlyBalancedTeams(parsed.teams)
        return
      }
    }
    
    // Generate new monthly balanced teams
    if (playersWithStats.length >= 10) {
      const balancedTeams = generateBalancedTeams(playersWithStats, 5)
      setMonthlyBalancedTeams(balancedTeams)
      
      // Store for the month
      localStorage.setItem('monthlyBalancedTeams', JSON.stringify({
        month: currentMonth,
        teams: balancedTeams
      }))
    }
  }

  const generateTeams = () => {
    if (playersWithStats.length >= teamSize * 2) {
      const balancedTeams = generateBalancedTeams(playersWithStats, teamSize)
      setGeneratedTeams({ 
        teamA: balancedTeams.teamA.players, 
        teamB: balancedTeams.teamB.players 
      })
    } else {
      // Fallback to simple shuffle if not enough data
      const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5)
      const playersPerTeam = teamSize
      
      const teamA = shuffled.slice(0, playersPerTeam)
      const teamB = shuffled.slice(playersPerTeam, playersPerTeam * 2)
      
      setGeneratedTeams({ teamA, teamB })
    }
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
    setShowMonthlyRatingPopup(false)
    loadPlayerRatings()
    loadLeaders() // Update leaders and rankings in real-time
    loadPlayersWithStats()
    generateMonthlyBalancedTeams() // Regenerate balanced teams with new ratings
    
    setTimeout(() => {
      setShowRatingSuccess(false)
    }, 3000)
    
    // Dispatch comprehensive update events using centralized system
    RealTimeEvents.dispatchRatingUpdate('homepage', Object.keys(userRatings).length)
    RealTimeEvents.getInstance().dispatch('dataUpdated', 'homepage', { 
      type: 'ratings', 
      ratingsCount: Object.keys(userRatings).length 
    })
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
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                  scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
                className="relative"
              >
                <div className="absolute inset-0 bg-white/20 rounded-full blur-2xl animate-pulse" />
                <div className="text-8xl relative z-10 drop-shadow-2xl">⚽</div>
              </motion.div>
            </div>
            <motion.h1 
              className="text-8xl md:text-9xl font-black bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400 bg-clip-text text-transparent animate-gradient-flow drop-shadow-2xl"
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ duration: 6, repeat: Infinity }}
            >
              Thursday Football
            </motion.h1>
            <motion.p 
              className="text-2xl bg-gradient-to-r from-gray-400 to-gray-200 bg-clip-text text-transparent mt-6 font-semibold"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Elite Competition League
            </motion.p>
            
            {/* Status */}
            <motion.div 
              className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-black/60 backdrop-blur-xl border border-green-400/30"
              whileHover={{ scale: 1.05 }}
              animate={{ boxShadow: ['0 0 0 rgba(34, 197, 94, 0)', '0 0 20px rgba(34, 197, 94, 0.3)', '0 0 0 rgba(34, 197, 94, 0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Unlock className="w-6 h-6 text-green-400" />
              </motion.div>
              <span className="text-lg font-semibold text-green-400">{timeUntilThursday}</span>
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* Next Game Banner - Top Priority Display */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, type: "spring", bounce: 0.4 }}
        className="relative z-20 -mt-16 mb-16"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
            <div className="relative bg-gradient-to-r from-green-600/30 to-emerald-600/30 backdrop-blur-xl rounded-3xl border border-green-400/30 p-8 text-center overflow-hidden">
              {/* Floating Animation Background */}
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute top-2 right-2 w-16 h-16 bg-green-400/20 rounded-full blur-xl"
                />
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.15, 0.1]
                  }}
                  transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                  className="absolute bottom-2 left-2 w-20 h-20 bg-emerald-400/20 rounded-full blur-xl"
                />
              </div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                    }}
                  >
                    <Calendar className="w-12 h-12 text-green-400 drop-shadow-glow" />
                  </motion.div>
                  <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Next Game
                  </h2>
                </div>
                
                <div className="space-y-4">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <p className="text-3xl md:text-4xl font-black text-white mb-2">
                      {nextGame?.date || getNextThursday().toLocaleDateString('en-US', { 
                        weekday: 'long',
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </motion.div>
                  
                  <div className="flex items-center justify-center gap-6">
                    <motion.div 
                      className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/40 border border-green-400/30"
                      whileHover={{ scale: 1.05 }}
                      animate={{ 
                        boxShadow: [
                          '0 0 0 rgba(34, 197, 94, 0)', 
                          '0 0 20px rgba(34, 197, 94, 0.4)', 
                          '0 0 0 rgba(34, 197, 94, 0)'
                        ] 
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <Clock className="w-6 h-6 text-green-400" />
                      <span className="text-2xl font-bold text-green-400">8:00 PM</span>
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/40 border border-emerald-400/30"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Trophy className="w-6 h-6 text-emerald-400" />
                      <span className="text-xl font-semibold text-emerald-400">Weekly Match</span>
                    </motion.div>
                  </div>
                  
                  {/* Countdown Timer - Accurate to 8pm Bahrain Time */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-6"
                  >
                    <p className="text-lg text-gray-300 mb-2">Time until next game:</p>
                    <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                      {[
                        { unit: 'Days', value: countdownTime.days },
                        { unit: 'Hours', value: countdownTime.hours },
                        { unit: 'Mins', value: countdownTime.minutes },
                        { unit: 'Secs', value: countdownTime.seconds }
                      ].map(({ unit, value }, index) => (
                        <div key={unit} className="bg-black/60 rounded-xl p-3 border border-green-400/20">
                          <motion.p 
                            className="text-2xl font-bold text-white"
                            key={value} // Re-animate when value changes
                            initial={{ scale: 1.2, opacity: 0.8 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {value.toString().padStart(2, '0')}
                          </motion.p>
                          <p className="text-xs text-gray-400 uppercase tracking-wide">{unit}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-gray-400 mt-3 text-center">
                      🇧🇭 Countdown to 8:00 PM Bahrain Time
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="space-y-16 md:space-y-24 lg:space-y-32">
        {/* Monthly Rating Popup */}
        <AnimatePresence>
          {showMonthlyRatingPopup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl rounded-3xl border border-white/20 p-8 max-w-md w-full text-center"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-6"
                >
                  <Star className="w-16 h-16 text-yellow-400 mx-auto" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Monthly Rating Time!
                </h3>
                <p className="text-gray-300 mb-6 text-lg">
                  It's the beginning of the month. Please rate all players to help balance teams fairly.
                </p>
                <div className="flex gap-4">
                  <motion.button
                    onClick={() => setShowMonthlyRatingPopup(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-gray-600 hover:bg-gray-700 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Later
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowMonthlyRatingPopup(false)
                      document.getElementById('rating-section')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Rate Now
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Section 1: Player Profile Carousel */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-16 md:mt-20 lg:mt-24"
        >
          <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
            <PlayerProfileCarousel currentUserName={currentUser} />
            <div className="text-center mt-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/rankings"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all text-lg font-semibold"
                >
                  <Trophy className="w-6 h-6" />
                  View All Rankings
                </Link>
                {currentUser && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all text-lg font-semibold"
                  >
                    <UserCog className="w-6 h-6" />
                    My Dashboard
                  </Link>
                )}
              </div>
              {currentUser && (
                <p className="text-sm text-gray-400">
                  Welcome back, {currentUser}! Click on your profile card to edit your info.
                </p>
              )}
            </div>
          </div>
        </motion.section>

        {/* Section 2: Games & Team Generator */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-24 md:mt-32 lg:mt-40"
        >
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Previous & Next Games */}
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                📅 Game Schedule
              </h2>
              
              <div className="space-y-6">
                {/* Next Game */}
                <div className="bg-black/40 rounded-2xl p-6 border border-green-400/20">
                  <h3 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Next Game
                  </h3>
                  {nextGame && (
                    <div>
                      <p className="text-lg font-semibold text-white">{nextGame.date}</p>
                      <p className="text-gray-400">{nextGame.opponent}</p>
                    </div>
                  )}
                </div>
                
                {/* Previous Games */}
                <div className="bg-black/40 rounded-2xl p-6 border border-blue-400/20">
                  <h3 className="text-xl font-bold mb-4 text-blue-400 flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    Recent Games
                  </h3>
                  <div className="space-y-3">
                    {previousGames.map((game, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{game.date}</p>
                          <p className="text-gray-500 text-sm">{game.opponent}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            game.result === 'Win' ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
                          }`}>
                            {game.result}
                          </span>
                          <p className="text-gray-400 text-sm mt-1">{game.score}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Team Generator */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                ⚽ Team Generator
              </h2>
              
              <div className="space-y-6">
                {/* Team Size Selector */}
                <div>
                  <label className="block text-lg font-semibold text-gray-300 mb-3">Team Size</label>
                  <div className="flex gap-4">
                    {[5, 6].map((size) => (
                      <motion.button
                        key={size}
                        onClick={() => setTeamSize(size as 5 | 6)}
                        className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                          teamSize === size
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                            : 'bg-black/40 text-gray-400 hover:text-white border border-white/10'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {size}v{size}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Player Selection Grid */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-lg font-semibold text-gray-300">Select Available Players</label>
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setAvailablePlayers(TEAM_MEMBERS)}
                        className="px-3 py-1 rounded-lg bg-green-600/20 text-green-400 text-sm hover:bg-green-600/30 transition-all"
                        whileHover={{ scale: 1.05 }}
                      >
                        Select All
                      </motion.button>
                      <motion.button
                        onClick={() => setAvailablePlayers([])}
                        className="px-3 py-1 rounded-lg bg-red-600/20 text-red-400 text-sm hover:bg-red-600/30 transition-all"
                        whileHover={{ scale: 1.05 }}
                      >
                        Clear All
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                    {TEAM_MEMBERS.map((player, index) => {
                      const isSelected = availablePlayers.includes(player)
                      const playerStats = playersWithStats.find(p => p.name === player)
                      const playerBadges = getPlayerBadges(player)
                      
                      return (
                        <motion.button
                          key={player}
                          onClick={() => {
                            if (isSelected) {
                              setAvailablePlayers(prev => prev.filter(p => p !== player))
                            } else {
                              setAvailablePlayers(prev => [...prev, player])
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all text-left ${
                            isSelected
                              ? 'bg-green-600/20 border-green-400/50 text-white'
                              : 'bg-black/40 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold">{player}</div>
                              {playerStats && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                  <span className="text-xs text-gray-400">{playerStats.rating}</span>
                                </div>
                              )}
                              {playerBadges.length > 0 && (
                                <div className="text-xs mt-1">{playerBadges.join(' ')}</div>
                              )}
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                              isSelected 
                                ? 'bg-green-400 border-green-400' 
                                : 'border-gray-400'
                            }`}>
                              {isSelected && (
                                <CheckCircle className="w-3 h-3 text-white m-0.5" />
                              )}
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Available Players Count */}
                <div className="text-center">
                  <p className="text-gray-400 mb-2">Selected Players</p>
                  <p className="text-3xl font-bold text-white">{availablePlayers.length}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Need {teamSize * 2} players minimum for {teamSize}v{teamSize}
                  </p>
                </div>

                {/* Generate Button */}
                <motion.button
                  onClick={generateTeams}
                  disabled={availablePlayers.length < teamSize * 2}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Shuffle className="w-6 h-6 inline mr-2" />
                  Generate Teams ({availablePlayers.length} players)
                </motion.button>

                {/* Generated Teams Display */}
                {generatedTeams && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="mt-6 space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-6">
                      <motion.div 
                        className="relative group"
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-blue-600/20 rounded-xl p-6 border border-blue-400/30 backdrop-blur-sm">
                          <h4 className="text-xl font-bold text-blue-400 mb-4 text-center flex items-center justify-center gap-2">
                            <Trophy className="w-6 h-6" />
                            Team A
                          </h4>
                          <div className="space-y-3">
                            {generatedTeams.teamA.map((player, index) => (
                              <motion.div 
                                key={index} 
                                className="text-white text-center font-medium py-2 px-3 rounded-lg bg-black/30"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                              >
                                {player}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="relative group"
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="absolute inset-0 bg-red-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative bg-red-600/20 rounded-xl p-6 border border-red-400/30 backdrop-blur-sm">
                          <h4 className="text-xl font-bold text-red-400 mb-4 text-center flex items-center justify-center gap-2">
                            <Trophy className="w-6 h-6" />
                            Team B
                          </h4>
                          <div className="space-y-3">
                            {generatedTeams.teamB.map((player, index) => (
                              <motion.div 
                                key={index} 
                                className="text-white text-center font-medium py-2 px-3 rounded-lg bg-black/30"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                              >
                                {player}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 3: Player Ratings Table - Centered */}
        <motion.section 
          id="rating-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-black/60 px-8 py-8 border-b border-white/10">
              <h2 className="text-5xl font-bold text-center bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-4">⭐ Rate All Players</h2>
              <p className="text-gray-300 text-center text-xl">
                {hasRated ? '✅ Ratings submitted! You can update anytime.' : 'Rate each player from 1-10 stars'}
              </p>
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-400/20 text-green-400 text-lg font-semibold">
                  <Unlock className="w-5 h-5" />
                  Rating Always Available
                </span>
              </div>
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
                    <th className="px-2 sm:px-4 md:px-8 py-6 text-left text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent uppercase tracking-wider">Player</th>
                    <th className="px-2 sm:px-4 md:px-8 py-6 text-center text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent uppercase tracking-wider">Avg Rating</th>
                    <th className="px-2 sm:px-4 md:px-8 py-6 text-center text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent uppercase tracking-wider">Your Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {playerRatings.map((player) => (
                    <motion.tr 
                      key={player.name} 
                      className="hover:bg-white/5 transition-all"
                      whileHover={{ scale: 1.01 }}
                    >
                      <td className="px-2 sm:px-4 md:px-8 py-7">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="text-lg sm:text-xl font-semibold text-white">{player.name}</div>
                            <div className="text-sm sm:text-base text-gray-500">{player.totalRatings} ratings</div>
                          </div>
                          {getPlayerBadges(player.name).length > 0 && (
                            <span className="text-xl animate-pulse">{getPlayerBadges(player.name).join(' ')}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 md:px-8 py-7 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-yellow-400 fill-yellow-400" />
                          <span className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-400">{player.rating}</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 md:px-8 py-7">
                        <div className="flex items-center justify-center gap-0.5 sm:gap-1 overflow-x-visible">
                          <div className="flex items-center gap-0.5 sm:gap-1 flex-wrap sm:flex-nowrap justify-center">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                              <motion.button
                                key={rating}
                                onClick={() => handleRatingChange(player.name, rating)}
                                className="group p-0.5 sm:p-1 flex-shrink-0"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Star
                                  className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 transition-all ${
                                    rating <= (userRatings[player.name] || 0)
                                      ? 'text-yellow-400 fill-yellow-400 drop-shadow-glow'
                                      : 'text-gray-600 hover:text-yellow-400'
                                  }`}
                                />
                              </motion.button>
                            ))}
                          </div>
                          <span className="ml-2 sm:ml-4 text-lg sm:text-xl md:text-2xl font-bold text-yellow-400 w-8 sm:w-12 flex-shrink-0">
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

        {/* Section 4: Monthly Balanced Teams */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-24 md:mt-32 lg:mt-40"
        >
          <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-12">
            <h2 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              🏆 Monthly Fair Teams
            </h2>
            <p className="text-center text-gray-300 text-xl mb-8">
              AI-balanced teams based on player ratings, stats, and form status
            </p>
            
            {monthlyBalancedTeams ? (
              <div className="space-y-8">
                {/* Balance Metrics */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-6 px-8 py-4 rounded-2xl bg-black/40 border border-emerald-400/30">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Balance Score</p>
                      <p className="text-2xl font-bold text-emerald-400">{monthlyBalancedTeams.balanceScore}</p>
                      <p className="text-xs text-gray-500">Lower = Better</p>
                    </div>
                    <div className="h-8 w-px bg-gray-600"></div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Generated</p>
                      <p className="text-lg font-semibold text-white">
                        {new Date(monthlyBalancedTeams.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Balanced Teams Display */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Team A */}
                  <motion.div 
                    className="relative group"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-blue-600/30 to-cyan-600/30 backdrop-blur-xl rounded-2xl border border-blue-400/30 p-8">
                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          >
                            <Trophy className="w-8 h-8 text-blue-400" />
                          </motion.div>
                          <h3 className="text-3xl font-bold text-blue-400">Team A</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-black/40 rounded-xl p-3">
                            <p className="text-sm text-gray-400">Avg Rating</p>
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <p className="text-xl font-bold text-white">{monthlyBalancedTeams.teamA.avgRating}</p>
                            </div>
                          </div>
                          <div className="bg-black/40 rounded-xl p-3">
                            <p className="text-sm text-gray-400">Total Points</p>
                            <p className="text-xl font-bold text-white">{monthlyBalancedTeams.teamA.totalPoints}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {monthlyBalancedTeams.teamA.players.map((player, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-blue-400/20"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-white">{player}</span>
                              {getPlayerBadges(player).length > 0 && (
                                <span className="text-sm">{getPlayerBadges(player).join(' ')}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-medium text-gray-300">
                                {playersWithStats.find(p => p.name === player)?.rating || 5.0}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Team B */}
                  <motion.div 
                    className="relative group"
                    whileHover={{ scale: 1.03 }}
                  >
                    <div className="absolute inset-0 bg-red-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative bg-gradient-to-br from-red-600/30 to-pink-600/30 backdrop-blur-xl rounded-2xl border border-red-400/30 p-8">
                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <motion.div
                            animate={{ rotate: [360, 0] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          >
                            <Trophy className="w-8 h-8 text-red-400" />
                          </motion.div>
                          <h3 className="text-3xl font-bold text-red-400">Team B</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-black/40 rounded-xl p-3">
                            <p className="text-sm text-gray-400">Avg Rating</p>
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <p className="text-xl font-bold text-white">{monthlyBalancedTeams.teamB.avgRating}</p>
                            </div>
                          </div>
                          <div className="bg-black/40 rounded-xl p-3">
                            <p className="text-sm text-gray-400">Total Points</p>
                            <p className="text-xl font-bold text-white">{monthlyBalancedTeams.teamB.totalPoints}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {monthlyBalancedTeams.teamB.players.map((player, index) => (
                          <motion.div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-red-400/20"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-white">{player}</span>
                              {getPlayerBadges(player).length > 0 && (
                                <span className="text-sm">{getPlayerBadges(player).join(' ')}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm font-medium text-gray-300">
                                {playersWithStats.find(p => p.name === player)?.rating || 5.0}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Regenerate Button */}
                <div className="text-center">
                  <motion.button
                    onClick={generateMonthlyBalancedTeams}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold text-lg flex items-center gap-3 mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Shuffle className="w-6 h-6" />
                    Regenerate Fair Teams
                  </motion.button>
                  <p className="text-sm text-gray-400 mt-3">
                    Teams regenerate automatically each month based on updated ratings
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-4"
                >
                  <Shuffle className="w-16 h-16 text-emerald-400 mx-auto" />
                </motion.div>
                <p className="text-xl text-gray-400 mb-6">Generating balanced teams...</p>
                <p className="text-sm text-gray-500">Need more player ratings to create fair teams</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* Section 5: Login and Leaders - Side by Side with Space */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-24 md:mt-32 lg:mt-40"
        >
          <div className="grid md:grid-cols-2 gap-20">
            {/* Login Form */}
            <motion.div 
              className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-10"
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
              className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-10"
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

        {/* Section 5: How Points Work - More Space and Visual */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-24 md:mt-32 lg:mt-40"
        >
          <div className="bg-gradient-to-br from-violet-900/20 to-purple-900/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-12">
            <h2 className="text-4xl font-bold mb-10 text-center bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">⚡ How Points Work</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
              {[
                { icon: Star, label: 'Peer Rating', value: '×10', color: 'from-yellow-400 to-orange-500', desc: 'Monthly ratings' },
                { icon: Goal, label: 'Goals', value: '×5', color: 'from-blue-400 to-cyan-500', desc: 'Goals scored' },
                { icon: Target, label: 'Assists', value: '×3', color: 'from-purple-400 to-pink-500', desc: 'Assists made' },
                { icon: Shield, label: 'Saves', value: '×2', color: 'from-green-400 to-emerald-500', desc: 'Keeper saves' },
                { icon: Trophy, label: 'Team Win', value: '×5', color: 'from-orange-400 to-red-500', desc: 'Victory bonus' }
              ].map(({ icon: Icon, label, value, color, desc }, index) => (
                <motion.div 
                  key={label} 
                  className="relative group"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -10 }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl blur-xl opacity-20 group-hover:opacity-50 transition-all duration-300`} />
                  <div className={`relative bg-gradient-to-br ${color} p-0.5 rounded-2xl overflow-hidden`}>
                    <div className="bg-black rounded-2xl p-6 text-center h-full relative">
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      >
                        <Icon className="w-12 h-12 mx-auto mb-3" />
                      </motion.div>
                      <motion.p 
                        className="text-3xl font-black mb-2"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      >
                        {value}
                      </motion.p>
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

        {/* Section 6: Rules Section - Comprehensive and Beautiful */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-24 md:mt-32 lg:mt-40"
        >
          <div className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-12">
            <h2 className="text-5xl font-bold mb-16 text-center bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">📋 League Rules & Guidelines</h2>
            
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
                    <h3 className="text-2xl font-bold mb-6 text-white">{title}</h3>
                    <ul className="space-y-3">
                      {rules.map((rule, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <span className="text-cyan-400 mt-1 text-lg">•</span>
                          <span className="text-base text-gray-300 leading-relaxed">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-16 p-8 bg-black/60 rounded-3xl border border-white/10">
              <p className="text-center text-xl leading-relaxed">
                <span className="font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent text-2xl">Important:</span>
                <span className="text-gray-300 block mt-2"> All players must maintain good sportsmanship. 
                The league is based on trust and honest reporting. Enjoy the competition and have fun! ⚽</span>
              </p>
            </div>
          </div>
        </motion.section>

        {/* Section 7: Admin Access Button - Big and Centered */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-24 md:mt-32 lg:mt-40"
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