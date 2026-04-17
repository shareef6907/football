'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const [status, setStatus] = useState('Checking login status...')

  useEffect(() => {
    let didRedirect = false

    const handleCallback = async () => {
      // Use onAuthStateChange to catch session from URL hash
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth event:', event)
        
        if (didRedirect) return
        
        if (session?.user) {
          console.log('User logged in:', session.user.email)
          
          // Check for linked profile in user_profiles table
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*, players(*)')
            .eq('google_id', session.user.id)
            .single()

          console.log('Profile found:', profile)

          if (profile) {
            didRedirect = true
            router.push('/')
          } else {
            // No profile linked - go to select profile
            didRedirect = true
            router.push('/login/select-profile')
          }
        }
      })

      // Fallback: check getSession after delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      if (didRedirect) return

      const { data: { session } } = await supabase.auth.getSession()

      console.log('Fallback session:', session?.user?.email)

      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*, players(*)')
          .eq('google_id', session.user.id)
          .single()

        console.log('Fallback profile:', profile)

        if (!profile) {
          didRedirect = true
          router.push('/login/select-profile')
        } else {
          didRedirect = true
          router.push('/')
        }
      } else {
        // No session - go to login
        router.push('/login')
      }

      return () => subscription.unsubscribe()
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-400" />
        <p>{status}</p>
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