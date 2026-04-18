'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PLAYERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Lock, Users, RotateCcw, Save, Edit2, Trophy, Calendar } from 'lucide-react'

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

function AdminContent() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activeTab, setActiveTab] = useState<'ratings'>('ratings')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const handleLogin = () => {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setLoginError('')
    } else {
      setLoginError('Invalid username or password')
    }
  }

  const getPlayerById = (id: string) => PLAYERS.find(p => p.id === id)

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <main className="max-w-md mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border border-white/10"
          >
            <Lock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
            <div className="space-y-4">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10"
                placeholder="Username"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10"
                placeholder="Password"
              />
              {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
              <button onClick={handleLogin} className="w-full py-3 rounded-xl bg-green-500 text-black font-bold">
                Login
              </button>
              <p className="text-center text-gray-500 text-sm">/admin</p>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // Reset ALL ratings function
  const handleResetRatings = async () => {
    if (!confirm('Reset ALL ratings to 5/5/5/5? This cannot be undone.')) return
    setSaving(true)
    setSaveMessage('')
    try {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      
      // Insert default ratings for all players (self-rating)
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
    } catch (err: any) {
      setSaveMessage('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Admin content
  return (
    <div className="min-h-screen pb-20">
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </motion.div>

        {saveMessage && (
          <div className={`p-3 rounded-xl text-center ${saveMessage.startsWith('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
            {saveMessage}
          </div>
        )}

        {/*Ratings */}
        <div className="space-y-4">
          <button
            onClick={handleResetRatings}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Reset All Ratings to 5/5/5/5
          </button>
        </div>
      </main>
    </div>
  )
}

export default function AdminPage() {
  return <AdminContent />
}