'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, Trophy, ArrowRight, CheckCircle } from 'lucide-react'
import { TEAM_MEMBERS } from '@/lib/auth'

// Sort team members alphabetically
const SORTED_TEAM_MEMBERS = [...TEAM_MEMBERS].sort()

interface PlayerRating {
  name: string
  rating: number
}

interface PlayerRatings {
  [key: string]: number
}

export default function RatePlayersPage() {
  const router = useRouter()
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [ratings, setRatings] = useState<PlayerRating[]>([])
  const [hoveredRating, setHoveredRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [playerRatings, setPlayerRatings] = useState<PlayerRatings>({})

  const currentPlayer = SORTED_TEAM_MEMBERS[currentPlayerIndex]

  const handleRating = (rating: number) => {
    setSelectedRating(rating)
    const newRating = { name: currentPlayer, rating }
    setRatings([...ratings, newRating])
    setPlayerRatings({ ...playerRatings, [currentPlayer]: rating })

    // Delay for animation effect
    setTimeout(() => {
      if (currentPlayerIndex < SORTED_TEAM_MEMBERS.length - 1) {
        setCurrentPlayerIndex(currentPlayerIndex + 1)
        setHoveredRating(0)
        setSelectedRating(0)
      } else {
        // All players rated
        setIsComplete(true)
        // Store ratings in localStorage for now
        localStorage.setItem('playerRatings', JSON.stringify([...ratings, newRating]))
        // Redirect to rankings after a brief celebration
        setTimeout(() => {
          router.push('/rankings')
        }, 2000)
      }
    }, 500)
  }

  const skipPlayer = () => {
    setSelectedRating(0)
    if (currentPlayerIndex < SORTED_TEAM_MEMBERS.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1)
      setHoveredRating(0)
    } else {
      setIsComplete(true)
      localStorage.setItem('playerRatings', JSON.stringify(ratings))
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ratings Complete!
          </h2>
          <p className="text-slate-400 mb-8">
            Thank you for rating {ratings.length} players
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center p-8">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-500/10 to-purple-600/10 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-green-500/10 to-blue-500/10 blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.div
        key={currentPlayerIndex}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full relative z-10"
      >
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Player {currentPlayerIndex + 1} of {SORTED_TEAM_MEMBERS.length}</span>
            <span>{Math.round(((currentPlayerIndex) / TEAM_MEMBERS.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentPlayerIndex) / SORTED_TEAM_MEMBERS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-800">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Rate Player Performance
            </h1>
            <p className="text-slate-400">
              How would you rate this player&apos;s overall performance?
            </p>
          </div>

          {/* Player Name */}
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {currentPlayer}
            </h2>
          </div>

          {/* Rating Stars */}
          <div className="mb-8">
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <div key={rating} className="flex flex-col items-center">
                  <button
                    onClick={() => handleRating(rating)}
                    onMouseEnter={() => setHoveredRating(rating)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="group"
                  >
                    <Star
                      className={`w-12 h-12 transition-all duration-200 ${
                        rating <= selectedRating
                          ? 'text-yellow-400 fill-yellow-400 scale-125 animate-pulse'
                          : rating <= hoveredRating
                          ? 'text-yellow-400 fill-yellow-400 scale-110'
                          : 'text-slate-600 hover:text-yellow-400'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-slate-400 mt-1">
                    {rating}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-center text-sm text-slate-500 mt-6">
              Click a star to rate (1 = Poor, 10 = Excellent)
            </p>
          </div>

          {/* Skip button */}
          <div className="flex justify-center">
            <button
              onClick={skipPlayer}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors flex items-center gap-2"
            >
              Skip this player
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mt-6 flex justify-center gap-8 text-sm text-slate-500">
          <div>
            <span className="text-slate-400 font-semibold">{ratings.length}</span> rated
          </div>
          <div>
            <span className="text-slate-400 font-semibold">{SORTED_TEAM_MEMBERS.length - currentPlayerIndex - 1}</span> remaining
          </div>
          {ratings.length > 0 && (
            <div>
              <span className="text-slate-400 font-semibold">
                {(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)}
              </span> avg rating
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}