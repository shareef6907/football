'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  const links = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/standings', label: 'Standings', icon: '🏆' },
    { href: '/players', label: 'Players', icon: '👥' },
    { href: '/ratings', label: 'Ratings', icon: '⭐' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {links.map(l => (
          <Link key={l.href} href={l.href} className={`flex flex-col items-center justify-center w-full h-full ${pathname === l.href ? 'text-green-400' : 'text-gray-400'}`}>
            <span className="text-xl">{l.icon}</span>
            <span className="text-xs mt-1">{l.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
