'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMounted } from '@/hooks/use-mounted';
import { useSession, useSessionPlayers, useSessionSummary, useSessionSettlement } from '@/core/hooks/use-poker';
import { usePlayers } from '@/core/hooks/use-poker';
import { closeSession } from '@/core/store/poker-store';
import { Button } from '@/components/ui/Button';
import { SeatTable } from '@/components/session/SeatTable';
import { AddSeatDialog } from '@/components/session/AddSeatDialog';
import { IntegrityDialog } from '@/components/ui/IntegrityDialog';
import { SettlementView } from '@/components/session/SettlementView';
import type { SessionIntegrity } from '@/core/logic/session-math';

function SessionContent() {
  const params = useSearchParams();
  const sessionId = params.get('id') ?? undefined;
  const router = useRouter();
  const mounted = useMounted();

  const session = useSession(sessionId);
  const seats = useSessionPlayers(sessionId);
  const summaries = useSessionSummary(sessionId);
  const settlement = useSessionSettlement(sessionId);
  const players = usePlayers();

  const [addOpen, setAddOpen] = useState(false);
  const [integrityOpen, setIntegrityOpen] = useState(false);
  const [pendingIntegrity, setPendingIntegrity] = useState<SessionIntegrity | null>(null);

  if (!mounted) return <div className="p-6 text-ivory-dim">Cargando…</div>;
  if (!session) return <div className="p-6 text-ivory-dim">Sesión no encontrada.</div>;

  const existingIds = new Set(seats.map((s) => s.sessionPlayer.playerId));

  function handleClose() {
    if (!sessionId) return;
    const integrity = settlement?.integrity;
    if (integrity && (!integrity.moneyBalanced || !integrity.chipsBalanced)) {
      setPendingIntegrity(integrity);
      setIntegrityOpen(true);
    } else {
      closeSession(sessionId);
    }
  }

  function handleForceClose() {
    if (!sessionId) return;
    closeSession(sessionId, { force: true });
  }

  if (session.status === 'closed' && settlement) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl text-brass-300">Cierre de mesa</h1>
          <button onClick={() => router.push('/history/')} className="text-sm text-ivory-dim hover:text-ivory">
            Historial →
          </button>
        </div>
        <div>
          <p className="mb-1 text-xs text-ivory-dim">{session.location ?? 'Mesa'}</p>
          <p className="text-xs text-ivory-dim">
            {new Date(session.date).toLocaleDateString('es-AR')} · {session.currency} · {session.chipValue}/ficha
          </p>
        </div>
        <section>
          <h2 className="mb-3 font-serif text-xl text-brass-300">Transferencias</h2>
          <SettlementView payments={settlement.payments} players={players} />
        </section>
        <section>
          <h2 className="mb-3 font-serif text-xl text-brass-300">Resultados</h2>
          <SeatTable seats={seats} summaries={summaries} session={session} />
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-brass-300">{session.location ?? 'Mesa activa'}</h1>
          <p className="text-xs text-ivory-dim mt-0.5">
            {new Date(session.date).toLocaleDateString('es-AR')} · {session.currency} · {session.chipValue}/ficha
            {(session.rake ?? 0) > 0 && ` · rake: ${session.rake}`}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={handleClose}>Cerrar mesa</Button>
      </div>

      <SeatTable seats={seats} summaries={summaries} session={session} />

      <Button
        variant="secondary"
        size="sm"
        onClick={() => setAddOpen(true)}
        className="w-full"
      >
        + Agregar jugador
      </Button>

      <AddSeatDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        sessionId={session.id}
        existingPlayerIds={existingIds}
      />

      {pendingIntegrity && (
        <IntegrityDialog
          open={integrityOpen}
          onClose={() => setIntegrityOpen(false)}
          onForce={handleForceClose}
          integrity={pendingIntegrity}
        />
      )}
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="p-6 text-ivory-dim">Cargando…</div>}>
      <SessionContent />
    </Suspense>
  );
}
