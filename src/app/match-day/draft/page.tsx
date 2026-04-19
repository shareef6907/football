'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { 
  Crown, Clock, Trophy, Users, UserPlus, Zap, 
  ArrowRight, Check, X, Sparkles, Eye, EyeOff,
  ChevronDown, ChevronUp, Share2, RefreshCw
} from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

// ============== TYPES ==============
interface DraftSession {
  id: string
  match_id: string
  status: 'setup' | 'drafting' | 'completed' | 'cancelled'
  num_teams: number
  team_size: number
  current_turn_team: number
  current_pick_number: number
  pick_time_limit: number
  attending_player_ids: string[]
}

interface DraftCaptain {
  id: string
  draft_session_id: string
  player_id: string
  team_number: number
  was_auto_selected: boolean
}

interface DraftPick {
  id: string
  draft_session_id: string
  pick_number: number
  team_number: number
  captain_id: string
  picked_player_id: string
  was_auto_pick: boolean
  picked_at: string
}

// ============== CONSTANTS ==============
const TEAM_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#EAB308'] // Red, Blue, Green, Yellow
const TEAM_NAMES = ['Red', 'Blue', 'Green', 'Yellow']
const PICK_TIME_LIMIT = 30

// ============== HELPER FUNCTIONS ==============
function getPlayerById(id: string) {
  return PLAYERS.find(p => p.id === id)
}

// Generate snake draft order for N teams
// 2 teams: [1,2,2,1,1,2,2,1...]
// 3 teams: [1,2,3,3,2,1,1,2,3,3,2,1...]
function generateSnakeOrder(numTeams: number, totalPicks: number): number[] {
  const order: number[] = []
  for (let i = 0; i < totalPicks; i++) {
    const round = Math.floor(i / numTeams)
    const positionInRound = i % numTeams
    
    // Snake: forward on odd rounds, backward on even rounds
    if (round % 2 === 0) {
      order.push(positionInRound + 1) // 1,2,3,4...
    } else {
      order.push(numTeams - positionInRound) // 4,3,2,1...
    }
  }
  return order
}

