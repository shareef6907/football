import NextLink from 'next/link'
import { Home, Users, Trophy, Calendar, Coins, Settings, Star, Award, LogIn, LogOut, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/standings', icon: Trophy, label: 'Standings' },
  { href: '/players', icon: Users, label: 'Players' },
  { href: '/ratings', icon: Star, label: 'Ratings' },
  { href: '/seasons', icon: Award, label: 'Seasons' },
  { href: '/coins', icon: Coins, label: 'Coins' },
]

export function Navigation({ activePath = '/' }: { activePath?: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === activePath
          return (
            <NextLink
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive 
                  ? 'text-green-400' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{label}</span>
            </NextLink>
          )
        })}
      </div>
    </nav>
  )
}

export function Header({ title = 'Thursday Football' }: { title?: string }) {
  // Use 'any' type to handle SSR - show Login by default, update after hydration
  const { user, profile } = useAuth() as any
  
  return (
    <header className="sticky top-0 z-40 glass border-b border-white/10">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <NextLink href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <h1 className="font-bold text-lg">{title}</h1>
        </NextLink>
        <div className="flex items-center gap-2">
          {user ? (
            <NextLink 
              href="/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm font-medium"
            >
              <User className="w-4 h-4" />
              {profile?.players?.name || (profile?.role === 'spectator' ? 'Spectator' : 'Profile')}
            </NextLink>
          ) : (
            <NextLink 
              href="/login"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500 text-black text-sm font-medium"
            >
              <LogIn className="w-4 h-4" />
              Login
            </NextLink>
          )}
          <NextLink 
            href="/settings"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </NextLink>
        </div>
      </div>
    </header>
  )
}