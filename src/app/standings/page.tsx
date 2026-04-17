'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PLAYERS, POINTS_SYSTEM } from '../../lib/constants'
import { Navigation, Header } from '../../components/Navigation'

type SortKey = 'points' | 'goals' | 'assists' | 'wins' | 'coins'

export default function StandingsPage() {
  const [sortBy, setSortBy] = useState<SortKey>('points')
  const [players, setPlayers] = useState(PLAYERS)

  // In v2, this would fetch from Supabase
  // For now, sort the local data
  const sorted = [...players].sort((a, b) => {
    // This is placeholder - real data would come from Supabase
    return a.name.localeCompare(b.name)
  })

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Standings" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        {/* Sort Options */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {([
            { key: 'points', label: 'Points' },
            { key: 'goals', label: 'Goals' },
            { key: 'assists', label: 'Assists' },
            { key: 'wins', label: 'Wins' },
            { key: 'coins', label: 'Coins' },
          ] as const).map(item => (
            <button
              key={item.key}
              onClick={() => setSortBy(item.key)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                sortBy === item.key 
                  ? 'bg-green-500 text-black' 
                  : 'glass border border-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Standings Table */}
        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="p-3 text-left font-semibold">#</th>
                <th className="p-3 text-left font-semibold">Player</th>
                <th className="p-3 text-center font-semibold">Pts</th>
                <th className="p-3 text-center font-semibold hidden">G</th>
                <th className="p-3 text-center font-semibold hidden">A</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((player, index) => (
                <motion.tr
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border-t border-white/5 ${index < 3 ? 'bg-yellow-500/5' : ''}`}
                >
                  <td className="p-3 font-bold">{getRankEmoji(index + 1)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: player.color }}
                      />
                      <span className="font-medium">{player.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center font-bold text-green-400">0</td>
                  <td className="p-3 text-center hidden">0</td>
                  <td className="p-3 text-center hidden">0</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          Data loads from database in v2
        </div>
      </main>

      <Navigation activePath="/standings" />
    </div>
  )
}