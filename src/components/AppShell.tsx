'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMounted } from '@/hooks/use-mounted';
import { useOpenSessions } from '@/core/hooks/use-poker';
import { BottomNav } from './BottomNav';

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  const mounted = useMounted();
  const pathname = usePathname();
  const openSessions = useOpenSessions();

  const activeSession = mounted ? openSessions[0] : undefined;
  const onSessionPage = pathname.startsWith('/session');

  return (
    <div className="flex min-h-dvh flex-col">
      {activeSession && !onSessionPage && (
        <Link
          href={`/session/?id=${activeSession.id}`}
          className="flex items-center justify-between bg-brass-700 px-4 py-2 text-sm font-semibold text-ink hover:bg-brass-500 transition-colors"
        >
          <span>Mesa activa: {activeSession.location ?? 'Sin nombre'}</span>
          <span>Continuar →</span>
        </Link>
      )}
      <main className="flex flex-1 flex-col pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
