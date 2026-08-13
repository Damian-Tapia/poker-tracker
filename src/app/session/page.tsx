'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMounted } from '@/hooks/use-mounted';
import {
  useSession,
  useSessionPlayers,
  useSessionSummary,
  useSessionSettlement,
} from '@/core/hooks/use-poker';
import { usePlayers } from '@/core/hooks/use-poker';
import { closeSession } from '@/core/store/poker-store';
import { Button } from '@/components/ui/Button';
import { SeatTable } from '@/components/session/SeatTable';
import { AddSeatDialog } from '@/components/session/AddSeatDialog';
import { BulkBuyInDialog } from '@/components/session/BulkBuyInDialog';
import { IntegrityDialog } from '@/components/ui/IntegrityDialog';
import { SettlementView } from '@/components/session/SettlementView';
import { ModeBadge } from '@/components/session/ModeBadge';
import { ModeDialog } from '@/components/session/ModeDialog';
import { formatMXN } from '@/core/logic/currency';
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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [integrityOpen, setIntegrityOpen] = useState(false);
  const [pendingIntegrity, setPendingIntegrity] = useState<SessionIntegrity | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);

  if (!mounted) return <div className="p-6 text-ivory-dim">Cargando…</div>;
  if (!session) return <div className="p-6 text-ivory-dim">Sesión no encontrada.</div>;

  const existingIds = new Set(seats.map((s) => s.sessionPlayer.playerId));
  const modeLocked = summaries.length > 0;

  const byPlayer = new Map(summaries.map((s) => [s.playerId, s]));
  const pool = summaries.reduce((sum, s) => sum + s.buyInMoney - s.cashoutMoney, 0);
  const totalBuyIn = summaries.reduce((sum, s) => sum + s.buyInMoney, 0);

  const bulkSeats = seats
    .filter((s): s is typeof s & { player: NonNullable<typeof s.player> } => !!s.player)
    .map((s) => ({ player: s.player, summary: byPlayer.get(s.player.id) }));

  function handleClose() {
    if (!sessionId) return;
    const integrity = settlement?.integrity;
    if (integrity && !integrity.moneyBalanced) {
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
        <div className="flex items-center gap-2">
          <ModeBadge mode={session.mode} />
          <div>
            <p className="text-xs text-ivory-dim">{session.location ?? 'Mesa'}</p>
            <p className="text-xs text-ivory-dim">
              {new Date(session.date).toLocaleDateString('es-MX')} · MXN
            </p>
          </div>
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl text-brass-300">{session.location ?? 'Mesa activa'}</h1>
            <ModeBadge mode={session.mode} onClick={() => setModeDialogOpen(true)} />
          </div>
          <p className="text-xs text-ivory-dim mt-0.5">
            {new Date(session.date).toLocaleDateString('es-MX')} · MXN
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={handleClose}>Cerrar mesa</Button>
      </div>

      {totalBuyIn > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-felt-900 border border-felt-500 px-4 py-3">
            <p className="text-xs text-ivory-dim mb-1">En mesa</p>
            <p className="text-xl font-semibold tabular-money text-brass-300">{formatMXN(pool)}</p>
          </div>
          <div className="rounded-xl bg-felt-900 border border-felt-500 px-4 py-3">
            <p className="text-xs text-ivory-dim mb-1">Total invertido</p>
            <p className="text-xl font-semibold tabular-money text-ivory">{formatMXN(totalBuyIn)}</p>
          </div>
        </div>
      )}

      <SeatTable seats={seats} summaries={summaries} session={session} />

      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setBulkOpen(true)}
          className="flex-1"
        >
          Entrada para todos
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setAddOpen(true)}
          className="flex-1"
        >
          + Jugador
        </Button>
      </div>

      <BulkBuyInDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        sessionId={session.id}
        seats={bulkSeats}
        label={totalBuyIn > 0 ? 'rebuy' : 'buy-in'}
      />

      <AddSeatDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        sessionId={session.id}
        existingPlayerIds={existingIds}
      />

      <ModeDialog
        open={modeDialogOpen}
        onClose={() => setModeDialogOpen(false)}
        sessionId={session.id}
        currentMode={session.mode}
        locked={modeLocked}
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
