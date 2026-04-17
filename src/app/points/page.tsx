'use client'

import { motion } from 'framer-motion'
import { POINTS_SYSTEM } from '../../lib/constants'
import { Navigation, Header } from '../../components/Navigation'

const pointItems = [
  { icon: '⚽', label: 'Goal', points: POINTS_SYSTEM.goal, description: 'Scored by the forward/midfielder' },
  { icon: '⚡', label: 'Assist', points: POINTS_SYSTEM.assist, description: 'Pass leading to a goal' },
  { icon: '🏆', label: 'Match Win', points: POINTS_SYSTEM.matchWin, description: 'Entire winning team' },
  { icon: '🛡️', label: 'Clean Sheet', points: POINTS_SYSTEM.cleanSheet, description: 'Defenders + GK on winning team' },
  { icon: '🧤', label: 'GK Win Bonus', points: POINTS_SYSTEM.goalkeeperWinBonus, description: 'Winning team goalkeeper' },
  { icon: '✅', label: 'Attendance', points: POINTS_SYSTEM.attendance, description: 'Showed up & played' },
  { icon: '🔥', label: 'Streak Bonus', points: POINTS_SYSTEM.attendanceStreakBonus, description: 'Per consecutive week' },
  { icon: '⭐', label: 'Man of the Match', points: POINTS_SYSTEM.manOfTheMatch, description: 'Man of the Match winner' },
]

export default function PointsPage() {
  return (
    <div className="min-h-screen pb-20">
      <Header title="Points System" />
      
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-green-500/30"
        >
          <h2 className="text-xl font-bold text-center mb-2">
            How to Earn Points ⚡
          </h2>
          <p className="text-center text-gray-400 text-sm">
            Every point = 1 coin (1:1)
          </p>
        </motion.div>

        <div className="space-y-3">
          {pointItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl p-4 border border-white/10 flex items-center gap-4"
            >
              <div className="text-3xl">{item.icon}</div>
              <div className="flex-1">
                <div className="font-semibold">{item.label}</div>
                <div className="text-sm text-gray-400">{item.description}</div>
              </div>
              <div className="text-2xl font-bold text-green-400">
                +{item.points}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-4 border border-red-500/20"
        >
          <h3 className="font-bold text-red-400 mb-2">⚠️ Removed</h3>
          <p className="text-sm text-gray-400">
            <span className="line-through text-gray-500">Saves</span> — Saves were removed from the points system because people were cheating.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-4 border border-yellow-500/20"
        >
          <h3 className="font-bold text-yellow-400 mb-2">🏆 End-of-Season Awards</h3>
          <div className="text-sm text-gray-400 space-y-1">
            <p>• Golden Boot — Most goals</p>
            <p>• Playmaker — Most assists</p>
            <p>• Best Defender — Highest avg defender rating</p>
            <p>• Golden Glove — Highest avg goalkeeper rating</p>
            <p>• Man of the Season — Most Man of the Match awards</p>
            <p>• Iron Man — Best attendance</p>
            <p>• Coin King — Most coins</p>
          </div>
        </motion.div>
      </main>

      <Navigation />
    </div>
  )
}