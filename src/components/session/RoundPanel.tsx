'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { formatMXN } from '@/core/logic/currency';
import { recordRound } from '@/core/store/poker-store';
import type { RoundResult } from '@/core/models/domain';

interface SeatOption {
  playerId: string;
  name: string;
}

interface Props {
  sessionId: string;
  seats: SeatOption[];
  rounds: RoundResult[];
}

/** Contador de rondas. Informativo — nunca alimenta settlement ni el neto de plata. */
export function RoundPanel({ sessionId, seats, rounds }: Props) {
  const [pot, setPot] = useState('');
  const [winnerId, setWinnerId] = useState('');

  const nextRoundNumber = rounds.length + 1;
  const lastRound = rounds[rounds.length - 1];
  const lastWinnerName = lastRound
    ? seats.find((s) => s.playerId === lastRound.winnerPlayerId)?.name
    : undefined;

  function handleNext() {
    if (!winnerId) return;
    const potNum = parseFloat(pot) || 0;
    recordRound(sessionId, winnerId, potNum > 0 ? potNum : undefined);
    setPot('');
    setWinnerId('');
  }

  if (seats.length === 0) return null;

  return (
    <div className="rounded-xl border border-felt-500 bg-felt-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-serif text-lg text-brass-300">
          <Icon name="pot" size={18} />
          Ronda {nextRoundNumber}
        </h3>
        {lastRound && lastWinnerName && (
          <p className="text-right text-xs text-ivory-dim">
            Última: {lastWinnerName} ganó {formatMXN(lastRound.potChips ?? 0)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs text-ivory-dim">Pozo (opcional)</label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={pot}
            onChange={(e) => setPot(e.target.value)}
            placeholder="0"
            className="w-full rounded-lg border border-felt-500 bg-felt-700 px-3 py-2 text-ivory tabular-money placeholder:text-ivory-dim focus:border-brass-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ivory-dim">Ganador</label>
          <select
            value={winnerId}
            onChange={(e) => setWinnerId(e.target.value)}
            className="w-full rounded-lg border border-felt-500 bg-felt-700 px-3 py-2 text-ivory focus:border-brass-500 focus:outline-none"
          >
            <option value="">Elegir…</option>
            {seats.map((s) => (
              <option key={s.playerId} value={s.playerId}>{s.name}</option>
            ))}
          </select>
        </div>
        <Button onClick={handleNext} disabled={!winnerId} className="w-full">
          <Icon name="round-next" size={18} />
          Siguiente
        </Button>
      </div>
    </div>
  );
}
