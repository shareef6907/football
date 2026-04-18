'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Clock, Trophy, Target, Calendar, Users, ArrowRight, Star, Share2, Download, X, Clipboard } from 'lucide-react'
import { Navigation, Header } from '../components/Navigation'
import { supabase } from '@/lib/supabase/client'
import { PLAYERS } from '@/lib/constants'
import { useAuth } from '@/context/AuthContext'

// Next game date calculator - uses settings from Supabase/localStorage
function getNextGameDate(gameDay: number, gameTime: string) {
  const now = new Date()
  const [hours, minutes] = gameTime.split(':').map(Number)
  const daysUntilGameDay = (gameDay - now.getDay() + 7) % 7 || 7
  const nextGame = new Date(now)
  nextGame.setDate(now.getDate() + daysUntilGameDay)
  nextGame.setHours(hours || 20, minutes || 0, 0, 0)
  return nextGame
}

export default function HomePage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [countdown, setCountdown] = useState('')
  const [nextGame, setNextGame] = useState(() => getNextGameDate(4, '20:00'))
  const [gameTimeDisplay, setGameTimeDisplay] = useState('8:00 PM')
  const [showPwaPrompt, setShowPwaPrompt] = useState(false)
  const [dismissedPwa, setDismissedPwa] = useState(false)
  
  // Man of the Match data
  const [motmMatch, setMotmMatch] = useState<{id: string, date: string} | null>(null)
  const [motmWinners, setMotmWinners] = useState<{id: string, name: string, color: string}[]>([])
  const [motmLoading, setMotmLoading] = useState(true)
  const [votingOpen, setVotingOpen] = useState(true)

  // Load game settings from Supabase/localStorage
  useEffect(() => {
    const loadSettings = async () => {
      // Try localStorage first (faster)
      const localDay = localStorage.getItem('game_day')
      const localTime = localStorage.getItem('game_time')
      
      let gameDay = localDay ? parseInt(localDay) : 4
      let gameTime = localTime || '20:00'
      
      // Also try Supabase
      try {
        const { data } = await supabase.from('game_settings').select('key, value')
        if (data) {
          data.forEach(({ key, value }) => {
            if (key === 'game_day') gameDay = parseInt(value)
            if (key === 'game_time') gameTime = value
          })
        }
      } catch (err) {
        // Supabase not available, use localStorage
      }
      
      const newNextGame = getNextGameDate(gameDay, gameTime)
      setNextGame(newNextGame)
      
      // Format time for display
      const [h, m] = gameTime.split(':')
      const hour = parseInt(h)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      setGameTimeDisplay(`${hour12}:${m || '00'} ${ampm}`)
    }
    
    loadSettings()
  }, [])

  useEffect(() => {
    // PWA prompt after 5 seconds
    const timer = setTimeout(() => {
      if (!dismissedPwa && !window.matchMedia('(display-mode: standalone)').matches) {
        setShowPwaPrompt(true)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [dismissedPwa])

  // Load Man of the Match from database - count actual votes for previous Thursday
  useEffect(() => {
    const loadMotm = async () => {
      setMotmLoading(true)
      
      // Check voting window
      const now = new Date()
      const day = now.getDay()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      
      // Thursday 6PM to 9:30PM - voting CLOSED
      if (day === 4 && hours >= 18 && (hours < 21 || (hours === 21 && minutes <= 30))) {
        setVotingOpen(false)
      } else {
        setVotingOpen(true)
      }
      
      try {
        // Get previous Thursday's match
        const now = new Date()
        const dayOfWeek = now.getDay()
        const daysSinceThursday = (dayOfWeek - 4 + 7) % 7 || 7
        const prevThursday = new Date(now)
        prevThursday.setDate(now.getDate() - daysSinceThursday)
        const prevThursdayStr = prevThursday.toISOString().split('T')[0]
        
        const { data: matches } = await supabase
          .from('matches')
          .select('id, match_date')
          .lte('match_date', prevThursdayStr)
          .order('match_date', { ascending: false })
          .limit(1)
          .single()
        
        if (!matches) {
          setMotmLoading(false)
          return
        }
        
        setMotmMatch({ id: matches.id, date: matches.match_date })
        
        // Get ALL votes for this match and count them
        const { data: allVotes } = await supabase
          .from('man_of_the_match_votes')
          .select('voted_for_player_id')
          .eq('match_id', matches.id)
        
        if (allVotes && allVotes.length > 0) {
          // Count votes per player
          const voteCounts: Record<string, number> = {}
          allVotes.forEach(v => {
            voteCounts[v.voted_for_player_id] = (voteCounts[v.voted_for_player_id] || 0) + 1
          })
          
          // Find max votes
          const maxVotes = Math.max(...Object.values(voteCounts))
          const winningIds = Object.entries(voteCounts).filter(([_, count]) => count === maxVotes).map(([id]) => id)
          const winners = PLAYERS.filter(p => winningIds.includes(p.id))
          setMotmWinners(winners)
        }
      } catch (err) {
        console.error('Error loading MOTM:', err)
      }
      setMotmLoading(false)
    }
    loadMotm()
  }, [])

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const distance = nextGame.getTime() - now.getTime()
      
      if (distance < 0) {
        setCountdown('🎉 Game Day!')
        return
      }
      
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)
      
      setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`)
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [nextGame])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Hero: Next Game Countdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-3xl blur-xl" />
          <div className="relative glass rounded-3xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-green-400" />
              <span className="text-gray-400">Next Game</span>
            </div>
            <h2 className="text-xl font-bold mb-2">{formatDate(nextGame)}</h2>
            <h2 className="text-xl font-bold mb-4">{gameTimeDisplay}</h2>
            <div className="text-center py-4">
              <div className="text-3xl font-black text-red-500">{countdown}</div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/match-day">
            <motion.div 
              whileTap={{ scale: 0.95 }}
              className="glass rounded-2xl p-4 border border-white/10 card-hover"
            >
              <Target className="w-8 h-8 text-green-400 mb-2" />
              <div className="font-semibold">Set Up Match</div>
              <div className="text-sm text-gray-400">Create teams</div>
            </motion.div>
          </Link>
          
          <Link href="/man-of-the-match">
            <motion.div 
              whileTap={{ scale: 0.95 }}
              className="glass rounded-2xl p-4 border border-white/10 card-hover"
            >
              <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
              <div className="font-semibold">Vote Man of the Match</div>
              <div className="text-sm text-gray-400">Cast your vote</div>
            </motion.div>
          </Link>
          
          <Link href="/standings">
            <motion.div 
              whileTap={{ scale: 0.95 }}
              className="glass rounded-2xl p-4 border border-white/10 card-hover"
            >
              <Trophy className="w-8 h-8 text-blue-400 mb-2" />
              <div className="font-semibold">Standings</div>
              <div className="text-sm text-gray-400">League table</div>
            </motion.div>
          </Link>
          
          {user && profile?.player_id ? (
            <Link href="/match-day/submit">
              <motion.div 
                whileTap={{ scale: 0.95 }}
                className="glass rounded-2xl p-4 border border-white/10 card-hover"
              >
                <Clipboard className="w-8 h-8 text-green-400 mb-2" />
                <div className="font-semibold">Submit Stats</div>
                <div className="text-sm text-gray-400">After the game</div>
              </motion.div>
            </Link>
          ) : (
            <Link href="/players">
              <motion.div 
                whileTap={{ scale: 0.95 }}
                className="glass rounded-2xl p-4 border border-white/10 card-hover"
              >
                <Users className="w-8 h-8 text-purple-400 mb-2" />
                <div className="font-semibold">Players</div>
                <div className="text-sm text-gray-400">View cards</div>
              </motion.div>
            </Link>
          )}
        </div>

        {/* Man of the Match Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-4 border border-yellow-500/30"
        >
          <div className="flex items-center gap-3 mb-3">
            <Star className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold">
              Man of the Match
              {motmMatch?.date && ` - ${new Date(motmMatch.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
              {votingOpen && <span className="ml-2 text-green-400 text-xs">Vote now!</span>}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              {motmLoading ? (
                <div className="text-sm text-gray-400">Loading...</div>
              ) : motmWinners.length > 0 ? (
                <>
                  <div className="text-lg font-bold">
                    {motmWinners.map(p => p.name).join(' & ')}
                  </div>
                  <div className="text-sm text-gray-400">Vote winner</div>
                </>
              ) : (
                <>
                  <div className="text-lg font-bold text-gray-400">No votes yet</div>
                  <div className="text-sm text-gray-500">Cast your vote!</div>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full bg-white/10"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
              <Link href="/man-of-the-match">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 text-black font-semibold"
                >
                  Vote <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Points System Link */}
        <Link href="/points" className="block">
          <motion.div 
            whileTap={{ scale: 0.98 }}
            className="glass rounded-2xl p-4 border border-white/10 text-center"
          >
            <span className="text-gray-400">How do points work?</span>
            <span className="ml-2 text-green-400">See points system →</span>
          </motion.div>
        </Link>
      </main>

      <Navigation activePath="/" />

      {/* PWA Install Prompt */}
      <AnimatePresence>
        {showPwaPrompt && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-20 left-4 right-4 z-50 glass rounded-2xl p-4 border border-green-500/30"
          >
            <div className="flex items-start gap-3">
              <Download className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold mb-1">Add to Home Screen</h3>
                <p className="text-sm text-gray-400 mb-2">
                  For the best experience, install our app:
                </p>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-500">iOS:</span> Tap Share → Add to Home Screen</p>
                  <p><span className="text-gray-500">Android:</span> Tap menu → Install App</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowPwaPrompt(false); setDismissedPwa(true) }}
                className="p-1"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}