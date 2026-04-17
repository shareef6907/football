'use client'

import { useAuth } from '@/context/AuthContext'
import { User, LogOut, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Please log in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-40 glass border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-bold text-lg">Profile</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="glass rounded-2xl p-6 border border-white/10 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-2xl font-bold">
            {profile?.players?.name || (profile?.role === 'spectator' ? 'Spectator' : 'Profile')}
          </h2>
          <p className="text-gray-400">{user.email}</p>
          {profile?.role === 'spectator' && (
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
              Spectator
            </span>
          )}
        </div>

        {/* Account Info */}
        <div className="glass rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400" />
            <div>
              <div className="font-medium">Google Account</div>
              <div className="text-sm text-gray-400">{user.email}</div>
            </div>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-4 rounded-2xl bg-red-500/20 text-red-400 font-bold flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </main>
    </div>
  )
}