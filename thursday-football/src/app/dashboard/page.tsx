'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, TEAM_MEMBERS } from '@/lib/auth'
import { getPlayerBadges, awardMonthlyBadge, awardBallonDor, awardGoldenBoot, shouldAwardQuarterly, calculateBallonDor, calculateGoldenBoot } from '@/lib/awards'
import { RealTimeEvents } from '@/lib/realtime'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, Target, Shield, Activity, TrendingUp, Users, 
  Calendar, Award, BarChart3, Plus, ChevronRight, LogOut,
  Goal, HandHelping, ShieldCheck, Lock, Unlock, Clock,
  CheckCircle, AlertCircle, XCircle, Download, FileText,
  User, Upload, Camera, Edit3, Save, X
} from 'lucide-react'
import Link from 'next/link'

interface UserData {
  display_name: string
  team: string
  isAdmin?: boolean
}

interface MatchStats {
  goals: number
  assists: number
  saves: number
  wins: number
  losses: number
  gamesPlayed: number
}

interface WeeklySubmission {
  week: string
  goals: number
  assists: number
  saves: number
  teamWon: boolean
  formStatus: 'fully_fit' | 'slightly_injured' | 'injured'
  submittedAt: Date
}

interface MonthlyAwards {
  topScorer?: string
  topAssists?: string
  topKeeper?: string
  month: string
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
  const [formStatus, setFormStatus] = useState<'fully_fit' | 'slightly_injured' | 'injured'>('fully_fit')
  const [isThursdayUnlocked, setIsThursdayUnlocked] = useState(false)
  const [hasSubmittedThisWeek, setHasSubmittedThisWeek] = useState(false)
  const [timeUntilThursday, setTimeUntilThursday] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [monthlyAwards, setMonthlyAwards] = useState<MonthlyAwards | null>(null)
  const [playerBadges, setPlayerBadges] = useState<string[]>([])
  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [profileImage, setProfileImage] = useState<string>('')
  const [profileData, setProfileData] = useState({
    age: 25,
    height: '5.8 FT',
    weight: '70KG',
    position: 'MIDFIELDER',
    shirtNumber: 1,
    attributes: ['PASSING', 'VISION', 'CREATING ASSISTS']
  })

  useEffect(() => {
    checkUser()
    checkThursdayStatus()
    loadMonthlyAwards()
    checkMonthlyReset()
    
    const interval = setInterval(checkThursdayStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (user) {
      loadMatchStats()
      checkWeeklySubmission()
      loadPlayerBadges()
      loadProfileData()
    }
  }, [user])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    const userEmail = session.user?.email || ''
    const userName = userEmail.split('@')[0] || 'Player'
    const displayName = userName.charAt(0).toUpperCase() + userName.slice(1)
    
    // Check if admin
    const isAdmin = userEmail === 'admin@thursdayfootball.com'
    
    // Find matching TEAM_MEMBERS name
    const actualPlayerName = TEAM_MEMBERS.find(name => 
      name.toLowerCase() === displayName.toLowerCase()
    ) || displayName
    
    setUser({
      display_name: actualPlayerName,
      team: 'Thursday FC',
      isAdmin
    })
    
    setLoading(false)
  }

