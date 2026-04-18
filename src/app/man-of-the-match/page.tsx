'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Trophy, Vote, Share2, Copy, Check, X } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

// Get the previous Thursday (for MOTM voting)
function getPreviousThursday(): Date {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysSinceThursday = (dayOfWeek - 4 + 7) % 7 || 7
  const previousThursday = new Date(now)
  previousThursday.setDate(now.getDate() - daysSinceThursday)
  previousThursday.setHours(20, 0, 0, 0)
  return previousThursday
}

// Check if voting window is open (Thursday 6PM to 9:30PM is CLOSED, otherwise open for previous game)
function isVotingWindowOpen(): { open: boolean; message: string } {
  const now = new Date()
  const day = now.getDay()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  
  // Thursday 6PM to 9:30PM - voting is CLOSED (game in progress)
  if (day === 4) {
    if (hours >= 18 && (hours < 21 || (hours === 21 && minutes <= 30))) {
      return { open: false, message: 'Voting closes after the game (9:30 PM)' }
    }
  }
  
  // After 9:30PM Thursday, new voting window opens for that day's game
  // Other times: can vote for previous game
  return { open: true, message: '' }
}

export default function ManOfTheMatchPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [matchId, setMatchId] = useState<string | null>(null)
  const [votedFor, setVotedFor] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [winners, setWinners] = useState<any[]>([])
  const [votingOpen, setVotingOpen] = useState<{ open: boolean; message: string }>({ open: true, message: '' })

  useEffect(() => {
    // Check voting window
    setVotingOpen(isVotingWindowOpen())
    
    // Fetch previous Thursday's match for voting
    const fetchData = async () => {
      // Get previous Thursday
      const prevThursday = getPreviousThursday()
      const prevThursdayStr = prevThursday.toISOString().split('T')[0]
      
      // Find match on or before previous Thursday
      const { data: matches } = await supabase
        .from('matches')
        .select('id, match_date')
        .lte('match_date', prevThursdayStr)
        .order('match_date', { ascending: false })
        .limit(1)
      
      if (matches?.length) {
        setMatchId(matches[0].id)
        
        if (user && profile?.player_id) {
          const { data: vote } = await supabase
            .from('man_of_the_match_votes')
            .select('voted_for_player_id')
            .eq('match_id', matches[0].id)
            .eq('voter_id', profile.player_id)
            .single()
          
          if (vote) {
            setVotedFor(vote.voted_for_player_id)
            setHasVoted(true)
          }
        }
        
        // Get current winners
        const { data: winnerRecords } = await supabase
          .from('man_of_the_match_winners')
          .select('player_id, vote_count')
          .eq('match_id', matches[0].id)
          .order('vote_count', { ascending: false })
        
        if (winnerRecords?.length) {
          const winnerIds = winnerRecords.map(w => w.player_id)
          const winnerPlayers = PLAYERS.filter(p => winnerIds.includes(p.id))
          setWinners(winnerPlayers)
        }
      }
    }
    
    if (!authLoading) fetchData()
  }, [user, profile, authLoading])

  const handleVote = async () => {
    if (!votedFor || !matchId || !profile?.player_id) return
    if (votedFor === profile.player_id) {
      alert("You can't vote for yourself!")
      return
    }
    
    setIsSubmitting(true)
    
    const { error } = await supabase
      .from('man_of_the_match_votes')
      .insert({
        match_id: matchId,
        voter_id: profile.player_id,
        voted_for_player_id: votedFor,
      })
    
    if (error) {
      alert(error.message)
    } else {
      setHasVoted(true)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }
    
    setIsSubmitting(false)
  }

  const copyShareLink = () => {
    const url = `${window.location.origin}/man-of-the-match?vote=${matchId}`
    navigator.clipboard.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  const canVote = user && profile?.player_id && !hasVoted && votingOpen.open

  return (
    <div className="min-h-screen pb-20">
      <Header title="Man of the Match" />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Voting closed message */}
        {!votingOpen.open && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-yellow-500/30 text-center"
          >
            <Vote className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
            <h2 className="text-xl font-bold mb-2">Voting Closed</h2>
            <p className="text-gray-400">{votingOpen.message}</p>
          </motion.div>
        )}

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Trophy className="w-16 h-16 mx-auto mb-2 text-yellow-400" />
          <h1 className="text-2xl font-bold">Who was the best?</h1>
          <p className="text-gray-400">Vote for Man of the Match</p>
        </motion.div>

        {/* Share Link */}
        {canVote && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={copyShareLink}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2"
          >
            {shareCopied ? <Check className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5" />}
            {shareCopied ? 'Link Copied!' : 'Copy Link to Share'}
          </motion.button>
        )}

        {/* Current Winners (if any) */}
        {winners.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 border border-yellow-500/30"
          >
            <h2 className="text-lg font-bold text-yellow-400 mb-4 text-center">🏆 Current Winner{winners.length > 1 ? 's' : ''}</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {winners.map(player => (
                <div key={player.id} className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="font-bold">{player.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Not Logged In */}
        {!user && !authLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-6 border border-blue-500/30 text-center"
          >
            <p className="text-gray-400 mb-4">
              Login to vote for Man of the Match
            </p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 rounded-xl bg-green-500 text-black font-bold"
            >
              Login to Vote
            </button>
          </motion.div>
        )}

        {/* Voting UI */}
        {canVote && (
          <>
            <p className="text-center text-gray-400 text-sm">
              Tap a player to vote • Can't vote for yourself
            </p>

            <div className="grid grid-cols-2 gap-3">
              {PLAYERS.filter(p => p.id !== profile?.player_id).map(player => (
                <motion.button
                  key={player.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setVotedFor(player.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    votedFor === player.id
                      ? 'border-yellow-500 bg-yellow-500/20'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-semibold">{player.name}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Submit Vote */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              disabled={!votedFor || isSubmitting}
              onClick={handleVote}
              className="w-full py-4 rounded-2xl bg-yellow-500 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Submitting...'
              ) : (
                <>
                  <Vote className="w-5 h-5" />
                  Cast Vote
                </>
              )}
            </motion.button>
          </>
        )}

        {/* Already Voted */}
        {hasVoted && user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 border border-green-500/30 text-center"
          >
            <Check className="w-12 h-12 mx-auto mb-2 text-green-400" />
            <h2 className="text-xl font-bold">Vote Submitted!</h2>
            <p className="text-gray-400">Thank you for voting</p>
          </motion.div>
        )}

        {/* Voting Closed / No Match */}
        {!matchId && !authLoading && (
          <div className="glass rounded-2xl p-6 border border-white/10 text-center">
            <p className="text-gray-400">
              No matches found. Create a match day to start voting.
            </p>
          </div>
        )}
      </main>

      <Navigation activePath="/man-of-the-match" />
    </div>
  )
}