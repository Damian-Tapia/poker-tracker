'use client';

import { useState } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { usePlayers, usePlayerLifetimeStats, usePlayerRoundStats } from '@/core/hooks/use-poker';
import { Avatar } from '@/components/ui/Avatar';
import { Money } from '@/components/ui/Money';
import { Icon } from '@/components/ui/Icon';
import { formatMXN } from '@/core/logic/currency';
import type { Player, SessionMode } from '@/core/models/domain';

function PlayerStats({ player, mode }: { player: Player; mode: SessionMode }) {
  const stats = usePlayerLifetimeStats(player.id);
  const roundStats = usePlayerRoundStats(player.id);
  const bucket = stats?.[mode];
  const rounds = roundStats?.[mode];
  if (!bucket || bucket.sessionsPlayed === 0) return null;

  return (
    <div className="rounded-xl border border-felt-500 bg-felt-900 p-4">
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={player.name} avatar={player.avatar} size="md" />
        <div>
          <p className="font-semibold text-ivory">{player.name}</p>
          <p className="text-xs text-ivory-dim">{bucket.sessionsPlayed} noches</p>
        </div>
        <div className="ml-auto text-right">
          <Money amount={bucket.net} showSign className="text-xl font-semibold" />
          <p className="text-xs text-ivory-dim">net total</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Stat label="Invertido" value={<Money amount={bucket.totalIn} />} />
        <Stat label="Cobrado" value={<Money amount={bucket.totalCashout} />} />
        <Stat label="Sesiones ganadas" value={<span className="text-win">{bucket.winningSessions}</span>} />
        <Stat label="Sesiones perdidas" value={<span className="text-loss">{bucket.losingSessions}</span>} />
        <Stat label="Mejor noche" value={<Money amount={bucket.biggestWin} showSign />} />
        <Stat label="Peor noche" value={<Money amount={-bucket.biggestLoss} showSign />} />
      </div>
      {rounds && rounds.roundsWon > 0 && (
        <div className="mt-4 border-t border-felt-500 pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ivory-dim">
            <Icon name="pot" size={14} />
            Rondas (informativo)
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Stat label="Rondas ganadas" value={<span className="text-ivory">{rounds.roundsWon}</span>} />
            <Stat label="Pozo más grande" value={<span className="text-ivory tabular-money">{formatMXN(rounds.biggestPotWon)}</span>} />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-ivory-dim">{label}</span>
      <span className="font-semibold tabular-money">{value}</span>
    </div>
  );
}

export default function StatsPage() {
  const mounted = useMounted();
  const players = usePlayers();
  const [mode, setMode] = useState<SessionMode>('real');
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!mounted) return <div className="p-6 text-ivory-dim">Cargando…</div>;

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="font-serif text-2xl text-brass-300">Estadísticas</h1>

      <div className="flex gap-2 rounded-lg bg-felt-900 p-1">
        <button
          onClick={() => setMode('real')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-colors ${
            mode === 'real' ? 'bg-brass-700 text-ivory' : 'text-ivory-dim hover:text-ivory'
          }`}
        >
          <Icon name="mode-real" size={16} />
          Dinero real
        </button>
        <button
          onClick={() => setMode('play')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-semibold transition-colors ${
            mode === 'play' ? 'bg-brass-700 text-ivory' : 'text-ivory-dim hover:text-ivory'
          }`}
        >
          <Icon name="mode-play" size={16} />
          Por diversión
        </button>
      </div>

      {players.length === 0 && (
        <p className="py-10 text-center text-ivory-dim">Sin jugadores todavía.</p>
      )}
      <div className="space-y-3">
        {players.map((p) => (
          <div key={p.id} onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
            {expanded === p.id ? (
              <PlayerStats player={p} mode={mode} />
            ) : (
              <PlayerStatRow player={p} mode={mode} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerStatRow({ player, mode }: { player: Player; mode: SessionMode }) {
  const stats = usePlayerLifetimeStats(player.id);
  const bucket = stats?.[mode];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-felt-500 bg-felt-900 px-4 py-3 cursor-pointer hover:border-brass-700 transition-colors">
      <Avatar name={player.name} avatar={player.avatar} size="sm" />
      <span className="flex-1 font-semibold text-ivory">{player.name}</span>
      {bucket && bucket.sessionsPlayed > 0 ? (
        <>
          <span className="text-xs text-ivory-dim">{bucket.sessionsPlayed}n</span>
          <Money amount={bucket.net} showSign className="font-semibold" />
        </>
      ) : (
        <span className="text-xs text-ivory-dim">Sin historial</span>
      )}
    </div>
  );
}
