'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/auth'
import { RealTimeEvents } from '@/lib/realtime'
import { motion } from 'framer-motion'
import { 
  Shield, Users, Trophy, Settings, Database, 
  Download, RefreshCw, AlertTriangle, CheckCircle,
  Calendar, Target, Award, Activity, Shuffle,
  Lock, Unlock, Clock, Upload, Eye
} from 'lucide-react'

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalGames: 0,
    pendingVerifications: 0,
    monthlyWinners: [] as Array<{ month: string; winner: string; points: number }>
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    checkAdminAccess()
    
    // Listen for real-time updates from player actions
    const handleAdminStatsUpdate = () => {
      console.log('Admin stats refreshing due to player activity')
      setIsRefreshing(true)
      loadAdminStats()
      setLastUpdated(new Date().toLocaleTimeString())
      setTimeout(() => setIsRefreshing(false), 1000)
    }
    
    const handleDataUpdate = (event: CustomEvent) => {
      console.log('Data updated from:', event.detail)
      setIsRefreshing(true)
      loadAdminStats()
      setLastUpdated(new Date().toLocaleTimeString())
      setTimeout(() => setIsRefreshing(false), 1000)
    }
    
    // Set up event listeners for real-time admin updates
    window.addEventListener('adminStatsUpdated', handleAdminStatsUpdate)
    window.addEventListener('ratingsUpdated', handleAdminStatsUpdate)
    window.addEventListener('playerStatsUpdated', handleAdminStatsUpdate)
    window.addEventListener('dataUpdated', handleDataUpdate as EventListener)
    
    // Auto-refresh admin stats every 30 seconds for real-time monitoring
    const interval = setInterval(loadAdminStats, 30000)
    
    return () => {
      window.removeEventListener('adminStatsUpdated', handleAdminStatsUpdate)
      window.removeEventListener('ratingsUpdated', handleAdminStatsUpdate)
      window.removeEventListener('playerStatsUpdated', handleAdminStatsUpdate)
      window.removeEventListener('dataUpdated', handleDataUpdate as EventListener)
      clearInterval(interval)
    }
  }, [])

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    // Check if user is admin (you can modify this logic)
    const isAdminUser = session.user.email === 'admin@thursdayfootball.com' || 
                        session.user.email === 'shareef@example.com'
    
    if (!isAdminUser) {
      router.push('/dashboard')
      return
    }

    setIsAdmin(true)
    loadAdminStats()
    setLoading(false)
  }

  const loadAdminStats = () => {
    // Load admin dashboard stats
    const matchData = localStorage.getItem('matchData')
    const matches = matchData ? JSON.parse(matchData) : {}
    
    const playerRatings = localStorage.getItem('playerRatings')
    const ratings = playerRatings ? JSON.parse(playerRatings) : []
    
    setStats({
      totalPlayers: Object.keys(matches).length || 20,
      totalGames: 15, // Sample data
      pendingVerifications: 3,
      monthlyWinners: [
        { month: 'December 2024', winner: 'Ahmed', points: 125 },
        { month: 'January 2025', winner: 'Shareef', points: 142 }
      ]
    })
  }

  const handleResetMonth = () => {
    if (confirm('Are you sure you want to reset monthly scores? This cannot be undone.')) {
      // Reset monthly data but preserve badges
      const currentBadges = localStorage.getItem('playerBadges')
      localStorage.removeItem('playerRatings')
      localStorage.removeItem('matchData')
      localStorage.removeItem('weeklySubmissions')
      localStorage.removeItem('monthlyBalancedTeams')
      if (currentBadges) {
        localStorage.setItem('playerBadges', currentBadges)
      }
      alert('Monthly scores reset successfully!')
      loadAdminStats()
      
      // Dispatch events to update all components in real-time
      RealTimeEvents.dispatchAdminAction('monthly-reset', { 
        preservedBadges: !!currentBadges 
      })
      RealTimeEvents.getInstance().dispatch('dataUpdated', 'admin', { 
        type: 'monthly-reset',
        action: 'monthly-reset'
      })
    }
  }

  const handleBackupData = () => {
    const allData = {
      playerRatings: localStorage.getItem('playerRatings'),
      matchData: localStorage.getItem('matchData'),
      playerBadges: localStorage.getItem('playerBadges'),
      allPlayerRatings: localStorage.getItem('allPlayerRatings'),
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `thursday-football-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Shield className="w-16 h-16 text-blue-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-red-600/10 to-orange-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-full blur-3xl"
        />
      </div>

      {/* Header */}
      <header className="relative z-10 pt-16 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-6 mb-8">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Shield className="w-16 h-16 text-red-400 drop-shadow-2xl" />
              </motion.div>
            </div>
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-xl bg-gradient-to-r from-gray-400 to-gray-200 bg-clip-text text-transparent mt-4 font-semibold">
              Complete League Management
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              {isRefreshing && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Activity className="w-5 h-5 text-green-400" />
                </motion.div>
              )}
              <span className="text-sm bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent font-semibold">
                {isRefreshing ? '🔄 Updating...' : `✅ Live • Last updated: ${lastUpdated || new Date().toLocaleTimeString()}`}
              </span>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        {/* Quick Stats */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, label: 'Total Players', value: stats.totalPlayers, color: 'from-blue-500 to-cyan-500' },
              { icon: Trophy, label: 'Games Played', value: stats.totalGames, color: 'from-purple-500 to-pink-500' },
              { icon: AlertTriangle, label: 'Pending Verifications', value: stats.pendingVerifications, color: 'from-orange-500 to-red-500' },
              { icon: Award, label: 'Active Players', value: 18, color: 'from-green-500 to-emerald-500' }
            ].map(({ icon: Icon, label, value, color }) => (
              <motion.div
                key={label}
                className={`bg-gradient-to-br ${color} p-0.5 rounded-2xl`}
                whileHover={{ scale: 1.05 }}
              >
                <div className="bg-black rounded-2xl p-6 text-center">
                  <Icon className="w-8 h-8 mx-auto mb-3" />
                  <p className="text-3xl font-bold mb-2">{value}</p>
                  <p className="text-sm text-gray-400">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Admin Actions */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            🛠️ Admin Actions
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                icon: RefreshCw, 
                title: 'Reset Monthly Scores', 
                desc: 'Reset all monthly scores and rankings',
                action: handleResetMonth,
                color: 'from-orange-500 to-red-500'
              },
              { 
                icon: Download, 
                title: 'Backup Data', 
                desc: 'Download complete database backup',
                action: handleBackupData,
                color: 'from-blue-500 to-cyan-500'
              },
              { 
                icon: Upload, 
                title: 'Import Data', 
                desc: 'Restore from backup file',
                action: () => alert('Import feature coming soon!'),
                color: 'from-purple-500 to-pink-500'
              },
              { 
                icon: Shuffle, 
                title: 'Generate Teams', 
                desc: 'Auto-balance teams for next game',
                action: () => router.push('/admin/teams'),
                color: 'from-green-500 to-emerald-500'
              },
              { 
                icon: Eye, 
                title: 'View All Data', 
                desc: 'Detailed player statistics',
                action: () => router.push('/admin/stats'),
                color: 'from-indigo-500 to-purple-500'
              },
              { 
                icon: Settings, 
                title: 'League Settings', 
                desc: 'Configure league parameters',
                action: () => router.push('/admin/settings'),
                color: 'from-yellow-500 to-orange-500'
              }
            ].map(({ icon: Icon, title, desc, action, color }) => (
              <motion.button
                key={title}
                onClick={action}
                className="relative group text-left"
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${color} rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity`} />
                <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-full">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${color} mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
                  <p className="text-gray-400">{desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Recent Activity */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              📊 Recent Activity
            </h2>
            
            <div className="space-y-4">
              {[
                { time: '2 hours ago', action: 'Ahmed submitted match stats', status: 'pending' },
                { time: '1 day ago', action: 'Monthly awards distributed', status: 'completed' },
                { time: '3 days ago', action: 'Shareef rated all players', status: 'completed' },
                { time: '1 week ago', action: 'Teams generated for last match', status: 'completed' }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-black/60 border border-white/10"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.status === 'pending' ? 'bg-orange-400 animate-pulse' : 'bg-green-400'
                    }`} />
                    <div>
                      <p className="text-white font-medium">{activity.action}</p>
                      <p className="text-gray-500 text-sm">{activity.time}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'pending' 
                      ? 'bg-orange-400/20 text-orange-400' 
                      : 'bg-green-400/20 text-green-400'
                  }`}>
                    {activity.status}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <motion.button
            onClick={() => router.push('/')}
            className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back to Home
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}