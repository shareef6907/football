'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { PLAYERS } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { User, Check, AlertCircle, Instagram, Edit2, Heart } from 'lucide-react'
import { Navigation, Header } from '@/components/Navigation'

// These usernames are blocked — they match existing routes
const RESERVED_USERNAMES = [
 'admin', 'api', 'auth', 'coins', 'login', 'man-of-the-match', 'match-day',
 'players', 'points', 'profile', 'ratings', 'seasons', 'settings', 'standings',
 'match', 'draft', 'auto', 'submit', 'spectator', 'select-profile',
 'about', 'contact', 'help', 'terms', 'privacy', 'app', 'home',
 'thursday', 'football', 'thursdayfootball', 'league',
]

const FITNESS_OPTIONS = [
 { value: 'fit', label: '💪 Fit', color: 'text-green-400' },
 { value: 'slight_knock', label: '🤕 Slight Knock', color: 'text-yellow-400' },
 { value: 'injured', label: '🩹 Injured', color: 'text-red-400' },
 { value: 'unavailable', label: '❌ Unavailable', color: 'text-gray-400' },
]

export default function EditProfilePage() {
 const router = useRouter()
 const { user, profile, loading: authLoading } = useAuth()

 const [username, setUsername] = useState('')
 const [bio, setBio] = useState('')
 const [fitnessStatus, setFitnessStatus] = useState('fit')
 const [instagramHandle, setInstagramHandle] = useState('')
 const [saving, setSaving] = useState(false)
 const [saveMessage, setSaveMessage] = useState('')
 const [usernameError, setUsernameError] = useState('')
 const [checkingUsername, setCheckingUsername] = useState(false)

 // Load existing profile data
 useEffect(() => {
 if (!authLoading && !user) {
 router.push('/login')
 return
 }

 if (profile?.player_id) {
 const loadProfile = async () => {
 const { data } = await supabase
 .from('user_profiles')
 .select('username, bio, fitness_status, instagram_handle')
 .eq('player_id', profile.player_id)
 .single()

 if (data) {
 setUsername(data.username || '')
 setBio(data.bio || '')
 setFitnessStatus(data.fitness_status || 'fit')
 setInstagramHandle(data.instagram_handle || '')
 }
 }
 loadProfile()
 }
 }, [user, profile, authLoading, router])

 // Validate username
 const validateUsername = (value: string): string => {
 if (!value) return ''
 if (value.length < 3) return 'Username must be at least 3 characters'
 if (value.length > 20) return 'Username must be 20 characters or less'
 if (!/^[a-z0-9_]+$/.test(value)) return 'Only lowercase letters, numbers, and underscores'
 if (RESERVED_USERNAMES.includes(value)) return 'This username is reserved'
 return ''
 }

 // Check username availability
 const checkUsername = async (value: string) => {
 const error = validateUsername(value)
 if (error) {
 setUsernameError(error)
 return
 }

 setCheckingUsername(true)
 const { data } = await supabase
 .from('user_profiles')
 .select('player_id')
 .eq('username', value)
 .single()

 if (data && data.player_id !== profile?.player_id) {
 setUsernameError('Username taken')
 } else {
 setUsernameError('')
 }
 setCheckingUsername(false)
 }

 const handleSave = async () => {
 if (!profile?.player_id) return
 if (usernameError) return

 setSaving(true)
 setSaveMessage('')

 // Final username check
 if (username) {
 const error = validateUsername(username)
 if (error) {
 setUsernameError(error)
 setSaving(false)
 return
 }
 }

 try {
 const { error } = await supabase
 .from('user_profiles')
 .update({
 username: username || null,
 bio: bio.slice(0, 200),
 fitness_status: fitnessStatus,
 instagram_handle: instagramHandle.replace('@', ''),
 profile_updated_at: new Date().toISOString(),
 })
 .eq('player_id', profile.player_id)

 if (error) {
 if (error.message.includes('unique') || error.message.includes('duplicate')) {
 setUsernameError('Username taken')
 } else {
 setSaveMessage('Error: ' + error.message)
 }
 } else {
 setSaveMessage('Profile saved!')
 // Redirect to profile after short delay
 setTimeout(() => {
 if (username) {
 router.push('/' + username)
 }
 }, 1000)
 }
 } catch (err: any) {
 setSaveMessage('Error: ' + err.message)
 } finally {
 setSaving(false)
 }
 }

 const player = profile?.player_id ? PLAYERS.find(p => p.id === profile.player_id) : null

 if (authLoading) {
 return (
 <div className="min-h-screen pb-20">
 <Header title="Edit Profile" />
 <main className="max-w-md mx-auto px-4 py-6">
 <div className="text-center p-8 text-gray-400">Loading...</div>
 </main>
 <Navigation activePath="/players" />
 </div>
 )
 }

 return (
 <div className="min-h-screen pb-20">
 <Header title="Edit Profile" />

 <main className="max-w-md mx-auto px-4 py-6 space-y-6">
 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
 {player && (
 <div
 className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-2"
 style={{ backgroundColor: player.color }}
 >
 {player.name.slice(0, 2).toUpperCase()}
 </div>
 )}
 <h1 className="text-2xl font-bold">{player?.name || 'Edit Profile'}</h1>
 </motion.div>

 {/* Username */}
 <div className="space-y-2">
 <label className="text-sm text-gray-400">Username (your custom URL)</label>
 <div className="flex items-center gap-2">
 <span className="text-gray-500 text-sm">thursdayfootball.com/</span>
 <input
 type="text"
 value={username}
 onChange={(e) => {
 const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
 setUsername(val)
 setUsernameError('')
 }}
 onBlur={() => username && checkUsername(username)}
 className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10"
 placeholder="yourname"
 maxLength={20}
 />
 </div>
 {checkingUsername && <p className="text-xs text-gray-500">Checking...</p>}
 {usernameError && <p className="text-xs text-red-400">{usernameError}</p>}
 {username && !usernameError && !checkingUsername && <p className="text-xs text-green-400">✓ Available</p>}
 </div>

 {/* Bio */}
 <div className="space-y-2">
 <label className="text-sm text-gray-400">Bio ({bio.length}/200)</label>
 <textarea
 value={bio}
 onChange={(e) => setBio(e.target.value.slice(0, 200))}
 className="w-full p-3 rounded-xl bg-white/5 border border-white/10 resize-none"
 rows={3}
 placeholder="Tell us about yourself..."
 />
 </div>

 {/* Fitness Status */}
 <div className="space-y-2">
 <label className="text-sm text-gray-400">Fitness Status</label>
 <div className="grid grid-cols-2 gap-2">
 {FITNESS_OPTIONS.map(option => (
 <button
 key={option.value}
 onClick={() => setFitnessStatus(option.value)}
 className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
 fitnessStatus === option.value
 ? 'border-green-500 bg-green-500/10'
 : 'border-white/10 bg-white/5'
 }`}
 >
 <span className={fitnessStatus === option.value ? option.color : 'text-gray-400'}>
 {option.label}
 </span>
 </button>
 ))}
 </div>
 </div>

 {/* Instagram */}
 <div className="space-y-2">
 <label className="text-sm text-gray-400">Instagram Handle</label>
 <div className="flex items-center gap-2">
 <span className="text-gray-500">@</span>
 <input
 type="text"
 value={instagramHandle}
 onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
 className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10"
 placeholder="instagram_username"
 />
 </div>
 </div>

 {/* Save */}
 {saveMessage && (
 <div className={`p-3 rounded-xl text-center ${saveMessage.startsWith('Error') ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
 {saveMessage}
 </div>
 )}

 <button
 onClick={handleSave}
 disabled={saving || !!usernameError}
 className="w-full py-4 rounded-2xl bg-green-500 text-black font-bold disabled:opacity-50 flex items-center justify-center gap-2"
 >
 <Check className="w-5 h-5" />
 {saving ? 'Saving...' : 'Save Profile'}
 </button>
 </main>

 <Navigation activePath="/players" />
 </div>
 )
}