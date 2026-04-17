'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Check, User, Users } from 'lucide-react'

export default function SelectProfilePage() {
  const router = useRouter()
  const { user, linkPlayer } = useAuth()
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSpectator, setIsSpectator] = useState(false)

  const handleConfirm = async () => {
    if (!user) return
    setIsLoading(true)
    
    if (isSpectator) {
      // Mark as spectator
      await supabase.from('user_profiles').upsert({
        google_id: user.id,
        player_id: null,
        role: 'spectator',
      })
    } else if (selectedPlayer) {
      await linkPlayer(selectedPlayer)
    }
    
    router.push('/')
  }

  const selected = PLAYERS.find(p => p.id === selectedPlayer)

  return (
    <div className="min-h-screen">
      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Users className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <h1 className="text-2xl font-bold">Who are you?</h1>
          <p className="text-gray-400">Select your profile to link</p>
        </motion.div>

        {/* Player Selection */}
        <div className="space-y-2">
          <h2 className="font-semibold mb-3">Players</h2>
          <div className="grid grid-cols-2 gap-2">
            {PLAYERS.map(player => (
              <motion.button
                key={player.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setSelectedPlayer(player.id); setIsSpectator(false) }}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                  selectedPlayer === player.id && !isSpectator
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="font-medium">{player.name}</span>
                {selectedPlayer === player.id && !isSpectator && (
                  <Check className="w-5 h-5 text-green-400 ml-auto" />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Spectator Option */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => { setSelectedPlayer(null); setIsSpectator(true) }}
          className={`w-full p-4 rounded-xl border flex items-center gap-3 transition-colors ${
            isSpectator
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-white/10 hover:border-white/30'
          }`}
        >
          <User className="w-6 h-6 text-blue-400" />
          <div className="text-left">
            <div className="font-medium">I'm a Spectator</div>
            <div className="text-sm text-gray-400">View everything, vote for Man of the Match</div>
          </div>
          {isSpectator && <Check className="w-5 h-5 text-blue-400 ml-auto" />}
        </motion.button>

        {/* Confirm Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={(!selectedPlayer && !isSpectator) || isLoading}
          onClick={handleConfirm}
          className="w-full py-4 rounded-2xl bg-green-500 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading 
            ? 'Linking...' 
            : selected 
              ? `I am ${selected.name}` 
              : isSpectator 
                ? 'Continue as Spectator' 
                : 'Select a profile'}
        </motion.button>

        <p className="text-center text-sm text-gray-500">
          Your Google account will be linked to this profile
        </p>
      </main>
    </div>
  )
}