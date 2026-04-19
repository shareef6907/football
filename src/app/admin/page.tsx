'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PLAYERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Lock, Users, RotateCcw, Save, Edit2, X, Calendar } from 'lucide-react'

const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'Thursday2024'

interface PlayerRating {
  id: string
  rated_player_id: string
  forward_rating: number
  midfielder_rating: number
  defender_rating: number
  goalkeeper_rating: number
}

interface Match {
  id: string
  match_date: string
}

interface MatchStats {
  id: string
  match_id: string
  player_id: string
  goals: number
  assists: number
  is_winner: boolean
  played_as_gk: boolean
  clean_sheet: boolean
}

function AdminContent() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null) // null = checking
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState<'ratings' | 'stats' | 'reset'>('ratings')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  
  // Check localStorage on mount BEFORE initial render
  useEffect(() => {
    const savedAuth = localStorage.getItem('admin_auth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    } else {
      setIsAuthenticated(false)
    }
  }, [])
  
  // Ratings data
  const [playerRatings, setPlayerRatings] = useState<PlayerRating[]>([])
  const [editingRating, setEditingRating] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ forward: 5, midfielder: 5, defender: 5, goalkeeper: 5 })
  
  // Stats data
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [matchStats, setMatchStats] = useState<MatchStats[]>([])
  const [editingStats, setEditingStats] = useState<string | null>(null)
  const [statsForm, setStatsForm] = useState({ goals: 0, assists: 0, isWinner: false, playedAsGK: false, cleanSheet: false })

  useEffect(() => {
    if (!isAuthenticated) return
    
    // Load player ratings
    const loadRatings = async () => {
      const { data } = await supabase
        .from('player_ratings')
        .select('*')
        .order('rating_year', { ascending: false })
        .order('rating_month', { ascending: false })
      
      if (data) {
        const latestByPlayer = new Map<string, PlayerRating>()
        data.forEach((r: any) => {
          if (!latestByPlayer.has(r.rated_player_id)) {
            latestByPlayer.set(r.rated_player_id, r)
          }
        })
        setPlayerRatings(Array.from(latestByPlayer.values()))
      }
    }
    loadRatings()
    
    // Load only PAST matches (before or on last Thursday)
    const loadMatches = async () => {
      // Calculate last Thursday
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const dayOfWeek = today.getDay()
      // Days since last Thursday
      const daysSinceThursday = (dayOfWeek + 6) % 7
      let lastThursday = new Date(today)
      lastThursday.setDate(today.getDate() - daysSinceThursday)
      
      const cutoffDate = lastThursday.toISOString().split('T')[0]
      console.log('Loading matches up to:', cutoffDate)
      
      // First load existing matches up to last Thursday
      const { data } = await supabase
        .from('matches')
        .select('*')
        .lte('match_date', cutoffDate)
        .order('match_date', { ascending: false })
        .limit(20)
      
      // Also check if there's a NEXT Thursday game (for new stats entry)
      let nextThursdayMatch = null
      const daysUntilNextThursday = (4 - dayOfWeek + 7) % 7 || 7
      let nextThursday = new Date(today)
      nextThursday.setDate(today.getDate() + daysUntilNextThursday)
      
      // Check if we're past Thursday 8pm - can create next game stats
      const hour = now.getHours()
      const canCreateNext = dayOfWeek === 4 && hour >= 20 // Thursday after 8pm
      
      if (canCreateNext) {
        const nextDate = nextThursday.toISOString().split('T')[0]
        // Check if match exists for next Thursday
        const { data: nextMatch } = await supabase
          .from('matches')
          .select('*')
          .eq('match_date', nextDate)
          .single()
        
        if (nextMatch) {
          nextThursdayMatch = nextMatch
        } else {
          // Create a placeholder match for next Thursday
          const { data: newMatch } = await supabase
            .from('matches')
            .insert({
              match_date: nextDate,
              team_size: 7,
              num_teams: 2,
            })
            .select()
            .single()
          if (newMatch) nextThursdayMatch = newMatch
        }
      }
      
      // Combine past matches with next Thursday (if applicable)
      const allMatches = nextThursdayMatch 
        ? [nextThursdayMatch, ...(data || [])]
        : (data || [])
      
      if (allMatches.length > 0) {
        setMatches(allMatches)
        // Select the most recent (first in sorted list)
        setSelectedMatch(allMatches[0].id)
      } else {
        setMatches([])
        setSelectedMatch(null)
      }
    }
    loadMatches()
  }, [isAuthenticated])

  // Load match stats when match selected - get ALL 21 players
  useEffect(() => {
    if (!selectedMatch) return
    
    const loadStats = async () => {
      // Get existing stats for this match
      const { data: existingStats } = await supabase
        .from('match_stats')
        .select('*')
        .eq('match_id', selectedMatch)
      
      // Build stats for ALL 21 players (not just attendees)
      const statsMap = new Map((existingStats || []).map(s => [s.player_id, s]))
      
      const fullStats = PLAYERS.map(player => ({
        id: statsMap.get(player.id)?.id || '',
        match_id: selectedMatch,
        player_id: player.id,
        goals: statsMap.get(player.id)?.goals || 0,
        assists: statsMap.get(player.id)?.assists || 0,
        is_winner: statsMap.get(player.id)?.is_winner || false,
        played_as_gk: statsMap.get(player.id)?.played_as_gk || false,
        clean_sheet: statsMap.get(player.id)?.clean_sheet || false,
      }))
      
      setMatchStats(fullStats)
    }
    loadStats()
  }, [selectedMatch])

  const handleLogin = () => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setLoginError('')
      if (rememberMe) {
        localStorage.setItem('admin_auth', 'true')
      }
    } else {
      setLoginError('Invalid username or password')
    }
  }

  const getPlayerById = (id: string) => PLAYERS.find(p => p.id === id)
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const handleResetRatings = async () => {
    if (!confirm('Reset ALL ratings to 5/5/5/5? This cannot be undone.')) return
    setSaving(true)
    setSaveMessage('')
    try {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const defaults = PLAYERS.map(p => ({
        rater_id: p.id,
        rated_player_id: p.id,
        rating_month: currentMonth,
        rating_year: currentYear,
        forward_rating: 5,
        midfielder_rating: 5,
        defender_rating: 5,
        goalkeeper_rating: 5,
      }))
      await supabase.from('player_ratings').insert(defaults)
      setSaveMessage('All ratings reset to 5/5/5/5')
      // Reload
      const { data } = await supabase.from('player_ratings').select('*').order('rating_year', { ascending: false }).order('rating_month', { ascending: false })
      if (data) {
        const latestByPlayer = new Map<string, PlayerRating>()
        data.forEach((r: any) => {
          if (!latestByPlayer.has(r.rated_player_id)) latestByPlayer.set(r.rated_player_id, r)
        })
        setPlayerRatings(Array.from(latestByPlayer.values()))
      }
    } catch (err: any) {
      setSaveMessage('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Reset all stats and coins
  const handleResetAllStats = async () => {
    if (!confirm('Are you sure you want to DELETE ALL data? This cannot be undone!')) return
    setSaving(true)
    setSaveMessage('')
    try {
      // Delete all from each table - use select('id') then delete by IDs
      const tables = ['draft_picks', 'draft_captains', 'draft_sessions', 'man_of_the_match_votes', 'man_of_the_match_winners', 'match_stats', 'attendance', 'match_team_players', 'match_teams', 'matches', 'coins_ledger', 'player_ratings']
      
      for (const table of tables) {
        const { data } = await supabase.from(table).select('id')
        if (data && data.length > 0) {
          await supabase.from(table).delete().in('id', data.map((r: any) => r.id))
        }
      }
      
      setSaveMessage('✅ All data cleared!')
    } catch (err: any) {
      setSaveMessage('Error: ' + err.message)
      console.error('Reset error:', err)
    } finally {
      setSaving(false)
    }
  }

  const startEditRating = (rating: PlayerRating) => {
    setEditingRating(rating.rated_player_id)
    setEditForm({
      forward: rating.forward_rating,
      midfielder: rating.midfielder_rating,
      defender: rating.defender_rating,
      goalkeeper: rating.goalkeeper_rating,
    })
  }

  const handleSaveRating = async () => {
    if (!editingRating) return
    setSaving(true)
    try {
      // Update rating for current month/year or create new
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const rating = playerRatings.find(r => r.rated_player_id === editingRating)
      
      if (rating) {
        // Update existing rating
        await supabase.from('player_ratings').update({
          forward_rating: editForm.forward,
          midfielder_rating: editForm.midfielder,
          defender_rating: editForm.defender,
          goalkeeper_rating: editForm.goalkeeper,
        }).eq('id', rating.id)
      } else {
        // For new rating, delete any existing first (to handle UNIQUE constraint)
        await supabase.from('player_ratings')
          .delete()
          .eq('rated_player_id', editingRating)
          .eq('rating_month', currentMonth)
          .eq('rating_year', currentYear)
        
        // Insert as system rater (use a fixed UUID for admin/system)
        await supabase.from('player_ratings').insert({
          rated_player_id: editingRating,
          rater_id: '00000000-0000-0000-0000-000000000000', // system rater
          rating_month: currentMonth,
          rating_year: currentYear,
          forward_rating: editForm.forward,
          midfielder_rating: editForm.midfielder,
          defender_rating: editForm.defender,
          goalkeeper_rating: editForm.goalkeeper,
        })
      }
      setSaveMessage('Rating updated!')
      setEditingRating(null)
      // Reload
      const { data } = await supabase.from('player_ratings').select('*').order('rating_year', { ascending: false }).order('rating_month', { ascending: false })
      if (data) {
        const latestByPlayer = new Map<string, PlayerRating>()
        data.forEach((r: any) => {
          if (!latestByPlayer.has(r.rated_player_id)) latestByPlayer.set(r.rated_player_id, r)
        })
        setPlayerRatings(Array.from(latestByPlayer.values()))
      }
    } catch (err: any) {
      setSaveMessage('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const startEditStats = (stats: MatchStats) => {
    setEditingStats(stats.player_id)
    setStatsForm({
      goals: stats.goals,
      assists: stats.assists,
      isWinner: stats.is_winner,
      playedAsGK: stats.played_as_gk,
      cleanSheet: stats.clean_sheet,
    })
  }

  const handleSaveStats = async () => {
    if (!editingStats || !selectedMatch) return
    setSaving(true)
    setSaveMessage('')
    
    // Find the current stats entry being edited
    const currentStats = matchStats.find(s => s.player_id === editingStats)
    const existingId = currentStats?.id
    
    try {
      if (existingId) {
        // UPDATE existing row
        const { error } = await supabase.from('match_stats').update({
          goals: statsForm.goals,
          assists: statsForm.assists,
          is_winner: statsForm.isWinner,
          played_as_gk: statsForm.playedAsGK,
          clean_sheet: statsForm.cleanSheet,
        }).eq('id', existingId)
        
        if (error) throw error
        setSaveMessage('Stats saved!')
      } else {
        // INSERT new row
        const { error } = await supabase.from('match_stats').insert({
          match_id: selectedMatch,
          player_id: editingStats,
          goals: statsForm.goals,
          assists: statsForm.assists,
          is_winner: statsForm.isWinner,
          played_as_gk: statsForm.playedAsGK,
          clean_sheet: statsForm.cleanSheet,
        })
        
        if (error) throw error
        setSaveMessage('Stats saved!')
      }
      
      setEditingStats(null)
      // Reload stats
      const { data } = await supabase.from('match_stats').select('*').eq('match_id', selectedMatch)
      if (data) {
        const statsMap = new Map(data.map(s => [s.player_id, s]))
        const fullStats = PLAYERS.map(player => ({
          id: statsMap.get(player.id)?.id || '',
          match_id: selectedMatch,
          player_id: player.id,
          goals: statsMap.get(player.id)?.goals || 0,
          assists: statsMap.get(player.id)?.assists || 0,
          is_winner: statsMap.get(player.id)?.is_winner || false,
          played_as_gk: statsMap.get(player.id)?.played_as_gk || false,
          clean_sheet: statsMap.get(player.id)?.clean_sheet || false,
        }))
        setMatchStats(fullStats)
      }
    } catch (err: any) {
      setSaveMessage('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Show loading while checking localStorage
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen">
        <main className="max-w-md mx-auto px-4 py-6">
          <div className="text-center p-8 text-gray-400">Loading...</div>
        </main>
      </div>
    )
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <main className="max-w-md mx-auto px-4 py-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 border border-white/10">
            <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
            <div className="space-y-4">
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10" placeholder="Username" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10" placeholder="Password" />
              <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4" />
                Remember me
              </label>
              {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
              <button onClick={handleLogin} className="w-full py-3 rounded-xl bg-green-500 text-black font-bold">Login</button>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // Admin content
  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('ratings')} className={`flex-1 py-3 rounded-xl font-bold ${activeTab === 'ratings' ? 'bg-purple-500 text-black' : 'bg-white/5 text-gray-400'}`}>Ratings</button>
          <button onClick={() => setActiveTab('stats')} className={`flex-1 py-3 rounded-xl font-bold ${activeTab === 'stats' ? 'bg-purple-500 text-black' : 'bg-white/5 text-gray-400'}`}>Stats</button>
          <button onClick={() => setActiveTab('reset')} className={`flex-1 py-3 rounded-xl font-bold ${activeTab === 'reset' ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400'}`}>Reset</button>
        </div>

        {saveMessage && <div className={`p-3 rounded-xl text-center ${saveMessage.startsWith('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{saveMessage}</div>}

        {/* RATINGS TAB */}
        {activeTab === 'ratings' && (
          <div className="space-y-4">
            <button onClick={handleResetRatings} disabled={saving} className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold flex items-center justify-center gap-2">
              <RotateCcw className="w-5 h-5" /> Reset All Ratings to 5/5/5/5
            </button>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-400">Player Ratings</h3>
              {playerRatings.map(rating => {
                const player = getPlayerById(rating.rated_player_id)
                if (!player) return null
                const isEditing = editingRating === rating.rated_player_id
                return (
                  <motion.div key={rating.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-3 border border-white/10">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: player.color }}>
                            {player.name.slice(0, 1)}
                          </div>
                          <span className="font-bold">{player.name}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {(['forward', 'midfielder', 'defender', 'goalkeeper'] as const).map(pos => {
                            const labels = { forward: 'FWD', midfielder: 'MID', defender: 'DEF', goalkeeper: 'GK' }
                            return (
                              <div key={pos} className="text-center">
                                <div className="text-xs text-gray-400">{labels[pos]}</div>
                                <input type="range" min="1" max="10" value={editForm[pos]} onChange={(e) => setEditForm(prev => ({ ...prev, [pos]: Number(e.target.value) }))} className="w-full" />
                                <div className="font-bold">{editForm[pos]}</div>
                              </div>
                            )
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSaveRating} disabled={saving} className="flex-1 py-2 rounded-lg bg-green-500 text-black font-bold"><Save className="w-4 h-4 inline mr-1" /> Save</button>
                          <button onClick={() => setEditingRating(null)} className="px-4 py-2 rounded-lg bg-white/10"><X className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: player.color }}>
                            {player.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-bold">{player.name}</div>
                            <div className="text-xs text-gray-400">FWD:{rating.forward_rating} MID:{rating.midfielder_rating} DEF:{rating.defender_rating} GK:{rating.goalkeeper_rating}</div>
                          </div>
                        </div>
                        <button onClick={() => startEditRating(rating)} className="p-2 rounded-lg bg-white/10"><Edit2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* STATS TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Select Match</label>
              <select value={selectedMatch || ''} onChange={(e) => setSelectedMatch(e.target.value)} className="w-full p-3 rounded-xl bg-white/5 border border-white/10">
                {matches.map(match => (
                  <option key={match.id} value={match.id}>{formatDate(match.match_date)}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-400">Player Stats</h3>
              {matchStats.length === 0 ? (
                <p className="text-center text-gray-500 p-4">No stats for this match yet. Enter stats below.</p>
              ) : (
                matchStats.map(stats => {
                  const player = getPlayerById(stats.player_id)
                  if (!player) return null
                  const isEditing = editingStats === stats.player_id
                  return (
                    <motion.div key={stats.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-3 border border-white/10">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: player.color }}>
                              {player.name.slice(0, 1)}
                            </div>
                            <span className="font-bold">{player.name}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-2 rounded bg-white/5">
                              <span>Goals</span>
                              <input type="number" min="0" value={statsForm.goals} onChange={(e) => setStatsForm(prev => ({ ...prev, goals: Number(e.target.value) }))} className="w-16 p-1 rounded bg-white/10 text-center" />
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-white/5">
                              <span>Assists</span>
                              <input type="number" min="0" value={statsForm.assists} onChange={(e) => setStatsForm(prev => ({ ...prev, assists: Number(e.target.value) }))} className="w-16 p-1 rounded bg-white/10 text-center" />
                            </div>
                            <label className="flex items-center justify-between p-2 rounded bg-white/5">
                              <span>Winner</span>
                              <input type="checkbox" checked={statsForm.isWinner} onChange={(e) => setStatsForm(prev => ({ ...prev, isWinner: e.target.checked }))} className="w-5 h-5" />
                            </label>
                            <label className="flex items-center justify-between p-2 rounded bg-white/5">
                              <span>Played GK</span>
                              <input type="checkbox" checked={statsForm.playedAsGK} onChange={(e) => setStatsForm(prev => ({ ...prev, playedAsGK: e.target.checked }))} className="w-5 h-5" />
                            </label>
                            <label className="col-span-2 flex items-center justify-between p-2 rounded bg-white/5">
                              <span>Clean Sheet</span>
                              <input type="checkbox" checked={statsForm.cleanSheet} onChange={(e) => setStatsForm(prev => ({ ...prev, cleanSheet: e.target.checked }))} className="w-5 h-5" />
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleSaveStats} disabled={saving} className="flex-1 py-2 rounded-lg bg-green-500 text-black font-bold"><Save className="w-4 h-4 inline mr-1" /> Save</button>
                            <button onClick={() => setEditingStats(null)} className="px-4 py-2 rounded-lg bg-white/10"><X className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: player.color }}>
                              {player.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-bold">{player.name}</div>
                              <div className="text-xs text-gray-400">{stats.goals}G {stats.assists}A • <span className={stats.is_winner ? 'text-green-400' : 'text-gray-500'}>{stats.is_winner ? 'W' : 'L'}</span> • {stats.played_as_gk ? '🧤' : ''} • {stats.clean_sheet ? '🛡️' : ''}</div>
                            </div>
                          </div>
                          <button onClick={() => startEditStats(stats)} className="p-2 rounded-lg bg-white/10"><Edit2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* RESET TAB */}
        {activeTab === 'reset' && (
          <div className="space-y-4">
            <div className="glass rounded-2xl p-6 border border-red-500/30">
              <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Danger Zone</h3>
              <p className="text-gray-400 mb-4">This will permanently delete all match stats, coins, and MOTM data.</p>
              
              <button 
                onClick={handleResetAllStats}
                disabled={saving}
                className="w-full py-4 rounded-xl bg-red-500 text-white font-bold flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Reset All Standings to Zero
              </button>
            </div>

            <div className="glass rounded-2xl p-4 border border-white/10">
              <h4 className="font-bold mb-2">What this does:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Delete all matches</li>
                <li>• Delete all match_stats, attendance, teams</li>
                <li>• Delete all draft sessions and picks</li>
                <li>• Delete all MOTM votes and winners</li>
                <li>• Delete all coins_ledger</li>
                <li>• Delete all player_ratings</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function AdminPage() {
  return <AdminContent />
}