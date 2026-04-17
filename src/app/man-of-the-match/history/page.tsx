'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { PLAYERS } from '@/lib/constants'
import { Trophy, Calendar } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

interface WinnerRecord {
  match_id: string
  player_id: string
  vote_count: number
}

export default function ManOfTheMatchHistoryPage() {
  const [winners, setWinners] = useState<WinnerRecord[]>([])
  const [matches, setMatches] = useState<{id: string, match_date: string}[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      // Get recent winners
      const { data: winnerData } = await supabase
        .from('man_of_the_match_winners')
        .select('match_id, player_id, vote_count')
        .order('match_id', { ascending: false })
        .limit(50)
      
      if (winnerData) {
        setWinners(winnerData)
        
        // Get match dates
        const matchIds = [...new Set(winnerData.map(w => w.match_id))]
        const { data: matchData } = await supabase
          .from('matches')
          .select('id, match_date')
          .in('id', matchIds)
        
        if (matchData) {
          setMatches(matchData)
        }
      }
      
      setLoading(false)
    }
    
    fetchHistory()
  }, [])

  const getPlayer = (playerId: string) => 
    PLAYERS.find(p => p.id === playerId)

  const getMatchDate = (matchId: string) => {
    const match = matches.find(m => m.id === matchId)
    if (!match) return 'Unknown'
    return new Date(match.match_date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Man of the Match" />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Trophy className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
          <h1 className="text-2xl font-bold">History</h1>
          <p className="text-gray-400">Past Man of the Match winners</p>
        </motion.div>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : winners.length === 0 ? (
          <div className="text-center text-gray-500">
            No matches yet. Create a match to start tracking!
          </div>
        ) : (
          <div className="space-y-3">
            {winners.map((winner, index) => {
              const player = getPlayer(winner.player_id)
              if (!player) return null
              
              return (
                <motion.div
                  key={`${winner.match_id}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-xl p-4 border border-white/10 flex items-center gap-4"
                >
                  <div className="text-2xl">🏆</div>
                  <div className="flex-1">
                    <div className="font-bold">{player.name}</div>
                    <div className="text-sm text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {getMatchDate(winner.match_id)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-yellow-400">
                      {winner.vote_count}
                    </div>
                    <div className="text-xs text-gray-500">votes</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>

      <Navigation activePath="/man-of-the-match" />
    </div>
  )
}