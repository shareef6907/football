'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS } from '@/lib/constants'
import { User, LogOut, Shield, Check, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function ProfilePage() {
  const { user, profile, linkPlayer, signOut } = useAuth()
  const router = useRouter()
  const [showSelect, setShowSelect] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleSelectPlayer = async (playerId: string) => {
    if (!user) return
    await supabase.from('user_profiles').upsert({
      google_id: user.id,
      player_id: playerId,
      role: 'player',
    }, { onConflict: 'google_id' })
    // Refresh by calling linkPlayer which will update context
    await linkPlayer(playerId)
    setShowSelect(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Please log in to view your profile</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-lg">Profile</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="glass rounded-2xl p-6 border border-white/10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-2xl font-bold">
            {profile?.players?.name || (profile?.role === 'spectator' ? 'Spectator' : 'No Player Selected')}
          </h2>
          <p className="text-gray-400">{user.email}</p>
        </div>

        {/* Select Player Button */}
        <button
          onClick={() => setShowSelect(!showSelect)}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
        >
          <span>Change Player</span>
          <ChevronRight className={`w-5 h-5 transition-transform ${showSelect ? 'rotate-90' : ''}`} />
        </button>

        {/* Player Selection */}
        {showSelect && (
          <div className="grid grid-cols-2 gap-2">
            {PLAYERS.map(player => (
              <button
                key={player.id}
                onClick={() => handleSelectPlayer(player.id)}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 ${
                  profile?.player_id === player.id
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.slice(0,2).toUpperCase()}
                </div>
                <span>{player.name}</span>
                {profile?.player_id === player.id && (
                  <Check className="w-5 h-5 text-green-400 ml-auto" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-4 rounded-2xl bg-red-500/20 text-red-400 font-bold flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </main>
    </div>
  )
}