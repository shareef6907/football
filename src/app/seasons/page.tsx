'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Trophy, Calendar, Award, Medal, Target, Star, Shield, Zap, Plus, DollarSign, User, Lock } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

interface Season {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface AwardWinner {
  player_id: string
  value: number
}

function SeasonsContent() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  
  const [seasons, setSeasons] = useState<Season[]>([])
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [awards, setAwards] = useState<Record<string, AwardWinner>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [newSeason, setNewSeason] = useState({ name: '', start: '', end: '' })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchSeasons = async () => {
      const { data } = await supabase
        .from('seasons')
        .select('*')
        .order('start_date', { ascending: false })
      
      if (data) {
        setSeasons(data)
        setCurrentSeason(data.find(s => s.is_active) || null)
      }
    }

    fetchSeasons()
  }, [])

  useEffect(() => {
    if (!currentSeason) return

    const calculateAwards = async () => {
      // Get all matches
      const { data: matches } = await supabase.from('matches').select('id')
      if (!matches) return
      const matchIds = matches.map(m => m.id)
      
      // Get all stats for these matches
      const { data: allStats } = await supabase
        .from('match_stats')
        .select('player_id, match_id, goals, assists, is_winner, played_as_gk, clean_sheet')
      
      // Get all MOTM winners
      const { data: motmWinners } = await supabase
        .from('man_of_the_match_winners')
        .select('player_id, match_id')
      
      // Get all ratings
      const { data: allRatings } = await supabase
        .from('player_ratings')
        .select('rated_player_id, forward_rating, midfielder_rating, defender_rating, goalkeeper_rating')
      
      if (!allStats) return
      
      // Golden Boot - most goals
      const goalsByPlayer: Record<string, number> = {}
      allStats.forEach(s => {
        if (matchIds.includes(s.match_id)) {
          goalsByPlayer[s.player_id] = (goalsByPlayer[s.player_id] || 0) + (s.goals || 0)
        }
      })
      let maxGoals = 0, goldenBootWinner = ''
      Object.entries(goalsByPlayer).forEach(([pid, goals]) => {
        if (goals > maxGoals) { maxGoals = goals; goldenBootWinner = pid }
      })
      if (goldenBootWinner) setAwards(prev => ({ ...prev, goldenBoot: { player_id: goldenBootWinner, value: maxGoals } }))

      // Playmaker - most assists
      const assistsByPlayer: Record<string, number> = {}
      allStats.forEach(s => {
        if (matchIds.includes(s.match_id)) {
          assistsByPlayer[s.player_id] = (assistsByPlayer[s.player_id] || 0) + (s.assists || 0)
        }
      })
      let maxAssists = 0, playmakerWinner = ''
      Object.entries(assistsByPlayer).forEach(([pid, assists]) => {
        if (assists > maxAssists) { maxAssists = assists; playmakerWinner = pid }
      })
      if (playmakerWinner) setAwards(prev => ({ ...prev, playmaker: { player_id: playmakerWinner, value: maxAssists } }))

      // Iron Man - most matches played (attendance)
      const matchesPlayed: Record<string, number> = {}
      allStats.forEach(s => {
        if (matchIds.includes(s.match_id)) {
          matchesPlayed[s.player_id] = (matchesPlayed[s.player_id] || 0) + 1
        }
      })
      let maxPlayed = 0, ironManWinner = ''
      Object.entries(matchesPlayed).forEach(([pid, played]) => {
        if (played > maxPlayed) { maxPlayed = played; ironManWinner = pid }
      })
      if (ironManWinner) setAwards(prev => ({ ...prev, ironMan: { player_id: ironManWinner, value: maxPlayed } }))

      // Coin King - calculated from stats (same as standings/coins page)
      const coinsByPlayer: Record<string, number> = {}
      PLAYERS.forEach(p => coinsByPlayer[p.id] = 0)
      allStats.forEach(s => {
        if (matchIds.includes(s.match_id)) {
          coinsByPlayer[s.player_id] = (coinsByPlayer[s.player_id] || 0) +
            (s.goals || 0) * 5 +
            (s.assists || 0) * 3 +
            (s.is_winner ? 10 : 0) +
            (s.clean_sheet ? 4 : 0) +
            (s.played_as_gk && s.clean_sheet ? 5 : 0)
        }
      })
      motmWinners?.forEach(m => {
        if (matchIds.includes(m.match_id)) {
          coinsByPlayer[m.player_id] = (coinsByPlayer[m.player_id] || 0) + 3
        }
      })
      let maxCoins = 0, coinKingWinner = ''
      Object.entries(coinsByPlayer).forEach(([pid, coins]) => {
        if (coins > maxCoins) { maxCoins = coins; coinKingWinner = pid }
      })
      if (coinKingWinner) setAwards(prev => ({ ...prev, coinKing: { player_id: coinKingWinner, value: maxCoins } }))

      // Man of the Season - most MOTM awards
      const motmByPlayer: Record<string, number> = {}
      motmWinners?.forEach(m => {
        if (matchIds.includes(m.match_id)) {
          motmByPlayer[m.player_id] = (motmByPlayer[m.player_id] || 0) + 1
        }
      })
      let maxMotm = 0, motmWinner = ''
      Object.entries(motmByPlayer).forEach(([pid, motm]) => {
        if (motm > maxMotm) { maxMotm = motm; motmWinner = pid }
      })
      if (motmWinner) setAwards(prev => ({ ...prev, manOfSeason: { player_id: motmWinner, value: maxMotm } }))

      // Best Defender - highest avg defender rating
      if (allRatings && allRatings.length > 0) {
        const defRatings: Record<string, { sum: number, count: number }> = {}
        allRatings.forEach(r => {
          if (!defRatings[r.rated_player_id]) defRatings[r.rated_player_id] = { sum: 0, count: 0 }
          defRatings[r.rated_player_id].sum += r.defender_rating || 0
          defRatings[r.rated_player_id].count += 1
        })
        let maxDefAvg = 0, bestDefWinner = ''
        Object.entries(defRatings).forEach(([pid, data]) => {
          const avg = data.sum / data.count
          if (avg > maxDefAvg) { maxDefAvg = avg; bestDefWinner = pid }
        })
        if (bestDefWinner) setAwards(prev => ({ ...prev, bestDefender: { player_id: bestDefWinner, value: Math.round(maxDefAvg * 10) / 10 } }))
      }

      // Golden Glove - highest avg goalkeeper rating
      if (allRatings && allRatings.length > 0) {
        const gkRatings: Record<string, { sum: number, count: number }> = {}
        allRatings.forEach(r => {
          if (!gkRatings[r.rated_player_id]) gkRatings[r.rated_player_id] = { sum: 0, count: 0 }
          gkRatings[r.rated_player_id].sum += r.goalkeeper_rating || 0
          gkRatings[r.rated_player_id].count += 1
        })
        let maxGkAvg = 0, goldenGloveWinner = ''
        Object.entries(gkRatings).forEach(([pid, data]) => {
          const avg = data.sum / data.count
          if (avg > maxGkAvg) { maxGkAvg = avg; goldenGloveWinner = pid }
        })
        if (goldenGloveWinner) setAwards(prev => ({ ...prev, goldenGlove: { player_id: goldenGloveWinner, value: Math.round(maxGkAvg * 10) / 10 } }))
      }
    }

    calculateAwards()
  }, [currentSeason])

  const handleCreateSeason = async () => {
    if (!newSeason.name || !newSeason.start || !newSeason.end) return
    
    setIsCreating(true)
    
    if (currentSeason) {
      await supabase.from('seasons').update({ is_active: false }).eq('id', currentSeason.id)
    }
    
    await supabase.from('seasons').insert({
      name: newSeason.name,
      start_date: newSeason.start,
      end_date: newSeason.end,
      is_active: true,
    })
    
    setIsCreating(false)
    setShowCreate(false)
    
    const { data } = await supabase.from('seasons').select('*').order('start_date', { ascending: false })
    if (data) setSeasons(data)
  }

  const getPlayer = (id: string) => PLAYERS.find(p => p.id === id)

  const awardData = [
    { key: 'goldenBoot', icon: Target, label: 'Golden Boot', desc: 'Most goals', color: 'text-yellow-400' },
    { key: 'playmaker', icon: Star, label: 'Playmaker', desc: 'Most assists', color: 'text-blue-400' },
    { key: 'ironMan', icon: Zap, label: 'Iron Man', desc: 'Most wins', color: 'text-red-400' },
    { key: 'coinKing', icon: DollarSign, label: 'Coin King', desc: 'Most coins', color: 'text-green-400' },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <Calendar className="w-12 h-12 mx-auto mb-2 text-purple-400" />
        <h1 className="text-2xl font-bold">Seasons</h1>
        <p className="text-gray-400">3-month seasons with awards</p>
      </motion.div>

      {currentSeason && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 border border-yellow-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold">{currentSeason.name} Awards</h2>
          </div>
          
          <div className="space-y-4">
            {awardData.map(award => {
              const winner = getPlayer(awards[award.key]?.player_id || '')
              if (!winner) return null
              
              return (
                <div key={award.key} className="flex items-center gap-4 p-3 rounded-xl bg-white/5">
                  <award.icon className={`w-8 h-8 ${award.color}`} />
                  <div className="flex-1">
                    <div className="font-bold">{award.label}</div>
                    <div className="text-sm text-gray-400">{winner.name}</div>
                  </div>
                  <div className={`font-bold ${award.color}`}>{awards[award.key]?.value}</div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {user && (
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(true)} className="w-full py-4 rounded-2xl bg-purple-500 text-black font-bold flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Season
        </motion.button>
      )}

      {showCreate && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-6 border border-purple-500/30 space-y-4">
          <h3 className="font-bold">Create New Season (ends current, 50% coin reset)</h3>
          
          <input type="text" placeholder="Season name (e.g., Season 2)" value={newSeason.name} onChange={(e) => setNewSeason(prev => ({ ...prev, name: e.target.value }))} className="w-full p-3 rounded-xl bg-white/5 border border-white/10" />
          
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={newSeason.start} onChange={(e) => setNewSeason(prev => ({ ...prev, start: e.target.value }))} className="p-3 rounded-xl bg-white/5 border border-white/10" />
            <input type="date" value={newSeason.end} onChange={(e) => setNewSeason(prev => ({ ...prev, end: e.target.value }))} className="p-3 rounded-xl bg-white/5 border border-white/10" />
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl bg-white/10">Cancel</button>
            <button onClick={handleCreateSeason} disabled={isCreating} className="flex-1 py-3 rounded-xl bg-green-500 text-black font-bold">{isCreating ? 'Creating...' : 'Create'}</button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        <h2 className="font-bold">All Seasons</h2>
        
        {seasons.map(season => (
          <motion.div key={season.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass rounded-xl p-4 border border-white/10">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold">{season.name}</div>
                <div className="text-sm text-gray-400">{new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${season.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{season.is_active ? 'Active' : 'Ended'}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {seasons.length === 0 && (
        <div className="text-center p-8 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No seasons yet</p>
          <p className="text-sm">Create the first season to get started!</p>
        </div>
      )}
    </div>
  )
}

export default function SeasonsPage() {
  return (
    <div className="min-h-screen pb-20">
      <Header title="Seasons" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <Suspense fallback={<div className="text-center p-8"><div className="animate-pulse">Loading...</div></div>}><SeasonsContent /></Suspense>
      </main>

      <Navigation activePath="/seasons" />
    </div>
  )
}