// ============== MAIN COMPONENT ==============
function DraftContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const { user, profile, loading: authLoading } = useAuth()
  
  // Game state
  const [draftSession, setDraftSession] = useState<DraftSession | null>(null)
  const [captains, setCaptains] = useState<DraftCaptain[]>([])
  const [picks, setPicks] = useState<DraftPick[]>([])
  const [availablePlayerIds, setAvailablePlayerIds] = useState<string[]>([])
  
  // Identity
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [myTeamNumber, setMyTeamNumber] = useState<number | null>(null)
  const [isCaptain, setIsCaptain] = useState(false)
  const [isCurrentCaptain, setIsCurrentCaptain] = useState(false)
  
  // Timer
  const [timeLeft, setTimeLeft] = useState(PICK_TIME_LIMIT)
  const [canPick, setCanPick] = useState(false)
  
  // Setup phase
  const [selectedCaptainIds, setSelectedCaptainIds] = useState<string[]>([])
  const [captainSelectMode, setCaptainSelectMode] = useState(false)
  
  // View state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ============== LOAD DRAFT SESSION ==============
  const loadDraftSession = useCallback(async () => {
    if (!sessionId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // Load draft session
      const { data: session, error: sessionError } = await supabase
        .from('draft_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()
      
      if (sessionError || !session) {
        setError('Draft session not found')
        setIsLoading(false)
        return
      }
      
      setDraftSession(session)
      
      // Get attending player IDs from session or localStorage
      let playerIds: string[] = session.attending_player_ids || []
      if (playerIds.length === 0) {
        const stored = localStorage.getItem('draft_players')
        if (stored) {
          try {
            playerIds = JSON.parse(stored)
          } catch {}
        }
      }
      setAvailablePlayerIds(playerIds)
      
      // Load captains
      const { data: captainsData } = await supabase
        .from('draft_captains')
        .select('*')
        .eq('draft_session_id', sessionId)
      
      if (captainsData) {
        setCaptains(captainsData)
        setSelectedCaptainIds(captainsData.map(c => c.player_id))
      }
      
      // Load picks
      const { data: picksData } = await supabase
        .from('draft_picks')
        .select('*')
        .eq('draft_session_id', sessionId)
        .order('pick_number')
      
      if (picksData) {
        setPicks(picksData)
        
        // Remove picked players from available
        const pickedIds = picksData.map(p => p.picked_player_id)
        setAvailablePlayerIds(prev => prev.filter(id => !pickedIds.includes(id)))
      }
      
    } catch (err) {
      console.error('Error loading draft:', err)
      setError('Failed to load draft session')
    }
    
    setIsLoading(false)
  }, [sessionId])

  // ============== SETUP AUTH & LOAD ==============
  useEffect(() => {
    if (authLoading) return
    
    // Get my player ID from profile
    if (profile?.player_id) {
      setMyPlayerId(profile.player_id)
    }
    
    if (sessionId) {
      loadDraftSession()
    }
  }, [sessionId, profile, authLoading, loadDraftSession])

  // ============== CHECK CAPTAIN IDENTITY ==============
  useEffect(() => {
    if (!draftSession || !myPlayerId || captains.length === 0) return
    
    const myCaptain = captains.find(c => c.player_id === myPlayerId)
    if (myCaptain) {
      setIsCaptain(true)
      setMyTeamNumber(myCaptain.team_number)
    }
  }, [draftSession, myPlayerId, captains])

  // ============== CHECK IF IT'S MY TURN ==============
  useEffect(() => {
    if (!draftSession || !isCaptain || !myTeamNumber) return
    
    const isMyTurn = draftSession.status === 'drafting' && 
                    draftSession.current_turn_team === myTeamNumber
    
    setIsCurrentCaptain(isMyTurn)
    setCanPick(isMyTurn)
    
    if (isMyTurn) {
      setTimeLeft(PICK_TIME_LIMIT)
    }
  }, [draftSession, isCaptain, myTeamNumber])

  // ============== TIMER ==============
  useEffect(() => {
    if (!isCurrentCaptain || !draftSession || draftSession.status !== 'drafting') return
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-pick when timer hits 0
          handleAutoPick()
          return PICK_TIME_LIMIT
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [isCurrentCaptain, draftSession])

  // ============== AUTO-PICK ==============
  const handleAutoPick = async () => {
    if (!draftSession || !canPick || availablePlayerIds.length === 0) return
    
    // Get highest rated available player
    // For now, just pick the first available
    const pickPlayerId = availablePlayerIds[0]
    if (pickPlayerId) {
      await makePick(pickPlayerId, true)
    }
  }

  // ============== MAKE A PICK ==============
  const makePick = async (pickPlayerId: string, wasAuto: boolean = false) => {
    if (!draftSession || !myPlayerId || !canPick) return
    
    const nextPickNum = (draftSession.current_pick_number || 0) + 1
    const currentTeam = draftSession.current_turn_team
    
    try {
      // Insert pick
      const { error: pickError } = await supabase
        .from('draft_picks')
        .insert({
          draft_session_id: sessionId,
          pick_number: nextPickNum,
          team_number: currentTeam,
          captain_id: myPlayerId,
          picked_player_id: pickPlayerId,
          was_auto_pick: wasAuto,
        })
      
      if (pickError) throw pickError
      
      // Calculate next team (snake draft)
      const numTeams = draftSession.num_teams
      const totalPicks = numTeams * draftSession.team_size
      const snakeOrder = generateSnakeOrder(numTeams, totalPicks)
      const nextTeamIndex = nextPickNum // 0-indexed
      const nextTeam = nextTeamIndex < snakeOrder.length 
        ? snakeOrder[nextPickNum] 
        : ((nextPickNum - 1) % numTeams) + 1
      
      // Update draft session
      const { error: updateError } = await supabase
        .from('draft_sessions')
        .update({
          current_pick_number: nextPickNum,
          current_turn_team: nextTeam,
        })
        .eq('id', sessionId)
      
      if (updateError) throw updateError
      
      // Reload to get latest state
      await loadDraftSession()
      
    } catch (err) {
      console.error('Error making pick:', err)
    }
  }

  // ============== REALTIME SUBSCRIPTION ==============
  useEffect(() => {
    if (!sessionId) return
    
    const channel = supabase
      .channel(`draft:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'draft_sessions',
        filter: `id=eq.${sessionId}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setDraftSession(prev => prev ? { ...prev, ...payload.new } : null)
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'draft_picks',
        filter: `draft_session_id=eq.${sessionId}`,
      }, (payload) => {
        loadDraftSession()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [sessionId, loadDraftSession])

  // ============== HELPERS ==============
  const getTeamPicks = (teamNumber: number) => {
    return picks.filter(p => p.team_number === teamNumber)
  }

  const getTeamCaptain = (teamNumber: number) => {
    const captain = captains.find(c => c.team_number === teamNumber)
    return captain ? getPlayerById(captain.player_id) : null
  }

  const shareDraft = () => {
    const url = `${window.location.origin}/match-day/draft?session=${sessionId}`
    navigator.clipboard.writeText(url)
    alert('Draft URL copied to clipboard!')
  }

  // ============== REDIRECT IF NO SESSION ==============
  if (!sessionId) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-400 mb-4">No draft session specified</p>
        <button 
          onClick={() => router.push('/match-day')}
          className="px-6 py-3 bg-blue-500 rounded-xl"
        >
          Go to Match Day
        </button>
      </div>
    )
  }

  // ============== LOADING ==============
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse text-gray-400">Loading draft...</div>
      </div>
    )
  }

  // ============== ERROR ==============
  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={() => router.push('/match-day')}
          className="px-6 py-3 bg-blue-500 rounded-xl"
        >
          Go to Match Day
        </button>
      </div>
    )
  }

  // ============== STATE 1: SETUP (captain selection) ==============
  if (draftSession?.status === 'setup') {
    return (
      <SetupPhase
        draftSession={draftSession}
        availablePlayerIds={availablePlayerIds}
        selectedCaptainIds={selectedCaptainIds}
        setSelectedCaptainIds={setSelectedCaptainIds}
        captains={captains}
        onStartDraft={async () => {
          // Update status to drafting
          await supabase
            .from('draft_sessions')
            .update({ status: 'drafting' })
            .eq('id', sessionId)
          
          await loadDraftSession()
        }}
        onAutoSelectCaptains={async () => {
          const numTeams = draftSession.num_teams
          // Get top N rated players as captains
          const topPlayers = availablePlayerIds.slice(0, numTeams)
          
          // Delete existing captains
          await supabase
            .from('draft_captains')
            .delete()
            .eq('draft_session_id', sessionId)
          
          // Insert new captains
          for (let i = 0; i < topPlayers.length; i++) {
            await supabase
              .from('draft_captains')
              .insert({
                draft_session_id: sessionId,
                player_id: topPlayers[i],
                team_number: i + 1,
                was_auto_selected: true,
              })
          }
          
          await loadDraftSession()
        }}
        shareDraft={shareDraft}
      />
    )
  }

  // ============== STATE 2: DRAFTING ==============
  if (draftSession?.status === 'drafting') {
    return (
      <DraftingPhase
        draftSession={draftSession}
        availablePlayerIds={availablePlayerIds}
        picks={picks}
        captains={captains}
        isCurrentCaptain={isCurrentCaptain}
        isCaptain={isCaptain}
        canPick={canPick}
        timeLeft={timeLeft}
        myTeamNumber={myTeamNumber}
        onPick={makePick}
        shareDraft={shareDraft}
      />
    )
  }

  // ============== STATE 3: COMPLETED ==============
  if (draftSession?.status === 'completed') {
    return (
      <CompletedPhase
        draftSession={draftSession}
        picks={picks}
        captains={captains}
        onConfirm={() => {
          router.push('/match-day/submit')
        }}
        shareDraft={shareDraft}
      />
    )
  }

  // Unknown state
  return (
    <div className="text-center p-8">
      <p className="text-gray-400">Unknown draft state</p>
    </div>
  )
}

