'use client';

import Link from 'next/link';
import { useMounted } from '@/hooks/use-mounted';
import { useSessionHistory } from '@/core/hooks/use-poker';
import { ModeBadge } from '@/components/session/ModeBadge';

export default function HistoryPage() {
  const mounted = useMounted();
  const sessions = useSessionHistory();

  if (!mounted) return <div className="p-6 text-ivory-dim">Cargando…</div>;

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="font-serif text-2xl text-brass-300">Historial</h1>

      {sessions.length === 0 && (
        <p className="py-10 text-center text-ivory-dim">Todavía no hay sesiones cerradas.</p>
      )}

      <ul className="space-y-2">
        {sessions.map((s) => (
          <li key={s.id}>
            <Link
              href={`/session/?id=${s.id}`}
              className="flex items-center justify-between rounded-xl border border-felt-500 bg-felt-900 px-4 py-3 hover:border-brass-700 transition-colors"
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-semibold text-ivory">{s.location ?? 'Mesa sin nombre'}</p>
                  <ModeBadge mode={s.mode} />
                </div>
                <p className="text-xs text-ivory-dim">
                  {new Date(s.date).toLocaleDateString('es-AR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
