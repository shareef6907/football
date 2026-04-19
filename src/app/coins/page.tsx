'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Coins, Trophy, History, ChevronRight, Gift } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

interface Transaction {
  id: string
  amount: number
  reason: string
  match_id: string | null
  created_at: string
}

function CoinsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Balance skeleton */}
      <div className="glass rounded-2xl p-8 border border-yellow-500/30">
        <div className="w-12 h-12 rounded-full bg-white/10 mx-auto mb-2" />
        <div className="h-4 w-32 mx-auto mb-2 rounded bg-white/10" />
        <div className="h-12 w-32 mx-auto rounded bg-white/10" />
        <div className="h-3 w-24 mx-auto mt-2 rounded bg-white/10" />
      </div>
      
      {/* Transactions skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-white/10 mb-2" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-3 border border-white/10">
            <div className="h-4 w-40 rounded bg-white/10 mb-2" />
            <div className="h-3 w-20 rounded bg-white/10" />
          </div>
        ))}
      </div>
      
      {/* Leaderboard skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-white/10 mb-2" />
        {[...Array(7)].map((_, i) => (
          <div key={i} className="glass rounded-xl p-3 border border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10" />
            <div className="w-8 h-8 rounded-full bg-white/10" />
            <div className="flex-1 h-4 w-24 rounded bg-white/10" />
            <div className="h-6 w-12 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CoinsContent() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [leaderboard, setLeaderboard] = useState<{player_id: string, total: number}[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!profile?.player_id) return

    // Get my balance AND transactions in parallel
    const fetchBalanceAndTransactions = async () => {
      setLoading(true)
      const [balanceRes, txRes] = await Promise.all([
        supabase.from('coins_ledger').select('amount').eq('player_id', profile.player_id),
        supabase.from('coins_ledger').select('*').eq('player_id', profile.player_id).order('created_at', { ascending: false }).limit(20),
      ])
      
      if (balanceRes.data) {
        const total = balanceRes.data.reduce((sum, t) => sum + t.amount, 0)
        setBalance(total)
      }
      if (txRes.data) setTransactions(txRes.data)
      setLoading(false)
    }

    fetchBalanceAndTransactions()
  }, [profile])

  // Get leaderboard - calculate from match_stats + MOTM (like standings)
  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Parallel queries for speed
      const [matchesRes, statsRes, motmRes] = await Promise.all([
        supabase.from('matches').select('id'),
        supabase.from('match_stats').select('player_id, match_id, goals, assists, is_winner, played_as_gk, clean_sheet'),
        supabase.from('man_of_the_match_winners').select('player_id, match_id'),
      ])
      
      const matches = matchesRes.data
      if (!matches) return
      const matchIds = matches.map(m => m.id)
      const allStats = statsRes.data || []
      const motmWinners = motmRes.data || []
      
      // Calculate coins for each player
      const coinsMap: Record<string, number> = {}
      
      // Initialize all players with 0
      PLAYERS.forEach(p => coinsMap[p.id] = 0)
      
      // Add points from match stats
      allStats?.forEach(s => {
        if (matchIds.includes(s.match_id)) {
          coinsMap[s.player_id] = (coinsMap[s.player_id] || 0) +
            (s.goals || 0) * 5 +
            (s.assists || 0) * 3 +
            (s.is_winner ? 10 : 0) +
            (s.clean_sheet ? 4 : 0) +
            (s.played_as_gk && s.clean_sheet ? 5 : 0)
        }
      })
      
      // Add MOTM points
      motmWinners?.forEach(m => {
        if (matchIds.includes(m.match_id)) {
          coinsMap[m.player_id] = (coinsMap[m.player_id] || 0) + 3
        }
      })
      
      // Create sorted leaderboard
      const sorted = Object.entries(coinsMap)
        .map(([player_id, total]) => ({ player_id, total }))
        .sort((a, b) => b.total - a.total)
      
      setLeaderboard(sorted)
    }
    fetchLeaderboard()
  }, [])

  const player = PLAYERS.find(p => p.id === profile?.player_id)

  return (
    <div className="space-y-6">
      {/* My Balance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 border border-yellow-500/30 text-center"
      >
        <Coins className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
        <div className="text-sm text-gray-400">Your Coin Balance</div>
        <div className="text-5xl font-black text-yellow-400">{balance}</div>
        <p className="text-sm text-gray-500 mt-2">
          {player ? `${player.name}'s account` : 'Your account'}
        </p>
      </motion.div>

      {/* Transactions */}
      <div className="space-y-3">
        <h2 className="font-bold flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Activity
        </h2>
        
        {transactions.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            No transactions yet
          </div>
        ) : (
          transactions.map(tx => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass rounded-xl p-3 border border-white/10 flex justify-between items-center"
            >
              <div>
                <div className="text-sm">{tx.reason || 'Coin transaction'}</div>
                <div className="text-xs text-gray-500">
                  {new Date(tx.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className={`font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {tx.amount >= 0 ? '+' : ''}{tx.amount}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Leaderboard (Public) */}
      <div className="space-y-3">
        <h2 className="font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          Coin Leaderboard
        </h2>
        
        {(showAllLeaderboard ? leaderboard : leaderboard.slice(0, 7)).map((entry, index) => {
          const p = PLAYERS.find(pl => pl.id === entry.player_id)
          if (!p) return null
          
          const displayIndex = showAllLeaderboard ? index : leaderboard.findIndex(e => e.player_id === entry.player_id)
          
          return (
            <motion.div
              key={entry.player_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (showAllLeaderboard ? index : displayIndex) * 0.05 }}
              className={`glass rounded-xl p-3 border ${
                displayIndex === 0 ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10'
              } flex items-center gap-3`}
            >
              <div className="text-lg font-bold w-8">
                {displayIndex === 0 ? '🥇' : displayIndex === 1 ? '🥈' : displayIndex === 2 ? '🥉' : displayIndex + 1}
              </div>
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: p.color }}
              >
                {p.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 font-bold">{p.name}</div>
              <div className="text-yellow-400 font-bold">{entry.total}</div>
            </motion.div>
          )
        })}
        
        {leaderboard.length > 7 && !showAllLeaderboard && (
          <button
            onClick={() => setShowAllLeaderboard(true)}
            className="w-full py-2 text-center text-gray-400 hover:text-white text-sm"
          >
            View More ({leaderboard.length - 7} more)
          </button>
        )}
      </div>

      {/* Shop Preview */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-4 border border-purple-500/30"
      >
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-5 h-5 text-purple-400" />
          <span className="font-bold">Spend Coins</span>
        </div>
        <p className="text-sm text-gray-400">
          Coming soon: Captain's Pick Token, profile badges
        </p>
      </motion.div>
    </div>
  )
}

export default function CoinsPage() {
  return (
    <div className="min-h-screen pb-20">
      <Header title="Coins" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <Suspense fallback={<CoinsSkeleton />}>
          <CoinsContent />
        </Suspense>
      </main>

      <Navigation activePath="/coins" />
    </div>
  )
}