// ============== SETUP PHASE COMPONENT ==============
function SetupPhase({
  draftSession,
  availablePlayerIds,
  selectedCaptainIds,
  setSelectedCaptainIds,
  captains,
  onStartDraft,
  onAutoSelectCaptains,
  shareDraft,
}: {
  draftSession: DraftSession
  availablePlayerIds: string[]
  selectedCaptainIds: string[]
  setSelectedCaptainIds: (ids: string[]) => void
  captains: DraftCaptain[]
  onStartDraft: () => void
  onAutoSelectCaptains: () => void
  shareDraft: () => void
}) {
  const numTeams = draftSession.num_teams
  const captainsNeeded = numTeams
  const hasCaptains = captains.length > 0

  const toggleCaptain = (playerId: string) => {
    if (selectedCaptainIds.includes(playerId)) {
      setSelectedCaptainIds(selectedCaptainIds.filter(id => id !== playerId))
    } else if (selectedCaptainIds.length < captainsNeeded) {
      setSelectedCaptainIds([...selectedCaptainIds, playerId])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Share Button */}
      <button
        onClick={shareDraft}
        className="w-full py-3 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share Draft Link
      </button>

      {/* Selected Captains Display */}
      {hasCaptains && (
        <div className="glass rounded-xl p-4 border border-yellow-500/30">
          <h3 className="font-bold text-yellow-400 mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Selected Captains ({captains.length}/{captainsNeeded})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {captains.map((c) => {
              const player = getPlayerById(c.player_id)
              return player ? (
                <div
                  key={c.player_id}
                  className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ 
                    backgroundColor: TEAM_COLORS[c.team_number - 1] + '20',
                    borderColor: TEAM_COLORS[c.team_number - 1]
                  }}
                >
                  <Crown className="w-4 h-4" style={{ color: TEAM_COLORS[c.team_number - 1] }} />
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <span className="text-sm">{player.name}</span>
                  <span className="text-xs text-gray-500">({TEAM_NAMES[c.team_number - 1]})</span>
                </div>
              ) : null
            })}
          </div>
        </div>
      )}

      {/* Player Cards for Selection */}
      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Available Players
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {availablePlayerIds.map((playerId) => {
            const player = getPlayerById(playerId)
            if (!player) return null
            
            const isSelected = selectedCaptainIds.includes(playerId)
            
            return (
              <motion.button
                key={playerId}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleCaptain(playerId)}
                className={`
                  p-3 rounded-xl border text-center transition-all
                  ${isSelected 
                    ? 'border-yellow-500 bg-yellow-500/20' 
                    : 'border-white/10 bg-white/5 hover:border-white/30'
                  }
                `}
              >
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm mx-auto mb-1"
                  style={{ backgroundColor: player.color }}
                >
                  {player.name.charAt(0)}
                </div>
                <div className="text-xs truncate">{player.name}</div>
                <div className="text-xs text-gray-500">{player.position}</div>
                {isSelected && (
                  <div className="mt-1">
                    <Crown className="w-4 h-4 mx-auto text-yellow-400" />
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onAutoSelectCaptains}
          className="w-full py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Auto-Select Captains
        </button>

        {captains.length === captainsNeeded && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onStartDraft}
            className="w-full py-4 rounded-2xl bg-yellow-500 text-black font-bold flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            Start Draft
          </motion.button>
        )}
      </div>
    </div>
  )
}

