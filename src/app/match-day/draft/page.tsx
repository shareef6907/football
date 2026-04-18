'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Users, Clock, Trophy, Lock, ArrowRight, Check, User, Zap, Crown, Sparkles } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

interface DraftState {
  id: string
  match_id: string
  status: string
  num_teams: number
  team_size: number
  current_turn_team: number
  current_pick_number: number
  pick_time_limit: number
}

interface DraftPick {
  pick_number: number
  team_number: number
  picked_player_id: string
  was_auto_pick: boolean
}

interface Captain {
  player_id: string
  team_number: number
  was_auto_selected: boolean
}

function LiveDraftContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const { user, profile, loading: authLoading } = useAuth()
  
  // Get players from localStorage (set by /match-day page)
  const getInitialPlayers = () => {
    try {
      const stored = localStorage.getItem('draft_players')
      // Clear it after reading to prevent stale data
      localStorage.removeItem('draft_players')
      return stored ? JSON.parse(stored) : []
    } catch {
      localStorage.removeItem('draft_players')
      return []
    }
  }
  
  const [draftState, setDraftState] = useState<DraftState | null>(null)
  const [picks, setPicks] = useState<DraftPick[]>([])
  const [availablePlayers, setAvailPlayers] = useState<string[]>(getInitialPlayers())
  const [captains, setCaptains] = useState<Captain[]>([])
  const [selectedCaptains, setSelectedCaptains] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [isMyTurn, setIsMyTurn] = useState(false)
  const [myTeam, setMyTeam] = useState<number | null>(null)
  const [isCaptain, setIsCaptain] = useState(false)

  // Initial load
  useEffect(() => {
    if (!sessionId) {
      router.push('/match-day')
      return
    }
    
    const loadDraft = async () => {
      const { data: draft } = await supabase
        .from('draft_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (draft) {
        setDraftState(draft)
        
        const { data: existingPicks } = await supabase
          .from('draft_picks')
          .select('*')
          .eq('draft_session_id', sessionId)
          .order('pick_number')
        
        if (existingPicks) {
          setPicks(existingPicks)
          const pickedIds = existingPicks.map((p: any) => p.picked_player_id)
          setAvailPlayers(prev => prev.filter((id: any) => !pickedIds.includes(id)))
        } else if (!draft.current_pick_number) {
          const { data: attendance } = await supabase
            .from('attendance')
            .select('player_id')
            .eq('match_id', draft.match_id)
          
          if (attendance) {
            setAvailPlayers(attendance.map((a: any) => a.player_id))
          }
        }
        
        // Load captains
        const { data: draftCaptains } = await supabase
          .from('draft_captains')
          .select('*')
          .eq('draft_session_id', sessionId)
        
        if (draftCaptains && draftCaptains.length > 0) {
          setCaptains(draftCaptains)
          setSelectedCaptains(draftCaptains.map((c: any) => c.player_id))
        }
        
        const { data: captain } = await supabase
          .from('draft_captains')
          .select('*')
          .eq('draft_session_id', sessionId)
          .eq('player_id', profile?.player_id)
          .single()
        
        if (captain) {
          setIsCaptain(true)
          setMyTeam(captain.team_number)
        }
      }
    }

    if (!authLoading) {
      loadDraft()
    }
  }, [sessionId, profile, authLoading, router])

  useEffect(() => {
    if (!draftState || draftState.status !== 'drafting') return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev <= 1 ? 30 : prev - 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [draftState])

  useEffect(() => {
    if (!sessionId) return

    const channel = supabase
      .channel('draft:' + sessionId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'draft_picks',
        filter: 'draft_session_id=eq.' + sessionId,
      }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const newPick = payload.new
          setPicks(prev => [...prev, newPick])
          setAvailPlayers(prev => 
            prev.filter(id => id !== newPick.picked_player_id)
          )
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId])

  useEffect(() => {
    if (!draftState || !isCaptain) return
    setIsMyTurn(isCaptain && draftState.current_turn_team === myTeam)
  }, [draftState, isCaptain, myTeam])

  const handlePick = async (playerId: string) => {
    if (!isMyTurn || !draftState || !profile?.player_id) return

    const nextPickNum = draftState.current_pick_number + 1
    
    await supabase.from('draft_picks').insert({
      draft_session_id: sessionId,
      pick_number: nextPickNum,
      team_number: draftState.current_turn_team,
      captain_id: profile.player_id,
      picked_player_id: playerId,
    })

    const nextTeam = draftState.current_turn_team % draftState.num_teams + 1
    await supabase
      .from('draft_sessions')
      .update({
        current_pick_number: nextPickNum,
        current_turn_team: nextTeam,
      })
      .eq('id', sessionId)

    setAvailPlayers(prev => prev.filter(id => id !== playerId))
  }

  const teamNames = ['Red', 'Blue', 'Green', 'Yellow']
  const teamColors = ['#EF4444', '#3B82F6', '#22C55E', '#EAB308']

  const getPlayerById = (id: string) => PLAYERS.find(p => p.id === id)

  // === SETUP PHASE: Captain Selection (when status is 'setup' and no captains assigned yet) ===
  if (draftState?.status === 'setup' && captains.length === 0) {
    const numTeams = draftState.num_teams || 2
    const captainsNeeded = numTeams

    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Crown className="w-12 h-12 mx-auto mb-2 text-yellow-400" />
          <h1 className="text-2xl font-bold">Captain Selection</h1>
          <p className="text-gray-400">
            Select {captainsNeeded} captains for {numTeams} teams
          </p>
        </motion.div>

        {/* Selected Captains */}
        <div className="glass rounded-xl p-4 border border-yellow-500/30">
          <h3 className="font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Selected Captains ({selectedCaptains.length}/{captainsNeeded})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {selectedCaptains.map((playerId, index) => {
              const player = getPlayerById(playerId)
              return player ? (
                <motion.div
                  key={playerId}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ backgroundColor: teamColors[index] + '20', borderColor: teamColors[index] }}
                >
                  <Crown className="w-4 h-4" style={{ color: teamColors[index] }} />
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.slice(0, 1)}
                  </div>
                  <span className="text-sm">{player.name}</span>
                  <span className="text-xs text-gray-500">({teamNames[index]})</span>
                </motion.div>
              ) : null
            })}
          </div>
        </div>

        {/* Auto-select button */}
        <button
          onClick={() => setSelectedCaptains(availablePlayers.slice(0, numTeams))}
          className="w-full py-3 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5 text-yellow-400" />
          Auto-Select Captains
        </button>

        {/* Player Selection */}
        <div className="space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <Users className="w-4 h-4" />
            Tap to assign as captain:
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {availablePlayers.map((playerId: string) => {
              const player = getPlayerById(playerId)
              if (!player) return null
              const isSelected = selectedCaptains.includes(playerId)
              
              return (
                <motion.button
                  key={playerId}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (selectedCaptains.includes(playerId)) {
                      setSelectedCaptains(prev => prev.filter(id => id !== playerId))
                    } else if (selectedCaptains.length < numTeams) {
                      setSelectedCaptains(prev => [...prev, playerId])
                    }
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-yellow-500 bg-yellow-500/20'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm mx-auto mb-1"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-xs">{player.name}</div>
                  {isSelected && (
                    <Crown className="w-4 h-4 mx-auto mt-1 text-yellow-400" />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Start Draft Button */}
        {selectedCaptains.length === captainsNeeded && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              // Save captains to database
              const captainRecords = selectedCaptains.map((playerId, index) => ({
                draft_session_id: sessionId,
                player_id: playerId,
                team_number: index + 1,
                was_auto_selected: false,
              }))
              await supabase.from('draft_captains').insert(captainRecords)
              setCaptains(captainRecords)
              // Update draft status to drafting
              await supabase.from('draft_sessions').update({ status: 'drafting' }).eq('id', sessionId)
              setDraftState(prev => prev ? { ...prev, status: 'drafting' } : null)
            }}
            className="w-full py-4 rounded-2xl bg-yellow-500 text-black font-bold flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Start Draft
          </motion.button>
        )}

        {selectedCaptains.length < captainsNeeded && (
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-gray-400">
              Select {captainsNeeded - selectedCaptains.length} more captain{captainsNeeded - selectedCaptains.length === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (draftState?.status === 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 border border-green-500/30 text-center"
      >
        <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
        <h2 className="text-2xl font-bold mb-2">Draft Complete!</h2>
        <p className="text-gray-400">Teams have been selected</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Users className="w-12 h-12 mx-auto mb-2 text-purple-400" />
        <h1 className="text-2xl font-bold">Live Team Selection by Captains</h1>
        <p className="text-gray-400">
          {draftState?.num_teams} teams • {draftState?.team_size}v{draftState?.team_size}
        </p>
      </motion.div>

      <AnimatePresence>
        {isMyTurn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 border border-yellow-500/30 animate-pulse"
          >
            <div className="flex items-center justify-between mb-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              <span className="font-bold text-yellow-400">Your Turn!</span>
              <Crown className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="text-3xl font-black">{timeLeft}s</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: draftState?.num_teams || 2 }, (_, i) => i + 1).map(teamNum => {
          const teamPicks = picks.filter(p => p.team_number === teamNum)
          return (
            <motion.div
              key={teamNum}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border overflow-hidden"
              style={{
                borderColor: teamColors[teamNum - 1],
                background: teamColors[teamNum - 1] + '15',
              }}
            >
              <div 
                className="px-4 py-2 flex justify-between items-center"
                style={{ backgroundColor: teamColors[teamNum - 1] }}
              >
                <span className="font-bold text-black">
                  {teamNames[teamNum - 1]} Team
                </span>
                <span className="text-xs text-black/70">
                  {teamPicks.length} picked
                </span>
              </div>
              <div className="p-3 space-y-2">
                {teamPicks.map((pick: any, idx: number) => {
                  const player = getPlayerById(pick.picked_player_id)
                  return player ? (
                    <div key={idx} className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.name.slice(0, 1)}
                      </div>
                      <span className="text-sm">{player.name}</span>
                    </div>
                  ) : null
                })}
              </div>
            </motion.div>
          )
        })}
      </div>

      {isMyTurn && (
        <div className="space-y-3">
          <h3 className="font-bold">Pick a player:</h3>
          <div className="grid grid-cols-3 gap-2">
            {availablePlayers.map((playerId: string) => {
              const player = getPlayerById(playerId)
              if (!player) return null
              
              return (
                <motion.button
                  key={playerId}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handlePick(playerId)}
                  className="p-3 rounded-xl border border-white/10 hover:border-green-500 bg-white/5 text-center"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm mx-auto mb-1"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-xs">{player.name}</div>
                  <div className="text-xs text-gray-500">{player.position}</div>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {!isMyTurn && draftState?.status === 'drafting' && (
        <div className="text-center p-4 rounded-xl bg-white/5">
          <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400 animate-pulse" />
          <p className="text-gray-400">
            Waiting for {teamNames[(draftState.current_turn_team || 1) - 1]} captain to pick...
          </p>
        </div>
      )}

      {/* Draft Complete - Show Confirm Button */}
      {draftState?.status === 'drafting' && picks.length >= (draftState.num_teams * draftState.team_size) && (
        <button 
          onClick={() => router.push('/match-day/submit')}
          className="w-full py-4 rounded-2xl bg-green-500 text-black font-bold flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5" />
          Confirm Teams & Start Match
        </button>
      )}

      {!isCaptain && (
        <div className="text-center p-4 rounded-xl bg-white/5">
          <p className="text-gray-400">You're spectating the draft</p>
        </div>
      )}
    </div>
  )
}

export default function LiveDraftPage() {
  return (
    <div className="min-h-screen pb-20">
      <Header title="Live Team Selection by Captains" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <Suspense fallback={
          <div className="text-center p-8">
            <div className="animate-pulse">Loading draft...</div>
          </div>
        }>
          <LiveDraftContent />
        </Suspense>
      </main>

      <Navigation activePath="/match-day" />
    </div>
  )
}