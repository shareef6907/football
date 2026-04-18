'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS, TEAM_SIZES, NUM_TEAMS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Users, Plus, UserPlus, Zap, UsersRound, ArrowRight, Check, X, Calendar, Rocket, Clock } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

interface MatchSetup {
  date: string
  attending: (string | null)[]
  guests: string[]
  teamSize: number
  numTeams: number
}

function MatchDayContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, loading: authLoading } = useAuth()
  const [setup, setSetup] = useState<MatchSetup>({
    date: getNextThursday(),
    attending: [],
    guests: [],
    teamSize: 7,
    numTeams: 2,
  })
  const [guestName, setGuestName] = useState('')
  const [showGuestInput, setShowGuestInput] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  function getNextThursday() {
    const today = new Date()
    const daysUntilThursday = (4 - today.getDay() + 7) % 7 || 7
    const nextThursday = new Date(today)
    nextThursday.setDate(today.getDate() + daysUntilThursday)
    return nextThursday.toISOString().split('T')[0]
  }

  const togglePlayer = (playerId: string) => {
    setSetup(prev => ({
      ...prev,
      attending: prev.attending.includes(playerId)
        ? prev.attending.filter(id => id !== playerId)
        : [...prev.attending, playerId],
    }))
  }

  const addGuest = () => {
    if (!guestName.trim()) return
    setSetup(prev => ({
      ...prev,
      guests: [...prev.guests, guestName.trim()],
    }))
    setGuestName('')
    setShowGuestInput(false)
  }

  const removeGuest = (index: number) => {
    setSetup(prev => ({
      ...prev,
      guests: prev.guests.filter((_, i) => i !== index),
    }))
  }

  const handleCreateMatch = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (setup.attending.length < 4) {
      alert('Need at least 4 players to create a match')
      return
    }
    
    setIsCreating(true)
    
    // Create match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        match_date: setup.date,
        team_size: setup.teamSize,
        num_teams: setup.numTeams,
        created_by: profile?.player_id,
      })
      .select()
      .single()
    
    if (matchError) {
      alert(matchError.message)
      setIsCreating(false)
      return
    }
    
    // Auto-add self if not attending
    if (profile?.player_id && !setup.attending.includes(profile.player_id)) {
      setSetup(prev => ({ 
        ...prev, 
        attending: [...prev.attending, profile.player_id] 
      }))
    }
    
    // Mark attendance for all attending players
    const attendanceRecords = setup.attending.map(playerId => ({
      player_id: playerId,
      match_id: match.id,
      attended: true,
    }))
    
    await supabase.from('attendance').insert(attendanceRecords)
    
    setIsCreating(false)
    router.push(`/match-day/submit?match=${match.id}`)
  }

  const handleLiveDraft = async () => {
    if (!user) {
      router.push('/login')
      return
    }
    
    if (setup.attending.length < 4) {
      alert('Need at least 4 players to start a draft')
      return
    }
    
    setIsCreating(true)
    
    // Create match first
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        match_date: setup.date,
        team_size: setup.teamSize,
        num_teams: setup.numTeams,
        created_by: profile?.player_id,
      })
      .select()
      .single()
    
    if (matchError) {
      alert(matchError.message)
      setIsCreating(false)
      return
    }
    
    // Mark attendance
    const attendanceRecords = setup.attending.map(playerId => ({
      player_id: playerId,
      match_id: match.id,
      attended: true,
    }))
    await supabase.from('attendance').insert(attendanceRecords)
    
    // Create draft session
    const { data: draft, error: draftError } = await supabase
      .from('draft_sessions')
      .insert({
        match_id: match.id,
        num_teams: setup.numTeams,
        team_size: setup.teamSize,
        status: 'setup',
        pick_time_limit: 30,
        created_by: profile?.player_id,
      })
      .select()
      .single()
    
    if (draftError) {
      alert(draftError.message)
      setIsCreating(false)
      return
    }
    
    setIsCreating(false)
    router.push(`/match-day/draft?session=${draft.id}&players=${setup.attending.join(',')}`)
  }

  const totalPlayers = setup.attending.length + setup.guests.length
  const playersNeeded = setup.teamSize * setup.numTeams

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-gray-400">
          <Calendar className="w-4 h-4" />
          Game Date
        </label>
        <input
          type="date"
          value={setup.date}
          onChange={(e) => setSetup(prev => ({ ...prev, date: e.target.value }))}
          className="w-full p-4 rounded-xl bg-white/5 border border-white/10"
        />
      </div>

      {/* Team Format */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-gray-400 text-sm">Team Size</label>
          <select
            value={setup.teamSize}
            onChange={(e) => setSetup(prev => ({ ...prev, teamSize: Number(e.target.value) }))}
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10"
          >
            {TEAM_SIZES.map(size => (
              <option key={size} value={size}>{size}v{size}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-gray-400 text-sm">Teams</label>
          <select
            value={setup.numTeams}
            onChange={(e) => setSetup(prev => ({ ...prev, numTeams: Number(e.target.value) }))}
            className="w-full p-4 rounded-xl bg-white/5 border border-white/10"
          >
            {NUM_TEAMS.map(num => (
              <option key={num} value={num}>{num} Teams</option>
            ))}
          </select>
        </div>
      </div>

      {/* Attendance */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-gray-400">
            <Users className="w-4 h-4" />
            Attendance ({totalPlayers}/{playersNeeded})
          </label>
          {totalPlayers < playersNeeded && (
            <span className="text-red-400 text-sm">Need {playersNeeded - totalPlayers} more</span>
          )}
          {totalPlayers >= playersNeeded && (
            <span className="text-green-400 text-sm">✓ Ready</span>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {PLAYERS.map(player => (
            <motion.button
              key={player.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => togglePlayer(player.id)}
              className={`p-2 rounded-lg border text-sm transition-colors ${
                setup.attending.includes(player.id)
                  ? 'border-green-500 bg-green-500/20'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              {player.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Add Guest */}
      <div className="space-y-2">
        <button
          onClick={() => setShowGuestInput(true)}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Guest
        </button>
        
        {setup.guests.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {setup.guests.map((guest, index) => (
              <div
                key={index}
                className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center gap-2"
              >
                <span className="text-sm">{guest}</span>
                <button onClick={() => removeGuest(index)}>
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {showGuestInput && (
          <div className="flex gap-2">
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest name"
              className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10"
              onKeyDown={(e) => e.key === 'Enter' && addGuest()}
            />
            <button
              onClick={addGuest}
              className="px-4 rounded-xl bg-green-500 text-black"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Mode Selection */}
      {totalPlayers >= setup.teamSize * setup.numTeams && !authLoading && (
        <div className="grid grid-cols-2 gap-4 pt-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/match-day/auto?players=${setup.attending.join(',')}&size=${setup.teamSize}&teams=${setup.numTeams}`)}
            className="p-6 rounded-2xl border border-green-500/30 bg-green-500/10 text-center"
          >
            <Zap className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <div className="font-bold">Auto Balance Teams</div>
            <div className="text-sm text-gray-400">Generate balanced teams</div>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLiveDraft}
            disabled={isCreating}
            className="p-6 rounded-2xl border border-purple-500/30 bg-purple-500/10 text-center disabled:opacity-50"
          >
            <UsersRound className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <div className="font-bold">Live Team Selection by Captains</div>
            <div className="text-sm text-gray-400">Captains choose their team one by one</div>
          </motion.button>
        </div>
      )}

      {/* Show prompt if not enough players */}
      {totalPlayers > 0 && totalPlayers < setup.teamSize * setup.numTeams && !authLoading && (
        <div className="text-center p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-yellow-400">
            Select {setup.teamSize * setup.numTeams - totalPlayers} more player(s) to generate teams
          </p>
        </div>
      )}

      {!user && !authLoading && (
        <div className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <p className="text-gray-400 mb-2">Login to set up match day</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 rounded-xl bg-green-500 text-black font-bold"
          >
            Login
          </button>
        </div>
      )}
    </div>
  )
}

export default function MatchDayPage() {
  return (
    <div className="min-h-screen pb-24">
      <Header title="Match Day" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <Suspense fallback={
          <div className="text-center p-8">
            <div className="animate-pulse">Loading...</div>
          </div>
        }>
          <MatchDayContent />
        </Suspense>
      </main>

      <Navigation activePath="/match-day" />
    </div>
  )
}