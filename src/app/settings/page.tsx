'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { Settings as SettingsIcon, Calendar, Save, Check } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function SettingsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  
  const [gameDay, setGameDay] = useState(4) // Thursday
  const [gameTime, setGameTime] = useState('20:00')
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    localStorage.setItem('game_day', gameDay.toString())
    localStorage.setItem('game_time', gameTime)
    setSaved(true)
    setIsSaving(false)
    setTimeout(() => setSaved(false), 2000)
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
            <p className="text-gray-400">Configure your preferences</p>
          </motion.div>

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

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 rounded-2xl bg-green-500 text-black font-bold flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : isSaving ? (
              'Saving...'
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Settings
              </>
            )}
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
                  <span className="text-gray-500 font-mono text-xs">
                    {user?.id?.slice(0, 8)}...
                  </span>
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