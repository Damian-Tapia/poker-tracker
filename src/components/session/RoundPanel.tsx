'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { formatMXN } from '@/core/logic/currency';
import { roundPot } from '@/core/logic/rounds';
import { recordRound } from '@/core/store/poker-store';
import type { RoundResult, RoundBet } from '@/core/models/domain';

interface SeatOption {
  playerId: string;
  name: string;
}

interface Props {
  sessionId: string;
  seats: SeatOption[];
  rounds: RoundResult[];
}

/** Contador de rondas. Cada apuesta es por jugador — el pozo es la suma, nunca partes iguales. */
export function RoundPanel({ sessionId, seats, rounds }: Props) {
  const [betsByPlayer, setBetsByPlayer] = useState<Record<string, string>>({});
  const [winnerId, setWinnerId] = useState('');

  const nextRoundNumber = rounds.length + 1;
  const lastRound = rounds[rounds.length - 1];
  const lastWinnerName = lastRound
    ? seats.find((s) => s.playerId === lastRound.winnerPlayerId)?.name
    : undefined;

  const bets: RoundBet[] = seats
    .map((s) => ({ playerId: s.playerId, amount: parseFloat(betsByPlayer[s.playerId] ?? '') || 0 }))
    .filter((b) => b.amount > 0);
  const pot = roundPot(bets);

  function setBet(playerId: string, value: string) {
    setBetsByPlayer((prev) => ({ ...prev, [playerId]: value }));
  }

  function handleNext() {
    if (!winnerId) return;
    recordRound(sessionId, bets, winnerId);
    setBetsByPlayer({});
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
            Última: {lastWinnerName} ganó {formatMXN(roundPot(lastRound.bets))}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-2 block text-xs text-ivory-dim">Cuánto apuesta cada quien</label>
          <div className="space-y-1.5">
            {seats.map((s) => (
              <div key={s.playerId} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-ivory">{s.name}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={betsByPlayer[s.playerId] ?? ''}
                  onChange={(e) => setBet(s.playerId, e.target.value)}
                  placeholder="0"
                  className="w-24 rounded-lg border border-felt-500 bg-felt-700 px-2 py-1.5 text-right text-sm text-ivory tabular-money placeholder:text-ivory-dim focus:border-brass-500 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-felt-700 px-3 py-2">
          <span className="text-xs font-semibold text-ivory-dim">Pozo</span>
          <span className="text-sm font-semibold tabular-money text-brass-300">{formatMXN(pot)}</span>
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
