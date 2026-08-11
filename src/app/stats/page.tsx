'use client';

import { useState } from 'react';
import { useMounted } from '@/hooks/use-mounted';
import { usePlayers, usePlayerLifetimeStats } from '@/core/hooks/use-poker';
import { Avatar } from '@/components/ui/Avatar';
import { Money } from '@/components/ui/Money';
import type { Player } from '@/core/models/domain';

function PlayerStats({ player }: { player: Player }) {
  const stats = usePlayerLifetimeStats(player.id);
  if (!stats || stats.sessionsPlayed === 0) return null;

  return (
    <div className="rounded-xl border border-felt-500 bg-felt-900 p-4">
      <div className="flex items-center gap-3 mb-4">
        <Avatar name={player.name} avatar={player.avatar} size="md" />
        <div>
          <p className="font-semibold text-ivory">{player.name}</p>
          <p className="text-xs text-ivory-dim">{stats.sessionsPlayed} noches</p>
        </div>
        <div className="ml-auto text-right">
          <Money amount={stats.net} currency="USD" showSign className="text-xl font-semibold" />
          <p className="text-xs text-ivory-dim">net total</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Stat label="Invertido" value={<Money amount={stats.totalIn} currency="USD" />} />
        <Stat label="Cobrado" value={<Money amount={stats.totalCashout} currency="USD" />} />
        <Stat label="Sesiones ganadas" value={<span className="text-win">{stats.winningSessions}</span>} />
        <Stat label="Sesiones perdidas" value={<span className="text-loss">{stats.losingSessions}</span>} />
        <Stat label="Mejor noche" value={<Money amount={stats.biggestWin} currency="USD" showSign />} />
        <Stat label="Peor noche" value={<Money amount={-stats.biggestLoss} currency="USD" showSign />} />
      </div>
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
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!mounted) return <div className="p-6 text-ivory-dim">Cargando…</div>;

  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="font-serif text-2xl text-brass-300">Estadísticas</h1>
      {players.length === 0 && (
        <p className="py-10 text-center text-ivory-dim">Sin jugadores todavía.</p>
      )}
      <div className="space-y-3">
        {players.map((p) => (
          <div key={p.id} onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
            {expanded === p.id ? (
              <PlayerStats player={p} />
            ) : (
              <PlayerStatRow player={p} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerStatRow({ player }: { player: Player }) {
  const stats = usePlayerLifetimeStats(player.id);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-felt-500 bg-felt-900 px-4 py-3 cursor-pointer hover:border-brass-700 transition-colors">
      <Avatar name={player.name} avatar={player.avatar} size="sm" />
      <span className="flex-1 font-semibold text-ivory">{player.name}</span>
      {stats && stats.sessionsPlayed > 0 ? (
        <>
          <span className="text-xs text-ivory-dim">{stats.sessionsPlayed}n</span>
          <Money amount={stats.net} currency="USD" showSign className="font-semibold" />
        </>
      ) : (
        <span className="text-xs text-ivory-dim">Sin historial</span>
      )}
    </div>
  );
}
