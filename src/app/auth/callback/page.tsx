'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const [status, setStatus] = useState('Setting up your account...')

  useEffect(() => {
    const handleCallback = async () => {
      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const { data: { session } } = await supabase.auth.getSession()

      console.log('Session:', session?.user?.email)

      // ALWAYS go to select-profile first - let user choose their profile
      // This ensures new users always select their profile
      router.push('/login/select-profile')
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