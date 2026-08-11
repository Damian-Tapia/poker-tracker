'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/players/', label: 'Jugadores', suit: '♠' },
  { href: '/session/new/', label: 'Sesión', suit: '♥' },
  { href: '/history/', label: 'Historial', suit: '♦' },
  { href: '/stats/', label: 'Stats', suit: '♣' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-felt-500 bg-ink/95 backdrop-blur-sm safe-area-bottom">
      {NAV.map(({ href, label, suit }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href.slice(0, -1)));
        const red = suit === '♥' || suit === '♦';
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs transition-colors ${
              active ? 'text-brass-300' : 'text-ivory-dim hover:text-ivory'
            }`}
          >
            <span className={`text-xl leading-none ${red && !active ? 'text-oxblood' : ''}`} aria-hidden>
              {suit}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
