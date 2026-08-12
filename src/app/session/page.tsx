'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMounted } from '@/hooks/use-mounted';
import {
  useSession,
  useSessionPlayers,
  useSessionSummary,
  useSessionSettlement,
  useSessionRounds,
} from '@/core/hooks/use-poker';
import { usePlayers } from '@/core/hooks/use-poker';
import { closeSession } from '@/core/store/poker-store';
import { Button } from '@/components/ui/Button';
import { SeatTable } from '@/components/session/SeatTable';
import { AddSeatDialog } from '@/components/session/AddSeatDialog';
import { IntegrityDialog } from '@/components/ui/IntegrityDialog';
import { SettlementView } from '@/components/session/SettlementView';
import { ModeBadge } from '@/components/session/ModeBadge';
import { ModeDialog } from '@/components/session/ModeDialog';
import { RoundPanel } from '@/components/session/RoundPanel';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { Money } from '@/components/ui/Money';
import { totalFromChipCounts, totalFromPlayerChipRacks } from '@/core/logic/chips';
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
  const rounds = useSessionRounds(sessionId);
  const players = usePlayers();

  const [addOpen, setAddOpen] = useState(false);
  const [integrityOpen, setIntegrityOpen] = useState(false);
  const [pendingIntegrity, setPendingIntegrity] = useState<SessionIntegrity | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
  const [chipRackOpen, setChipRackOpen] = useState(false);

  if (!mounted) return <div className="p-6 text-ivory-dim">Cargando…</div>;
  if (!session) return <div className="p-6 text-ivory-dim">Sesión no encontrada.</div>;

  const existingIds = new Set(seats.map((s) => s.sessionPlayer.playerId));
  const modeLocked = summaries.length > 0;
  const roundSeatOptions = seats
    .filter((s): s is typeof s & { player: NonNullable<typeof s.player> } => !!s.player)
    .map((s) => ({ playerId: s.player.id, name: s.player.name }));

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
              {new Date(session.date).toLocaleDateString('es-AR')} · MXN
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
            {new Date(session.date).toLocaleDateString('es-AR')} · MXN
            {(session.rake ?? 0) > 0 && ` · rake: ${session.rake}`}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={handleClose}>Cerrar mesa</Button>
      </div>

      {session.chipRack && session.chipRack.length > 0 && (
        <div className="rounded-lg bg-felt-900/50 px-3 py-2">
          <button
            type="button"
            onClick={() => setChipRackOpen((v) => !v)}
            className="flex w-full items-center gap-2 text-xs text-ivory-dim hover:text-ivory"
          >
            <Icon name="chips" size={14} />
            Fichas por jugador (referencia)
            <span className="ml-auto">{chipRackOpen ? 'ocultar' : 'mostrar'}</span>
          </button>
          {chipRackOpen && (
            <div className="mt-2 space-y-1.5">
              {session.chipRack.map((rack) => {
                const player = players.find((p) => p.id === rack.playerId);
                return (
                  <div key={rack.playerId} className="flex items-center gap-2">
                    <Avatar name={player?.name ?? 'Jugador borrado'} avatar={player?.avatar} size="sm" />
                    <span className="flex-1 text-sm text-ivory">{player?.name ?? 'Jugador borrado'}</span>
                    <Money amount={totalFromChipCounts(rack.counts)} />
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-brass-700 pt-1.5">
                <span className="text-xs font-semibold text-ivory">Gran total</span>
                <Money amount={totalFromPlayerChipRacks(session.chipRack)} className="font-semibold" />
              </div>
            </div>
          )}
        </div>
      )}

      <SeatTable seats={seats} summaries={summaries} session={session} />

      <Button
        variant="secondary"
        size="sm"
        onClick={() => setAddOpen(true)}
        className="w-full"
      >
        + Agregar jugador
      </Button>

      <RoundPanel sessionId={session.id} seats={roundSeatOptions} rounds={rounds} />

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
