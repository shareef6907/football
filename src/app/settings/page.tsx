'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Settings as SettingsIcon, Calendar, Save, Check, Users, Trophy, Trash2, Plus } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function SettingsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  
  const [gameDay, setGameDay] = useState(4)
  const [gameTime, setGameTime] = useState('20:00')
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [seasons, setSeasons] = useState<any[]>([])
  const [showCreateSeason, setShowCreateSeason] = useState(false)
  const [newSeason, setNewSeason] = useState({ name: '', start: new Date().toISOString().split('T')[0], end: '' })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const savedDay = localStorage.getItem('game_day')
    const savedTime = localStorage.getItem('game_time')
    if (savedDay) setGameDay(parseInt(savedDay))
    if (savedTime) setGameTime(savedTime)
    
    fetchSeasons()
  }, [])

  const fetchSeasons = async () => {
    const { data } = await supabase.from('seasons').select('*').order('start_date', { ascending: false })
    if (data) setSeasons(data)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Save to localStorage as backup
    localStorage.setItem('game_day', gameDay.toString())
    localStorage.setItem('game_time', gameTime)
    
    // Save to Supabase
    try {
      await supabase.from('game_settings').upsert({ key: 'game_day', value: gameDay.toString() }, { onConflict: 'key' })
      await supabase.from('game_settings').upsert({ key: 'game_time', value: gameTime }, { onConflict: 'key' })
    } catch (err) {
      console.error('Failed to save to Supabase:', err)
    }
    
    setSaved(true)
    setIsSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCreateSeason = async () => {
    if (!newSeason.name || !newSeason.start || !newSeason.end) return
    
    await supabase.from('seasons').insert({
      name: newSeason.name,
      start_date: newSeason.start,
      end_date: newSeason.end,
      is_active: seasons.length === 0,
    })
    
    setShowCreateSeason(false)
    setNewSeason({ name: '', start: new Date().toISOString().split('T')[0], end: '' })
    fetchSeasons()
  }

  if (!authLoading && !user) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="Settings" />
        <main className="max-w-md mx-auto px-4 py-6">
          <div className="text-center p-8 text-gray-400">Login to access settings</div>
        </main>
        <Navigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Settings" />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <SettingsIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </motion.div>

          {/* Game Schedule */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 border border-white/10 space-y-4"
          >
            <h2 className="font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-400" />
              Weekly Game Schedule
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Game Day</label>
                <select
                  value={gameDay}
                  onChange={(e) => setGameDay(parseInt(e.target.value))}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 mt-1"
                >
                  {DAYS.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Game Time</label>
                <input
                  type="time"
                  value={gameTime}
                  onChange={(e) => setGameTime(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 mt-1"
                />
              </div>
            </div>
          </motion.div>

          {/* Seasons */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 border border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Seasons
              </h2>
              <button
                onClick={() => setShowCreateSeason(true)}
                className="p-2 rounded-full bg-green-500/20 text-green-400"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {seasons.map(season => (
                <div key={season.id} className="flex justify-between items-center p-2 rounded-lg bg-white/5">
                  <div>
                    <div className="font-semibold">{season.name}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(season.start_date).toLocaleDateString()} - {new Date(season.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${season.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {season.is_active ? 'Active' : 'Ended'}
                  </span>
                </div>
              ))}
              {seasons.length === 0 && (
                <p className="text-sm text-gray-500">No seasons yet</p>
              )}
            </div>
          </motion.div>

          {/* Create Season Modal */}
          {showCreateSeason && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            >
              <motion.div 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="glass rounded-2xl p-6 border border-white/20 w-full max-w-sm"
              >
                <h3 className="font-bold text-xl mb-4">Create New Season</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Season Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Season 1"
                      value={newSeason.name}
                      onChange={(e) => setNewSeason(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">Start Date</label>
                    <input 
                      type="date" 
                      value={newSeason.start}
                      onChange={(e) => setNewSeason(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400">End Date</label>
                    <input 
                      type="date" 
                      value={newSeason.end}
                      onChange={(e) => setNewSeason(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full p-3 rounded-xl bg-white/5 border border-white/10 mt-1"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setShowCreateSeason(false)}
                    className="flex-1 py-3 rounded-xl bg-white/10"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateSeason}
                    className="flex-1 py-3 rounded-xl bg-green-500 text-black font-bold"
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Players List (Read-only) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-6 border border-white/10 space-y-4"
          >
            <h2 className="font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Players ({PLAYERS.length})
            </h2>
            
            <div className="grid grid-cols-2 gap-2">
              {PLAYERS.slice(0, 6).map(player => (
                <div key={player.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: player.color }}>
                    {player.name.slice(0,1)}
                  </div>
                  <span className="text-sm">{player.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">Total {PLAYERS.length} players in roster</p>
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 rounded-2xl bg-green-500 text-black font-bold flex items-center justify-center gap-2"
          >
            {saved ? <><Check className="w-5 h-5" /> Saved!</> : isSaving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Settings</>}
          </motion.button>

          {profile && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass rounded-2xl p-6 border border-white/10"
            >
              <h2 className="font-bold mb-4">Account</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Role</span>
                  <span className="capitalize">{profile.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Google ID</span>
                  <span className="text-gray-500 font-mono text-xs">{user?.id?.slice(0, 8)}...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Navigation activePath="/settings" />
    </div>
  )
}