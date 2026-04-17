import NextLink from 'next/link'
import { Home, Users, Trophy, Calendar, Coins, Settings } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/standings', icon: Trophy, label: 'Standings' },
  { href: '/players', icon: Users, label: 'Players' },
  { href: '/match-day', icon: Calendar, label: 'Match' },
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
  return (
    <header className="sticky top-0 z-40 glass border-b border-white/10">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <NextLink href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <h1 className="font-bold text-lg">{title}</h1>
        </NextLink>
        <NextLink 
          href="/login"
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </NextLink>
      </div>
    </header>
  )
}