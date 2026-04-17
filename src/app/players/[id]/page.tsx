'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { PLAYERS, Position } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Trophy, Target, Shield, Star, Coins, Calendar, Medal } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

function PlayerDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const playerId = searchParams.get('id')
  
  const player = PLAYERS.find(p => p.id === playerId)
  
  const [stats, setStats] = useState<any>({
    goals: 0,
    assists: 0,
    wins: 0,
    matches: 0,
  })
  const [coins, setCoins] = useState(0)
  const [motmCount, setMotmCount] = useState(0)
  const [ratings, setRatings] = useState({ forward: 0, midfielder: 0, defender: 0, goalkeeper: 0 })

  useEffect(() => {
    if (!playerId) return

    // Get player stats
    const fetchStats = async () => {
      const { data: matchStats } = await supabase
        .from('match_stats')
        .select('goals, assists, is_winner')
        .eq('player_id', playerId)
      
      if (matchStats) {
        const goals = matchStats.reduce((sum, s) => sum + s.goals, 0)
        const assists = matchStats.reduce((sum, s) => sum + s.assists, 0)
        const wins = matchStats.filter(s => s.is_winner).length
        setStats({ goals, assists, wins, matches: matchStats.length })
      }
    }

    // Get coins
    const fetchCoins = async () => {
      const { data: coinData } = await supabase
        .from('coins_ledger')
        .select('amount')
        .eq('player_id', playerId)
      
      if (coinData) {
        setCoins(coinData.reduce((sum, c) => sum + c.amount, 0))
      }
    }

    // Get MOTM count
    const fetchMotm = async () => {
      const { data } = await supabase
        .from('man_of_the_match_winners')
        .select('id')
        .eq('player_id', playerId)
      
      if (data) setMotmCount(data.length)
    }

    fetchStats()
    fetchCoins()
    fetchMotm()
  }, [playerId])

  if (!player) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-400">Player not found</p>
      </div>
    )
  }

  const overallRating = Math.floor(
    (ratings.forward + ratings.midfielder + ratings.defender + ratings.goalkeeper) / 4
  ) || 5

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Player Card Header */}
      <div className="glass rounded-2xl p-6 border text-center" style={{ borderColor: player.color }}>
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4"
          style={{ 
            backgroundColor: player.color,
            boxShadow: `0 0 30px ${player.color}40`
          }}
        >
          {player.name.slice(0, 2).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold">{player.name}</h1>
        <p className="text-gray-400 capitalize">{player.position}</p>
        
        {/* Overall Rating */}
        <div className="mt-4">
          <div className="text-sm text-gray-500">OVR</div>
          <div className="text-4xl font-black" style={{ color: player.color }}>
            {overallRating}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl p-4 border border-white/10 text-center">
          <Target className="w-6 h-6 mx-auto mb-1 text-green-400" />
          <div className="text-2xl font-bold">{stats.goals}</div>
          <div className="text-xs text-gray-500">Goals</div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/10 text-center">
          <Star className="w-6 h-6 mx-auto mb-1 text-blue-400" />
          <div className="text-2xl font-bold">{stats.assists}</div>
          <div className="text-xs text-gray-500">Assists</div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/10 text-center">
          <Trophy className="w-6 h-6 mx-auto mb-1 text-yellow-400" />
          <div className="text-2xl font-bold">{stats.wins}</div>
          <div className="text-xs text-gray-500">Wins</div>
        </div>
        
        <div className="glass rounded-xl p-4 border border-white/10 text-center">
          <Medal className="w-6 h-6 mx-auto mb-1 text-purple-400" />
          <div className="text-2xl font-bold">{motmCount}</div>
          <div className="text-xs text-gray-500">Man of Match</div>
        </div>
      </div>

      {/* Coins */}
      <div className="glass rounded-xl p-4 border border-yellow-500/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6 text-yellow-400" />
          <span className="font-bold">Coins</span>
        </div>
        <span className="text-2xl font-bold text-yellow-400">{coins}</span>
      </div>

      {/* Overall Stats */}
      <div className="glass rounded-xl p-4 border border-white/10">
        <h3 className="font-bold mb-3">Season Stats</h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Matches</span>
          <span>{stats.matches}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Win Rate</span>
          <span>{stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Goals/Match</span>
          <span>{stats.matches > 0 ? (stats.goals / stats.matches).toFixed(1) : 0}</span>
        </div>
      </div>
    </motion.div>
  )
}

export default function PlayerDetailPage() {
  return (
    <div className="min-h-screen pb-20">
      <Header title="Player" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <Suspense fallback={
          <div className="text-center p-8">
            <div className="animate-pulse">Loading...</div>
          </div>
        }>
          <PlayerDetailContent />
        </Suspense>
      </main>

      <Navigation activePath="/players" />
    </div>
  )
}