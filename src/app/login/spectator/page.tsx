'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'
import { User, ArrowRight, Shield } from 'lucide-react'

export default function SpectatorPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = async () => {
    setIsLoading(true)
    
    // Create a spectator session (anonymous)
    // Store in localStorage for now, in production would use Supabase anon
    localStorage.setItem('spectator_mode', 'true')
    
    router.push('/')
  }

  return (
    <div className="min-h-screen">
      <main className="max-w-md mx-auto px-4 py-8 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">👀</div>
          <h1 className="text-2xl font-bold">Spectator Mode</h1>
          <p className="text-gray-400">View everything without playing</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 border border-blue-500/20"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold">What's included</h2>
          </div>
          
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-blue-400 mt-1" />
              View all matches and stats
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-blue-400 mt-1" />
              Vote for Man of the Match
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-blue-400 mt-1" />
              View standings and ratings
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-blue-400 mt-1" />
              Cannot submit stats or create matches
            </li>
          </ul>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleContinue}
          disabled={isLoading}
          className="w-full py-4 rounded-2xl bg-blue-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? 'Setting up...' : (
            <>
              Enter as Spectator <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>

        <p className="text-center text-sm text-gray-500">
          <button onClick={() => router.push('/login')} className="text-green-400 hover:underline">
            Or login as a player
          </button>
        </p>
      </main>
    </div>
  )
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}