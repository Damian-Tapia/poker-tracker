'use client';

import Link from 'next/link';
import { SuitIcon } from '@/components/ui/SuitIcon';
import { Icon } from '@/components/ui/Icon';
import { ModeBadge } from '@/components/session/ModeBadge';
import { useMounted } from '@/hooks/use-mounted';
import { useOpenSessions, usePlayers } from '@/core/hooks/use-poker';

export default function Home() {
  const mounted = useMounted();
  const openSessions = useOpenSessions();
  const players = usePlayers();

  return (
    <div className="flex flex-col gap-6 p-6 felt-texture min-h-full">
      <header className="pt-4">
        <h1 className="font-serif text-3xl text-brass-300">Poker Night</h1>
        <p className="text-sm text-ivory-dim mt-1">Home game tracker · local-only</p>
      </header>

      {mounted && openSessions.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ivory-dim">
            Mesa activa
          </h2>
          <div className="space-y-2">
            {openSessions.map((s) => (
              <Link
                key={s.id}
                href={`/session/?id=${s.id}`}
                className="flex items-center justify-between rounded-xl border border-brass-700 bg-felt-700 px-4 py-3 hover:border-brass-500 transition-colors"
              >
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <p className="font-semibold text-ivory">{s.location ?? 'Mesa sin nombre'}</p>
                    <ModeBadge mode={s.mode} />
                  </div>
                  <p className="text-xs text-ivory-dim">
                    {new Date(s.date).toLocaleDateString('es-AR')}
                  </p>
                </div>
                <span className="text-brass-300 text-xl">▶</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-ivory-dim">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/session/new/"
            className="flex flex-col items-center gap-2 rounded-xl border border-felt-500 bg-felt-900 py-5 hover:border-brass-700 transition-colors"
          >
            <SuitIcon suit="♥" className="text-3xl" />
            <span className="text-sm font-semibold text-ivory">Nueva sesión</span>
          </Link>
          <Link
            href="/players/"
            className="flex flex-col items-center gap-2 rounded-xl border border-felt-500 bg-felt-900 py-5 hover:border-brass-700 transition-colors"
          >
            <SuitIcon suit="♠" className="text-3xl" />
            <span className="text-sm font-semibold text-ivory">
              {mounted ? `${players.length} jugadores` : 'Jugadores'}
            </span>
          </Link>
          <Link
            href="/history/"
            className="flex flex-col items-center gap-2 rounded-xl border border-felt-500 bg-felt-900 py-5 hover:border-brass-700 transition-colors"
          >
            <SuitIcon suit="♦" className="text-3xl" />
            <span className="text-sm font-semibold text-ivory">Historial</span>
          </Link>
          <Link
            href="/backup/"
            className="flex flex-col items-center gap-2 rounded-xl border border-felt-500 bg-felt-900 py-5 hover:border-brass-700 transition-colors"
          >
            <Icon name="export" size={30} />
            <span className="text-sm font-semibold text-ivory">Backup</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