// ============== DRAFTING PHASE COMPONENT ==============
function DraftingPhase({
  draftSession,
  availablePlayerIds,
  picks,
  captains,
  isCurrentCaptain,
  isCaptain,
  canPick,
  timeLeft,
  myTeamNumber,
  onPick,
  shareDraft,
}: {
  draftSession: DraftSession
  availablePlayerIds: string[]
  picks: DraftPick[]
  captains: DraftCaptain[]
  isCurrentCaptain: boolean
  isCaptain: boolean
  canPick: boolean
  timeLeft: number
  myTeamNumber: number | null
  onPick: (playerId: string, wasAuto?: boolean) => void
  shareDraft: () => void
}) {
  const numTeams = draftSession.num_teams
  const currentTeam = draftSession.current_turn_team
  
  // Get current captain name
  const currentCaptain = captains.find(c => c.team_number === currentTeam)
  const currentCaptainPlayer = currentCaptain ? getPlayerById(currentCaptain.player_id) : null

  return (
    <div className="space-y-4">
      {/* Share Button */}
      <button
        onClick={shareDraft}
        className="w-full py-2 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center gap-2 text-sm"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {/* Team Columns */}
      <div className={`grid gap-2 ${numTeams === 2 ? 'grid-cols-2' : numTeams === 3 ? 'grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        {Array.from({ length: numTeams }, (_, i) => i + 1).map((teamNum) => {
          const teamPicks = picks.filter(p => p.team_number === teamNum)
          const teamCaptain = captains.find(c => c.team_number === teamNum)
          const captain = teamCaptain ? getPlayerById(teamCaptain.player_id) : null
          const isMyTeam = teamNum === myTeamNumber
          const isTurn = teamNum === currentTeam

          return (
            <div
              key={teamNum}
              className={`
                rounded-xl p-3 border
                ${isTurn ? 'border-yellow-500 animate-pulse' : 'border-white/10'}
              `}
              style={{ 
                backgroundColor: (TEAM_COLORS[teamNum - 1] + '10'),
              }}
            >
              {/* Team Header */}
              <div className="text-center mb-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm mx-auto mb-1"
                  style={{ backgroundColor: TEAM_COLORS[teamNum - 1] }}
                >
                  {TEAM_NAMES[teamNum - 1].charAt(0)}
                </div>
                <div className="font-bold text-sm">{TEAM_NAMES[teamNum - 1]} Team</div>
                {captain && (
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                    <Crown className="w-3 h-3 text-yellow-400" />
                    {captain.name}
                  </div>
                )}
                {isMyTeam && (
                  <div className="text-xs text-blue-400">(You)</div>
                )}
              </div>

              {/* Players Picked */}
              <div className="space-y-1">
                {teamPicks.length === 0 && (
                  <div className="text-xs text-gray-500 text-center py-2">
                    No picks yet
                  </div>
                )}
                {teamPicks.map((pick, idx) => {
                  const player = getPlayerById(pick.picked_player_id)
                  return player ? (
                    <div 
                      key={pick.id}
                      className="flex items-center gap-2 text-xs bg-black/20 rounded p-1"
                    >
                      <div 
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.name.charAt(0)}
                      </div>
                      <span className="truncate">{player.name}</span>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Current Turn Indicator */}
      <div className={`
        rounded-xl p-4 text-center border
        ${isCurrentCaptain ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10 bg-white/5'}
      `}>
        <div className="flex items-center justify-center gap-2 mb-1">
          {isCurrentCaptain ? (
            <>
              <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
              <span className="font-bold text-yellow-400">YOUR TURN!</span>
            </>
          ) : (
            <>
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-400">
                Waiting for {currentCaptainPlayer?.name || 'captain'} to pick...
              </span>
            </>
          )}
        </div>
        
        {isCurrentCaptain && (
          <div className="text-2xl font-bold mt-2" style={{ color: TEAM_COLORS[(myTeamNumber || 1) - 1] }}>
            {timeLeft}s
          </div>
        )}
      </div>

      {/* Available Players for Picking */}
      {canPick && availablePlayerIds.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Users className="w-4 h-4" />
            Pick a player:
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {availablePlayerIds.map((playerId) => {
              const player = getPlayerById(playerId)
              if (!player) return null
              
              return (
                <motion.button
                  key={playerId}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onPick(playerId)}
                  className="p-2 rounded-xl border border-green-500/50 bg-green-500/10 hover:bg-green-500/20 text-center"
                >
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs mx-auto mb-1"
                    style={{ backgroundColor: player.color }}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <div className="text-xs">{player.name}</div>
                  <div className="text-xs text-gray-500">{player.position}</div>
                </motion.button>
              )
            })}
          </div>
        </div>
      )}

      {/* Spectator View */}
      {!isCaptain && (
        <div className="text-center p-3 rounded-xl bg-white/5">
          <Eye className="w-4 h-4 mx-auto mb-1 text-gray-400" />
          <p className="text-sm text-gray-400">Spectating the draft</p>
        </div>
      )}

      {/* Waiting View (captain but not my turn) */}
      {isCaptain && !canPick && (
        <div className="text-center p-3 rounded-xl bg-white/5">
          <Clock className="w-4 h-4 mx-auto mb-1 text-gray-400" />
          <p className="text-sm text-gray-400">Waiting for your turn...</p>
        </div>
      )}

      {/* Check ifDraft Complete */}
      {picks.length >= (draftSession.num_teams * draftSession.team_size) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-6 border border-green-500/30 text-center"
        >
          <Trophy className="w-12 h-12 mx-auto mb-2 text-green-400" />
          <h2 className="text-2xl font-bold text-green-400 mb-2">Teams Complete!</h2>
          <p className="text-gray-400 mb-4">
            All {draftSession.num_teams} teams have {draftSession.team_size} players each
          </p>
        </motion.div>
      )}
    </div>
  )
}

// ============== COMPLETED PHASE COMPONENT ==============
function CompletedPhase({
  draftSession,
  picks,
  captains,
  onConfirm,
  shareDraft,
}: {
  draftSession: DraftSession
  picks: DraftPick[]
  captains: DraftCaptain[]
  onConfirm: () => void
  shareDraft: () => void
}) {
  const numTeams = draftSession.num_teams

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-6 border border-green-500/30 text-center"
      >
        <Trophy className="w-16 h-16 mx-auto mb-2 text-green-400" />
        <h2 className="text-3xl font-bold text-green-400 mb-2">Teams Complete!</h2>
        <p className="text-gray-400">
          All {numTeams} teams are ready for match day
        </p>
      </motion.div>

      {/* Share Button */}
      <button
        onClick={shareDraft}
        className="w-full py-3 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share Draft Results
      </button>

      {/* Final Team Rosters */}
      <div className={`grid gap-4 ${numTeams === 2 ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-4'}`}>
        {Array.from({ length: numTeams }, (_, i) => i + 1).map((teamNum) => {
          const teamPicks = picks.filter(p => p.team_number === teamNum)
          const teamCaptain = captains.find(c => c.team_number === teamNum)
          const captain = teamCaptain ? getPlayerById(teamCaptain.player_id) : null

          return (
            <div
              key={teamNum}
              className="rounded-xl p-4 border border-white/10"
              style={{ 
                backgroundColor: (TEAM_COLORS[teamNum - 1] + '20'),
              }}
            >
              {/* Team Header */}
              <div className="text-center mb-4 pb-3 border-b border-white/10">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg mx-auto mb-2"
                  style={{ backgroundColor: TEAM_COLORS[teamNum - 1] }}
                >
                  {TEAM_NAMES[teamNum - 1].charAt(0)}
                </div>
                <div className="font-bold text-lg">{TEAM_NAMES[teamNum - 1]} Team</div>
                {captain && (
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    {captain.name}
                  </div>
                )}
              </div>

              {/* Roster */}
              <div className="space-y-2">
                {teamPicks.map((pick, idx) => {
                  const player = getPlayerById(pick.picked_player_id)
                  return player ? (
                    <div 
                      key={pick.id}
                      className="flex items-center gap-3 bg-black/20 rounded-lg p-2"
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: player.color }}
                      >
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{player.name}</div>
                        <div className="text-xs text-gray-400">{player.position}</div>
                      </div>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Confirm Button */}
      <button 
        onClick={onConfirm}
        className="w-full py-4 rounded-2xl bg-green-500 text-black font-bold flex items-center justify-center gap-2"
      >
        <Check className="w-5 h-5" />
        Confirm Teams & Start Match
      </button>
    </div>
  )
}

// ============== MAIN PAGE EXPORT ==============
export default function LiveDraftPage() {
  return (
    <div className="min-h-screen pb-20">
      <Header title="Live Team Selection" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <Suspense fallback={
          <div className="text-center p-8">
            <div className="animate-pulse">Loading...</div>
          </div>
        }>
          <DraftContent />
        </Suspense>
      </main>

      <Navigation activePath="/match-day" />
    </div>
  )
}