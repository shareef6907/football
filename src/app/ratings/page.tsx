'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Star, Check, Lock, Clock, AlertCircle } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

interface PlayerRating {
  forward: number
  midfielder: number
  defender: number
  goalkeeper: number
}

function RatingsContent() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  
  // Initialize ratings for all players with default value 5
  const defaultRatings: Record<string, PlayerRating> = {}
  PLAYERS.filter(p => p.id !== profile?.player_id).forEach(p => {
    defaultRatings[p.id] = { forward: 5, midfielder: 5, defender: 5, goalkeeper: 5 }
  })
  
  const [ratings, setRatings] = useState<Record<string, PlayerRating>>(defaultRatings)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
    
    // Check if already submitted this month
    if (profile?.player_id) {
      const checkRating = async () => {
        const { data } = await supabase
          .from('player_ratings')
          .select('id')
          .eq('rater_id', profile.player_id)
          .eq('rating_month', currentMonth)
          .eq('rating_year', currentYear)
          .single()
        
        if (data) setSubmitted(true)
      }
      checkRating()
    }
  }, [user, profile, authLoading, router, currentMonth, currentYear])

  const updateRating = (playerId: string, position: string, value: number) => {
    setRatings(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { forward: 5, midfielder: 5, defender: 5, goalkeeper: 5 }),
        [position]: value,
      },
    }))
  }

  const handleSubmit = async () => {
    if (!profile?.player_id) {
      setSubmitError('You must be logged in as a player to submit ratings')
      return
    }
    
    setIsSubmitting(true)
    setSubmitError('')
    
    try {
      // Insert ratings for each player
      const insertPromises = Object.entries(ratings).map(([playerId, playerRatings]) =>
        supabase.from('player_ratings').insert({
          rater_id: profile.player_id,
          rated_player_id: playerId,
          rating_month: currentMonth,
          rating_year: currentYear,
          forward_rating: playerRatings.forward,
          midfielder_rating: playerRatings.midfielder,
          defender_rating: playerRatings.defender,
          goalkeeper_rating: playerRatings.goalkeeper,
        })
      )
      
      const results = await Promise.all(insertPromises)
      
      // Check for errors
      const hasError = results.some(r => r.error)
      if (hasError) {
        setSubmitError('Failed to submit some ratings. Please try again.')
      } else {
        setSubmitted(true)
      }
    } catch (err) {
      setSubmitError('Failed to submit ratings. Please try again.')
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const playersToRate = PLAYERS.filter(p => p.id !== profile?.player_id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Star className="w-12 h-12 mx-auto mb-2 text-purple-400" />
        <h1 className="text-2xl font-bold">Monthly Ratings</h1>
        <p className="text-gray-400">Rate other players by position (1-10)</p>
        <p className="text-sm text-gray-500 mt-2">
          {currentMonth}/{currentYear} • All ratings anonymous
        </p>
      </motion.div>

      {/* Already Submitted */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-6 border border-green-500/30 text-center"
        >
          <Check className="w-12 h-12 mx-auto mb-2 text-green-400" />
          <h2 className="text-xl font-bold">Ratings Submitted!</h2>
          <p className="text-gray-400">Thank you for rating</p>
        </motion.div>
      )}

      {/* Rating Form */}
      {!submitted && playersToRate.map(player => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
              style={{ backgroundColor: player.color }}
            >
              {player.name.slice(0, 2).toUpperCase()}
            </div>
            <span className="font-bold">{player.name}</span>
            <span className="text-xs text-gray-500">({player.position})</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-center">
            {(['forward', 'midfielder', 'defender', 'goalkeeper'] as const).map(pos => {
              const labels = { forward: 'FWD', midfielder: 'MID', defender: 'DEF', goalkeeper: 'GK' }
              const colors = { forward: 'text-red-400', midfielder: 'text-blue-400', defender: 'text-green-400', goalkeeper: 'text-yellow-400' }
              return (
                <div key={pos}>
                  <div className={`text-xs ${colors[pos]}`}>{labels[pos]}</div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={ratings[player.id]?.[pos] || 5}
                    onChange={(e) => updateRating(player.id, pos, Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm font-bold">{ratings[player.id]?.[pos] || 5}</div>
                </div>
              )
            })}
          </div>
        </motion.div>
      ))}

      {/* Submit */}
      {!submitted && (
        <>
          {submitError && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-center">
              {submitError}
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl bg-purple-500 text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : (
              <>
                <Check className="w-5 h-5" />
                Submit Ratings
              </>
            )}
          </motion.button>
        </>
      )}

      {/* Not a player */}
      {profile?.role === 'spectator' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-6 border border-red-500/30 text-center"
        >
          <Lock className="w-12 h-12 mx-auto mb-2 text-red-400" />
          <h2 className="font-bold">Players Only</h2>
          <p className="text-gray-400">Spectators cannot rate players</p>
        </motion.div>
      )}
    </div>
  )
}

export default function RatingsPage() {
  return (
    <div className="min-h-screen pb-20">
      <Header title="Monthly Ratings" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <Suspense fallback={
          <div className="text-center p-8">
            <div className="animate-pulse">Loading...</div>
          </div>
        }>
          <RatingsContent />
        </Suspense>
      </main>

      <Navigation activePath="/ratings" />
    </div>
  )
}