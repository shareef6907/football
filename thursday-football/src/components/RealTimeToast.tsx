'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Activity, Trophy, Users, Shield } from 'lucide-react'

interface ToastNotification {
  id: string
  type: 'rating' | 'stats' | 'admin' | 'team'
  message: string
  timestamp: string
}

export default function RealTimeToast() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([])

  useEffect(() => {
    const handleRatingUpdate = (event: CustomEvent) => {
      const { detail } = event
      addNotification({
        type: 'rating',
        message: `Player ratings updated by ${detail.source}`,
        timestamp: detail.timestamp
      })
    }

    const handleStatsUpdate = (event: CustomEvent) => {
      const { detail } = event
      addNotification({
        type: 'stats',
        message: `${detail.player || 'Player'} submitted new stats`,
        timestamp: detail.timestamp
      })
    }

    const handleAdminAction = (event: CustomEvent) => {
      const { detail } = event
      addNotification({
        type: 'admin',
        message: `Admin performed: ${detail.action}`,
        timestamp: detail.timestamp
      })
    }

    const handleTeamGeneration = (event: CustomEvent) => {
      const { detail } = event
      addNotification({
        type: 'team',
        message: `New teams generated`,
        timestamp: detail.timestamp
      })
    }

    // Listen for all real-time events
    window.addEventListener('ratingsUpdated', handleRatingUpdate as EventListener)
    window.addEventListener('playerStatsUpdated', handleStatsUpdate as EventListener)
    window.addEventListener('adminAction', handleAdminAction as EventListener)
    window.addEventListener('teamGenerated', handleTeamGeneration as EventListener)

    return () => {
      window.removeEventListener('ratingsUpdated', handleRatingUpdate as EventListener)
      window.removeEventListener('playerStatsUpdated', handleStatsUpdate as EventListener)
      window.removeEventListener('adminAction', handleAdminAction as EventListener)
      window.removeEventListener('teamGenerated', handleTeamGeneration as EventListener)
    }
  }, [])

  const addNotification = (notification: Omit<ToastNotification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    
    setNotifications(prev => [...prev, newNotification])
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 4000)
  }

  const getIcon = (type: ToastNotification['type']) => {
    switch (type) {
      case 'rating': return <Users className="w-5 h-5" />
      case 'stats': return <Trophy className="w-5 h-5" />
      case 'admin': return <Shield className="w-5 h-5" />
      case 'team': return <Activity className="w-5 h-5" />
      default: return <CheckCircle className="w-5 h-5" />
    }
  }

  const getColor = (type: ToastNotification['type']) => {
    switch (type) {
      case 'rating': return 'from-blue-600 to-cyan-600'
      case 'stats': return 'from-green-600 to-emerald-600'
      case 'admin': return 'from-orange-600 to-red-600'
      case 'team': return 'from-purple-600 to-pink-600'
      default: return 'from-gray-600 to-gray-700'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.9 }}
            className={`bg-gradient-to-r ${getColor(notification.type)} p-0.5 rounded-xl shadow-2xl pointer-events-auto max-w-sm`}
          >
            <div className="bg-black/90 backdrop-blur-xl rounded-xl p-4 flex items-center gap-3">
              <div className="text-white">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{notification.message}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}