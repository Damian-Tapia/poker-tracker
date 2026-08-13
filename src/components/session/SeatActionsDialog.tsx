'use client';

import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Money } from '@/components/ui/Money';
import { buyIn, rebuy, cashout } from '@/core/store/poker-store';
import type { Player } from '@/core/models/domain';
import type { PlayerSessionSummary } from '@/core/logic/session-math';

type Action = 'buy-in' | 'rebuy' | 'cashout';

interface Props {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  player: Player;
  summary: PlayerSessionSummary | undefined;
}

export function SeatActionsDialog({ open, onClose, sessionId, player, summary }: Props) {
  const hasBoughtIn = (summary?.buyInMoney ?? 0) > 0;
  const [action, setAction] = useState<Action>(hasBoughtIn ? 'rebuy' : 'buy-in');
  const [amount, setAmount] = useState('');

  const parsedAmount = parseFloat(amount) || 0;
  const canSubmit = action === 'cashout' ? parsedAmount > 0 : parsedAmount > 0;

  function handleSubmit() {
    if (parsedAmount <= 0) return;
    if (action === 'buy-in') buyIn(sessionId, player.id, parsedAmount, 0);
    else if (action === 'rebuy') rebuy(sessionId, player.id, parsedAmount, 0);
    else cashout(sessionId, player.id, parsedAmount);
    setAmount('');
    onClose();
  }

  const actions: Action[] = hasBoughtIn ? ['rebuy', 'cashout'] : ['buy-in'];

  return (
    <Dialog open={open} onClose={onClose} title={player.name}>
      <div className="mb-4 flex items-center gap-3">
        <Avatar name={player.name} avatar={player.avatar} />
        {summary && (
          <div className="text-sm text-ivory-dim">
            Invertido: <Money amount={summary.buyInMoney} className="font-semibold" />
            {summary.cashoutMoney > 0 && (
              <> · Salida: <Money amount={summary.cashoutMoney} className="font-semibold" /></>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 rounded-lg bg-felt-900 p-1">
        {actions.map((a) => (
          <button
            key={a}
            onClick={() => { setAction(a); setAmount(''); }}
            className={`flex-1 rounded-md py-1.5 text-sm font-semibold transition-colors ${
              action === a ? 'bg-brass-700 text-ivory' : 'text-ivory-dim hover:text-ivory'
            }`}
          >
            {a === 'buy-in' ? 'Buy-in' : a === 'rebuy' ? 'Rebuy' : 'Cash-out'}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-xs text-ivory-dim">
          {action === 'cashout' ? '¿Con cuánto sale?' : '¿Cuánto entra?'}
        </label>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          autoFocus
          className="w-full rounded-lg border border-felt-500 bg-felt-700 px-3 py-3 text-center text-2xl text-ivory tabular-money placeholder:text-ivory-dim focus:border-brass-500 focus:outline-none"
        />
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {action === 'buy-in' ? 'Buy-in' : action === 'rebuy' ? 'Rebuy' : 'Cash-out'}
        </Button>
      </div>
    </Dialog>
  );
}