  const checkMonthlyReset = () => {
    const now = new Date()
    const lastReset = localStorage.getItem('lastMonthlyReset')
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`
    
    if (lastReset !== currentMonth) {
      // Before resetting, save monthly awards
      saveMonthlyAwards()
      
      // Check if it's time for quarterly awards (every 4 months)
      if (shouldAwardQuarterly()) {
        saveQuarterlyAwards()
      }
      
      // It's a new month, reset ratings and scores
      localStorage.setItem('lastMonthlyReset', currentMonth)
      localStorage.removeItem('playerRatings')
      localStorage.removeItem('matchData')
      localStorage.removeItem('weeklySubmissions')
      localStorage.setItem('allPlayerRatings', JSON.stringify({}))
    }
  }
  
  const saveMonthlyAwards = () => {
    const matchData = localStorage.getItem('matchData')
    if (!matchData) return
    
    const matches = JSON.parse(matchData)
    const playerStats = TEAM_MEMBERS.map(name => ({
      name,
      goals: matches[name]?.goals || 0,
      assists: matches[name]?.assists || 0,
      saves: matches[name]?.saves || 0
    }))
    
    // Find monthly winners
    const topScorer = [...playerStats].sort((a, b) => b.goals - a.goals)[0]
    const topAssists = [...playerStats].sort((a, b) => b.assists - a.assists)[0]
    const topKeeper = [...playerStats].sort((a, b) => b.saves - a.saves)[0]
    
    // Award permanent monthly badges
    if (topScorer && topScorer.goals > 0) {
      awardMonthlyBadge(topScorer.name, 'topScorer')
    }
    if (topAssists && topAssists.assists > 0) {
      awardMonthlyBadge(topAssists.name, 'topAssists')
    }
    if (topKeeper && topKeeper.saves > 0) {
      awardMonthlyBadge(topKeeper.name, 'topKeeper')
    }
  }
  
  const saveQuarterlyAwards = () => {
    const matchData = localStorage.getItem('matchData')
    const ratingData = localStorage.getItem('playerRatings')
    
    if (!matchData) return
    
    const matches = JSON.parse(matchData)
    const ratings = ratingData ? JSON.parse(ratingData) : []
    
    // Build comprehensive player stats
    const playerStats = TEAM_MEMBERS.map(name => {
      const playerRating = ratings.find((r: any) => r.name === name)?.rating || 5
      const playerMatches = matches[name] || {}
      
      return {
        name,
        rating: playerRating,
        goals: playerMatches.goals || 0,
        assists: playerMatches.assists || 0,
        saves: playerMatches.saves || 0,
        wins: playerMatches.wins || 0,
        gamesPlayed: playerMatches.gamesPlayed || 0
      }
    })
    
    // Calculate Ballon d'Or winner (best overall performance)
    const ballonDorWinner = calculateBallonDor(playerStats)
    if (ballonDorWinner) {
      awardBallonDor(ballonDorWinner)
    }
    
    // Calculate Golden Boot winner (top scorer)
    const goldenBootWinner = calculateGoldenBoot(playerStats)
    if (goldenBootWinner) {
      awardGoldenBoot(goldenBootWinner)
    }
  }

  const loadMonthlyAwards = () => {
    const awards = localStorage.getItem('monthlyAwards')
    if (awards) {
      const parsed = JSON.parse(awards)
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      
      if (parsed.month === lastMonth) {
        setMonthlyAwards(parsed)
      }
    }
  }

  const loadPlayerBadges = () => {
    if (!user) return
    
    // Get all permanent badges for this player
    const badges = getPlayerBadges(user.display_name)
    setPlayerBadges(badges)
  }

  const checkThursdayStatus = () => {
    // Players can now submit anytime during the week
    setIsThursdayUnlocked(true)
    setTimeUntilThursday('✅ Submissions Always Open')
  }

  const checkWeeklySubmission = () => {
    if (!user) return
    
    const submissions = localStorage.getItem('weeklySubmissions')
    if (submissions) {
      const parsed = JSON.parse(submissions)
      const currentWeek = getWeekIdentifier()
      const userSubmission = parsed[user.display_name]?.[currentWeek]
      setHasSubmittedThisWeek(!!userSubmission)
    }
  }

  const getWeekIdentifier = () => {
    // Get previous week identifier since players submit for previous week's game
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const year = lastWeek.getFullYear()
    const weekNumber = Math.ceil((lastWeek.getDate() + new Date(year, lastWeek.getMonth(), 1).getDay()) / 7)
    return `${year}-${lastWeek.getMonth() + 1}-W${weekNumber}`
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
    router.push('/')
  }

  const saveMatchData = () => {
    if (!user || hasSubmittedThisWeek) return
    
    const userName = user.display_name
    const currentWeek = getWeekIdentifier()
    
    // Save weekly submission
    const submissions = localStorage.getItem('weeklySubmissions') || '{}'
    const allSubmissions = JSON.parse(submissions)
    
    if (!allSubmissions[userName]) {
      allSubmissions[userName] = {}
    }
    
    allSubmissions[userName][currentWeek] = {
      week: currentWeek,
      goals: matchData.goals,
      assists: matchData.assists,
      saves: matchData.saves,
      teamWon: matchData.teamWon,
      formStatus,
      submittedAt: new Date().toISOString()
    }
    
    localStorage.setItem('weeklySubmissions', JSON.stringify(allSubmissions))
    
    // Update cumulative stats
    const existingData = localStorage.getItem('matchData')
    const allStats = existingData ? JSON.parse(existingData) : {}
    
    const currentStats = allStats[userName] || {
      goals: 0,
      assists: 0,
      saves: 0,
      wins: 0,
      losses: 0,
      gamesPlayed: 0
    }
    
    const updatedStats = {
      goals: currentStats.goals + matchData.goals,
      assists: currentStats.assists + matchData.assists,
      saves: currentStats.saves + matchData.saves,
      wins: currentStats.wins + (matchData.teamWon ? 1 : 0),
      losses: currentStats.losses + (matchData.teamWon ? 0 : 1),
      gamesPlayed: currentStats.gamesPlayed + 1
    }
    
    allStats[userName] = updatedStats
    localStorage.setItem('matchData', JSON.stringify(allStats))
    
    // Update state
    setMatchStats(updatedStats)
    setHasSubmittedThisWeek(true)
    setShowMatchForm(false)
    setShowSuccess(true)
    
    // Reset form
    setMatchData({ goals: 0, assists: 0, saves: 0, teamWon: false })
    setFormStatus('fully_fit')
    
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
    
    // Dispatch real-time update events using centralized system
    console.log('🔥 Dispatching real-time events for:', userName, updatedStats)
    RealTimeEvents.dispatchPlayerStatsUpdate('dashboard', userName, updatedStats)
    RealTimeEvents.getInstance().dispatch('dataUpdated', 'dashboard', { 
      type: 'player-stats',
      player: userName,
      stats: updatedStats
    })
    
    // Also trigger rankings update specifically
    window.dispatchEvent(new Event('ratingsUpdated'))
  }

  const downloadMonthlyReport = () => {
    // This will be implemented with jsPDF
    alert('PDF download feature coming soon!')
  }

  const loadProfileData = () => {
    if (!user?.display_name) return
    
    console.log('Loading profile data for:', user.display_name)
    
    // Load profile image
    const storedImages = localStorage.getItem('playerImages')
    const images = storedImages ? JSON.parse(storedImages) : {}
    console.log('Stored images:', images)
    setProfileImage(images[user.display_name] || '')
    
    // Load profile data
    const storedProfiles = localStorage.getItem('playerProfiles')
    const profiles = storedProfiles ? JSON.parse(storedProfiles) : {}
    console.log('Stored profiles:', profiles)
    
    if (profiles[user.display_name]) {
      setProfileData(profiles[user.display_name])
    } else {
      // Set default data for first time
      console.log('Setting default profile data for:', user.display_name)
    }
  }

  const handleImageUpload = (file: File) => {
    if (!user?.display_name) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      
      // Store in localStorage for both playerImages and playerProfiles
      const storedImages = localStorage.getItem('playerImages')
      const images = storedImages ? JSON.parse(storedImages) : {}
      images[user.display_name] = imageUrl
      localStorage.setItem('playerImages', JSON.stringify(images))
      
      setProfileImage(imageUrl)
      
      // Dispatch update to refresh homepage carousel
      RealTimeEvents.getInstance().dispatch('profileUpdated', 'dashboard', {
        player: user.display_name,
        image: imageUrl
      })
    }
    reader.readAsDataURL(file)
  }

  const saveProfileData = () => {
    if (!user?.display_name) return
    
    const storedProfiles = localStorage.getItem('playerProfiles')
    const profiles = storedProfiles ? JSON.parse(storedProfiles) : {}
    
    profiles[user.display_name] = profileData
    localStorage.setItem('playerProfiles', JSON.stringify(profiles))
    
    setShowProfileEdit(false)
    
    // Dispatch update to refresh homepage carousel
    RealTimeEvents.getInstance().dispatch('profileUpdated', 'dashboard', {
      player: user.display_name,
      profile: profileData
    })
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
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur-xl">
        <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Trophy className="w-8 h-8 text-yellow-400" />
              
              {/* Profile Picture */}
              <div className="relative">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt={user?.display_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => setShowProfileEdit(true)}
                  className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">
                    {user?.display_name}
                  </h1>
                  {playerBadges.length > 0 && (
                    <span className="text-xl">{playerBadges.join(' ')}</span>
                  )}
                </div>
                <p className="text-sm text-gray-400">{user?.team}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <Unlock className="w-4 h-4" />
                  <span>{timeUntilThursday}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-green-900/20 border-b border-green-800"
          >
            <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-3">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span>Stats submitted successfully for this week!</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
        {/* Admin Panel Link */}
        {user?.isAdmin && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-orange-600 hover:bg-orange-700 transition-colors"
            >
              <Shield className="w-5 h-5" />
              <span>Admin Panel</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* Monthly Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="bg-gray-950 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Goal className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Goals</span>
            </div>
            <p className="text-3xl font-bold">{matchStats.goals}</p>
          </div>
          <div className="bg-gray-950 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Assists</span>
            </div>
            <p className="text-3xl font-bold">{matchStats.assists}</p>
          </div>
          <div className="bg-gray-950 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Saves</span>
            </div>
            <p className="text-3xl font-bold">{matchStats.saves}</p>
          </div>
          <div className="bg-gray-950 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Win Rate</span>
            </div>
            <p className="text-3xl font-bold">
              {matchStats.gamesPlayed > 0 
                ? `${Math.round((matchStats.wins / matchStats.gamesPlayed) * 100)}%`
                : '0%'
              }
            </p>
          </div>
        </motion.div>

        {/* Weekly Score Entry */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Previous Week Score Entry</h2>
                <p className="text-sm text-gray-400 mt-1">Submit scores for last week's game • One submission per week</p>
              </div>
              {hasSubmittedThisWeek && (
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Submitted for previous week
                </span>
              )}
            </div>

            {!showMatchForm ? (
              <div className="p-6">
                <button
                  onClick={() => setShowMatchForm(true)}
                  disabled={hasSubmittedThisWeek}
                  className="w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>
                    {hasSubmittedThisWeek
                      ? 'Already submitted for previous week'
                      : 'Add Previous Week\'s Stats'
                    }
                  </span>
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Form Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Current Form Status
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setFormStatus('fully_fit')}
                      className={`p-3 rounded-lg border transition-all ${
                        formStatus === 'fully_fit'
                          ? 'bg-green-900/20 border-green-600 text-green-400'
                          : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">Fully Fit</span>
                    </button>
                    <button
                      onClick={() => setFormStatus('slightly_injured')}
                      className={`p-3 rounded-lg border transition-all ${
                        formStatus === 'slightly_injured'
                          ? 'bg-yellow-900/20 border-yellow-600 text-yellow-400'
                          : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">Slightly Injured</span>
                    </button>
                    <button
                      onClick={() => setFormStatus('injured')}
                      className={`p-3 rounded-lg border transition-all ${
                        formStatus === 'injured'
                          ? 'bg-red-900/20 border-red-600 text-red-400'
                          : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <XCircle className="w-5 h-5 mx-auto mb-1" />
                      <span className="text-sm">Injured</span>
                    </button>
                  </div>
                </div>

                {/* Stats Input */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Goals
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={matchData.goals}
                      onChange={(e) => setMatchData({...matchData, goals: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Assists
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={matchData.assists}
                      onChange={(e) => setMatchData({...matchData, assists: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Saves
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={matchData.saves}
                      onChange={(e) => setMatchData({...matchData, saves: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 rounded-lg bg-gray-900 border border-gray-700 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Team Result */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Match Result
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMatchData({...matchData, teamWon: true})}
                      className={`p-3 rounded-lg border transition-all ${
                        matchData.teamWon
                          ? 'bg-green-900/20 border-green-600 text-green-400'
                          : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <Trophy className="w-5 h-5 mx-auto mb-1" />
                      <span>Team Won</span>
                    </button>
                    <button
                      onClick={() => setMatchData({...matchData, teamWon: false})}
                      className={`p-3 rounded-lg border transition-all ${
                        !matchData.teamWon
                          ? 'bg-red-900/20 border-red-600 text-red-400'
                          : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <XCircle className="w-5 h-5 mx-auto mb-1" />
                      <span>Team Lost</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={saveMatchData}
                    className="flex-1 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    Submit Stats
                  </button>
                  <button
                    onClick={() => {
                      setShowMatchForm(false)
                      setMatchData({ goals: 0, assists: 0, saves: 0, teamWon: false })
                      setFormStatus('fully_fit')
                    }}
                    className="px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Report Download */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="bg-gray-950 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Monthly Report</h3>
                <p className="text-sm text-gray-400">
                  Download your personal progress report for this month
                </p>
              </div>
              <button
                onClick={downloadMonthlyReport}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </button>
            </div>

            {/* Quick Links */}
            <div className="mt-6 pt-6 border-t border-gray-800 flex gap-4">
              <Link
                href="/rankings"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <Award className="w-4 h-4" />
                <span>View Rankings</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <Users className="w-4 h-4" />
                <span>Rate Players</span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Profile Edit Modal */}
        <AnimatePresence>
          {showProfileEdit && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowProfileEdit(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-950 rounded-2xl border border-gray-800 p-6 w-full max-w-md"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Edit Profile</h3>
                  <button
                    onClick={() => setShowProfileEdit(false)}
                    className="p-1 hover:bg-gray-800 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Image Upload */}
                <div className="text-center mb-6">
                  <div className="relative inline-block">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-400"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(e.target.files[0])
                          }
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">Click camera to change photo</p>
                </div>

                {/* Profile Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Age</label>
                      <input
                        type="number"
                        value={profileData.age}
                        onChange={(e) => setProfileData(prev => ({ ...prev, age: parseInt(e.target.value) || 25 }))}
                        className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Shirt #</label>
                      <input
                        type="number"
                        value={profileData.shirtNumber}
                        onChange={(e) => setProfileData(prev => ({ ...prev, shirtNumber: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Height</label>
                      <input
                        type="text"
                        value={profileData.height}
                        onChange={(e) => setProfileData(prev => ({ ...prev, height: e.target.value }))}
                        placeholder="5.8 FT"
                        className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Weight</label>
                      <input
                        type="text"
                        value={profileData.weight}
                        onChange={(e) => setProfileData(prev => ({ ...prev, weight: e.target.value }))}
                        placeholder="70KG"
                        className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Position</label>
                    <select
                      value={profileData.position}
                      onChange={(e) => setProfileData(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="FORWARD">Forward</option>
                      <option value="MIDFIELDER">Midfielder</option>
                      <option value="DEFENDER">Defender</option>
                      <option value="GOALKEEPER">Goalkeeper</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Top Attributes (comma-separated)</label>
                    <input
                      type="text"
                      value={profileData.attributes.join(', ')}
                      onChange={(e) => setProfileData(prev => ({ 
                        ...prev, 
                        attributes: e.target.value.split(',').map(attr => attr.trim().toUpperCase()).filter(Boolean)
                      }))}
                      placeholder="PASSING, VISION, CREATING ASSISTS"
                      className="w-full px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={saveProfileData}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                  >
                    <Save className="w-4 h-4" />
                    Save Profile
                  </button>
                  <button
                    onClick={() => setShowProfileEdit(false)}
                    className="px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}