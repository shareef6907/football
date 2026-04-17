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

function CoinsContent() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [leaderboard, setLeaderboard] = useState<{player_id: string, total: number}[]>([])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!profile?.player_id) return

    // Get my balance
    const fetchBalance = async () => {
      const { data } = await supabase
        .from('coins_ledger')
        .select('amount')
        .eq('player_id', profile.player_id)
      
      if (data) {
        const total = data.reduce((sum, t) => sum + t.amount, 0)
        setBalance(total)
      }
    }

    // Get my transactions
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from('coins_ledger')
        .select('*')
        .eq('player_id', profile.player_id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (data) setTransactions(data)
    }

    fetchBalance()
    fetchTransactions()
  }, [profile])

  // Get leaderboard (public)
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from('coins_ledger')
        .select('player_id, amount')
      
      if (data) {
        // Aggregate by player
        const totals: Record<string, number> = {}
        data.forEach(t => {
          totals[t.player_id] = (totals[t.player_id] || 0) + t.amount
        })
        const sorted = Object.entries(totals)
          .map(([player_id, total]) => ({ player_id, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
        setLeaderboard(sorted)
      }
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
          {player?.name}'s account
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
        
        {leaderboard.map((entry, index) => {
          const p = PLAYERS.find(pl => pl.id === entry.player_id)
          if (!p) return null
          
          return (
            <motion.div
              key={entry.player_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`glass rounded-xl p-3 border ${
                index === 0 ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/10'
              } flex items-center gap-3`}
            >
              <div className="text-lg font-bold w-8">
                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
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
        <Suspense fallback={
          <div className="text-center p-8">
            <div className="animate-pulse">Loading...</div>
          </div>
        }>
          <CoinsContent />
        </Suspense>
      </main>

      <Navigation activePath="/coins" />
    </div>
  )
}