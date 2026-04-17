'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Shield, Eye, CheckCircle, X, ArrowRight, User, Users } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // This will be handled by Supabase Auth UI
      // For now, show the flow explanation
      router.push('/login/select-profile')
    } catch (err) {
      setError('Failed to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-md mx-auto px-4 py-8 space-y-8">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-2xl font-bold">Thursday Football</h1>
          <p className="text-gray-400">Sign in to continue</p>
        </motion.div>

        {/* Login Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.63l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.96 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.96 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </motion.div>

        {/* Why Login? */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-400" />
            <h2 className="font-bold">Why login is required</h2>
          </div>
          
          <p className="text-sm text-gray-400 mb-4">
            Login prevents cheating. You can only submit your own stats and vote once.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Submit your stats</div>
                <div className="text-sm text-gray-400">Only you can record your own goals & assists</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Vote Man of the Match</div>
                <div className="text-sm text-gray-400">One vote per person per match</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Rate players monthly</div>
                <div className="text-sm text-gray-400">Peer ratings for team balancing</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Spectator Option */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 border border-blue-500/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold">Spectators</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Not a player? Login as a spectator to view everything and vote for Man of the Match.
          </p>
          <Link href="/login/spectator">
            <button className="w-full py-3 rounded-xl bg-blue-500/20 text-blue-400 font-semibold flex items-center justify-center gap-2">
              I'm a Spectator <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
            <X className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="text-center text-sm text-gray-500">
          <Link href="/">Skip for now</Link>
        </div>
      </main>
    </div>
  )
}