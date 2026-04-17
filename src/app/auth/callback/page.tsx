'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const [status, setStatus] = useState('Processing your login...')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      // Give Supabase time to process the URL hash (access token)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        setError(sessionError.message)
        return
      }
      
      if (!session) {
        // No session after processing - try once more
        console.log('No session found, checking again...')
        const retry = await supabase.auth.getSession()
        if (!retry.data.session) {
          setError('No session found. Please try logging in again.')
          return
        }
      }
      
      const sessionUser = (await supabase.auth.getSession()).data.session
      
      if (sessionUser) {
        console.log('Session found for:', sessionUser.user.email)
        
        // Check if user has a profile linked
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*, players(*)')
          .eq('google_id', sessionUser.user.id)
          .single()
        
        if (profile) {
          console.log('Profile found, going to home')
          router.push('/')
        } else {
          console.log('No profile, going to select-profile')
          router.push('/login/select-profile')
        }
      } else {
        setError('Unable to create session. Please try again.')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-400" />
        <p>{status}</p>
        {error && <p className="text-red-400 mt-2">{error}</p>}
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