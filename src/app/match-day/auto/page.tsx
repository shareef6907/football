'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PLAYERS, Position, type PlayerId, type PlayerName } from '@/lib/constants'
import { Users, Shuffle, ArrowLeft, Trophy, Check } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

interface PlayerWithRating {
  id: string
  name: string
  color: string
  position: string
  rating: number
}

function AutoBalanceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const playerIds = searchParams.get('players')?.split(',').filter(Boolean) || []
  const teamSize = parseInt(searchParams.get('size') || '7')
  const numTeams = parseInt(searchParams.get('teams') || '2')
  
  const [teams, setTeams] = useState<PlayerWithRating[][]>([])
  const [isBalancing, setIsBalancing] = useState(false)

  useEffect(() => {
    if (playerIds.length >= 4) {
      balanceTeams()
    }
  }, [playerIds, teamSize, numTeams])

  const balanceTeams = () => {
    setIsBalancing(true)
    
    // Get player objects with ratings
    const playersWithRating = playerIds.map(id => {
      const player = PLAYERS.find(p => p.id === id)
      if (!player) return null
      
      // Generate a rating based on position (in real app, fetch from DB)
      const baseRating = player.position === 'goalkeeper' ? 6 :
                        player.position === 'defender' ? 7 :
                        player.position === 'midfielder' ? 8 : 7
      
      return { ...player, rating: baseRating }
    }).filter(Boolean) as PlayerWithRating[]
    
    // Sort by rating (highest first)
    playersWithRating.sort((a, b) => b.rating - a.rating)
    
    // Snake draft distribution for balance
    const newTeams: PlayerWithRating[][] = Array.from({ length: numTeams }, () => [])
    
    playersWithRating.forEach((player, index) => {
      const teamIndex = index % numTeams
      // Snake pattern: 0,1,1,0,0,1,1,0...
      const snakeIndex = Math.floor(index / numTeams)
      const actualTeam = snakeIndex % 2 === 0 ? teamIndex : (numTeams - 1 - teamIndex)
      newTeams[actualTeam].push(player)
    })
    
    setTeams(newTeams)
    setIsBalancing(false)
  }

  const getTeamColor = (index: number) => {
    const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500']
    return colors[index % colors.length]
  }

  if (playerIds.length < 4) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-400">Need at least 4 players to balance teams</p>
        <button 
          onClick={() => router.push('/match-day')}
          className="mt-4 px-6 py-2 bg-green-500 rounded-xl text-black font-bold"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <Shuffle className="w-12 h-12 mx-auto mb-2 text-green-400" />
        <h1 className="text-2xl font-bold">Auto Balanced Teams</h1>
        <p className="text-gray-400">{playerIds.length} players • {teamSize}v{teamSize} • {numTeams} teams</p>
      </motion.div>

      {isBalancing ? (
        <div className="text-center p-8">
          <div className="animate-pulse text-gray-400">Balancing teams...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team, teamIndex) => (
            <motion.div
              key={teamIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: teamIndex * 0.1 }}
              className={`glass rounded-2xl p-4 border ${teamIndex === 0 ? 'border-blue-500/30' : 'border-red-500/30'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${teamIndex === 0 ? 'bg-blue-500' : 'bg-red-500'} text-white`}>
                  {teamIndex === 0 ? 'Team A' : 'Team B'}
                </div>
                <div className="text-sm text-gray-400">
                  Avg Rating: {(team.reduce((sum, p) => sum + p.rating, 0) / team.length).toFixed(1)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {team.map(player => (
                  <div 
                    key={player.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: player.color }}
                    >
                      {player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{player.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{player.position}</div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: player.color }}>
                      {player.rating}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <button 
        onClick={balanceTeams}
        className="w-full py-3 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center gap-2"
      >
        <Shuffle className="w-4 h-4" />
        Re-balance
      </button>

      {/* Confirm Teams Button */}
      <button 
        onClick={() => router.push('/match-day/submit')}
        className="w-full py-4 rounded-2xl bg-green-500 text-black font-bold flex items-center justify-center gap-2"
      >
        <Check className="w-5 h-5" />
        Confirm Teams & Start Match
      </button>

      <button 
        onClick={() => router.push('/match-day')}
        className="w-full py-3 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Match Day
      </button>
    </div>
  )
}

export default function AutoBalancePage() {
  return (
    <div className="min-h-screen pb-20">
      <Header title="Auto Balance" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <Suspense fallback={
          <div className="text-center p-8">
            <div className="animate-pulse">Loading...</div>
          </div>
        }>
          <AutoBalanceContent />
        </Suspense>
      </main>

      <Navigation activePath="/match-day" />
    </div>
  )
}