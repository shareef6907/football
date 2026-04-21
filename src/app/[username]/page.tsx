'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { PLAYERS, POINTS_SYSTEM, Position } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { Trophy, Target, Shield, Star, Instagram, Heart, ArrowLeft, Edit2 } from 'lucide-react'
import { Navigation } from '@/components/Navigation'
import Link from 'next/link'

const FITNESS_LABELS: Record<string, { label: string, color: string }> = {
 fit: { label: '💪 Fit', color: 'text-green-400' },
 slight_knock: { label: '🤕 Slight Knock', color: 'text-yellow-400' },
 injured: { label: '🩹 Injured', color: 'text-red-400' },
 unavailable: { label: '❌ Unavailable', color: 'text-gray-400' },
}

function getPositionColor(position: Position) {
 switch (position) {
 case 'forward': return 'text-red-400'
 case 'midfielder': return 'text-blue-400'
 case 'defender': return 'text-green-400'
 case 'goalkeeper': return 'text-yellow-400'
 }
}

function getPositionLabel(position: Position) {
 switch (position) {
 case 'forward': return 'Forward'
 case 'midfielder': return 'Midfielder'
 case 'defender': return 'Defender'
 case 'goalkeeper': return 'Goalkeeper'
 }
}

export default function PublicProfilePage() {
 const params = useParams()
 const username = params.username as string

 const [profileData, setProfileData] = useState<any>(null)
 const [player, setPlayer] = useState<typeof PLAYERS[number] | null>(null)
 const [stats, setStats] = useState({ goals: 0, assists: 0, wins: 0, matches: 0, motm: 0, coins: 0 })
 const [ratings, setRatings] = useState({ forward: 0, midfielder: 0, defender: 0, goalkeeper: 0, overall: 0 })
 const [loading, setLoading] = useState(true)
 const [notFound, setNotFound] = useState(false)

 // Reserved routes that should NOT be caught by [username]
 const RESERVED_ROUTES = ['admin', 'api', 'auth', 'coins', 'login', 'man-of-the-match', 'match-day',
 'players', 'points', 'profile', 'ratings', 'seasons', 'settings', 'standings',
 'match', 'draft', 'auto', 'submit', 'spectator', 'select-profile',
 'about', 'contact', 'help', 'terms', 'privacy', 'app', 'home',
 'thursday', 'football', 'thursdayfootball', 'league']

 // If it's a reserved route, redirect to 404 immediately
 useEffect(() => {
 if (RESERVED_ROUTES.includes(username)) {
 setNotFound(true)
 setLoading(false)
 }
 }, [username])

 useEffect(() => {
 if (RESERVED_ROUTES.includes(username)) return

 const loadProfile = async () => {
 setLoading(true)

 // Step 1: Find the player — by custom username OR by name
 let profileDataFromDb: any = null
 let foundPlayer: typeof PLAYERS[number] | null = null

 // Try custom username in DB
 const { data: byUsername } = await supabase
 .from('user_profiles')
 .select('*')
 .eq('username', username)
 .single()

 if (byUsername && byUsername.player_id) {
 profileDataFromDb = byUsername
 foundPlayer = PLAYERS.find(p => p.id === byUsername.player_id) || null
 }

 // Fallback: match by player name (case-insensitive)
 if (!foundPlayer) {
 const nameMatch = PLAYERS.find(p => p.name.toLowerCase() === username.toLowerCase())
 if (nameMatch) {
 foundPlayer = nameMatch
 // Try to load their profile data
 const { data: byPlayer } = await supabase
 .from('user_profiles')
 .select('*')
 .eq('player_id', nameMatch.id)
 .single()
 if (byPlayer) profileDataFromDb = byPlayer
 }
 }

 if (!foundPlayer) {
 setNotFound(true)
 setLoading(false)
 return
 }

 setPlayer(foundPlayer)
 setProfileData(profileDataFromDb)

 // Step 2: Load stats using foundPlayer.id
 const [matchesRes, statsRes, motmRes, ratingsRes] = await Promise.all([
 supabase.from('matches').select('id'),
 supabase.from('match_stats').select('*').eq('player_id', foundPlayer.id),
 supabase.from('man_of_the_match_winners').select('match_id').eq('player_id', foundPlayer.id),
 supabase.from('player_ratings').select('forward_rating, midfielder_rating, defender_rating, goalkeeper_rating').eq('rated_player_id', foundPlayer.id),
 ])

 const matchIds = (matchesRes.data || []).map(m => m.id)
 const playerStats = (statsRes.data || []).filter(s => matchIds.includes(s.match_id))
 const motmWins = (motmRes.data || []).filter(m => matchIds.includes(m.match_id))
 const playerRatings = ratingsRes.data || []

 // Calculate stats
 let goals = 0, assists = 0, wins = 0, coins = 0
 playerStats.forEach(s => {
 goals += s.goals || 0
 assists += s.assists || 0
 if (s.is_winner) wins++
 // Calculate points for coins
 let pts = (s.goals || 0) * POINTS_SYSTEM.goal + (s.assists || 0) * POINTS_SYSTEM.assist
 if (s.is_winner) pts += POINTS_SYSTEM.matchWin
 if (s.clean_sheet) pts += POINTS_SYSTEM.cleanSheet
 if (s.played_as_gk && s.is_winner) pts += POINTS_SYSTEM.goalkeeperWinBonus
 coins += pts
 })
 coins += motmWins.length * POINTS_SYSTEM.manOfTheMatch

 setStats({ goals, assists, wins, matches: playerStats.length, motm: motmWins.length, coins })

 // Calculate ratings
 if (playerRatings.length > 0) {
 let fwd = 0, mid = 0, def = 0, gk = 0
 playerRatings.forEach(r => {
 fwd += r.forward_rating || 0
 mid += r.midfielder_rating || 0
 def += r.defender_rating || 0
 gk += r.goalkeeper_rating || 0
 })
 const count = playerRatings.length
 const avgFwd = Math.round((fwd / count) * 10) / 10
 const avgMid = Math.round((mid / count) * 10) / 10
 const avgDef = Math.round((def / count) * 10) / 10
 const avgGk = Math.round((gk / count) * 10) / 10
 const overall = Math.round((avgFwd + avgMid + avgDef + avgGk) / 4 * 10) / 10
 setRatings({ forward: avgFwd, midfielder: avgMid, defender: avgDef, goalkeeper: avgGk, overall })
 }

 setLoading(false)
 }

 loadProfile()
 }, [username])

 if (loading) {
 return (
 <div className="min-h-screen pb-20">
 <main className="max-w-md mx-auto px-4 py-6">
 <div className="text-center p-8 text-gray-400">Loading profile...</div>
 </main>
 </div>
 )
 }

 if (notFound) {
 return (
 <div className="min-h-screen pb-20">
 <main className="max-w-md mx-auto px-4 py-6 text-center">
 <div className="text-6xl mb-4">🔍</div>
 <h1 className="text-2xl font-bold mb-2">Player Not Found</h1>
 <p className="text-gray-400 mb-6">No player with username "{username}"</p>
 <Link href="/players" className="px-6 py-3 bg-green-500 text-black rounded-xl font-bold">
 View All Players
 </Link>
 </main>
 <Navigation activePath="/players" />
 </div>
 )
 }

 if (!player) return null

 const fitness = FITNESS_LABELS[profileData?.fitness_status || 'fit']

 return (
 <div className="min-h-screen pb-20">
 <main className="max-w-md mx-auto px-4 py-6 space-y-6">
 {/* Back */}
 <Link href="/players" className="flex items-center gap-2 text-gray-400 text-sm">
 <ArrowLeft className="w-4 h-4" /> All Players
 </Link>

 {/* Edit Profile */}
 <Link href="/profile/edit" className="w-full py-3 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center gap-2 text-sm">
 <Edit2 className="w-4 h-4" />
 Edit My Profile
 </Link>

 {/* Header Card */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="glass rounded-2xl p-6 border border-white/10 text-center"
 style={{ background: `linear-gradient(135deg, ${player.color}20 0%, transparent 60%)` }}
 >
 <div
 className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-3"
 style={{ backgroundColor: player.color, boxShadow: `0 0 30px ${player.color}40` }}
 >
 {player.name.slice(0, 2).toUpperCase()}
 </div>
 <h1 className="text-3xl font-bold">{player.name}</h1>
 <p className={`text-sm font-semibold ${getPositionColor((profileData?.preferred_position || player.position) as Position)}`}>
 {getPositionLabel((profileData?.preferred_position || player.position) as Position)}
 </p>

 {/* Fitness */}
 <div className={`mt-2 text-sm ${fitness.color}`}>{fitness.label}</div>

 {/* Bio */}
 {profileData?.bio && (
 <p className="mt-3 text-gray-400 text-sm">{profileData.bio}</p>
 )}

 {/* Instagram */}
 {profileData?.instagram_handle && (
 <a
 href={`https://instagram.com/${profileData.instagram_handle}`}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 mt-3 text-pink-400 text-sm hover:text-pink-300"
 >
 <Instagram className="w-4 h-4" />
 @{profileData.instagram_handle}
 </a>
 )}
 </motion.div>

 {/* Overall Rating */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.1 }}
 className="glass rounded-2xl p-6 border border-white/10"
 >
 <div className="flex items-center justify-between mb-4">
 <h2 className="font-bold text-gray-400">Player Rating</h2>
 <div className="text-3xl font-bold" style={{ color: player.color }}>{ratings.overall || 5}</div>
 </div>
 <div className="grid grid-cols-4 gap-3 text-center">
 <div>
 <div className="text-xs text-red-400">FWD</div>
 <div className="text-lg font-bold">{ratings.forward || 5}</div>
 </div>
 <div>
 <div className="text-xs text-blue-400">MID</div>
 <div className="text-lg font-bold">{ratings.midfielder || 5}</div>
 </div>
 <div>
 <div className="text-xs text-green-400">DEF</div>
 <div className="text-lg font-bold">{ratings.defender || 5}</div>
 </div>
 <div>
 <div className="text-xs text-yellow-400">GK</div>
 <div className="text-lg font-bold">{ratings.goalkeeper || 5}</div>
 </div>
 </div>
 </motion.div>

 {/* Stats */}
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: 0.2 }}
 className="glass rounded-2xl p-6 border border-white/10"
 >
 <h2 className="font-bold text-gray-400 mb-4">Season Stats</h2>
 <div className="grid grid-cols-3 gap-4 text-center">
 <div>
 <div className="text-2xl font-bold text-white">{stats.goals}</div>
 <div className="text-xs text-gray-500">Goals</div>
 </div>
 <div>
 <div className="text-2xl font-bold text-white">{stats.assists}</div>
 <div className="text-xs text-gray-500">Assists</div>
 </div>
 <div>
 <div className="text-2xl font-bold text-white">{stats.wins}</div>
 <div className="text-xs text-gray-500">Wins</div>
 </div>
 <div>
 <div className="text-2xl font-bold text-yellow-400">{stats.motm}</div>
 <div className="text-xs text-gray-500">Man of the Match</div>
 </div>
 <div>
 <div className="text-2xl font-bold text-white">{stats.matches}</div>
 <div className="text-xs text-gray-500">Matches</div>
 </div>
 <div>
 <div className="text-2xl font-bold text-green-400">{stats.coins}</div>
 <div className="text-xs text-gray-500">Coins</div>
 </div>
 </div>
 </motion.div>
 </main>

 <Navigation activePath="/players" />
 </div>
 )
}