'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { buyIn } from '@/core/store/poker-store';
import { formatMXN } from '@/core/logic/currency';
import type { Player } from '@/core/models/domain';
import type { PlayerSessionSummary } from '@/core/logic/session-math';

interface Seat {
  player: Player;
  summary: PlayerSessionSummary | undefined;
}

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  seats: Seat[];
  label?: 'buy-in' | 'rebuy';
}

export function BulkBuyInDialog({ open, onClose, sessionId, seats, label = 'buy-in' }: Props) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [sameAmount, setSameAmount] = useState('');
  const [useSame, setUseSame] = useState(true);

  const total = seats.reduce((sum, { player }) => {
    const raw = useSame ? sameAmount : (amounts[player.id] ?? '');
    return sum + (parseFloat(raw) || 0);
  }, 0);

  const canSubmit = total > 0;

  function handleSubmit() {
    for (const { player } of seats) {
      const raw = useSame ? sameAmount : (amounts[player.id] ?? '');
      const amount = parseFloat(raw) || 0;
      if (amount > 0) {
        buyIn(sessionId, player.id, amount, 0, label === 'rebuy' ? 'REBUY' : 'BUY_IN');
      }
    }
    setAmounts({});
    setSameAmount('');
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={label === 'rebuy' ? 'Rebuy para todos' : 'Entrada para todos'}>
      <div className="mb-4 flex gap-2 rounded-lg bg-felt-900 p-1">
        <button
          onClick={() => setUseSame(true)}
          className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${useSame ? 'bg-brass-700 text-ivory' : 'text-ivory-dim hover:text-ivory'}`}
        >
          Mismo monto
        </button>
        <button
          onClick={() => setUseSame(false)}
          className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${!useSame ? 'bg-brass-700 text-ivory' : 'text-ivory-dim hover:text-ivory'}`}
        >
          Individual
        </button>
      </div>

      {useSame ? (
        <div>
          <label className="mb-2 block text-xs text-ivory-dim">¿Cuánto entra cada jugador?</label>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={sameAmount}
            onChange={(e) => setSameAmount(e.target.value)}
            placeholder="0"
            autoFocus
            className="w-full rounded-lg border border-felt-500 bg-felt-700 px-3 py-3 text-center text-2xl text-ivory tabular-money placeholder:text-ivory-dim focus:border-brass-500 focus:outline-none"
          />
          <p className="mt-2 text-center text-xs text-ivory-dim">
            Se aplica a {seats.length} jugador{seats.length !== 1 ? 'es' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {seats.map(({ player, summary }) => (
            <div key={player.id} className="flex items-center gap-3">
              <Avatar name={player.name} avatar={player.avatar} size="sm" />
              <span className="flex-1 text-sm text-ivory">{player.name}</span>
              {summary && summary.buyInMoney > 0 && (
                <span className="text-xs text-ivory-dim">+{formatMXN(summary.buyInMoney)}</span>
              )}
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={amounts[player.id] ?? ''}
                onChange={(e) => setAmounts((prev) => ({ ...prev, [player.id]: e.target.value }))}
                placeholder="0"
                className="w-28 rounded-lg border border-felt-500 bg-felt-700 px-2 py-1.5 text-right text-sm text-ivory tabular-money placeholder:text-ivory-dim focus:border-brass-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-felt-700 px-3 py-2">
          <span className="text-xs text-ivory-dim">Total a registrar</span>
          <span className="font-semibold tabular-money text-brass-300">{formatMXN(total)}</span>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>Confirmar</Button>
      </div>
    </Dialog>
  );
}
