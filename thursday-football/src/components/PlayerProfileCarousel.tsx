'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, Trophy, Target, ShieldCheck, Upload, User } from 'lucide-react'
import { TEAM_MEMBERS } from '@/lib/auth'
import { getPlayerBadges } from '@/lib/awards'

interface PlayerProfile {
  name: string
  rating: number
  goals: number
  assists: number
  saves: number
  wins: number
  gamesPlayed: number
  points: number
  badges: string[]
  image?: string
  position: string
  age: number
  height: string
  weight: string
  shirtNumber: number
  attributes: string[]
}

interface PlayerProfileCarouselProps {
  currentUserName?: string
}

export default function PlayerProfileCarousel({ currentUserName }: PlayerProfileCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [players, setPlayers] = useState<PlayerProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlayerProfiles()
    
    // Listen for profile updates from dashboard
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('Profile update received:', event.detail)
      loadPlayerProfiles() // Reload all profiles when any profile is updated
    }
    
    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener)
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener)
    }
  }, [])

  const loadPlayerProfiles = () => {
    // Get ratings from localStorage
    const storedRatings = localStorage.getItem('playerRatings')
    const ratings = storedRatings ? JSON.parse(storedRatings) : []
    
    // Get match data from localStorage
    const matchData = localStorage.getItem('matchData')
    const matches = matchData ? JSON.parse(matchData) : {}
    
    // Get player images from localStorage
    const storedImages = localStorage.getItem('playerImages')
    const images = storedImages ? JSON.parse(storedImages) : {}
    
    // Get stored profile data from localStorage
    const storedProfiles = localStorage.getItem('playerProfiles')
    const profilesData = storedProfiles ? JSON.parse(storedProfiles) : {}

    const profiles: PlayerProfile[] = TEAM_MEMBERS.map((name, index) => {
      const playerRating = ratings.find((r: any) => r.name === name)?.rating || 5
      const playerMatches = matches[name] || {}
      const badges = getPlayerBadges(name)
      
      // Calculate total points
      const points = calculatePoints({
        rating: playerRating,
        goals: playerMatches.goals || 0,
        assists: playerMatches.assists || 0,
        saves: playerMatches.saves || 0,
        wins: playerMatches.wins || 0
      })

      // Get stored profile data or default
      const storedProfile = profilesData[name]
      const defaultData = getPlayerData(name, index)

      return {
        name,
        rating: playerRating,
        goals: playerMatches.goals || 0,
        assists: playerMatches.assists || 0,
        saves: playerMatches.saves || 0,
        wins: playerMatches.wins || 0,
        gamesPlayed: playerMatches.gamesPlayed || 0,
        points,
        badges,
        image: images[name] || defaultData.defaultImage,
        position: storedProfile?.position || defaultData.position,
        age: storedProfile?.age || defaultData.age,
        height: storedProfile?.height || defaultData.height,
        weight: storedProfile?.weight || defaultData.weight,
        shirtNumber: storedProfile?.shirtNumber || defaultData.shirtNumber,
        attributes: storedProfile?.attributes || defaultData.attributes
      }
    })

    // Sort by points (highest first)
    profiles.sort((a, b) => b.points - a.points)
    
    setPlayers(profiles)
    setLoading(false)
  }

  const calculatePoints = (stats: {
    rating: number
    goals: number
    assists: number
    saves: number
    wins: number
  }) => {
    return (
      stats.rating * 10 +
      stats.goals * 5 +
      stats.assists * 3 +
      stats.saves * 2 +
      stats.wins * 4
    )
  }

  const getPlayerData = (name: string, index: number) => {
    // Sample data for each player - customize as needed
    const positions = ['FORWARD', 'MIDFIELDER', 'DEFENDER', 'GOALKEEPER']
    const attributes = [
      ['SCORING GOALS', 'PACE', 'FINISHING'],
      ['PASSING', 'VISION', 'CREATING ASSISTS'],
      ['DEFENDING', 'TACKLING', 'STRENGTH'],
      ['GOALKEEPING', 'REFLEXES', 'DISTRIBUTION']
    ]

    return {
      defaultImage: '/default-player.jpg', // Default player image
      position: positions[index % 4],
      age: 20 + (index % 15),
      height: `${5.5 + (index % 8) * 0.1} FT`,
      weight: `${65 + (index % 20)}KG`,
      shirtNumber: index + 1,
      attributes: attributes[index % 4]
    }
  }

  const handleImageUpload = (playerName: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      
      // Store in localStorage
      const storedImages = localStorage.getItem('playerImages')
      const images = storedImages ? JSON.parse(storedImages) : {}
      images[playerName] = imageUrl
      localStorage.setItem('playerImages', JSON.stringify(images))
      
      // Update state
      setPlayers(prev => prev.map(player => 
        player.name === playerName 
          ? { ...player, image: imageUrl }
          : player
      ))
    }
    reader.readAsDataURL(file)
  }

  const nextPlayer = () => {
    setCurrentIndex((prev) => (prev + 1) % players.length)
  }

  const prevPlayer = () => {
    setCurrentIndex((prev) => (prev - 1 + players.length) % players.length)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    )
  }

  const currentPlayer = players[currentIndex]

  return (
    <div className="relative">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
          ⚽ Player Profiles
        </h2>
        <p className="text-gray-400">Swipe to explore all players</p>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mb-6">
        {players.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-blue-400 w-8' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
          />
        ))}
      </div>

      {/* Player Card */}
      <div className="relative overflow-hidden">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -300 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="w-full max-w-md mx-auto"
        >
          <div className="relative bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header with club logo */}
            <div className="relative h-48 bg-gradient-to-br from-yellow-300 to-yellow-500">
              <div className="absolute top-4 right-4 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white">
                TF
              </div>
              
              {/* Player Image */}
              <div className="absolute bottom-0 right-4 w-32 h-40 relative">
                {currentPlayer.image && currentPlayer.image !== '/default-player.jpg' ? (
                  <img 
                    src={currentPlayer.image} 
                    alt={currentPlayer.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                
                {/* Image upload button - only for current user */}
                {currentUserName === currentPlayer.name && (
                  <label className="absolute top-1 right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                    <Upload className="w-3 h-3 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleImageUpload(currentPlayer.name, e.target.files[0])
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Player Info Section */}
            <div className="bg-white p-6 text-black">
              <h3 className="text-2xl font-black mb-4">PLAYER PROFILE</h3>
              
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mb-6">
                <div className="bg-gray-100 rounded px-2 py-1">
                  <span className="font-medium">Nick Name:</span>
                  <span className="ml-2">{currentPlayer.name}</span>
                </div>
                <div className="rounded px-2 py-1">
                  <span className="font-medium">Age:</span>
                  <span className="ml-2">{currentPlayer.age}</span>
                </div>
                <div className="rounded px-2 py-1">
                  <span className="font-medium">Height:</span>
                  <span className="ml-2">{currentPlayer.height}</span>
                </div>
                <div className="bg-gray-100 rounded px-2 py-1">
                  <span className="font-medium">Weight:</span>
                  <span className="ml-2">{currentPlayer.weight}</span>
                </div>
                <div className="bg-gray-100 rounded px-2 py-1">
                  <span className="font-medium">Position:</span>
                  <span className="ml-2">{currentPlayer.position}</span>
                </div>
                <div className="rounded px-2 py-1">
                  <span className="font-medium">Shirt No:</span>
                  <span className="ml-2">{currentPlayer.shirtNumber}</span>
                </div>
              </div>

              {/* Attributes */}
              <div className="mb-6">
                <div className="font-medium text-sm mb-2">Attributes:</div>
                <div className="text-sm font-bold space-y-1">
                  {currentPlayer.attributes.map((attr, index) => (
                    <div key={index}>{attr}</div>
                  ))}
                </div>
              </div>

              {/* Career Stats */}
              <div className="bg-blue-600 text-white rounded-full p-4 flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 text-2xl font-black">
                  {String(currentPlayer.goals).padStart(2, '0')}
                </div>
                <div>
                  <div className="text-lg font-bold">TOTAL CAREER GOALS</div>
                  <div className="text-sm opacity-90">IN {currentPlayer.gamesPlayed} GAMES</div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-green-100 rounded p-2">
                  <div className="font-bold text-lg text-green-800">{currentPlayer.assists}</div>
                  <div className="text-green-600">ASSISTS</div>
                </div>
                <div className="bg-blue-100 rounded p-2">
                  <div className="font-bold text-lg text-blue-800">{currentPlayer.saves}</div>
                  <div className="text-blue-600">SAVES</div>
                </div>
                <div className="bg-yellow-100 rounded p-2">
                  <div className="font-bold text-lg text-yellow-800">{currentPlayer.wins}</div>
                  <div className="text-yellow-600">WINS</div>
                </div>
                <div className="bg-purple-100 rounded p-2">
                  <div className="font-bold text-lg text-purple-800">{currentPlayer.points}</div>
                  <div className="text-purple-600">POINTS</div>
                </div>
              </div>

              {/* Rating Display */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="text-lg font-bold">{currentPlayer.rating}/10 Rating</span>
              </div>

              {/* Badges */}
              {currentPlayer.badges.length > 0 && (
                <div className="mt-4 text-center">
                  <div className="text-sm font-medium mb-1">Achievements</div>
                  <div className="text-xl">{currentPlayer.badges.join(' ')}</div>
                </div>
              )}
            </div>

            {/* Player Name Footer */}
            <div className="bg-black text-white text-center py-3">
              <div className="text-xs opacity-70">{currentPlayer.position}</div>
              <div className="text-2xl font-black">{currentPlayer.name.toUpperCase()}</div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Arrows */}
        <button
          onClick={prevPlayer}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button
          onClick={nextPlayer}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all duration-200 backdrop-blur-sm"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Auto-slide every 5 seconds */}
      <div className="mt-6 text-center">
        <button
          onClick={() => {
            const interval = setInterval(nextPlayer, 3000)
            setTimeout(() => clearInterval(interval), 30000) // Auto-slide for 30 seconds
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
        >
          Auto-Slide (30s)
        </button>
      </div>
    </div>
  )
}

// Sample player data generator
function getPlayerData(name: string, index: number) {
  const positions = ['FORWARD', 'MIDFIELDER', 'DEFENDER', 'GOALKEEPER']
  const forwardAttributes = ['SCORING GOALS', 'PACE', 'FINISHING']
  const midfielderAttributes = ['PASSING', 'VISION', 'CREATING ASSISTS']
  const defenderAttributes = ['DEFENDING', 'TACKLING', 'STRENGTH']
  const goalkeeperAttributes = ['GOALKEEPING', 'REFLEXES', 'DISTRIBUTION']
  
  const allAttributes = [forwardAttributes, midfielderAttributes, defenderAttributes, goalkeeperAttributes]
  const positionIndex = index % 4

  return {
    defaultImage: '/default-player.jpg',
    position: positions[positionIndex],
    age: 20 + (index % 15),
    height: `${5.5 + (index % 8) * 0.1}`,
    weight: `${65 + (index % 20)}`,
    shirtNumber: index + 1,
    attributes: allAttributes[positionIndex]
  }
}