'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS, POINTS_SYSTEM } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Check, Trophy, Target, Save, Users } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

interface StatsForm {
  goals: number
  assists: number
  isWinner: boolean
  playedAsGK: boolean
  cleanSheet: boolean
}

function StatsSubmissionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const [matchId, setMatchId] = useState<string | null>(null)
  const [matchDate, setMatchDate] = useState<string>('')

  // Auto-find most recent match if no match param provided
  useEffect(() => {
    const findMatch = async () => {
      const paramMatch = searchParams.get('match')
      if (paramMatch) {
        setMatchId(paramMatch)
        const { data } = await supabase.from('matches').select('match_date').eq('id', paramMatch).single()
        if (data) setMatchDate(data.match_date)
        return
      }
      // Find most recent match
      const { data: matches } = await supabase.from('matches').select('id, match_date').order('match_date', { ascending: false }).limit(1).single()
      if (matches) {
        setMatchId(matches.id)
        setMatchDate(matches.match_date)
      }
    }
    findMatch()
  }, [])

  const [form, setForm] = useState<StatsForm>({
    goals: 0,
    assists: 0,
    isWinner: false,
    playedAsGK: false,
    cleanSheet: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Check submission when matchId is ready
  useEffect(() => {
    if (!matchId || !profile?.player_id) return
    const checkSubmission = async () => {
      const { data } = await supabase.from('match_stats').select('id').eq('match_id', matchId).eq('player_id', profile.player_id).single()
      if (data) setAlreadySubmitted(true)
    }
    checkSubmission()
  }, [matchId, profile])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [user, authLoading, router])

  const calculatePoints = () => {
    let points = form.goals * POINTS_SYSTEM.goal + form.assists * POINTS_SYSTEM.assist
    if (form.isWinner) points += POINTS_SYSTEM.matchWin
    if (form.playedAsGK && form.isWinner) points += POINTS_SYSTEM.goalkeeperWinBonus
    return points
  }

  const handleSubmit = async () => {
    if (!profile?.player_id || !matchId) return

    setIsSubmitting(true)

    const points = calculatePoints()

    const { error } = await supabase
      .from('match_stats')
      .insert({
        match_id: matchId,
        player_id: profile.player_id,
        goals: form.goals,
        assists: form.assists,
        is_winner: form.isWinner,
        played_as_gk: form.playedAsGK,
        clean_sheet: form.cleanSheet,
      })

    if (error) {
      alert(error.message)
    } else {
      // Add coins
      await supabase.from('coins_ledger').insert({
        player_id: profile.player_id,
        amount: points,
        reason: `Match stats: ${form.goals} goals, ${form.assists} assists${form.isWinner ? ', win' : ''}`,
        match_id: matchId,
      })

      setShowSuccess(true)
      setTimeout(() => router.push('/'), 3000)
    }

    setIsSubmitting(false)
  }

  const player = PLAYERS.find(p => p.id === profile?.player_id)

  if (alreadySubmitted) {
    return (
      <div className="glass rounded-2xl p-8 border border-green-500/30">
        <Check className="w-16 h-16 mx-auto mb-4 text-green-400" />
        <h2 className="text-2xl font-bold mb-2">Stats Submitted!</h2>
        <p className="text-gray-400">You've already submitted for this match</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Player Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        {matchDate && (
          <p className="text-sm text-gray-400 mb-1">
            Match: {new Date(matchDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
        <div className="text-3xl font-bold">{player?.name || 'Unknown'}</div>
        <p className="text-gray-400">Submit your match stats</p>
      </motion.div>

      {/* Stats Form */}
      <div className="space-y-4">
        {/* Goals */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <span className="font-semibold">Goals</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(prev => ({ ...prev, goals: Math.max(0, prev.goals - 1) }))}
              className="w-10 h-10 rounded-full bg-white/10"
            >
              -
            </button>
            <span className="w-8 text-center text-xl font-bold">{form.goals}</span>
            <button
              onClick={() => setForm(prev => ({ ...prev, goals: prev.goals + 1 }))}
              className="w-10 h-10 rounded-full bg-white/10"
            >
              +
            </button>
          </div>
        </div>

        {/* Assists */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <span className="font-semibold">Assists</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm(prev => ({ ...prev, assists: Math.max(0, prev.assists - 1) }))}
              className="w-10 h-10 rounded-full bg-white/10"
            >
              -
            </button>
            <span className="w-8 text-center text-xl font-bold">{form.assists}</span>
            <button
              onClick={() => setForm(prev => ({ ...prev, assists: prev.assists + 1 }))}
              className="w-10 h-10 rounded-full bg-white/10"
            >
              +
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="p-4 rounded-xl bg-white/5">
          <label className="flex items-center justify-between">
            <span className="font-semibold">🏆 Won the Match</span>
            <input
              type="checkbox"
              checked={form.isWinner}
              onChange={(e) => setForm(prev => ({ ...prev, isWinner: e.target.checked }))}
              className="w-6 h-6 rounded"
            />
          </label>
        </div>

        {/* Played as GK */}
        <div className="p-4 rounded-xl bg-white/5">
          <label className="flex items-center justify-between">
            <span className="font-semibold">🧤 Played as Goalkeeper</span>
            <input
              type="checkbox"
              checked={form.playedAsGK}
              onChange={(e) => setForm(prev => ({ ...prev, playedAsGK: e.target.checked }))}
              className="w-6 h-6 rounded"
            />
          </label>
        </div>

        {/* Clean Sheet */}
        <div className="p-4 rounded-xl bg-white/5">
          <label className="flex items-center justify-between">
            <span className="font-semibold">🛡️ Clean Sheet</span>
            <input
              type="checkbox"
              checked={form.cleanSheet}
              onChange={(e) => setForm(prev => ({ ...prev, cleanSheet: e.target.checked }))}
              className="w-6 h-6 rounded"
            />
          </label>
        </div>
      </div>

      {/* Points Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-6 rounded-2xl bg-green-500/10 border border-green-500/30"
      >
        <div className="text-gray-400 mb-1">Points you'll earn</div>
        <div className="text-4xl font-black text-green-400">+{calculatePoints()}</div>
      </motion.div>

      {/* Submit */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        disabled={isSubmitting}
        onClick={handleSubmit}
        className="w-full py-4 rounded-2xl bg-green-500 text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? 'Submitting...' : (
          <>
            <Save className="w-5 h-5" />
            Submit Stats
          </>
        )}
      </motion.button>

      {/* Success */}
      {showSuccess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center p-4 rounded-xl bg-green-500/20 text-green-400"
        >
          ✓ Stats submitted! +{calculatePoints()} points earned
        </motion.div>
      )}
    </div>
  )
}

export default function SubmitStatsPage() {
  return (
    <div className="min-h-screen pb-20">
      <Header title="Submit Stats" />

      <main className="max-w-md mx-auto px-4 py-6">
        <Suspense fallback={
          <div className="text-center p-8">
            <div className="animate-pulse">Loading...</div>
          </div>
        }>
          <StatsSubmissionContent />
        </Suspense>
      </main>

      <Navigation activePath="/match-day" />
    </div>
  )
}