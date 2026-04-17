'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { PLAYERS, Position } from '../../lib/constants'
import { Navigation, Header } from '../../components/Navigation'

function getPositionColor(position: Position) {
  switch (position) {
    case 'forward': return 'text-red-400'
    case 'midfielder': return 'text-blue-400'
    case 'defender': return 'text-green-400'
    case 'goalkeeper': return 'text-yellow-400'
  }
}

function getPositionAbbrev(position: Position) {
  switch (position) {
    case 'forward': return 'FWD'
    case 'midfielder': return 'MID'
    case 'defender': return 'DEF'
    case 'goalkeeper': return 'GK'
  }
}

function PlayerCard({ player, index }: { player: typeof PLAYERS[number], index: number }) {
  // Generate position ratings (placeholder - would come from Supabase)
  const ratings = {
    forward: Math.floor(Math.random() * 5) + 5,
    midfielder: Math.floor(Math.random() * 5) + 5,
    defender: Math.floor(Math.random() * 5) + 5,
    goalkeeper: player.position === 'goalkeeper' ? Math.floor(Math.random() * 3) + 8 : Math.floor(Math.random() * 3) + 3,
  }
  const overall = Math.floor((ratings.forward + ratings.midfielder + ratings.defender + ratings.goalkeeper) / 4)

  return (
    <Link href={`/players/${player.id}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative overflow-hidden rounded-2xl border border-white/10 card-hover cursor-pointer"
        style={{ 
          background: `linear-gradient(135deg, ${player.color}15 0%, transparent 50%)`
        }}
      >
        {/* Card header with colored bar */}
        <div 
          className="h-2" 
          style={{ backgroundColor: player.color }}
        />
        
        <div className="p-4">
          {/* Avatar */}
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
              style={{ 
                backgroundColor: player.color,
                boxShadow: `0 0 20px ${player.color}40`
              }}
            >
              {player.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-lg">{player.name}</h3>
              <span className={`text-xs font-semibold ${getPositionColor(player.position)}`}>
                {getPositionAbbrev(player.position)}
              </span>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold" style={{ color: player.color }}>
                {overall}
              </div>
            </div>
            
            {/* Position Ratings */}
            <div className="text-right space-y-1">
              <div className="flex gap-2 text-xs">
                <span className="text-red-400">FWD:{ratings.forward}</span>
                <span className="text-blue-400">MID:{ratings.midfielder}</span>
                <span className="text-green-400">DEF:{ratings.defender}</span>
                <span className="text-yellow-400">GK:{ratings.goalkeeper}</span>
              </div>
            </div>
          </div>

          {/* Stats placeholder */}
          <div className="mt-3 pt-3 border-t border-white/10 flex justify-around text-center text-xs text-gray-500">
            <div>
              <div className="font-bold text-white">0</div>
              <div>Goals</div>
            </div>
            <div>
              <div className="font-bold text-white">0</div>
              <div>Assists</div>
            </div>
            <div>
              <div className="font-bold text-white">0</div>
              <div>Wins</div>
            </div>
            <div>
              <div className="font-bold text-green-400">0</div>
              <div>Coins</div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

export default function PlayersPage() {
  return (
    <div className="min-h-screen pb-20">
      <Header title="Players" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {PLAYERS.map((player, index) => (
            <PlayerCard key={player.id} player={player} index={index} />
          ))}
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          Tap a card to view full profile
        </div>
      </main>

      <Navigation activePath="/players" />
    </div>
  )
}