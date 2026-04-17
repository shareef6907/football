'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2, AlertCircle } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const [status, setStatus] = useState('Checking login status...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      // Use onAuthStateChange to catch the session from URL hash
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || session) {
          console.log('Auth event:', event, session?.user?.email)
          
          if (session?.user) {
            // Check for linked profile
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*, players(*)')
              .eq('google_id', session.user.id)
              .single()
            
            if (profile) {
              router.push('/')
            } else {
              router.push('/login/select-profile')
            }
          }
        }
      })

      // Also try getSession as fallback
      await new Promise(resolve => setTimeout(resolve, 2000))
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*, players(*)')
          .eq('google_id', session.user.id)
          .single()
        
        if (profile) {
          router.push('/')
        } else {
          router.push('/login/select-profile')
        }
      }

      return () => subscription.unsubscribe()
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-400" />
        <p>{status}</p>
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/20 border border-red-500/30">
            <AlertCircle className="w-5 h-5 inline mr-2" />
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-400" />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}